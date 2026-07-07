import { prisma } from '@/lib/prisma'

export async function listRecipes(householdId: string) {
  return prisma.recipe.findMany({
    where: { householdId },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { ingredients: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
