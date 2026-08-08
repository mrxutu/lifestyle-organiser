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

export class InvalidWatchlistSourceError extends Error {
  constructor() {
    super('The selected source must belong to this household')
    this.name = 'InvalidWatchlistSourceError'
  }
}

async function assertWatchlistSourceInHousehold(householdId: string, sourceId: string) {
  const count = await prisma.watchlistSource.count({ where: { id: sourceId, householdId } })
  if (count !== 1) throw new InvalidWatchlistSourceError()
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
  await Promise.all([
    assertViewersInHousehold(householdId, viewerUserIds),
    assertWatchlistSourceInHousehold(householdId, input.sourceId),
  ])
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
  await Promise.all([
    assertViewersInHousehold(householdId, viewerUserIds),
    assertWatchlistSourceInHousehold(householdId, input.sourceId),
  ])

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

export async function listWatchlistSources(householdId: string) {
  return prisma.watchlistSource.findMany({ where: { householdId }, orderBy: { name: 'asc' } })
}

export const watchlistSourceInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
})

export type WatchlistSourceInput = z.infer<typeof watchlistSourceInputSchema>

export async function createWatchlistSource(householdId: string, input: WatchlistSourceInput) {
  return prisma.watchlistSource.create({ data: { ...input, householdId } })
}

export async function updateWatchlistSource(
  householdId: string,
  sourceId: string,
  input: WatchlistSourceInput
) {
  const result = await prisma.watchlistSource.updateMany({
    where: { id: sourceId, householdId },
    data: input,
  })
  if (result.count === 0) return null
  return prisma.watchlistSource.findUnique({ where: { id: sourceId } })
}

export class WatchlistSourceInUseError extends Error {
  constructor(public count: number) {
    super(`This source is used by ${count} watchlist entr${count === 1 ? 'y' : 'ies'} and can't be deleted`)
    this.name = 'WatchlistSourceInUseError'
  }
}

export async function deleteWatchlistSource(householdId: string, sourceId: string) {
  const usageCount = await prisma.watchlistEntry.count({ where: { sourceId, householdId } })
  if (usageCount > 0) throw new WatchlistSourceInUseError(usageCount)
  const result = await prisma.watchlistSource.deleteMany({ where: { id: sourceId, householdId } })
  return result.count > 0
}
