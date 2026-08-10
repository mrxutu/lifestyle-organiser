import { Skeleton } from '@/components/ui/skeleton'
import { Page } from '@/components/ui/page'

export default function WatchlistLoading() {
  return (
    <Page>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Page>
  )
}
