import Link from 'next/link'
import { BellOff } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { RemindersBoard } from '@/components/reminders/reminders-board'
import type { EventType } from '@/generated/prisma/client'
import type { UpcomingReminder } from '@/lib/events'

export function ProfileRemindersSection({
  reminders,
  eventTypes,
  currentUserId,
  householdUsers,
}: {
  reminders: UpcomingReminder[]
  eventTypes: EventType[]
  currentUserId: string
  householdUsers: { id: string; name: string | null }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Reminders / Calendar</h2>
        <Link href="/reminders" className="text-sm text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
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
    </div>
  )
}
