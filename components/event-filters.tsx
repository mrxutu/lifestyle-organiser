'use client'

import type { EventType } from '@/generated/prisma/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ALL_EVENT_TYPES, type UserFilterValue } from '@/lib/event-filters'

export function EventFilters({
  eventTypes,
  eventTypeFilter,
  onEventTypeFilterChange,
  userFilter,
  onUserFilterChange,
  otherUserName,
}: {
  eventTypes: EventType[]
  eventTypeFilter: string
  onEventTypeFilterChange: (value: string) => void
  userFilter: UserFilterValue
  onUserFilterChange: (value: UserFilterValue) => void
  otherUserName: string | null
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={eventTypeFilter} onValueChange={onEventTypeFilterChange}>
        <SelectTrigger className="w-[160px]" aria-label="Filter by event type">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_EVENT_TYPES}>All types</SelectItem>
          {eventTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: type.color }} />
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={userFilter} onValueChange={(value) => onUserFilterChange(value as UserFilterValue)}>
        <SelectTrigger className="w-[160px]" aria-label="Filter by assigned user">
          <SelectValue placeholder="Everyone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Everyone</SelectItem>
          <SelectItem value="ME">Me</SelectItem>
          <SelectItem value="OTHER">{otherUserName ?? 'Them'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
