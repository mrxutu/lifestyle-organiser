import { ProfileTabs } from '@/components/profile/profile-tabs'
import { getCurrentUser, listHouseholdUsers } from '@/lib/current-user'
import { listUpcomingReminders } from '@/lib/events'
import { listEventTypes } from '@/lib/event-types'
import { listRecipes } from '@/lib/recipes'
import { listWatchlistEntries, listWatchlistSources } from '@/lib/watchlist'
import { listBooks } from '@/lib/books'

export default async function ProfilePage() {
  const { id: currentUserId, householdId, sections } = await getCurrentUser()

  const [reminders, eventTypes, householdUsers, recipes, watchlistEntries, watchlistSources, books] =
    await Promise.all([
      sections.calendar ? listUpcomingReminders(householdId) : Promise.resolve([]),
      sections.calendar ? listEventTypes() : Promise.resolve([]),
      listHouseholdUsers(householdId),
      sections.recipes ? listRecipes(householdId) : Promise.resolve([]),
      sections.watchlist ? listWatchlistEntries(householdId) : Promise.resolve([]),
      sections.watchlist ? listWatchlistSources() : Promise.resolve([]),
      sections.books ? listBooks(householdId) : Promise.resolve([]),
    ])

  const myReminders = reminders.filter((reminder) =>
    reminder.attendees.some((attendee) => attendee.userId === currentUserId)
  )
  const myRecipes = recipes.filter((recipe) => recipe.chefId === currentUserId)
  const myWatchlistEntries = watchlistEntries.filter((entry) =>
    entry.viewers.some((viewer) => viewer.userId === currentUserId)
  )
  const myBooks = books.filter((book) => book.readerId === currentUserId)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <ProfileTabs
        sections={sections}
        reminders={myReminders}
        eventTypes={eventTypes}
        currentUserId={currentUserId}
        householdUsers={householdUsers}
        myRecipes={myRecipes}
        watchlistEntries={myWatchlistEntries}
        watchlistSources={watchlistSources}
        myBooks={myBooks}
      />
    </div>
  )
}
