import { WatchlistCards } from '@/components/watchlist/watchlist-cards'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listWatchlistEntries, listWatchlistSources } from '@/lib/watchlist'

export default async function WatchlistPage() {
  const { id: currentUserId, householdId } = await requireSection('watchlist')
  const [entries, sources, householdUsers] = await Promise.all([
    listWatchlistEntries(householdId),
    listWatchlistSources(),
    listHouseholdUsers(householdId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Watchlist</h1>
      <WatchlistCards
        entries={entries}
        sources={sources}
        householdUsers={householdUsers}
        currentUserId={currentUserId}
      />
    </div>
  )
}
