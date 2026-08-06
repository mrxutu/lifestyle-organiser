import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const householdInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    showCalendar: z.boolean().default(true),
    showRecipes: z.boolean().default(true),
    showWatchlist: z.boolean().default(true),
    showBooks: z.boolean().default(true),
  })
  .refine((data) => data.showCalendar || data.showRecipes || data.showWatchlist || data.showBooks, {
    message: 'At least one section must stay enabled',
    path: ['showCalendar'],
  })

export type HouseholdInput = z.infer<typeof householdInputSchema>

export class HouseholdInUseError extends Error {
  constructor() {
    super("This household still has members or content — reassign or remove them first")
    this.name = 'HouseholdInUseError'
  }
}

export async function listHouseholds() {
  return prisma.household.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  })
}

export type HouseholdWithCount = Awaited<ReturnType<typeof listHouseholds>>[number]

export async function createHousehold(input: HouseholdInput) {
  return prisma.household.create({ data: input })
}

export async function updateHousehold(householdId: string, input: HouseholdInput) {
  return prisma.household.update({ where: { id: householdId }, data: input })
}

export async function deleteHousehold(householdId: string) {
  const [userCount, eventCount, recipeCount, watchlistCount, bookCount] = await Promise.all([
    prisma.user.count({ where: { householdId } }),
    prisma.event.count({ where: { householdId } }),
    prisma.recipe.count({ where: { householdId } }),
    prisma.watchlistEntry.count({ where: { householdId } }),
    prisma.book.count({ where: { householdId } }),
  ])

  if (userCount + eventCount + recipeCount + watchlistCount + bookCount > 0) {
    throw new HouseholdInUseError()
  }

  await prisma.household.delete({ where: { id: householdId } })
}
