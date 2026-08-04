import { cache } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user) {
    throw new Error('getCurrentUser called outside an authenticated route')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, householdId: true, role: true, isActive: true },
  })
  if (!user) {
    throw new Error(`Session user ${session.user.id} has no matching User row`)
  }
  // Re-checked on every request (not just at login) so disabling a user via the
  // admin page takes effect immediately, even on an already-live session/JWT.
  if (!user.isActive) {
    redirect('/login')
  }
  if (!user.householdId) {
    throw new Error(`User ${user.email} has no household assigned`)
  }

  return { ...user, householdId: user.householdId }
})

export class ForbiddenError extends Error {
  constructor() {
    super('Admin access required')
    this.name = 'ForbiddenError'
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (user.role !== 'ADMIN') throw new ForbiddenError()
  return user
}

export async function listHouseholdUsers(householdId: string) {
  return prisma.user.findMany({
    where: { householdId },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
}
