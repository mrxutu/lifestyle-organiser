import { Skeleton } from '@/components/ui/skeleton'
import { Page } from '@/components/ui/page'

export default function ProfileLoading() {
  return (
    <Page>
      <Skeleton className="h-8 w-28" />
      <div className="flex gap-2 overflow-x-auto">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </Page>
  )
}
