'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileRemindersSection } from '@/components/profile/profile-reminders-section'
import { ProfileRecipesSection } from '@/components/profile/profile-recipes-section'
import { ProfileWatchlistSection } from '@/components/profile/profile-watchlist-section'
import { ProfileBooksSection } from '@/components/profile/profile-books-section'
import type { EventType, WatchlistSource } from '@/generated/prisma/client'
import type { UpcomingReminder } from '@/lib/events'
import type { listRecipes } from '@/lib/recipes'
import type { WatchlistEntryWithSource } from '@/lib/watchlist'
import type { listBooks } from '@/lib/books'

export function ProfileTabs({
  reminders,
  eventTypes,
  currentUserId,
  householdUsers,
  myRecipes,
  watchlistEntries,
  watchlistSources,
  myBooks,
}: {
  reminders: UpcomingReminder[]
  eventTypes: EventType[]
  currentUserId: string
  householdUsers: { id: string; name: string | null }[]
  myRecipes: Awaited<ReturnType<typeof listRecipes>>
  watchlistEntries: WatchlistEntryWithSource[]
  watchlistSources: WatchlistSource[]
  myBooks: Awaited<ReturnType<typeof listBooks>>
}) {
  return (
    <Tabs defaultValue="all">
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="reminders">Reminders/Calendar</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="all" className="flex flex-col gap-8 pt-2">
        <ProfileRemindersSection
          reminders={reminders}
          eventTypes={eventTypes}
          currentUserId={currentUserId}
          householdUsers={householdUsers}
        />
        <ProfileRecipesSection recipes={myRecipes} />
        <ProfileWatchlistSection entries={watchlistEntries} sources={watchlistSources} />
        <ProfileBooksSection books={myBooks} />
      </TabsContent>

      <TabsContent value="reminders" className="pt-2">
        <ProfileRemindersSection
          reminders={reminders}
          eventTypes={eventTypes}
          currentUserId={currentUserId}
          householdUsers={householdUsers}
        />
      </TabsContent>

      <TabsContent value="recipes" className="pt-2">
        <ProfileRecipesSection recipes={myRecipes} />
      </TabsContent>

      <TabsContent value="watchlist" className="pt-2">
        <ProfileWatchlistSection entries={watchlistEntries} sources={watchlistSources} />
      </TabsContent>

      <TabsContent value="books" className="pt-2">
        <ProfileBooksSection books={myBooks} />
      </TabsContent>
    </Tabs>
  )
}
