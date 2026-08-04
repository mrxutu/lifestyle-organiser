export const ALL_RATINGS = 'ALL'
export const NOT_RATED = 'UNRATED'

type FilterableBook = {
  title: string
  rating: number | null
}

export function filterBooks<T extends FilterableBook>(
  books: T[],
  { search, ratingFilter }: { search: string; ratingFilter: string }
): T[] {
  const query = search.trim().toLowerCase()

  return books.filter((book) => {
    if (query && !book.title.toLowerCase().includes(query)) return false
    if (ratingFilter === NOT_RATED && book.rating != null) return false
    if (ratingFilter !== ALL_RATINGS && ratingFilter !== NOT_RATED && book.rating !== Number(ratingFilter)) {
      return false
    }
    return true
  })
}
