import { notFound } from 'next/navigation'
import { BookForm } from '@/components/books/book-form'
import { Page } from '@/components/ui/page'
import { PageHeader } from '@/components/ui/page-header'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { getBook, listBookSources } from '@/lib/books'

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { id: currentUserId, householdId } = await requireSection('books')
  const [book, sources, householdUsers] = await Promise.all([
    getBook(householdId, id),
    listBookSources(householdId),
    listHouseholdUsers(householdId),
  ])

  if (!book) notFound()

  return (
    <Page>
      <PageHeader title="Edit book" />
      <BookForm
        initialBook={book}
        sources={sources}
        householdUsers={householdUsers}
        currentUserId={currentUserId}
      />
    </Page>
  )
}
