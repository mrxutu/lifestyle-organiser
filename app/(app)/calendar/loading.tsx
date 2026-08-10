import { Skeleton } from '@/components/ui/skeleton'
import { Page } from '@/components/ui/page'

export default function CalendarLoading() {
  return (
    <Page>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </Page>
  )
}
