import type { WatchStatus } from '@/generated/prisma/enums'

export const ALL_STATUSES = 'ALL'
export const ALL_SOURCES = 'ALL'

type FilterableEntry = {
  sourceId: string
  status: WatchStatus
}

export function filterWatchlistEntries<T extends FilterableEntry>(
  entries: T[],
  { statusFilter, sourceFilter }: { statusFilter: string; sourceFilter: string }
): T[] {
  return entries.filter((entry) => {
    if (statusFilter !== ALL_STATUSES && entry.status !== statusFilter) return false
    if (sourceFilter !== ALL_SOURCES && entry.sourceId !== sourceFilter) return false
    return true
  })
}
