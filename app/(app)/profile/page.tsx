import { ProfileTabs } from '@/components/profile/profile-tabs'
import { getCurrentUser, listHouseholdUsers } from '@/lib/current-user'
import { listUpcomingReminders } from '@/lib/events'
import { listEventTypes } from '@/lib/event-types'
import { listRecipes } from '@/lib/recipes'
import { listWatchlistEntries, listWatchlistSources } from '@/lib/watchlist'
import { listBooks } from '@/lib/books'

export default async function ProfilePage() {
  const { id: currentUserId, householdId } = await getCurrentUser()

  const [reminders, eventTypes, householdUsers, recipes, watchlistEntries, watchlistSources, books] =
    await Promise.all([
      listUpcomingReminders(householdId),
      listEventTypes(),
      listHouseholdUsers(householdId),
      listRecipes(householdId),
      listWatchlistEntries(householdId),
      listWatchlistSources(),
      listBooks(householdId),
    ])

  const myRecipes = recipes.filter((recipe) => recipe.authorId === currentUserId)
  const myBooks = books.filter((book) => book.readerId === currentUserId)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <ProfileTabs
        reminders={reminders}
        eventTypes={eventTypes}
        currentUserId={currentUserId}
        householdUsers={householdUsers}
        myRecipes={myRecipes}
        watchlistEntries={watchlistEntries}
        watchlistSources={watchlistSources}
        myBooks={myBooks}
      />
    </div>
  )
}
