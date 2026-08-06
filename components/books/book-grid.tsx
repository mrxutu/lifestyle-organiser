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
import { ALL_MEMBERS, memberFilterLabel } from '@/lib/member-filters'
import { RATINGS, ratingLabel } from '@/lib/rating'
import type { listBooks } from '@/lib/books'

export function BookGrid({
  books,
  householdUsers,
  currentUserId,
}: {
  books: Awaited<ReturnType<typeof listBooks>>
  householdUsers?: { id: string; name: string | null }[]
  currentUserId?: string
}) {
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>(ALL_RATINGS)
  const [readerFilter, setReaderFilter] = useState<string>(ALL_MEMBERS)

  const filteredBooks = useMemo(
    () => filterBooks(books, { search, ratingFilter, readerFilter }),
    [books, search, ratingFilter, readerFilter]
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
            {RATINGS.map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                {ratingLabel[rating]}
              </SelectItem>
            ))}
            <SelectItem value={NOT_RATED}>Not rated</SelectItem>
          </SelectContent>
        </Select>
        {householdUsers && currentUserId && (
          <Select value={readerFilter} onValueChange={setReaderFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by reader">
              <SelectValue placeholder="All readers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MEMBERS}>All readers</SelectItem>
              {householdUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {memberFilterLabel(user, currentUserId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
