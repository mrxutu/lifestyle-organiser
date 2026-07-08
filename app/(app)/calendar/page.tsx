import { CalendarBoard } from '@/components/calendar/calendar-board'
import { getCurrentUser, listHouseholdUsers } from '@/lib/current-user'
import { listEvents } from '@/lib/events'
import { listEventTypes } from '@/lib/event-types'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { id: currentUserId, householdId } = await getCurrentUser()
  const [events, eventTypes, householdUsers, { eventId }] = await Promise.all([
    listEvents(householdId),
    listEventTypes(),
    listHouseholdUsers(householdId),
    searchParams,
  ])

  const otherUser = householdUsers.find((u) => u.id !== currentUserId) ?? { id: currentUserId, name: null }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No events yet — plans and appointments will appear here once added.
        </p>
      )}
      <CalendarBoard
        eventsRaw={events}
        eventTypes={eventTypes}
        currentUserId={currentUserId}
        otherUser={otherUser}
        initialEventId={eventId ?? null}
      />
    </div>
  )
}
