import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { listReminders } from '@/lib/reminders'

const recurrenceLabel: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
}

export function ReminderRow({
  reminder,
}: {
  reminder: Awaited<ReturnType<typeof listReminders>>[number]
}) {
  const dueDate = new Date(reminder.dueDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{reminder.title}</p>
            <Badge variant="secondary">{reminder.category}</Badge>
            {reminder.recurrence !== 'NONE' && (
              <Badge variant="outline">{recurrenceLabel[reminder.recurrence]}</Badge>
            )}
          </div>
          {reminder.recipients.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {reminder.recipients.map((r) => r.user.name ?? r.user.email).join(', ')}
            </p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Due {dueDate}</p>
      </CardContent>
    </Card>
  )
}
