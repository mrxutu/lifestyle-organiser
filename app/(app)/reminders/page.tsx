import { BellOff } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { ReminderList } from '@/components/reminders/reminder-list'
import { getCurrentUser } from '@/lib/current-user'
import { listReminders } from '@/lib/reminders'

export default async function RemindersPage() {
  const { householdId } = await getCurrentUser()
  const reminders = await listReminders(householdId)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Reminders</h1>
      {reminders.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No reminders yet"
          description="Renewals, bills, and other recurring to-dos will show up here once they're added."
        />
      ) : (
        <ReminderList reminders={reminders} />
      )}
    </div>
  )
}
