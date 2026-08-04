'use client'

import { useState, type FormEvent } from 'react'
import type { UserWithHousehold } from '@/lib/admin-users'
import type { Role } from '@/generated/prisma/enums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export function UserForm({
  households,
  initialUser,
  currentUserId,
  onSuccess,
  onCancel,
}: {
  households: { id: string; name: string }[]
  initialUser?: UserWithHousehold | null
  currentUserId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialUser?.name ?? '')
  const [email, setEmail] = useState(initialUser?.email ?? '')
  const [householdId, setHouseholdId] = useState(initialUser?.householdId ?? households[0]?.id ?? '')
  const [role, setRole] = useState<Role>(initialUser?.role ?? 'MEMBER')
  const [isActive, setIsActive] = useState(initialUser?.isActive ?? true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSelf = initialUser?.id === currentUserId

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = initialUser
      ? { name, householdId, role, isActive }
      : { name, email, householdId, role }

    const res = await fetch(initialUser ? `/api/admin/users/${initialUser.id}` : '/api/admin/users', {
      method: initialUser ? 'PATCH' : 'POST',
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
    if (!initialUser) return
    setDeleting(true)
    setError(null)

    const res = await fetch(`/api/admin/users/${initialUser.id}`, { method: 'DELETE' })

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
        <Label htmlFor="user-name">Name</Label>
        <Input id="user-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          required
          disabled={!!initialUser}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {!initialUser && (
          <p className="text-sm text-muted-foreground">
            No password is set here — they&rsquo;ll get an email to set their own.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-household">Household</Label>
        <Select value={householdId} onValueChange={setHouseholdId}>
          <SelectTrigger id="user-household" className="w-full">
            <SelectValue placeholder="Select a household" />
          </SelectTrigger>
          <SelectContent>
            {households.map((household) => (
              <SelectItem key={household.id} value={household.id}>
                {household.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-role">Role</Label>
        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger id="user-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        {isSelf && (
          <p className="text-sm text-muted-foreground">
            You can&rsquo;t demote yourself if you&rsquo;re the only admin.
          </p>
        )}
      </div>

      {initialUser && (
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="user-active">Account active</Label>
            {!isActive && (
              <p className="text-sm text-muted-foreground">
                This user can&rsquo;t log in while disabled.
              </p>
            )}
          </div>
          <Switch id="user-active" checked={isActive} onCheckedChange={setIsActive} disabled={isSelf} />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {initialUser && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || isSelf}
                className="sm:mr-auto"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {initialUser.name ?? initialUser.email}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can&rsquo;t be undone. If they&rsquo;ve created any events or recipes, deletion
                  will be blocked until that content is reassigned or removed.
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
        <Button type="submit" disabled={submitting || households.length === 0}>
          {submitting ? 'Saving…' : initialUser ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}
