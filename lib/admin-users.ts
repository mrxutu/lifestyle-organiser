import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma/enums'
import { sendNewUserSetPasswordEmail } from '@/lib/password-reset'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'

export const createUserInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email(),
  householdId: z.string().min(1, 'Household is required'),
  role: z.enum(Role).default('MEMBER'),
})

export type CreateUserInput = z.infer<typeof createUserInputSchema>

export const updateUserInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  householdId: z.string().min(1, 'Household is required'),
  role: z.enum(Role),
  isActive: z.boolean(),
})

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>

export class UserHasContentError extends Error {
  constructor(public count: number) {
    super(`This user is linked to ${count} record${count === 1 ? '' : 's'} — reassign or delete them first`)
    this.name = 'UserHasContentError'
  }
}

export class CannotDeleteSelfError extends Error {
  constructor() {
    super("You can't delete your own account")
    this.name = 'CannotDeleteSelfError'
  }
}

export class CannotDisableSelfError extends Error {
  constructor() {
    super("You can't disable your own account")
    this.name = 'CannotDisableSelfError'
  }
}

export class LastAdminError extends Error {
  constructor() {
    super("You're the only active super admin — promote another user before demoting yourself")
    this.name = 'LastAdminError'
  }
}

export class LastSuperAdminError extends Error {
  constructor() {
    super("You're the only active super admin")
    this.name = 'LastSuperAdminError'
  }
}

export function getRoleScopedUserInput<T extends CreateUserInput | UpdateUserInput>(
  currentUser: { role: UserRole; householdId?: string | null; id?: string },
  input: T
): T {
  if (currentUser.role === 'SUPER_ADMIN') return input

  if (currentUser.role === 'ADMIN') {
    const scopedHouseholdId = currentUser.householdId ?? input.householdId
    return {
      ...input,
      householdId: scopedHouseholdId,
      role: 'MEMBER',
    } as T
  }

  return input
}

export async function listUsersForContext(currentUser: { role: UserRole; householdId?: string | null }) {
  const where = currentUser.role === 'ADMIN' ? { householdId: currentUser.householdId ?? undefined } : {}

  return prisma.user.findMany({
    where,
    include: { household: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
}

export type UserWithHousehold = Awaited<ReturnType<typeof listUsersForContext>>[number]

export async function createUser(input: CreateUserInput, currentUser?: { role: UserRole; householdId?: string | null }) {
  const scopedInput = currentUser ? getRoleScopedUserInput(currentUser, input) : input
  const user = await prisma.user.create({
    data: {
      name: scopedInput.name,
      email: scopedInput.email,
      householdId: scopedInput.householdId,
      role: scopedInput.role,
      passwordHash: null,
    },
  })

  void sendNewUserSetPasswordEmail(user)

  return user
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  currentUserId: string,
  currentUser?: { role: UserRole; householdId?: string | null }
) {
  const scopedInput = currentUser ? getRoleScopedUserInput(currentUser, input) : input

  if (userId === currentUserId) {
    if (!scopedInput.isActive) throw new CannotDisableSelfError()
  }

  const activeSuperAdminCount = await prisma.user.count({
    where: { role: 'SUPER_ADMIN', isActive: true },
  })

  if (userId === currentUserId && scopedInput.role !== 'SUPER_ADMIN' && activeSuperAdminCount <= 1) {
    throw new LastSuperAdminError()
  }

  const currentTarget = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  const isTargetSuperAdmin = currentTarget?.role === 'SUPER_ADMIN'
  if (isTargetSuperAdmin && scopedInput.role !== 'SUPER_ADMIN' && activeSuperAdminCount <= 1) {
    throw new LastSuperAdminError()
  }

  if (isTargetSuperAdmin && !scopedInput.isActive && activeSuperAdminCount <= 1) {
    throw new LastSuperAdminError()
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: scopedInput.name,
      householdId: scopedInput.householdId,
      role: scopedInput.role,
      isActive: scopedInput.isActive,
    },
  })
}

export async function deleteUser(userId: string, currentUserId: string) {
  if (userId === currentUserId) throw new CannotDeleteSelfError()

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } })
  if (targetUser?.role === 'SUPER_ADMIN' && targetUser.isActive) {
    const activeSuperAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } })
    if (activeSuperAdminCount <= 1) throw new LastSuperAdminError()
  }

  const [eventCount, authoredRecipeCount, chefRecipeCount, attendeeCount, viewerCount, bookCount] = await Promise.all([
    prisma.event.count({ where: { creatorId: userId } }),
    prisma.recipe.count({ where: { authorId: userId } }),
    prisma.recipe.count({ where: { chefId: userId } }),
    prisma.eventAttendee.count({ where: { userId } }),
    prisma.watchlistViewer.count({ where: { userId } }),
    prisma.book.count({ where: { readerId: userId } }),
  ])

  const contentCount =
    eventCount + authoredRecipeCount + chefRecipeCount + attendeeCount + viewerCount + bookCount
  if (contentCount > 0) throw new UserHasContentError(contentCount)

  await prisma.user.delete({ where: { id: userId } })
}
