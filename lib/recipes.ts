import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { MeasurementUnit } from '@/generated/prisma/enums'

const emptyToNull = (val: unknown) => (val === '' || val == null ? null : val)

const ingredientInputSchema = z.object({
  name: z.string().trim().min(1, 'Ingredient name is required').max(200),
  amount: z.preprocess(
    emptyToNull,
    z.coerce.number({ error: 'Amount must be a valid number' }).nonnegative().nullable()
  ),
  unit: z.preprocess(emptyToNull, z.enum(MeasurementUnit).nullable()),
  order: z.coerce.number().int(),
})

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  servings: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable()),
  prepMinutes: z.preprocess(emptyToNull, z.coerce.number().int().nonnegative().nullable()),
  cookMinutes: z.preprocess(emptyToNull, z.coerce.number().int().nonnegative().nullable()),
  method: z.string().trim().max(10000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  ingredients: z.array(ingredientInputSchema).default([]),
})

export type RecipeInput = z.infer<typeof recipeInputSchema>

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

export async function getRecipe(householdId: string, recipeId: string) {
  return prisma.recipe.findFirst({
    where: { id: recipeId, householdId },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
    },
  })
}

export type RecipeWithDetail = NonNullable<Awaited<ReturnType<typeof getRecipe>>>

export async function createRecipe(householdId: string, authorId: string, input: RecipeInput) {
  const { ingredients, ...recipe } = input
  return prisma.recipe.create({
    data: {
      ...recipe,
      householdId,
      authorId,
      ingredients: { create: ingredients },
    },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
    },
  })
}

export async function updateRecipe(householdId: string, recipeId: string, input: RecipeInput) {
  const { ingredients, ...recipe } = input

  return prisma.$transaction(async (tx) => {
    const result = await tx.recipe.updateMany({ where: { id: recipeId, householdId }, data: recipe })
    if (result.count === 0) return null

    await tx.ingredient.deleteMany({ where: { recipeId } })
    if (ingredients.length > 0) {
      await tx.ingredient.createMany({ data: ingredients.map((i) => ({ ...i, recipeId })) })
    }

    return tx.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
      },
    })
  })
}

export async function deleteRecipe(householdId: string, recipeId: string) {
  const result = await prisma.recipe.deleteMany({ where: { id: recipeId, householdId } })
  return result.count > 0
}
