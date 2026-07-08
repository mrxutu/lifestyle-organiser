'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'

export function CalendarView({
  events,
  onDateClick,
  onEventClick,
}: {
  events: EventInput[]
  onDateClick: (arg: DateClickArg) => void
  onEventClick: (arg: EventClickArg) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-2 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
        dateClick={onDateClick}
        eventClick={onEventClick}
      />
    </div>
  )
}
