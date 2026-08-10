import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { householdLookupDefaults } from '@/lib/lookup-defaults'
import { ForbiddenError } from '@/lib/current-user'

export const householdInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    showCalendar: z.boolean().default(true),
    showRecipes: z.boolean().default(true),
    showWatchlist: z.boolean().default(true),
    showBooks: z.boolean().default(true),
    showTodos: z.boolean().default(true),
  })
  .refine((data) => data.showCalendar || data.showTodos || data.showRecipes || data.showWatchlist || data.showBooks, {
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

type ContentAggregate = {
  householdId: string
  _count: { id: number }
  _max: { createdAt: Date | null }
}

type ContentStatistic = { count: number; lastCreatedAt: Date | null }

function indexContentAggregates(aggregates: ContentAggregate[]) {
  return new Map<string, ContentStatistic>(
    aggregates.map((aggregate) => [
      aggregate.householdId,
      { count: aggregate._count.id, lastCreatedAt: aggregate._max.createdAt },
    ])
  )
}

function latestDate(dates: Array<Date | null>) {
  return dates.reduce<Date | null>(
    (latest, date) => (!latest || (date && date > latest) ? date : latest),
    null
  )
}

export async function listHouseholds(currentUser: { role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' }) {
  if (currentUser.role !== 'SUPER_ADMIN') throw new ForbiddenError('Super admin access required')

  const [households, eventAggregates, todoAggregates, recipeAggregates, watchlistAggregates, bookAggregates] =
    await Promise.all([
      prisma.household.findMany({
        include: {
          _count: { select: { users: true } },
          eventTypes: { orderBy: { name: 'asc' } },
          watchlistSources: { orderBy: { name: 'asc' } },
          bookSources: { orderBy: { name: 'asc' } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.event.groupBy({
        by: ['householdId'],
        _count: { id: true },
        _max: { createdAt: true },
      }),
      prisma.todo.groupBy({
        by: ['householdId'],
        _count: { id: true },
        _max: { createdAt: true },
      }),
      prisma.recipe.groupBy({
        by: ['householdId'],
        _count: { id: true },
        _max: { createdAt: true },
      }),
      prisma.watchlistEntry.groupBy({
        by: ['householdId'],
        _count: { id: true },
        _max: { createdAt: true },
      }),
      prisma.book.groupBy({
        by: ['householdId'],
        _count: { id: true },
        _max: { createdAt: true },
      }),
    ])

  const contentByType = {
    events: indexContentAggregates(eventAggregates),
    todos: indexContentAggregates(todoAggregates),
    recipes: indexContentAggregates(recipeAggregates),
    watchlistItems: indexContentAggregates(watchlistAggregates),
    books: indexContentAggregates(bookAggregates),
  }

  return households.map((household) => {
    const events = contentByType.events.get(household.id) ?? { count: 0, lastCreatedAt: null }
    const todos = contentByType.todos.get(household.id) ?? { count: 0, lastCreatedAt: null }
    const recipes = contentByType.recipes.get(household.id) ?? { count: 0, lastCreatedAt: null }
    const watchlistItems = contentByType.watchlistItems.get(household.id) ?? {
      count: 0,
      lastCreatedAt: null,
    }
    const books = contentByType.books.get(household.id) ?? { count: 0, lastCreatedAt: null }

    return {
      ...household,
      statistics: {
        events: events.count,
        todos: todos.count,
        recipes: recipes.count,
        watchlistItems: watchlistItems.count,
        books: books.count,
        lastActivityAt: latestDate([
          events.lastCreatedAt,
          todos.lastCreatedAt,
          recipes.lastCreatedAt,
          watchlistItems.lastCreatedAt,
          books.lastCreatedAt,
        ]),
      },
    }
  })
}

export type HouseholdWithCount = Awaited<ReturnType<typeof listHouseholds>>[number]

export async function createHousehold(input: HouseholdInput) {
  return prisma.household.create({
    data: {
      ...input,
      ...householdLookupDefaults(),
    },
  })
}

export async function updateHousehold(householdId: string, input: HouseholdInput) {
  return prisma.household.update({ where: { id: householdId }, data: input })
}

export async function deleteHousehold(householdId: string) {
  const [userCount, eventCount, todoCount, recipeCount, watchlistCount, bookCount] = await Promise.all([
    prisma.user.count({ where: { householdId } }),
    prisma.event.count({ where: { householdId } }),
    prisma.todo.count({ where: { householdId } }),
    prisma.recipe.count({ where: { householdId } }),
    prisma.watchlistEntry.count({ where: { householdId } }),
    prisma.book.count({ where: { householdId } }),
  ])

  if (userCount + eventCount + todoCount + recipeCount + watchlistCount + bookCount > 0) {
    throw new HouseholdInUseError()
  }

  await prisma.household.delete({ where: { id: householdId } })
}
