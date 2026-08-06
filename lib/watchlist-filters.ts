import type { WatchStatus } from '@/generated/prisma/enums'
import { ALL_MEMBERS } from '@/lib/member-filters'

export const ALL_STATUSES = 'ALL'
export const ALL_SOURCES = 'ALL'
export const ALL_RATINGS = 'ALL'
export const NOT_RATED = 'UNRATED'

type FilterableEntry = {
  sourceId: string
  status: WatchStatus
  rating: number | null
  viewers: { userId: string }[]
}

export function filterWatchlistEntries<T extends FilterableEntry>(
  entries: T[],
  {
    statusFilter,
    sourceFilter,
    ratingFilter,
    viewerFilter,
  }: { statusFilter: string; sourceFilter: string; ratingFilter: string; viewerFilter?: string }
): T[] {
  return entries.filter((entry) => {
    if (statusFilter !== ALL_STATUSES && entry.status !== statusFilter) return false
    if (sourceFilter !== ALL_SOURCES && entry.sourceId !== sourceFilter) return false
    if (ratingFilter === NOT_RATED && entry.rating != null) return false
    if (ratingFilter !== ALL_RATINGS && ratingFilter !== NOT_RATED && entry.rating !== Number(ratingFilter)) {
      return false
    }
    if (viewerFilter && viewerFilter !== ALL_MEMBERS && !entry.viewers.some((viewer) => viewer.userId === viewerFilter)) {
      return false
    }
    return true
  })
}
