'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tv } from 'lucide-react'
import type { WatchlistSource } from '@/generated/prisma/client'
import type { WatchlistEntryWithSource } from '@/lib/watchlist'
import { ALL_SOURCES, ALL_STATUSES, filterWatchlistEntries } from '@/lib/watchlist-filters'
import { watchStatusBadgeVariant, watchStatusLabel } from '@/lib/watchlist-status'
import { formatFriendlyDate } from '@/lib/format-datetime'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { WatchlistForm } from '@/components/watchlist/watchlist-form'
import { WatchlistSourceManager } from '@/components/watchlist/watchlist-source-manager'

type BoardState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; entry: WatchlistEntryWithSource }
  | { mode: 'manage-sources' }

export function WatchlistCards({
  entries,
  sources,
}: {
  entries: WatchlistEntryWithSource[]
  sources: WatchlistSource[]
}) {
  const router = useRouter()
  const [state, setState] = useState<BoardState>({ mode: 'closed' })
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES)
  const [sourceFilter, setSourceFilter] = useState<string>(ALL_SOURCES)

  const filteredEntries = useMemo(
    () => filterWatchlistEntries(entries, { statusFilter, sourceFilter }),
    [entries, statusFilter, sourceFilter]
  )

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              {Object.entries(watchStatusLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by source">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SOURCES}>All sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setState({ mode: 'manage-sources' })}
          >
            Manage sources
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setState({ mode: 'create' })}>
            + Add to watchlist
          </Button>
        </div>
      </div>

      {entries.length === 0 && (
        <EmptyState
          icon={Tv}
          title="Nothing on the watchlist yet"
          description="Shows and movies you're tracking will appear here once added."
        />
      )}

      {entries.length > 0 && filteredEntries.length === 0 && (
        <p className="text-sm text-muted-foreground">No entries match the selected filters.</p>
      )}

      {filteredEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {filteredEntries.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer"
              onClick={() => setState({ mode: 'edit', entry })}
            >
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">{entry.source.name}</p>
                  {(entry.season != null || entry.episode != null) && (
                    <p className="text-sm text-muted-foreground">
                      S{entry.season ?? '—'} E{entry.episode ?? '—'}
                    </p>
                  )}
                  <Badge variant={watchStatusBadgeVariant[entry.status]}>
                    {watchStatusLabel[entry.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatFriendlyDate(new Date(entry.updatedAt))}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={(open) => !open && close()}
        title={state.mode === 'edit' ? 'Edit watchlist entry' : 'Add to watchlist'}
      >
        <WatchlistForm
          sources={sources}
          initialEntry={state.mode === 'edit' ? state.entry : null}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={state.mode === 'manage-sources'}
        onOpenChange={(open) => !open && close()}
        title="Manage sources"
      >
        <WatchlistSourceManager sources={sources} />
      </ResponsiveDialog>
    </div>
  )
}
