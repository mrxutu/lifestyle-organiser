import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EVENT_TYPE_COLOR_VALUES } from '@/lib/event-type-colors'

export const eventTypeInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  color: z.enum(EVENT_TYPE_COLOR_VALUES),
})

export type EventTypeInput = z.infer<typeof eventTypeInputSchema>

export async function listEventTypes(householdId: string) {
  return prisma.eventType.findMany({ where: { householdId }, orderBy: { name: 'asc' } })
}

export async function createEventType(householdId: string, input: EventTypeInput) {
  return prisma.eventType.create({ data: { ...input, householdId } })
}

export async function updateEventType(
  householdId: string,
  eventTypeId: string,
  input: EventTypeInput
) {
  const result = await prisma.eventType.updateMany({
    where: { id: eventTypeId, householdId },
    data: input,
  })
  if (result.count === 0) return null
  return prisma.eventType.findUnique({ where: { id: eventTypeId } })
}

export class EventTypeInUseError extends Error {
  constructor(public count: number) {
    super(`This type is used by ${count} event${count === 1 ? '' : 's'} and can't be deleted`)
    this.name = 'EventTypeInUseError'
  }
}

export async function deleteEventType(householdId: string, eventTypeId: string) {
  const usageCount = await prisma.event.count({ where: { eventTypeId, householdId } })
  if (usageCount > 0) throw new EventTypeInUseError(usageCount)
  const result = await prisma.eventType.deleteMany({ where: { id: eventTypeId, householdId } })
  return result.count > 0
}
