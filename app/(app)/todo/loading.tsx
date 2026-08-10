import { Skeleton } from '@/components/ui/skeleton'
import { Page } from '@/components/ui/page'

export default function TodoLoading() {
  return <Page><Skeleton className="h-9 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></Page>
}
