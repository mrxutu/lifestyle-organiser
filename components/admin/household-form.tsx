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
import { ResponsiveDialog } from '@/components/responsive-dialog'
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
    todos: household?.showTodos ?? true,
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
  const [cascadeOpen, setCascadeOpen] = useState(false)
  const [confirmationName, setConfirmationName] = useState('')
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
          showTodos: sections.todos,
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

  async function handleCascadeDelete() {
    if (!initialHousehold || confirmationName !== initialHousehold.name) return
    setDeleting(true)
    setError(null)

    const res = await fetch(`/api/admin/households/${initialHousehold.id}/cascade-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationName }),
    })
    const data = await res.json().catch(() => null)
    setDeleting(false)

    if (!res.ok) {
      setError(data?.error ?? 'Something went wrong')
      setCascadeOpen(false)
      return
    }

    if (data?.warning) console.warn(data.warning, data.blobCleanup)
    setCascadeOpen(false)
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
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label>Delete household and all contents</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently removes this household, its members, and all household content.
              </p>
            </div>
            {initialHousehold.hasSuperAdmin ? (
              <>
                <Button type="button" variant="destructive" disabled>
                  Delete household and contents
                </Button>
                <p className="text-sm text-destructive">
                  Move all Super Admins out of this household before deleting it.
                </p>
              </>
            ) : (
              <Button type="button" variant="destructive" onClick={() => setCascadeOpen(true)}>
                Delete household and contents
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialHousehold && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleting} className="sm:mr-auto">
                Delete empty household
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

      {initialHousehold && (
        <ResponsiveDialog
          open={cascadeOpen}
          onOpenChange={(open) => {
            setCascadeOpen(open)
            if (!open) setConfirmationName('')
          }}
          title={`Permanently delete “${initialHousehold.name}”?`}
          description="This action is irreversible."
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setCascadeOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || confirmationName !== initialHousehold.name}
                onClick={handleCascadeDelete}
              >
                {deleting ? 'Deleting…' : 'Permanently delete household'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                All members and household content will be permanently deleted. This cannot be undone.
              </AlertDescription>
            </Alert>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border p-4 text-sm">
              {[
                ['Members', initialHousehold._count.users],
                ['Events', initialHousehold.statistics.events],
                ['To-dos', initialHousehold.statistics.todos],
                ['Recipes', initialHousehold.statistics.recipes],
                ['Watchlist items', initialHousehold.statistics.watchlistItems],
                ['Books', initialHousehold.statistics.books],
              ].map(([label, count]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              These counts are informational. The server determines the current deletion set when you submit.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="cascade-confirmation-name">
                Type <span className="font-semibold text-foreground">{initialHousehold.name}</span> to confirm
              </Label>
              <Input
                id="cascade-confirmation-name"
                autoComplete="off"
                value={confirmationName}
                onChange={(event) => setConfirmationName(event.target.value)}
              />
            </div>
          </div>
        </ResponsiveDialog>
      )}
    </form>
  )
}
