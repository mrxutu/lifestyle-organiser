import { CalendarBoard } from '@/components/calendar/calendar-board'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listEvents } from '@/lib/events'
import { listEventTypes } from '@/lib/event-types'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { id: currentUserId, householdId } = await requireSection('calendar')
  const [events, eventTypes, householdUsers, { eventId }] = await Promise.all([
    listEvents(householdId),
    listEventTypes(),
    listHouseholdUsers(householdId),
    searchParams,
  ])

  return (
    <div className="flex flex-col gap-6">
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No events yet — plans and appointments will appear here once added.
        </p>
      )}
      <CalendarBoard
        eventsRaw={events}
        eventTypes={eventTypes}
        currentUserId={currentUserId}
        householdUsers={householdUsers}
        initialEventId={eventId ?? null}
      />
    </div>
  )
}
