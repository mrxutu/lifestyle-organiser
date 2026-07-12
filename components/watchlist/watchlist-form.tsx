'use client'

import { useState, type FormEvent } from 'react'
import type { WatchlistSource } from '@/generated/prisma/client'
import type { WatchStatus } from '@/generated/prisma/enums'
import type { WatchlistEntryWithSource } from '@/lib/watchlist'
import { watchStatusLabel } from '@/lib/watchlist-status'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export function WatchlistForm({
  sources,
  initialEntry,
  onSuccess,
  onCancel,
}: {
  sources: WatchlistSource[]
  initialEntry?: WatchlistEntryWithSource | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialEntry?.name ?? '')
  const [sourceId, setSourceId] = useState(initialEntry?.sourceId ?? sources[0]?.id ?? '')
  const [season, setSeason] = useState(initialEntry?.season != null ? String(initialEntry.season) : '')
  const [episode, setEpisode] = useState(initialEntry?.episode != null ? String(initialEntry.episode) : '')
  const [status, setStatus] = useState<WatchStatus>(initialEntry?.status ?? 'TO_WATCH')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = {
      name,
      sourceId,
      season: season === '' ? null : Number(season),
      episode: episode === '' ? null : Number(episode),
      status,
    }

    const res = await fetch(initialEntry ? `/api/watchlist/${initialEntry.id}` : '/api/watchlist', {
      method: initialEntry ? 'PATCH' : 'POST',
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
    if (!initialEntry) return
    setDeleting(true)
    setError(null)

    const res = await fetch(`/api/watchlist/${initialEntry.id}`, { method: 'DELETE' })

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
        <Label htmlFor="watchlist-name">Name</Label>
        <Input id="watchlist-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="watchlist-source">Source</Label>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sources yet — create one under &ldquo;Manage sources&rdquo; first.
          </p>
        ) : (
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger id="watchlist-source" className="w-full">
              <SelectValue placeholder="Select a source" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="watchlist-season">Season (optional)</Label>
          <Input
            id="watchlist-season"
            type="number"
            min={1}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="watchlist-episode">Episode (optional)</Label>
          <Input
            id="watchlist-episode"
            type="number"
            min={1}
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="watchlist-status">Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as WatchStatus)}>
          <SelectTrigger id="watchlist-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(watchStatusLabel).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialEntry && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleting} className="sm:mr-auto">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{initialEntry.name}&rdquo; will be removed. This can&rsquo;t be undone.
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
        <Button type="submit" disabled={submitting || sources.length === 0}>
          {submitting ? 'Saving…' : initialEntry ? 'Save changes' : 'Add to watchlist'}
        </Button>
      </div>
    </form>
  )
}
