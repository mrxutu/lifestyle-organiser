import { BookForm } from '@/components/books/book-form'
import { getCurrentUser, listHouseholdUsers } from '@/lib/current-user'
import { listBookSources } from '@/lib/books'

export default async function NewBookPage() {
  const { id: currentUserId, householdId } = await getCurrentUser()
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
