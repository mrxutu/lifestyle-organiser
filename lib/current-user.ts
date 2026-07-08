import { cache } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user) {
    throw new Error('getCurrentUser called outside an authenticated route')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, householdId: true },
  })
  if (!user) {
    throw new Error(`Session user ${session.user.id} has no matching User row`)
  }
  if (!user.householdId) {
    throw new Error(`User ${user.email} has no household assigned`)
  }

  return { ...user, householdId: user.householdId }
})
