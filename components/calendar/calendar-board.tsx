'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventType } from '@/generated/prisma/client'
import type { EventWithType } from '@/lib/events'
import { toCalendarEventInput } from '@/lib/calendar-events'
import { ALL_EVENT_TYPES, filterEventsByTypeAndUser, type UserFilterValue } from '@/lib/event-filters'
import { Button } from '@/components/ui/button'
import { EventFilters } from '@/components/event-filters'
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
  eventsRaw,
  eventTypes,
  currentUserId,
  otherUser,
  initialEventId,
}: {
  eventsRaw: EventWithType[]
  eventTypes: EventType[]
  currentUserId: string
  otherUser: { id: string; name: string | null }
  initialEventId?: string | null
}) {
  const router = useRouter()

  const initialEvent = initialEventId ? (eventsRaw.find((e) => e.id === initialEventId) ?? null) : null

  const [state, setState] = useState<BoardState>(() =>
    initialEvent ? { mode: 'edit', event: initialEvent } : { mode: 'closed' }
  )
  const [eventTypeFilter, setEventTypeFilter] = useState<string>(ALL_EVENT_TYPES)
  const [userFilter, setUserFilter] = useState<UserFilterValue>('ALL')

  const [initialViewDate] = useState<Date | null>(() => (initialEvent ? new Date(initialEvent.startAt) : null))

  useEffect(() => {
    if (!initialEventId) return
    router.replace('/calendar', { scroll: false })
    // Only meant to run once, reacting to the initial navigation — re-running
    // on every router change would re-navigate needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredEvents = useMemo(
    () =>
      filterEventsByTypeAndUser(eventsRaw, {
        eventTypeId: eventTypeFilter,
        userFilter,
        currentUserId,
        otherUserId: otherUser.id,
      }),
    [eventsRaw, eventTypeFilter, userFilter, currentUserId, otherUser.id]
  )

  const events = useMemo(() => filteredEvents.map(toCalendarEventInput), [filteredEvents])

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EventFilters
          eventTypes={eventTypes}
          eventTypeFilter={eventTypeFilter}
          onEventTypeFilterChange={setEventTypeFilter}
          userFilter={userFilter}
          onUserFilterChange={setUserFilter}
          otherUserName={otherUser.name}
        />

        <div className="flex gap-2">
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
      </div>

      {eventsRaw.length > 0 && filteredEvents.length === 0 && (
        <p className="text-sm text-muted-foreground">No events match the selected filters.</p>
      )}

      <CalendarView
        events={events}
        initialDate={initialViewDate}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={(open) => !open && close()}
        title={state.mode === 'edit' ? 'Edit event' : 'Add event'}
      >
        <EventForm
          eventTypes={eventTypes}
          initialEvent={state.mode === 'edit' ? state.event : null}
          initialDate={state.mode === 'create' ? state.initialDate : null}
          currentUserId={currentUserId}
          otherUser={otherUser}
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
