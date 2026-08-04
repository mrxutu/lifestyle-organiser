import { BookForm } from '@/components/books/book-form'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listBookSources } from '@/lib/books'

export default async function NewBookPage() {
  const { id: currentUserId, householdId } = await requireSection('books')
  const [sources, householdUsers] = await Promise.all([
    listBookSources(),
    listHouseholdUsers(householdId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add book</h1>
      <BookForm sources={sources} householdUsers={householdUsers} currentUserId={currentUserId} />
    </div>
  )
}
