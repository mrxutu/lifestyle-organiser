import { notFound } from 'next/navigation'
import { BookForm } from '@/components/books/book-form'
import { getCurrentUser, listHouseholdUsers } from '@/lib/current-user'
import { getBook, listBookSources } from '@/lib/books'

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { id: currentUserId, householdId } = await getCurrentUser()
  const [book, sources, householdUsers] = await Promise.all([
    getBook(householdId, id),
    listBookSources(),
    listHouseholdUsers(householdId),
  ])

  if (!book) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit book</h1>
      <BookForm
        initialBook={book}
        sources={sources}
        householdUsers={householdUsers}
        currentUserId={currentUserId}
      />
    </div>
  )
}
