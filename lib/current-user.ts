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
  constructor(message = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') throw new ForbiddenError('Admin access required')
  return user
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (user.role !== 'SUPER_ADMIN') throw new ForbiddenError('Super admin access required')
  return user
}

export async function requireHouseholdAdmin() {
  const user = await getCurrentUser()
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') throw new ForbiddenError('Household admin access required')
  return user
}

// Server-side gate for a section's routes — redirects rather than just relying on
// the nav being hidden, so direct URL access to a disabled section is also blocked.
export async function requireSection(section: SectionKey) {
  const user = await getCurrentUser()
  if (!user.sections[section]) redirect('/profile')
  return user
}

// API routes must return a JSON 403 rather than following the page guard's
// redirect behaviour. Keep this separate from requireSection for that reason.
type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

export function requireApiSection(section: SectionKey): Promise<CurrentUser>
export function requireApiSection<T extends { sections: SectionFlags }>(
  section: SectionKey,
  loadUser: () => Promise<T>
): Promise<T>
export async function requireApiSection(
  section: SectionKey,
  loadUser: (() => Promise<CurrentUser>) | (() => Promise<{ sections: SectionFlags }>) = getCurrentUser
) {
  const user = await loadUser()
  assertSectionEnabled(user.sections, section)
  return user
}

const SECTION_LABELS: Record<SectionKey, string> = {
  calendar: 'Calendar',
  recipes: 'Recipes',
  watchlist: 'Watchlist',
  books: 'Books',
}

export function assertSectionEnabled(sections: SectionFlags, section: SectionKey) {
  if (!sections[section]) throw new ForbiddenError(`${SECTION_LABELS[section]} section is disabled`)
}

export async function listHouseholdUsers(householdId: string) {
  return prisma.user.findMany({
    where: { householdId, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
}
