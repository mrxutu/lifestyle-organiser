import { Recurrence } from '@/generated/prisma/enums'

export const recurrenceLabel: Record<Recurrence, string> = {
  NONE: 'None',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const DUE_SOON_THRESHOLD_DAYS = 3

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysUntil(startAt: Date): number {
  return Math.round(
    (startOfDay(new Date(startAt)).getTime() - startOfDay(new Date()).getTime()) / MS_PER_DAY
  )
}

// Visibility on the Reminders page:
// - leadTimeDays null -> never shown
// - past events -> never shown, regardless of leadTimeDays
// - leadTimeDays 0 -> shown the entire time it's upcoming
// - leadTimeDays > 0 -> shown only once inside the window (daysUntil < leadTimeDays)
export function isVisibleOnReminders(reminder: { startAt: Date; leadTimeDays: number | null }): boolean {
  if (reminder.leadTimeDays == null) return false
  const days = daysUntil(reminder.startAt)
  if (days < 0) return false
  if (reminder.leadTimeDays === 0) return true
  return days < reminder.leadTimeDays
}

// "Due soon" badge: a flat threshold independent of the event's own leadTimeDays.
export function isDueSoon(reminder: { startAt: Date }): boolean {
  const days = daysUntil(reminder.startAt)
  return days >= 0 && days < DUE_SOON_THRESHOLD_DAYS
}
