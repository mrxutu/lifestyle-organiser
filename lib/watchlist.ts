import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { WatchStatus } from '@/generated/prisma/enums'

const emptyToNull = (val: unknown) => (val === '' || val == null ? null : val)

export async function listWatchlistEntries(householdId: string) {
  return prisma.watchlistEntry.findMany({
    where: { householdId },
    include: {
      source: true,
      viewers: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export type WatchlistEntryWithSource = Awaited<ReturnType<typeof listWatchlistEntries>>[number]

export const watchlistEntryInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  sourceId: z.string().min(1, 'Source is required'),
  season: z.coerce.number().int().min(1).optional().nullable(),
  episode: z.coerce.number().int().min(1).optional().nullable(),
  status: z.enum(WatchStatus).default('TO_WATCH'),
  rating: z.preprocess(emptyToNull, z.coerce.number().int().min(1).max(5).nullable()),
  viewerUserIds: z.array(z.string().min(1)).min(1, 'Select at least one viewer'),
})

export type WatchlistEntryInput = z.infer<typeof watchlistEntryInputSchema>

export class InvalidViewersError extends Error {
  constructor() {
    super('Every selected viewer must be an active member of this household')
    this.name = 'InvalidViewersError'
  }
}

async function assertViewersInHousehold(householdId: string, viewerUserIds: string[]) {
  const uniqueViewerIds = new Set(viewerUserIds)
  const memberCount = await prisma.user.count({
    where: { householdId, isActive: true, id: { in: [...uniqueViewerIds] } },
  })
  if (memberCount !== uniqueViewerIds.size || uniqueViewerIds.size !== viewerUserIds.length) {
    throw new InvalidViewersError()
  }
}

export async function createWatchlistEntry(householdId: string, input: WatchlistEntryInput) {
  const { viewerUserIds, ...entry } = input
  await assertViewersInHousehold(householdId, viewerUserIds)
  return prisma.watchlistEntry.create({
    data: {
      ...entry,
      householdId,
      viewers: { create: viewerUserIds.map((userId) => ({ userId })) },
    },
    include: {
      source: true,
      viewers: { include: { user: { select: { id: true, name: true } } } },
    },
  })
}

export async function updateWatchlistEntry(
  householdId: string,
  entryId: string,
  input: WatchlistEntryInput
) {
  const { viewerUserIds, ...entry } = input
  await assertViewersInHousehold(householdId, viewerUserIds)

  return prisma.$transaction(async (tx) => {
    const result = await tx.watchlistEntry.updateMany({
      where: { id: entryId, householdId },
      data: entry,
    })
    if (result.count === 0) return null

    await tx.watchlistViewer.deleteMany({ where: { watchlistEntryId: entryId } })
    await tx.watchlistViewer.createMany({
      data: viewerUserIds.map((userId) => ({ watchlistEntryId: entryId, userId })),
    })

    return tx.watchlistEntry.findUnique({
      where: { id: entryId },
      include: {
        source: true,
        viewers: { include: { user: { select: { id: true, name: true } } } },
      },
    })
  })
}

export async function deleteWatchlistEntry(householdId: string, entryId: string) {
  const result = await prisma.watchlistEntry.deleteMany({ where: { id: entryId, householdId } })
  return result.count > 0
}

export async function listWatchlistSources() {
  return prisma.watchlistSource.findMany({ orderBy: { name: 'asc' } })
}

export const watchlistSourceInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
})

export type WatchlistSourceInput = z.infer<typeof watchlistSourceInputSchema>

export async function createWatchlistSource(input: WatchlistSourceInput) {
  return prisma.watchlistSource.create({ data: input })
}

export async function updateWatchlistSource(sourceId: string, input: WatchlistSourceInput) {
  return prisma.watchlistSource.update({ where: { id: sourceId }, data: input })
}

export class WatchlistSourceInUseError extends Error {
  constructor(public count: number) {
    super(`This source is used by ${count} watchlist entr${count === 1 ? 'y' : 'ies'} and can't be deleted`)
    this.name = 'WatchlistSourceInUseError'
  }
}

export async function deleteWatchlistSource(sourceId: string) {
  const usageCount = await prisma.watchlistEntry.count({ where: { sourceId } })
  if (usageCount > 0) throw new WatchlistSourceInUseError(usageCount)
  return prisma.watchlistSource.delete({ where: { id: sourceId } })
}
