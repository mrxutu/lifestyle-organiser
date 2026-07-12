'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ArrowUpDown, Tv } from 'lucide-react'
import type { WatchlistSource } from '@/generated/prisma/client'
import type { WatchlistEntryWithSource } from '@/lib/watchlist'
import { ALL_SOURCES, ALL_STATUSES, filterWatchlistEntries } from '@/lib/watchlist-filters'
import { watchStatusBadgeVariant, watchStatusLabel } from '@/lib/watchlist-status'
import { formatFriendlyDate } from '@/lib/format-datetime'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { WatchlistForm } from '@/components/watchlist/watchlist-form'
import { WatchlistSourceManager } from '@/components/watchlist/watchlist-source-manager'

type SortKey = 'name' | 'source' | 'season' | 'episode' | 'status' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

type BoardState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; entry: WatchlistEntryWithSource }
  | { mode: 'manage-sources' }

const columns: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'source', label: 'Source' },
  { key: 'season', label: 'Season' },
  { key: 'episode', label: 'Episode' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Last Updated' },
]

function compare(a: WatchlistEntryWithSource, b: WatchlistEntryWithSource, key: SortKey): number {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name)
    case 'source':
      return a.source.name.localeCompare(b.source.name)
    case 'season':
      return (a.season ?? -1) - (b.season ?? -1)
    case 'episode':
      return (a.episode ?? -1) - (b.episode ?? -1)
    case 'status':
      return watchStatusLabel[a.status].localeCompare(watchStatusLabel[b.status])
    case 'updatedAt':
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  }
}

export function WatchlistTable({
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
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredEntries = useMemo(
    () => filterWatchlistEntries(entries, { statusFilter, sourceFilter }),
    [entries, statusFilter, sourceFilter]
  )

  const sortedEntries = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => compare(a, b, sortKey))
    if (sortDirection === 'desc') sorted.reverse()
    return sorted
  }, [filteredEntries, sortKey, sortDirection])

  function close() {
    setState({ mode: 'closed' })
  }

  function handleSuccess() {
    close()
    router.refresh()
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
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

      {sortedEntries.length > 0 && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 text-foreground hover:text-muted-foreground"
                    >
                      {column.label}
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer"
                  onClick={() => setState({ mode: 'edit', entry })}
                >
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell>{entry.source.name}</TableCell>
                  <TableCell>{entry.season ?? '—'}</TableCell>
                  <TableCell>{entry.episode ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={watchStatusBadgeVariant[entry.status]}>
                      {watchStatusLabel[entry.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFriendlyDate(new Date(entry.updatedAt))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
