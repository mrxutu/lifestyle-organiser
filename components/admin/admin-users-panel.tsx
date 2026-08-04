'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserWithHousehold } from '@/lib/admin-users'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { UserForm } from '@/components/admin/user-form'

type BoardState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; user: UserWithHousehold }

export function AdminUsersPanel({
  users,
  households,
  currentUserId,
}: {
  users: UserWithHousehold[]
  households: { id: string; name: string }[]
  currentUserId: string
}) {
  const router = useRouter()
  const [state, setState] = useState<BoardState>({ mode: 'closed' })

  function close() {
    setState({ mode: 'closed' })
  }

  function handleSuccess() {
    close()
    router.refresh()
  }

  const formOpen = state.mode === 'create' || state.mode === 'edit'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setState({ mode: 'create' })}>
          + New user
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Household</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => setState({ mode: 'edit', user })}
              >
                <TableCell className="font-medium">{user.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{user.household?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={(open) => !open && close()}
        title={state.mode === 'edit' ? 'Edit user' : 'New user'}
      >
        <UserForm
          households={households}
          initialUser={state.mode === 'edit' ? state.user : null}
          currentUserId={currentUserId}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </ResponsiveDialog>
    </div>
  )
}
