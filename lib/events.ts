import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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
