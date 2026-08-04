import type { WatchStatus } from '@/generated/prisma/enums'

export const ALL_STATUSES = 'ALL'
export const ALL_SOURCES = 'ALL'
export const ALL_RATINGS = 'ALL'
export const NOT_RATED = 'UNRATED'

type FilterableEntry = {
  sourceId: string
  status: WatchStatus
  rating: number | null
}

export function filterWatchlistEntries<T extends FilterableEntry>(
  entries: T[],
  {
    statusFilter,
    sourceFilter,
    ratingFilter,
  }: { statusFilter: string; sourceFilter: string; ratingFilter: string }
): T[] {
  return entries.filter((entry) => {
    if (statusFilter !== ALL_STATUSES && entry.status !== statusFilter) return false
    if (sourceFilter !== ALL_SOURCES && entry.sourceId !== sourceFilter) return false
    if (ratingFilter === NOT_RATED && entry.rating != null) return false
    if (ratingFilter !== ALL_RATINGS && ratingFilter !== NOT_RATED && entry.rating !== Number(ratingFilter)) {
      return false
    }
    return true
  })
}
