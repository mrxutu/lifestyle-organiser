import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { BookGrid } from '@/components/books/book-grid'
import { BookSourceManagerDialog } from '@/components/books/book-source-manager-dialog'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/current-user'
import { listBooks, listBookSources } from '@/lib/books'

export default async function BooksPage() {
  const { householdId } = await getCurrentUser()
  const [books, sources] = await Promise.all([listBooks(householdId), listBookSources()])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Books</h1>
        <div className="flex gap-2">
          <BookSourceManagerDialog sources={sources} />
          <Button asChild size="sm">
            <Link href="/books/new">Add book</Link>
          </Button>
        </div>
      </div>
      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books yet"
          description="Books you're reading or have read will appear here."
        />
      ) : (
        <BookGrid books={books} />
      )}
    </div>
  )
}
