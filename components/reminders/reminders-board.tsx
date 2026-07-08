'use client'

import { useMemo, useState } from 'react'
import type { EventType } from '@/generated/prisma/client'
import type { UpcomingReminder } from '@/lib/events'
import { ALL_EVENT_TYPES, filterEventsByTypeAndUser, type UserFilterValue } from '@/lib/event-filters'
import { EventFilters } from '@/components/event-filters'
import { UpcomingReminderRow } from '@/components/reminders/upcoming-reminder-row'

export function RemindersBoard({
  reminders,
  eventTypes,
  currentUserId,
  otherUser,
}: {
  reminders: UpcomingReminder[]
  eventTypes: EventType[]
  currentUserId: string
  otherUser: { id: string; name: string | null }
}) {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>(ALL_EVENT_TYPES)
  const [userFilter, setUserFilter] = useState<UserFilterValue>('ME')

  const filteredReminders = useMemo(
    () =>
      filterEventsByTypeAndUser(reminders, {
        eventTypeId: eventTypeFilter,
        userFilter,
        currentUserId,
        otherUserId: otherUser.id,
      }),
    [reminders, eventTypeFilter, userFilter, currentUserId, otherUser.id]
  )

  return (
    <div className="flex flex-col gap-3">
      <EventFilters
        eventTypes={eventTypes}
        eventTypeFilter={eventTypeFilter}
        onEventTypeFilterChange={setEventTypeFilter}
        userFilter={userFilter}
        onUserFilterChange={setUserFilter}
        otherUserName={otherUser.name}
      />

      {filteredReminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reminders match the selected filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredReminders.map((reminder) => (
            <UpcomingReminderRow key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </div>
  )
}
