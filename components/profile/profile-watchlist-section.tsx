import Link from 'next/link'
import { WatchlistCards } from '@/components/watchlist/watchlist-cards'
import type { WatchlistSource } from '@/generated/prisma/client'
import type { WatchlistEntryWithSource } from '@/lib/watchlist'

export function ProfileWatchlistSection({
  entries,
  sources,
}: {
  entries: WatchlistEntryWithSource[]
  sources: WatchlistSource[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Watchlist</h2>
        <Link href="/watchlist" className="text-sm text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      <WatchlistCards entries={entries} sources={sources} />
    </div>
  )
}
