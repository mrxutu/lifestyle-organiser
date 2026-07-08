import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isDueSoon, recurrenceLabel } from '@/lib/reminder-urgency'
import type { UpcomingReminder } from '@/lib/events'

export function UpcomingReminderRow({ reminder }: { reminder: UpcomingReminder }) {
  const dueSoon = isDueSoon(reminder)
  const startAt = new Date(reminder.startAt)
  const startDate = startAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const startTime = reminder.allDay
    ? null
    : startAt.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })

  return (
    <Card className={cn(dueSoon && 'border-l-4 border-l-warning')}>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: reminder.eventType.color }}
          />
          <p className="font-medium">{reminder.title}</p>
          <Badge variant="secondary">{reminder.eventType.name}</Badge>
          {reminder.recurrence !== 'NONE' && (
            <Badge variant="outline">{recurrenceLabel[reminder.recurrence]}</Badge>
          )}
          {dueSoon && <Badge variant="warning">Due soon</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Due {startDate}
          {startTime && ` at ${startTime}`}
        </p>
      </CardContent>
    </Card>
  )
}
