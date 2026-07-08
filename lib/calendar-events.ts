import type { EventInput } from '@fullcalendar/core'
import type { EventWithType } from '@/lib/events'

// FullCalendar treats `end` as exclusive for all-day events, but our stored
// endAt is the last inclusive day the user picked — bump it by a day so a
// 1st-3rd all-day event actually shades the 3rd on the calendar.
function toCalendarEnd(event: EventWithType) {
  if (!event.endAt) return undefined
  if (!event.allDay) return event.endAt.toISOString()

  const end = new Date(event.endAt)
  end.setDate(end.getDate() + 1)
  return end.toISOString()
}

export function toCalendarEventInput(event: EventWithType): EventInput {
  return {
    id: event.id,
    title: event.title,
    start: event.startAt.toISOString(),
    end: toCalendarEnd(event),
    allDay: event.allDay,
    backgroundColor: event.eventType.color,
    borderColor: event.eventType.color,
    extendedProps: { attendees: event.attendees },
  }
}
