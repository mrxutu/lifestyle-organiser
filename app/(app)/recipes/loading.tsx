import { Skeleton } from '@/components/ui/skeleton'

export default function RecipesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-[4/5] w-full" />
        <Skeleton className="aspect-[4/5] w-full" />
        <Skeleton className="aspect-[4/5] w-full" />
      </div>
    </div>
  )
}
