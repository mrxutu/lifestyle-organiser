import { WatchlistPage as WatchlistPageContent } from '@/components/watchlist/watchlist-cards'
import { Page } from '@/components/ui/page'
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
    <Page>
      <WatchlistPageContent
        entries={entries}
        sources={sources}
        householdUsers={householdUsers}
        currentUserId={currentUserId}
        canManageLookups={role === 'ADMIN' || role === 'SUPER_ADMIN'}
      />
    </Page>
  )
}
