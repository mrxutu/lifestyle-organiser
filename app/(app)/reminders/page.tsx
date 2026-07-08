import { BellOff } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { UpcomingReminderRow } from '@/components/reminders/upcoming-reminder-row'
import { getCurrentUser } from '@/lib/current-user'
import { listUpcomingReminders } from '@/lib/events'

export default async function RemindersPage() {
  const { householdId } = await getCurrentUser()
  const reminders = await listUpcomingReminders(householdId)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Reminders</h1>
      {reminders.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No reminders yet"
          description="Events with a lead time set will show up here once they're added — set one from the Calendar's event form."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reminders.map((reminder) => (
            <UpcomingReminderRow key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </div>
  )
}
