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
import type { SectionFlags } from '@/lib/household-sections'

export function ProfileTabs({
  sections,
  reminders,
  eventTypes,
  currentUserId,
  householdUsers,
  myRecipes,
  watchlistEntries,
  watchlistSources,
  myBooks,
}: {
  sections: SectionFlags
  reminders: UpcomingReminder[]
  eventTypes: EventType[]
  currentUserId: string
  householdUsers: { id: string; name: string | null }[]
  myRecipes: Awaited<ReturnType<typeof listRecipes>>
  watchlistEntries: WatchlistEntryWithSource[]
  watchlistSources: WatchlistSource[]
  myBooks: Awaited<ReturnType<typeof listBooks>>
}) {
  const tabs = [
    {
      key: 'reminders',
      enabled: sections.calendar,
      label: 'Reminders/Calendar',
      content: (
        <ProfileRemindersSection
          reminders={reminders}
          eventTypes={eventTypes}
          currentUserId={currentUserId}
          householdUsers={householdUsers}
        />
      ),
    },
    {
      key: 'recipes',
      enabled: sections.recipes,
      label: 'Recipes',
      content: <ProfileRecipesSection recipes={myRecipes} />,
    },
    {
      key: 'watchlist',
      enabled: sections.watchlist,
      label: 'Watchlist',
      content: <ProfileWatchlistSection entries={watchlistEntries} sources={watchlistSources} />,
    },
    {
      key: 'books',
      enabled: sections.books,
      label: 'Books',
      content: <ProfileBooksSection books={myBooks} />,
    },
  ].filter((tab) => tab.enabled)

  return (
    <Tabs defaultValue="all">
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="all" className="flex flex-col gap-8 pt-2">
        {tabs.map((tab) => (
          <div key={tab.key}>{tab.content}</div>
        ))}
      </TabsContent>

      {tabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className="pt-2">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
