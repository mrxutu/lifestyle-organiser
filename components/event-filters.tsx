'use client'

import { ChevronDown } from 'lucide-react'
import type { EventType } from '@/generated/prisma/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ALL_EVENT_TYPES } from '@/lib/event-filters'

function userFilterLabel(userFilter: string[], currentUserId: string, householdUsers: { id: string; name: string | null }[]) {
  if (userFilter.length === 0) return 'All attendees'
  if (userFilter.length === 1) {
    const [id] = userFilter
    if (id === currentUserId) return 'Me'
    return householdUsers.find((u) => u.id === id)?.name ?? 'Someone'
  }
  return `${userFilter.length} people`
}

export function EventFilters({
  eventTypes,
  eventTypeFilter,
  onEventTypeFilterChange,
  userFilter,
  onUserFilterChange,
  currentUserId,
  householdUsers,
}: {
  eventTypes: EventType[]
  eventTypeFilter: string
  onEventTypeFilterChange: (value: string) => void
  userFilter: string[]
  onUserFilterChange: (value: string[]) => void
  currentUserId: string
  householdUsers: { id: string; name: string | null }[]
}) {
  function toggleUser(userId: string) {
    onUserFilterChange(
      userFilter.includes(userId) ? userFilter.filter((id) => id !== userId) : [...userFilter, userId]
    )
  }

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-[160px] justify-between font-normal"
            aria-label="Filter by assigned user"
          >
            {userFilterLabel(userFilter, currentUserId, householdUsers)}
            <ChevronDown className="opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem
            checked={userFilter.length === 0}
            onCheckedChange={() => onUserFilterChange([])}
            onSelect={(e) => e.preventDefault()}
          >
            All attendees
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {householdUsers.map((user) => (
            <DropdownMenuCheckboxItem
              key={user.id}
              checked={userFilter.includes(user.id)}
              onCheckedChange={() => toggleUser(user.id)}
              onSelect={(e) => e.preventDefault()}
            >
              {user.id === currentUserId ? 'Me' : (user.name ?? 'Unnamed')}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
