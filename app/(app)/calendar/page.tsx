import type { EventInput } from '@fullcalendar/core'
import { CalendarView } from '@/components/calendar/calendar-view'
import { getCurrentUser } from '@/lib/current-user'
import { listEvents } from '@/lib/events'

export default async function CalendarPage() {
  const { householdId } = await getCurrentUser()
  const events = await listEvents(householdId)

  const calendarEvents: EventInput[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startAt.toISOString(),
    end: event.endAt?.toISOString(),
    allDay: event.allDay,
    backgroundColor: event.eventType.color,
    borderColor: event.eventType.color,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No events yet — plans and appointments will appear here once added.
        </p>
      )}
      <CalendarView events={calendarEvents} />
    </div>
  )
}
