'use client'

import type { UserWithHousehold } from '@/lib/admin-users'
import type { HouseholdWithCount } from '@/lib/admin-households'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminUsersPanel } from '@/components/admin/admin-users-panel'
import { AdminHouseholdsPanel } from '@/components/admin/admin-households-panel'

export function AdminTabs({
  users,
  households,
  currentUserId,
  currentUserRole,
  currentUserHouseholdId,
}: {
  users: UserWithHousehold[]
  households: HouseholdWithCount[]
  currentUserId: string
  currentUserRole: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  currentUserHouseholdId: string
}) {
  const canManageHouseholds = currentUserRole === 'SUPER_ADMIN'

  if (!canManageHouseholds) {
    return (
      <AdminUsersPanel
        users={users}
        households={[]}
        currentUserId={currentUserId}
        canManageGlobal={false}
        currentHouseholdId={currentUserHouseholdId}
      />
    )
  }

  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="households">Households</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <AdminUsersPanel
          users={users}
          households={households.map((h) => ({ id: h.id, name: h.name }))}
          currentUserId={currentUserId}
          canManageGlobal
        />
      </TabsContent>
      <TabsContent value="households">
        <AdminHouseholdsPanel households={households} />
      </TabsContent>
    </Tabs>
  )
}
