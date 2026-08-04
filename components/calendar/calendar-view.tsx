'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, EventClickArg, EventContentArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { UserIndicator } from '@/components/calendar/user-indicator'

export function CalendarView({
  events,
  currentUserId,
  initialDate,
  onDateClick,
  onEventClick,
}: {
  events: EventInput[]
  currentUserId: string
  initialDate?: Date | null
  onDateClick: (arg: DateClickArg) => void
  onEventClick: (arg: EventClickArg) => void
}) {
  function renderEventContent(arg: EventContentArg) {
    const attendees = (arg.event.extendedProps.attendees ?? []) as { userId: string }[]

    return (
      <div className="flex min-w-0 items-center gap-1 px-0.5">
        <UserIndicator attendees={attendees} currentUserId={currentUserId} />
        {arg.timeText && <span className="shrink-0 text-[0.7em] opacity-80">{arg.timeText}</span>}
        <span className="min-w-0 flex-1 truncate">{arg.event.title}</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2 sm:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate ?? undefined}
        events={events}
        eventDisplay="block"
        height="auto"
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        nowIndicator
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        dateClick={onDateClick}
        eventClick={onEventClick}
        eventContent={renderEventContent}
      />
    </div>
  )
}
