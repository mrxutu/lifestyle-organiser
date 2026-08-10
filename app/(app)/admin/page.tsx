import { getCurrentUser } from '@/lib/current-user'
import { listUsersForContext } from '@/lib/admin-users'
import { listHouseholds } from '@/lib/admin-households'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { Page } from '@/components/ui/page'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminPage() {
  const currentUser = await getCurrentUser()
  const [users, households] = await Promise.all([
    listUsersForContext(currentUser),
    currentUser.role === 'SUPER_ADMIN' ? listHouseholds(currentUser) : Promise.resolve([]),
  ])

  return (
    <Page>
      <PageHeader title="Admin" />
      <AdminTabs
        users={users}
        households={households}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        currentUserHouseholdId={currentUser.householdId}
      />
    </Page>
  )
}
