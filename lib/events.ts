import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Recurrence } from '@/generated/prisma/enums'
import { isVisibleOnReminders } from '@/lib/reminder-urgency'

export async function listEvents(householdId: string) {
  return prisma.event.findMany({
    where: { householdId },
    include: {
      eventType: true,
      creator: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { startAt: 'asc' },
  })
}

export type EventWithType = Awaited<ReturnType<typeof listEvents>>[number]

export async function listUpcomingReminders(householdId: string) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // DB query fetches a cheap superset (Prisma can't compare startAt against
  // now() + leadTimeDays days where leadTimeDays is itself a column) — the
  // exact per-event visibility window is applied in isVisibleOnReminders below.
  const candidates = await prisma.event.findMany({
    where: { householdId, leadTimeDays: { not: null }, startAt: { gte: startOfToday } },
    include: { eventType: true },
    orderBy: { startAt: 'asc' },
  })

  return candidates.filter(isVisibleOnReminders)
}

export type UpcomingReminder = Awaited<ReturnType<typeof listUpcomingReminders>>[number]

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date().optional().nullable(),
    allDay: z.boolean().default(false),
    location: z.string().trim().max(200).optional().nullable(),
    eventTypeId: z.string().min(1, 'Event type is required'),
    remindMinutesBefore: z.coerce.number().int().min(0).optional().nullable(),
    recurrence: z.enum(Recurrence).default('NONE'),
    leadTimeDays: z.coerce.number().int().min(0).optional().nullable(),
  })
  .refine((data) => !data.endAt || data.endAt >= data.startAt, {
    message: 'End time must be after start time',
    path: ['endAt'],
  })

export type EventInput = z.infer<typeof eventInputSchema>

export async function createEvent(householdId: string, creatorId: string, input: EventInput) {
  return prisma.event.create({
    data: { ...input, householdId, creatorId },
    include: {
      eventType: true,
      creator: { select: { id: true, name: true } },
      attendees: true,
    },
  })
}

export async function updateEvent(householdId: string, eventId: string, input: EventInput) {
  const result = await prisma.event.updateMany({
    where: { id: eventId, householdId },
    data: input,
  })
  if (result.count === 0) return null
  return prisma.event.findUnique({ where: { id: eventId }, include: { eventType: true } })
}

export async function deleteEvent(householdId: string, eventId: string) {
  const result = await prisma.event.deleteMany({ where: { id: eventId, householdId } })
  return result.count > 0
}
