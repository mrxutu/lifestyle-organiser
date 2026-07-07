'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { EventInput } from '@fullcalendar/core'

export function CalendarView({ events }: { events: EventInput[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
      />
    </div>
  )
}
