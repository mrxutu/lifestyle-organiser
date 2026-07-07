import { prisma } from '@/lib/prisma'

export async function listReminders(householdId: string) {
  return prisma.reminder.findMany({
    where: { householdId },
    include: {
      recipients: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { dueDate: 'asc' },
  })
}
