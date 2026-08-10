import { CalendarBoard } from '@/components/calendar/calendar-board'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listEvents } from '@/lib/events'
import { listEventTypes } from '@/lib/event-types'
import { Page } from '@/components/ui/page'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { id: currentUserId, householdId, role } = await requireSection('calendar')
  const [events, eventTypes, householdUsers, { eventId }] = await Promise.all([
    listEvents(householdId),
    listEventTypes(householdId),
    listHouseholdUsers(householdId),
    searchParams,
  ])

  return (
    <Page>
      <CalendarBoard
        eventsRaw={events}
        eventTypes={eventTypes}
        currentUserId={currentUserId}
        householdUsers={householdUsers}
        initialEventId={eventId ?? null}
        canManageLookups={role === 'ADMIN' || role === 'SUPER_ADMIN'}
      />
    </Page>
  )
}
