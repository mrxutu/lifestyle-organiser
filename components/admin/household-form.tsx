'use client'

import { useState, type FormEvent } from 'react'
import type { HouseholdWithCount } from '@/lib/admin-households'
import { SECTION_KEYS, SECTION_META, type SectionFlags } from '@/lib/household-sections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { EventTypeManager } from '@/components/calendar/event-type-manager'
import { WatchlistSourceManager } from '@/components/watchlist/watchlist-source-manager'
import { BookSourceManager } from '@/components/books/book-source-manager'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

function sectionsFrom(household?: HouseholdWithCount | null): SectionFlags {
  return {
    calendar: household?.showCalendar ?? true,
    recipes: household?.showRecipes ?? true,
    watchlist: household?.showWatchlist ?? true,
    books: household?.showBooks ?? true,
  }
}

export function HouseholdForm({
  initialHousehold,
  onSuccess,
  onCancel,
}: {
  initialHousehold?: HouseholdWithCount | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialHousehold?.name ?? '')
  const [sections, setSections] = useState<SectionFlags>(sectionsFrom(initialHousehold))
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const noSectionsEnabled = SECTION_KEYS.every((key) => !sections[key])

  function toggleSection(key: keyof SectionFlags) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (noSectionsEnabled) {
      setError('At least one section must stay enabled')
      return
    }
    setSubmitting(true)
    setError(null)

    const res = await fetch(
      initialHousehold ? `/api/admin/households/${initialHousehold.id}` : '/api/admin/households',
      {
        method: initialHousehold ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          showCalendar: sections.calendar,
          showRecipes: sections.recipes,
          showWatchlist: sections.watchlist,
          showBooks: sections.books,
        }),
      }
    )

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }

    onSuccess()
  }

  async function handleDelete() {
    if (!initialHousehold) return
    setDeleting(true)
    setError(null)

    const res = await fetch(`/api/admin/households/${initialHousehold.id}`, { method: 'DELETE' })

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
        <Label htmlFor="household-name">Name</Label>
        <Input id="household-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Section types</Label>
        <div className="flex flex-col gap-2">
          {SECTION_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`household-section-${key}`}
                checked={sections[key]}
                onCheckedChange={() => toggleSection(key)}
              />
              <Label htmlFor={`household-section-${key}`} className="font-normal">
                {SECTION_META[key].label}
                {key === 'calendar' && ' (includes Reminders)'}
              </Label>
            </div>
          ))}
        </div>
        {noSectionsEnabled && (
          <p className="text-sm text-destructive">At least one section must stay enabled.</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {initialHousehold && (
        <div className="flex flex-col gap-5 border-t pt-4">
          <div className="space-y-2">
            <Label>Event types</Label>
            <EventTypeManager eventTypes={initialHousehold.eventTypes} householdId={initialHousehold.id} />
          </div>
          <div className="space-y-2">
            <Label>Watchlist sources</Label>
            <WatchlistSourceManager sources={initialHousehold.watchlistSources} householdId={initialHousehold.id} />
          </div>
          <div className="space-y-2">
            <Label>Book sources</Label>
            <BookSourceManager sources={initialHousehold.bookSources} householdId={initialHousehold.id} />
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialHousehold && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleting} className="sm:mr-auto">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &ldquo;{initialHousehold.name}&rdquo;?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can&rsquo;t be undone. Deletion is blocked while this household still has
                  members or content.
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
        <Button type="submit" disabled={submitting || noSectionsEnabled}>
          {submitting ? 'Saving…' : initialHousehold ? 'Save changes' : 'Create household'}
        </Button>
      </div>
    </form>
  )
}
