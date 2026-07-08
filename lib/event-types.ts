import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EVENT_TYPE_COLOR_VALUES } from '@/lib/event-type-colors'

export const eventTypeInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  color: z.enum(EVENT_TYPE_COLOR_VALUES),
})

export type EventTypeInput = z.infer<typeof eventTypeInputSchema>

export async function listEventTypes() {
  return prisma.eventType.findMany({ orderBy: { name: 'asc' } })
}

export async function createEventType(input: EventTypeInput) {
  return prisma.eventType.create({ data: input })
}

export async function updateEventType(eventTypeId: string, input: EventTypeInput) {
  return prisma.eventType.update({ where: { id: eventTypeId }, data: input })
}

export class EventTypeInUseError extends Error {
  constructor(public count: number) {
    super(`This type is used by ${count} event${count === 1 ? '' : 's'} and can't be deleted`)
    this.name = 'EventTypeInUseError'
  }
}

export async function deleteEventType(eventTypeId: string) {
  const usageCount = await prisma.event.count({ where: { eventTypeId } })
  if (usageCount > 0) throw new EventTypeInUseError(usageCount)
  return prisma.eventType.delete({ where: { id: eventTypeId } })
}
