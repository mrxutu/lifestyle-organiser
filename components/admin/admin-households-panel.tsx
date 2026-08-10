'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HouseholdWithCount } from '@/lib/admin-households'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { HouseholdForm } from '@/components/admin/household-form'
import { formatHouseholdActivityDate } from '@/lib/format-datetime'

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

  function lastActivity(household: HouseholdWithCount) {
    if (!household.statistics.lastActivityAt) return 'Never'
    return formatHouseholdActivityDate(household.statistics.lastActivityAt)
  }

  function openHousehold(household: HouseholdWithCount) {
    setState({ mode: 'edit', household })
  }

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
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-center">Events</TableHead>
                  <TableHead className="text-center">To-dos</TableHead>
                  <TableHead className="text-center">Recipes</TableHead>
                  <TableHead className="text-center">Watchlist</TableHead>
                  <TableHead className="text-center">Books</TableHead>
                  <TableHead className="text-right">Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {households.map((household) => (
                  <TableRow
                    key={household.id}
                    className="cursor-pointer"
                    onClick={() => openHousehold(household)}
                  >
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={(event) => {
                          event.stopPropagation()
                          openHousehold(household)
                        }}
                      >
                        {household.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {household._count.users}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {household.statistics.events}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {household.statistics.todos}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {household.statistics.recipes}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {household.statistics.watchlistItems}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {household.statistics.books}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {household.statistics.lastActivityAt ? (
                        <time dateTime={household.statistics.lastActivityAt.toISOString()}>
                          {lastActivity(household)}
                        </time>
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {households.map((household) => (
              <button
                key={household.id}
                type="button"
                className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openHousehold(household)}
              >
                <span className="font-medium">{household.name}</span>
                <span className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {[
                    ['Members', household._count.users],
                    ['Events', household.statistics.events],
                    ['To-dos', household.statistics.todos],
                    ['Recipes', household.statistics.recipes],
                    ['Watchlist', household.statistics.watchlistItems],
                    ['Books', household.statistics.books],
                  ].map(([label, count]) => (
                    <span key={label} className="flex items-baseline justify-between gap-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </span>
                  ))}
                </span>
                <span className="mt-3 flex justify-between gap-3 border-t pt-3 text-sm">
                  <span className="text-muted-foreground">Last activity</span>
                  {household.statistics.lastActivityAt ? (
                    <time dateTime={household.statistics.lastActivityAt.toISOString()}>
                      {lastActivity(household)}
                    </time>
                  ) : (
                    <span>Never</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
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
