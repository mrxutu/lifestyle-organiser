import { ReminderRow } from '@/components/reminders/reminder-row'
import type { listReminders } from '@/lib/reminders'

export function ReminderList({
  reminders,
}: {
  reminders: Awaited<ReturnType<typeof listReminders>>
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {reminders.map((reminder) => (
        <ReminderRow key={reminder.id} reminder={reminder} />
      ))}
    </div>
  )
}
