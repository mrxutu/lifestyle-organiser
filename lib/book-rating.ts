export const BOOK_RATINGS = [1, 2, 3, 4, 5] as const

export type BookRating = (typeof BOOK_RATINGS)[number]

export const bookRatingLabel: Record<BookRating, string> = {
  1: '1 Star',
  2: '2 Stars',
  3: '3 Stars',
  4: '4 Stars',
  5: '5 Stars',
}
