'use client'

import { useState, type FormEvent } from 'react'
import type { HouseholdWithCount } from '@/lib/admin-households'
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
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch(
      initialHousehold ? `/api/admin/households/${initialHousehold.id}` : '/api/admin/households',
      {
        method: initialHousehold ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initialHousehold ? 'Save changes' : 'Create household'}
        </Button>
      </div>
    </form>
  )
}
