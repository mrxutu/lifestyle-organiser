'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { EventType } from '@/generated/prisma/client'
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
import { ColorSwatchPicker } from '@/components/calendar/color-swatch-picker'
import { EVENT_TYPE_COLORS } from '@/lib/event-type-colors'

function EditRow({
  initialName,
  initialColor,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initialName: string
  initialColor: string
  submitLabel: string
  onCancel: () => void
  onSubmit: (input: { name: string; color: string }) => Promise<void>
}) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`type-name-${initialName}`}>Name</Label>
        <Input
          id={`type-name-${initialName}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label>Colour</Label>
        <ColorSwatchPicker value={color} onChange={setColor} />
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
            await onSubmit({ name: name.trim(), color })
            setSubmitting(false)
          }}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

export function EventTypeManager({ eventTypes }: { eventTypes: EventType[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function submit(url: string, method: string, input: { name: string; color: string }) {
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
    const res = await fetch(`/api/event-types/${id}`, { method: 'DELETE' })
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

      {eventTypes.length === 0 && !creating && (
        <p className="text-sm text-muted-foreground">
          No event types yet — create one to get started.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {eventTypes.map((type) =>
          editingId === type.id ? (
            <EditRow
              key={type.id}
              initialName={type.name}
              initialColor={type.color}
              submitLabel="Save"
              onCancel={() => setEditingId(null)}
              onSubmit={(input) => submit(`/api/event-types/${type.id}`, 'PATCH', input)}
            />
          ) : (
            <div
              key={type.id}
              className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-b-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm">{type.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${type.name}`}
                  onClick={() => setEditingId(type.id)}
                >
                  <Pencil />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${type.name}`}
                      disabled={deletingId === type.id}
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete &ldquo;{type.name}&rdquo;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This can&rsquo;t be undone. Events using this type must be reassigned or removed
                        first.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleDelete(type.id)}>
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
          initialColor={EVENT_TYPE_COLORS[0].value}
          submitLabel="Add"
          onCancel={() => setCreating(false)}
          onSubmit={(input) => submit('/api/event-types', 'POST', input)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus /> New type
        </Button>
      )}
    </div>
  )
}
