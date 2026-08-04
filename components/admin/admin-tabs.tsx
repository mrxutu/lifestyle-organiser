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
}: {
  users: UserWithHousehold[]
  households: HouseholdWithCount[]
  currentUserId: string
}) {
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
        />
      </TabsContent>
      <TabsContent value="households">
        <AdminHouseholdsPanel households={households} />
      </TabsContent>
    </Tabs>
  )
}
