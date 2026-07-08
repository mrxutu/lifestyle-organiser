'use client'

import { useState, type FormEvent } from 'react'
import type { EventType } from '@/generated/prisma/client'
import type { Recurrence } from '@/generated/prisma/enums'
import type { EventWithType } from '@/lib/events'
import { recurrenceLabel } from '@/lib/reminder-urgency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toTimeValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

type Who = 'ME' | 'OTHER' | 'BOTH'

function initialWho(initialEvent: EventWithType | null | undefined, currentUserId: string, otherUserId: string): Who {
  if (!initialEvent) return 'ME'
  const attendeeIds = new Set(initialEvent.attendees.map((a) => a.userId))
  const hasMe = attendeeIds.has(currentUserId)
  const hasOther = attendeeIds.has(otherUserId)
  if (hasMe && hasOther) return 'BOTH'
  if (hasOther) return 'OTHER'
  return 'ME'
}

export function EventForm({
  eventTypes,
  initialEvent,
  initialDate,
  currentUserId,
  otherUser,
  onSuccess,
  onCancel,
}: {
  eventTypes: EventType[]
  initialEvent?: EventWithType | null
  initialDate?: Date | null
  currentUserId: string
  otherUser: { id: string; name: string | null }
  onSuccess: () => void
  onCancel: () => void
}) {
  const baseStart = initialEvent ? new Date(initialEvent.startAt) : initialDate ?? new Date()
  const baseEnd = initialEvent?.endAt ? new Date(initialEvent.endAt) : null

  const [title, setTitle] = useState(initialEvent?.title ?? '')
  const [eventTypeId, setEventTypeId] = useState(initialEvent?.eventTypeId ?? eventTypes[0]?.id ?? '')
  const [who, setWho] = useState<Who>(initialWho(initialEvent, currentUserId, otherUser.id))
  const [allDay, setAllDay] = useState(initialEvent?.allDay ?? false)
  const [startDate, setStartDate] = useState(toDateValue(baseStart))
  const [startTime, setStartTime] = useState(toTimeValue(baseStart))
  const [endDate, setEndDate] = useState(baseEnd ? toDateValue(baseEnd) : '')
  const [endTime, setEndTime] = useState(baseEnd ? toTimeValue(baseEnd) : '')
  const [location, setLocation] = useState(initialEvent?.location ?? '')
  const [description, setDescription] = useState(initialEvent?.description ?? '')
  const [recurrence, setRecurrence] = useState<Recurrence>(initialEvent?.recurrence ?? 'NONE')
  const [leadTimeDays, setLeadTimeDays] = useState(
    initialEvent ? (initialEvent.leadTimeDays != null ? String(initialEvent.leadTimeDays) : '') : '0'
  )
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const startAt = allDay ? parseDateOnly(startDate) : new Date(`${startDate}T${startTime}`)
    const endAt = endDate ? (allDay ? parseDateOnly(endDate) : new Date(`${endDate}T${endTime}`)) : null

    const body = {
      title,
      description: description || null,
      startAt: startAt.toISOString(),
      endAt: endAt ? endAt.toISOString() : null,
      allDay,
      location: location || null,
      eventTypeId,
      recurrence,
      leadTimeDays: leadTimeDays === '' ? null : Number(leadTimeDays),
      attendeeUserIds:
        who === 'BOTH' ? [currentUserId, otherUser.id] : who === 'OTHER' ? [otherUser.id] : [currentUserId],
    }

    const res = await fetch(initialEvent ? `/api/events/${initialEvent.id}` : '/api/events', {
      method: initialEvent ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }

    onSuccess()
  }

  async function handleDelete() {
    if (!initialEvent) return
    setDeleting(true)
    setError(null)

    const res = await fetch(`/api/events/${initialEvent.id}`, { method: 'DELETE' })

    setDeleting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="event-title">Title</Label>
        <Input id="event-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-type">Event type</Label>
        {eventTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No event types yet — create one under &ldquo;Manage types&rdquo; first.
          </p>
        ) : (
          <Select value={eventTypeId} onValueChange={setEventTypeId}>
            <SelectTrigger id="event-type" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-who">Who&rsquo;s this for</Label>
        <Select value={who} onValueChange={(value) => setWho(value as Who)}>
          <SelectTrigger id="event-who" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ME">Me</SelectItem>
            <SelectItem value="OTHER">{otherUser.name ?? 'Them'}</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="event-all-day">All day</Label>
        <Switch id="event-all-day" checked={allDay} onCheckedChange={setAllDay} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="event-start-date">Start</Label>
          <Input
            id="event-start-date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        {!allDay && (
          <div className="space-y-1.5">
            <Label htmlFor="event-start-time">&nbsp;</Label>
            <Input
              id="event-start-time"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="event-end-date">End (optional)</Label>
          <Input
            id="event-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {!allDay && (
          <div className="space-y-1.5">
            <Label htmlFor="event-end-time">&nbsp;</Label>
            <Input
              id="event-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-location">Location (optional)</Label>
        <Input id="event-location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-description">Description (optional)</Label>
        <Textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-recurrence">Recurrence</Label>
        <Select value={recurrence} onValueChange={(value) => setRecurrence(value as Recurrence)}>
          <SelectTrigger id="event-recurrence" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(recurrenceLabel).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-lead-time">Show on Reminders (days before, blank to exclude)</Label>
        <Input
          id="event-lead-time"
          type="number"
          min={0}
          value={leadTimeDays}
          onChange={(e) => setLeadTimeDays(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialEvent && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleting} className="sm:mr-auto">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{initialEvent.title}&rdquo; will be removed. This can&rsquo;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || eventTypes.length === 0}>
          {submitting ? 'Saving…' : initialEvent ? 'Save changes' : 'Add event'}
        </Button>
      </div>
    </form>
  )
}
