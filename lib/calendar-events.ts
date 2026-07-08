import type { EventInput } from '@fullcalendar/core'
import type { EventWithType } from '@/lib/events'

export function toCalendarEventInput(event: EventWithType): EventInput {
  return {
    id: event.id,
    title: event.title,
    start: event.startAt.toISOString(),
    end: event.endAt?.toISOString(),
    allDay: event.allDay,
    backgroundColor: event.eventType.color,
    borderColor: event.eventType.color,
    extendedProps: { attendees: event.attendees },
  }
}
