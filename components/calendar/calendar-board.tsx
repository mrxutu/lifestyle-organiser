'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventInput as CalendarEventInput, EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventType } from '@/generated/prisma/client'
import type { EventWithType } from '@/lib/events'
import { Button } from '@/components/ui/button'
import { CalendarView } from '@/components/calendar/calendar-view'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { EventForm } from '@/components/calendar/event-form'
import { EventTypeManager } from '@/components/calendar/event-type-manager'

type BoardState =
  | { mode: 'closed' }
  | { mode: 'create'; initialDate: Date | null }
  | { mode: 'edit'; event: EventWithType }
  | { mode: 'manage-types' }

export function CalendarBoard({
  events,
  eventsRaw,
  eventTypes,
}: {
  events: CalendarEventInput[]
  eventsRaw: EventWithType[]
  eventTypes: EventType[]
}) {
  const router = useRouter()
  const [state, setState] = useState<BoardState>({ mode: 'closed' })

  function close() {
    setState({ mode: 'closed' })
  }

  function handleSuccess() {
    close()
    router.refresh()
  }

  function handleDateClick(arg: DateClickArg) {
    setState({ mode: 'create', initialDate: arg.date })
  }

  function handleEventClick(arg: EventClickArg) {
    const found = eventsRaw.find((e) => e.id === arg.event.id)
    if (found) setState({ mode: 'edit', event: found })
  }

  const formOpen = state.mode === 'create' || state.mode === 'edit'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setState({ mode: 'manage-types' })}
        >
          Manage types
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setState({ mode: 'create', initialDate: null })}
        >
          + Add event
        </Button>
      </div>

      <CalendarView events={events} onDateClick={handleDateClick} onEventClick={handleEventClick} />

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={(open) => !open && close()}
        title={state.mode === 'edit' ? 'Edit event' : 'Add event'}
      >
        <EventForm
          eventTypes={eventTypes}
          initialEvent={state.mode === 'edit' ? state.event : null}
          initialDate={state.mode === 'create' ? state.initialDate : null}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={state.mode === 'manage-types'}
        onOpenChange={(open) => !open && close()}
        title="Manage event types"
      >
        <EventTypeManager eventTypes={eventTypes} />
      </ResponsiveDialog>
    </div>
  )
}
