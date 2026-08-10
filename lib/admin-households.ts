import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { householdLookupDefaults } from '@/lib/lookup-defaults'
import { ForbiddenError } from '@/lib/current-user'
import { deleteManagedImage, isManagedImageUrl, type ImageFeature } from '@/lib/image-storage'

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

export class HouseholdCascadeIneligibleError extends Error {
  constructor() {
    super('Move all Super Admins out of this household before deleting it')
    this.name = 'HouseholdCascadeIneligibleError'
  }
}

export class HouseholdConfirmationError extends Error {
  constructor() {
    super('The confirmation name does not exactly match the household name')
    this.name = 'HouseholdConfirmationError'
  }
}

export class HouseholdCascadeConflictError extends Error {
  constructor() {
    super('The household changed during deletion. Nothing was deleted; review it and try again')
    this.name = 'HouseholdCascadeConflictError'
  }
}

export const householdCascadeInputSchema = z.object({
  confirmationName: z.string().min(1, 'Household name confirmation is required'),
})

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
          users: { where: { role: 'SUPER_ADMIN' }, select: { id: true } },
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

    const { users, ...householdData } = household
    return {
      ...householdData,
      hasSuperAdmin: users.length > 0,
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

type LockedHousehold = { id: string; name: string }
type LockedUser = { id: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'; isActive: boolean }
type ManagedImage = { feature: ImageFeature; url: string }

type CascadeOptions = {
  afterContentDeletion?: () => Promise<void>
  deleteImage?: typeof deleteManagedImage
}

function uniqueManagedImages(recipes: Array<{ imageUrl: string | null }>, books: Array<{ imageUrl: string | null }>) {
  const images = new Map<string, ManagedImage>()
  for (const { feature, urls } of [
    { feature: 'recipes' as const, urls: recipes },
    { feature: 'books' as const, urls: books },
  ]) {
    for (const { imageUrl } of urls) {
      if (imageUrl && isManagedImageUrl(imageUrl, feature)) {
        images.set(`${feature}:${imageUrl}`, { feature, url: imageUrl })
      }
    }
  }
  return [...images.values()]
}

export async function cascadeDeleteHousehold(
  householdId: string,
  confirmationName: string,
  initiatingUserId: string,
  options: CascadeOptions = {}
) {
  let images: ManagedImage[]

  try {
    images = await prisma.$transaction(
      async (tx) => {
        const households = await tx.$queryRaw<LockedHousehold[]>(Prisma.sql`
          SELECT "id", "name" FROM "Household" WHERE "id" = ${householdId} FOR UPDATE
        `)
        const household = households[0]
        if (!household) throw new Prisma.PrismaClientKnownRequestError('Household not found', { code: 'P2025', clientVersion: '7' })

        const initiators = await tx.$queryRaw<LockedUser[]>(Prisma.sql`
          SELECT "id", "role"::text, "isActive" FROM "User" WHERE "id" = ${initiatingUserId} FOR UPDATE
        `)
        const initiator = initiators[0]
        if (!initiator?.isActive || initiator.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Super admin access required')
        }

        const users = await tx.$queryRaw<LockedUser[]>(Prisma.sql`
          SELECT "id", "role"::text, "isActive" FROM "User"
          WHERE "householdId" = ${householdId} ORDER BY "id" FOR UPDATE
        `)
        if (users.some((user) => user.role === 'SUPER_ADMIN')) throw new HouseholdCascadeIneligibleError()
        if (household.name !== confirmationName) throw new HouseholdConfirmationError()

        const recipes = await tx.recipe.findMany({ where: { householdId }, select: { imageUrl: true } })
        const books = await tx.book.findMany({ where: { householdId }, select: { imageUrl: true } })
        const managedImages = uniqueManagedImages(recipes, books)

        await tx.eventAttendee.deleteMany({ where: { event: { householdId } } })
        await tx.event.deleteMany({ where: { householdId } })
        await tx.ingredient.deleteMany({ where: { recipe: { householdId } } })
        await tx.recipe.deleteMany({ where: { householdId } })
        await tx.watchlistViewer.deleteMany({ where: { watchlistEntry: { householdId } } })
        await tx.watchlistEntry.deleteMany({ where: { householdId } })
        await tx.todoOwner.deleteMany({ where: { todo: { householdId } } })
        await tx.todo.deleteMany({ where: { householdId } })
        await tx.book.deleteMany({ where: { householdId } })
        await tx.eventType.deleteMany({ where: { householdId } })
        await tx.watchlistSource.deleteMany({ where: { householdId } })
        await tx.bookSource.deleteMany({ where: { householdId } })
        await tx.passwordResetToken.deleteMany({ where: { user: { householdId } } })

        await options.afterContentDeletion?.()

        await tx.user.deleteMany({ where: { householdId } })
        await tx.household.delete({ where: { id: householdId } })
        return managedImages
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new HouseholdCascadeConflictError()
    }
    throw error
  }

  const deleteImage = options.deleteImage ?? deleteManagedImage
  const failedImages: ManagedImage[] = []
  for (const image of images) {
    try {
      await deleteImage(image.feature, image.url)
    } catch (error) {
      failedImages.push(image)
      console.error('Managed Blob cleanup failed after successful household cascade deletion', {
        householdId,
        feature: image.feature,
        url: image.url,
        error,
      })
    }
  }

  return {
    ok: true as const,
    databaseDeleted: true as const,
    blobCleanup: { attempted: images.length, failed: failedImages.length },
    warning:
      failedImages.length > 0
        ? `${failedImages.length} managed image${failedImages.length === 1 ? '' : 's'} could not be removed`
        : undefined,
  }
}
