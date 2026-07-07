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
