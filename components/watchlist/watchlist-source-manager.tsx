'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { WatchlistSource } from '@/generated/prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

function EditRow({
  initialName,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initialName: string
  submitLabel: string
  onCancel: () => void
  onSubmit: (input: { name: string }) => Promise<void>
}) {
  const [name, setName] = useState(initialName)
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`source-name-${initialName}`}>Name</Label>
        <Input
          id={`source-name-${initialName}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={submitting || !name.trim()}
          onClick={async () => {
            setSubmitting(true)
            await onSubmit({ name: name.trim() })
            setSubmitting(false)
          }}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

export function WatchlistSourceManager({ sources }: { sources: WatchlistSource[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function submit(url: string, method: string, input: { name: string }) {
    setError(null)
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }
    setEditingId(null)
    setCreating(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setError(null)
    setDeletingId(id)
    const res = await fetch(`/api/watchlist-sources/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sources.length === 0 && !creating && (
        <p className="text-sm text-muted-foreground">No sources yet — add one to get started.</p>
      )}

      <div className="flex flex-col gap-2">
        {sources.map((source) =>
          editingId === source.id ? (
            <EditRow
              key={source.id}
              initialName={source.name}
              submitLabel="Save"
              onCancel={() => setEditingId(null)}
              onSubmit={(input) => submit(`/api/watchlist-sources/${source.id}`, 'PATCH', input)}
            />
          ) : (
            <div
              key={source.id}
              className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-b-0"
            >
              <span className="text-sm">{source.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${source.name}`}
                  onClick={() => setEditingId(source.id)}
                >
                  <Pencil />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${source.name}`}
                      disabled={deletingId === source.id}
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete &ldquo;{source.name}&rdquo;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This can&rsquo;t be undone. Entries using this source must be reassigned or removed
                        first.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleDelete(source.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        )}
      </div>

      {creating ? (
        <EditRow
          initialName=""
          submitLabel="Add"
          onCancel={() => setCreating(false)}
          onSubmit={(input) => submit('/api/watchlist-sources', 'POST', input)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus /> New source
        </Button>
      )}
    </div>
  )
}
