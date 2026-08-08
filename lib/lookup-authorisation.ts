import { assertSectionEnabled, ForbiddenError } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'
import type { SectionFlags, SectionKey } from '@/lib/household-sections'

export type LookupManager = {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  householdId: string
}

export function lookupManagementHousehold(user: LookupManager, requestedHouseholdId?: string | null) {
  if (user.role === 'MEMBER') throw new ForbiddenError('Admin access required')
  if (user.role === 'SUPER_ADMIN') return requestedHouseholdId || user.householdId
  if (requestedHouseholdId && requestedHouseholdId !== user.householdId) {
    throw new ForbiddenError("You can't manage lookup data for another household")
  }
  return user.householdId
}

export async function requireHouseholdSection(
  householdId: string,
  section: SectionKey,
  loadSections: (householdId: string) => Promise<SectionFlags | null> = loadHouseholdSections
) {
  const sections = await loadSections(householdId)
  if (!sections) throw new ForbiddenError('Household not found')
  assertSectionEnabled(sections, section)
}

async function loadHouseholdSections(householdId: string): Promise<SectionFlags | null> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { showCalendar: true, showRecipes: true, showWatchlist: true, showBooks: true },
  })
  if (!household) return null
  return {
    calendar: household.showCalendar,
    recipes: household.showRecipes,
    watchlist: household.showWatchlist,
    books: household.showBooks,
  }
}
