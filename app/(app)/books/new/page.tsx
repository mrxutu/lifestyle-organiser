import { BookForm } from '@/components/books/book-form'
import { Page } from '@/components/ui/page'
import { PageHeader } from '@/components/ui/page-header'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listBookSources } from '@/lib/books'

export default async function NewBookPage() {
  const { id: currentUserId, householdId } = await requireSection('books')
  const [sources, householdUsers] = await Promise.all([
    listBookSources(householdId),
    listHouseholdUsers(householdId),
  ])

  return (
    <Page>
      <PageHeader title="Add book" />
      <BookForm sources={sources} householdUsers={householdUsers} currentUserId={currentUserId} />
    </Page>
  )
}
