import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma/enums'
import { sendPasswordResetEmail } from '@/lib/password-reset'

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
})

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>

export class UserHasContentError extends Error {
  constructor(public count: number) {
    super(`This user has created ${count} event${count === 1 ? '' : 's'}/recipe${count === 1 ? '' : 's'} — reassign or delete their content first`)
    this.name = 'UserHasContentError'
  }
}

export class CannotDeleteSelfError extends Error {
  constructor() {
    super("You can't delete your own account")
    this.name = 'CannotDeleteSelfError'
  }
}

export class LastAdminError extends Error {
  constructor() {
    super("You're the only admin — promote another user to admin before demoting yourself")
    this.name = 'LastAdminError'
  }
}

export async function listUsers() {
  return prisma.user.findMany({
    include: { household: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
}

export type UserWithHousehold = Awaited<ReturnType<typeof listUsers>>[number]

export async function createUser(input: CreateUserInput, origin: string) {
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      householdId: input.householdId,
      role: input.role,
      passwordHash: null,
    },
  })

  await sendPasswordResetEmail(user, origin)

  return user
}

export async function updateUser(userId: string, input: UpdateUserInput, currentUserId: string) {
  if (userId === currentUserId && input.role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) throw new LastAdminError()
  }

  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name, householdId: input.householdId, role: input.role },
  })
}

export async function deleteUser(userId: string, currentUserId: string) {
  if (userId === currentUserId) throw new CannotDeleteSelfError()

  const [eventCount, recipeCount] = await Promise.all([
    prisma.event.count({ where: { creatorId: userId } }),
    prisma.recipe.count({ where: { authorId: userId } }),
  ])

  const contentCount = eventCount + recipeCount
  if (contentCount > 0) throw new UserHasContentError(contentCount)

  await prisma.user.delete({ where: { id: userId } })
}
