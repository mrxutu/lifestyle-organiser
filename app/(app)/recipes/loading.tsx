import { Skeleton } from '@/components/ui/skeleton'
import { Page } from '@/components/ui/page'

export default function RecipesLoading() {
  return (
    <Page>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-[4/5] w-full" />
        <Skeleton className="aspect-[4/5] w-full" />
        <Skeleton className="aspect-[4/5] w-full" />
      </div>
    </Page>
  )
}
