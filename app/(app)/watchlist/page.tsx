import { WatchlistCards } from '@/components/watchlist/watchlist-cards'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listWatchlistEntries, listWatchlistSources } from '@/lib/watchlist'

export default async function WatchlistPage() {
  const { id: currentUserId, householdId, role } = await requireSection('watchlist')
  const [entries, sources, householdUsers] = await Promise.all([
    listWatchlistEntries(householdId),
    listWatchlistSources(householdId),
    listHouseholdUsers(householdId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <WatchlistCards
        entries={entries}
        sources={sources}
        householdUsers={householdUsers}
        currentUserId={currentUserId}
        canManageLookups={role === 'ADMIN' || role === 'SUPER_ADMIN'}
      />
    </div>
  )
}
