'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HouseholdWithCount } from '@/lib/admin-households'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { HouseholdForm } from '@/components/admin/household-form'

type BoardState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; household: HouseholdWithCount }

export function AdminHouseholdsPanel({ households }: { households: HouseholdWithCount[] }) {
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
          + New household
        </Button>
      </div>

      {households.length === 0 ? (
        <p className="text-sm text-muted-foreground">No households yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {households.map((household) => (
              <TableRow
                key={household.id}
                className="cursor-pointer"
                onClick={() => setState({ mode: 'edit', household })}
              >
                <TableCell className="font-medium">{household.name}</TableCell>
                <TableCell className="text-muted-foreground">{household._count.users}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={(open) => !open && close()}
        title={state.mode === 'edit' ? 'Edit household' : 'New household'}
      >
        <HouseholdForm
          initialHousehold={state.mode === 'edit' ? state.household : null}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </ResponsiveDialog>
    </div>
  )
}
