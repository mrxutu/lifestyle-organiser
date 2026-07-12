import { WatchlistTable } from '@/components/watchlist/watchlist-table'
import { getCurrentUser } from '@/lib/current-user'
import { listWatchlistEntries, listWatchlistSources } from '@/lib/watchlist'

export default async function WatchlistPage() {
  const { householdId } = await getCurrentUser()
  const [entries, sources] = await Promise.all([
    listWatchlistEntries(householdId),
    listWatchlistSources(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Watchlist</h1>
      <WatchlistTable entries={entries} sources={sources} />
    </div>
  )
}
