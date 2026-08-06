import { ALL_MEMBERS } from '@/lib/member-filters'

export const ALL_RATINGS = 'ALL'
export const NOT_RATED = 'UNRATED'

type FilterableBook = {
  title: string
  rating: number | null
  readerId: string
}

export function filterBooks<T extends FilterableBook>(
  books: T[],
  {
    search,
    ratingFilter,
    readerFilter,
  }: { search: string; ratingFilter: string; readerFilter?: string }
): T[] {
  const query = search.trim().toLowerCase()

  return books.filter((book) => {
    if (query && !book.title.toLowerCase().includes(query)) return false
    if (ratingFilter === NOT_RATED && book.rating != null) return false
    if (ratingFilter !== ALL_RATINGS && ratingFilter !== NOT_RATED && book.rating !== Number(ratingFilter)) {
      return false
    }
    if (readerFilter && readerFilter !== ALL_MEMBERS && book.readerId !== readerFilter) return false
    return true
  })
}
