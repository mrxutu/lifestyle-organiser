import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { BookGrid } from '@/components/books/book-grid'
import { BookSourceManagerDialog } from '@/components/books/book-source-manager-dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listBooks, listBookSources } from '@/lib/books'

export default async function BooksPage() {
  const { id: currentUserId, householdId } = await requireSection('books')
  const [books, sources, householdUsers] = await Promise.all([
    listBooks(householdId),
    listBookSources(),
    listHouseholdUsers(householdId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Books"
        actions={
          <>
            <BookSourceManagerDialog sources={sources} />
            <Button asChild size="sm">
              <Link href="/books/new">Add book</Link>
            </Button>
          </>
        }
      />
      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books yet"
          description="Books you're reading or have read will appear here."
        />
      ) : (
        <BookGrid
          books={books}
          householdUsers={householdUsers}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
