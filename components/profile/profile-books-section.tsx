import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { BookGrid } from '@/components/books/book-grid'
import type { listBooks } from '@/lib/books'

export function ProfileBooksSection({
  books,
}: {
  books: Awaited<ReturnType<typeof listBooks>>
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Books</h2>
        <Link href="/books" className="text-sm text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books yet"
          description="Books assigned to you as the reader will appear here."
        />
      ) : (
        <BookGrid books={books} />
      )}
    </div>
  )
}
