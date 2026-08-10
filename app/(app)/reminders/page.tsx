import { BellOff } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { RemindersBoard } from '@/components/reminders/reminders-board'
import { Page } from '@/components/ui/page'
import { PageHeader } from '@/components/ui/page-header'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listUpcomingReminders } from '@/lib/events'
import { listEventTypes } from '@/lib/event-types'

export default async function RemindersPage() {
  const { id: currentUserId, householdId } = await requireSection('calendar')
  const [reminders, eventTypes, householdUsers] = await Promise.all([
    listUpcomingReminders(householdId),
    listEventTypes(householdId),
    listHouseholdUsers(householdId),
  ])

  return (
    <Page>
      <PageHeader title="Reminders" />
      {reminders.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No reminders yet"
          description="Events with a lead time set will show up here once they're added — set one from the Calendar's event form."
        />
      ) : (
        <RemindersBoard
          reminders={reminders}
          eventTypes={eventTypes}
          currentUserId={currentUserId}
          householdUsers={householdUsers}
        />
      )}
    </Page>
  )
}
