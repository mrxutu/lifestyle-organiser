'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookCard } from '@/components/books/book-card'
import { ALL_RATINGS, NOT_RATED, filterBooks } from '@/lib/book-filters'
import { BOOK_RATINGS, bookRatingLabel } from '@/lib/book-rating'
import type { listBooks } from '@/lib/books'

export function BookGrid({ books }: { books: Awaited<ReturnType<typeof listBooks>> }) {
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>(ALL_RATINGS)

  const filteredBooks = useMemo(
    () => filterBooks(books, { search, ratingFilter }),
    [books, search, ratingFilter]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          placeholder="Search books by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search books by title"
          className="sm:flex-1"
        />
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by rating">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RATINGS}>All ratings</SelectItem>
            {BOOK_RATINGS.map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                {bookRatingLabel[rating]}
              </SelectItem>
            ))}
            <SelectItem value={NOT_RATED}>Not rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredBooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No books match the current filters.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}
