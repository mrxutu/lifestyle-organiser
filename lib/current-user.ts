import { cache } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { SectionFlags, SectionKey } from '@/lib/household-sections'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user) {
    throw new Error('getCurrentUser called outside an authenticated route')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      householdId: true,
      role: true,
      isActive: true,
      household: {
        select: { showCalendar: true, showRecipes: true, showWatchlist: true, showBooks: true },
      },
    },
  })
  if (!user) {
    throw new Error(`Session user ${session.user.id} has no matching User row`)
  }
  // Re-checked on every request (not just at login) so disabling a user via the
  // admin page takes effect immediately, even on an already-live session/JWT.
  if (!user.isActive) {
    redirect('/login')
  }
  if (!user.householdId || !user.household) {
    throw new Error(`User ${user.email} has no household assigned`)
  }

  const sections: SectionFlags = {
    calendar: user.household.showCalendar,
    recipes: user.household.showRecipes,
    watchlist: user.household.showWatchlist,
    books: user.household.showBooks,
  }

  return { ...user, householdId: user.householdId, sections }
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

// Server-side gate for a section's routes — redirects rather than just relying on
// the nav being hidden, so direct URL access to a disabled section is also blocked.
export async function requireSection(section: SectionKey) {
  const user = await getCurrentUser()
  if (!user.sections[section]) redirect('/profile')
  return user
}

export async function listHouseholdUsers(householdId: string) {
  return prisma.user.findMany({
    where: { householdId },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
}
