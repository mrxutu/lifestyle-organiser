import { ProfileTabs } from '@/components/profile/profile-tabs'
import { getCurrentUser, listHouseholdUsers } from '@/lib/current-user'
import { listUpcomingReminders } from '@/lib/events'
import { listEventTypes } from '@/lib/event-types'
import { listRecipes } from '@/lib/recipes'
import { listWatchlistEntries, listWatchlistSources } from '@/lib/watchlist'
import { listBooks } from '@/lib/books'
import { listTodosForOwner } from '@/lib/todos'
import { applicationVersionLabel } from '@/lib/application-version'
import { Page } from '@/components/ui/page'
import { PageHeader } from '@/components/ui/page-header'

export default async function ProfilePage() {
  const { id: currentUserId, householdId, sections } = await getCurrentUser()

  const [reminders, eventTypes, householdUsers, todos, recipes, watchlistEntries, watchlistSources, books] =
    await Promise.all([
      sections.calendar ? listUpcomingReminders(householdId) : Promise.resolve([]),
      sections.calendar ? listEventTypes(householdId) : Promise.resolve([]),
      listHouseholdUsers(householdId),
      sections.todos ? listTodosForOwner(householdId, currentUserId) : Promise.resolve([]),
      sections.recipes ? listRecipes(householdId) : Promise.resolve([]),
      sections.watchlist ? listWatchlistEntries(householdId) : Promise.resolve([]),
      sections.watchlist ? listWatchlistSources(householdId) : Promise.resolve([]),
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
    <Page>
      <PageHeader title="Profile" />
      <ProfileTabs
        sections={sections}
        reminders={myReminders}
        eventTypes={eventTypes}
        currentUserId={currentUserId}
        householdUsers={householdUsers}
        myTodos={todos}
        myRecipes={myRecipes}
        watchlistEntries={myWatchlistEntries}
        watchlistSources={watchlistSources}
        myBooks={myBooks}
      />
      <p className="text-center text-xs text-muted-foreground">{applicationVersionLabel}</p>
    </Page>
  )
}
