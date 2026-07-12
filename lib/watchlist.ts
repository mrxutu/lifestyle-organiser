import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { WatchStatus } from '@/generated/prisma/enums'

export async function listWatchlistEntries(householdId: string) {
  return prisma.watchlistEntry.findMany({
    where: { householdId },
    include: { source: true },
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
})

export type WatchlistEntryInput = z.infer<typeof watchlistEntryInputSchema>

export async function createWatchlistEntry(householdId: string, input: WatchlistEntryInput) {
  return prisma.watchlistEntry.create({
    data: { ...input, householdId },
    include: { source: true },
  })
}

export async function updateWatchlistEntry(
  householdId: string,
  entryId: string,
  input: WatchlistEntryInput
) {
  const result = await prisma.watchlistEntry.updateMany({
    where: { id: entryId, householdId },
    data: input,
  })
  if (result.count === 0) return null

  return prisma.watchlistEntry.findUnique({
    where: { id: entryId },
    include: { source: true },
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
