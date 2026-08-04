import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserIndicator } from '@/components/calendar/user-indicator'
import { cn } from '@/lib/utils'
import { isDueSoon, recurrenceLabel } from '@/lib/reminder-urgency'
import { formatFriendlyDateTime } from '@/lib/format-datetime'
import { getContrastTextColor } from '@/lib/contrast-color'
import type { UpcomingReminder } from '@/lib/events'

export function UpcomingReminderRow({
  reminder,
  currentUserId,
}: {
  reminder: UpcomingReminder
  currentUserId: string
}) {
  const dueSoon = isDueSoon(reminder)
  const startAt = new Date(reminder.startAt)
  const due = formatFriendlyDateTime(startAt, { allDay: reminder.allDay })

  return (
    <Link href={`/calendar?eventId=${reminder.id}`} className="block">
      <Card className={cn(dueSoon && 'border-l-4 border-l-warning')}>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{reminder.title}</p>
            {reminder.location && (
              <p className="text-sm text-muted-foreground">| {reminder.location}</p>
            )}
            <Badge
              style={{
                backgroundColor: reminder.eventType.color,
                color: getContrastTextColor(reminder.eventType.color),
              }}
            >
              {reminder.eventType.name}
            </Badge>
            {reminder.recurrence !== 'NONE' && (
              <Badge variant="outline">{recurrenceLabel[reminder.recurrence]}</Badge>
            )}
            {dueSoon && <Badge variant="warning">Due soon</Badge>}
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <UserIndicator attendees={reminder.attendees} currentUserId={currentUserId} />
            <p className="text-sm text-muted-foreground">{due}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
