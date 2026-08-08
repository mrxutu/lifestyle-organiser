import { getCurrentUser } from '@/lib/current-user'
import { listUsersForContext } from '@/lib/admin-users'
import { listHouseholds } from '@/lib/admin-households'
import { AdminTabs } from '@/components/admin/admin-tabs'

export default async function AdminPage() {
  const currentUser = await getCurrentUser()
  const [users, households] = await Promise.all([
    listUsersForContext(currentUser),
    currentUser.role === 'SUPER_ADMIN' ? listHouseholds() : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <AdminTabs
        users={users}
        households={households}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        currentUserHouseholdId={currentUser.householdId}
      />
    </div>
  )
}
