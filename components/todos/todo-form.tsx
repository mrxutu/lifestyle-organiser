'use client'

import { useState, type FormEvent } from 'react'
import type { TodoPriority } from '@/generated/prisma/enums'
import type { TodoWithOwners } from '@/lib/todos'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const priorityLabels: Record<TodoPriority, string> = {
  HIGH: 'High',
  NORMAL: 'Normal',
  LOW: 'Low',
}

export function TodoForm({
  initialTodo,
  householdUsers,
  currentUserId,
  onSuccess,
  onCancel,
}: {
  initialTodo?: TodoWithOwners | null
  householdUsers: { id: string; name: string | null }[]
  currentUserId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initialTodo?.title ?? '')
  const [description, setDescription] = useState(initialTodo?.description ?? '')
  const [priority, setPriority] = useState<TodoPriority>(initialTodo?.priority ?? 'NORMAL')
  const [ownerUserIds, setOwnerUserIds] = useState<string[]>(
    initialTodo ? initialTodo.owners.map((owner) => owner.userId) : [currentUserId]
  )
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const response = await fetch(initialTodo ? `/api/todos/${initialTodo.id}` : '/api/todos', {
      method: initialTodo ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || null, priority, ownerUserIds }),
    })

    setSubmitting(false)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }
    onSuccess()
  }

  async function handleDelete() {
    if (!initialTodo) return
    setDeleting(true)
    setError(null)
    const response = await fetch(`/api/todos/${initialTodo.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong')
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="todo-title">Title</Label>
        <Input id="todo-title" required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="todo-description">Description (optional)</Label>
        <Textarea
          id="todo-description"
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="todo-priority">Priority</Label>
        <Select value={priority} onValueChange={(value) => setPriority(value as TodoPriority)}>
          <SelectTrigger id="todo-priority" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(priorityLabels) as [TodoPriority, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Owners</Label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOwnerUserIds(householdUsers.map((user) => user.id))}>
            Select all
          </Button>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          {householdUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <Checkbox
                id={`todo-owner-${user.id}`}
                checked={ownerUserIds.includes(user.id)}
                onCheckedChange={() => setOwnerUserIds((ids) => ids.includes(user.id) ? ids.filter((id) => id !== user.id) : [...ids, user.id])}
              />
              <Label htmlFor={`todo-owner-${user.id}`} className="font-normal">
                {user.id === currentUserId ? 'Me' : (user.name ?? 'Unnamed household member')}
              </Label>
            </div>
          ))}
        </div>
        {ownerUserIds.length === 0 && <p className="text-sm text-destructive">Select at least one owner.</p>}
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialTodo && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleting} className="sm:mr-auto">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this to-do?</AlertDialogTitle>
                <AlertDialogDescription>&ldquo;{initialTodo.title}&rdquo; will be removed. This can&rsquo;t be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting || ownerUserIds.length === 0}>
          {submitting ? 'Saving…' : initialTodo ? 'Save changes' : 'Add to-do'}
        </Button>
      </div>
    </form>
  )
}
