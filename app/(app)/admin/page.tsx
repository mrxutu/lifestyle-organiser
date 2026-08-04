import { getCurrentUser } from '@/lib/current-user'
import { listUsers } from '@/lib/admin-users'
import { listHouseholds } from '@/lib/admin-households'
import { AdminTabs } from '@/components/admin/admin-tabs'

export default async function AdminPage() {
  const currentUser = await getCurrentUser()
  const [users, households] = await Promise.all([listUsers(), listHouseholds()])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <AdminTabs users={users} households={households} currentUserId={currentUser.id} />
    </div>
  )
}
