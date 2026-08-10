import { z } from 'zod'
import { TodoPriority } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'

const todoInclude = {
  owners: { include: { user: { select: { id: true, name: true, isActive: true } } } },
} as const

export const todoInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  priority: z.enum(TodoPriority).default('NORMAL'),
  ownerUserIds: z.array(z.string().min(1)).min(1, 'Select at least one owner'),
})

export const todoCompletionInputSchema = z.object({ completed: z.boolean() }).strict()

export type TodoInput = z.infer<typeof todoInputSchema>

export class InvalidTodoOwnersError extends Error {
  constructor() {
    super('Every selected owner must be an active member of this household')
    this.name = 'InvalidTodoOwnersError'
  }
}

async function assertOwnersInHousehold(householdId: string, ownerUserIds: string[]) {
  const uniqueOwnerIds = new Set(ownerUserIds)
  const memberCount = await prisma.user.count({
    where: { householdId, isActive: true, id: { in: [...uniqueOwnerIds] } },
  })
  if (
    uniqueOwnerIds.size === 0 ||
    memberCount !== uniqueOwnerIds.size ||
    uniqueOwnerIds.size !== ownerUserIds.length
  ) {
    throw new InvalidTodoOwnersError()
  }
}

export async function listTodos(householdId: string) {
  return prisma.todo.findMany({
    where: { householdId },
    include: todoInclude,
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function listTodosForOwner(householdId: string, ownerUserId: string) {
  return prisma.todo.findMany({
    where: { householdId, owners: { some: { userId: ownerUserId } } },
    include: todoInclude,
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })
}

export type TodoWithOwners = Awaited<ReturnType<typeof listTodos>>[number]

export async function createTodo(householdId: string, input: TodoInput) {
  const { ownerUserIds, description, ...todo } = input
  await assertOwnersInHousehold(householdId, ownerUserIds)
  return prisma.todo.create({
    data: {
      ...todo,
      description: description || null,
      householdId,
      owners: { create: ownerUserIds.map((userId) => ({ userId })) },
    },
    include: todoInclude,
  })
}

export async function updateTodo(householdId: string, todoId: string, input: TodoInput) {
  const { ownerUserIds, description, ...todo } = input
  await assertOwnersInHousehold(householdId, ownerUserIds)

  return prisma.$transaction(async (tx) => {
    const result = await tx.todo.updateMany({
      where: { id: todoId, householdId },
      data: { ...todo, description: description || null },
    })
    if (result.count === 0) return null

    await tx.todoOwner.deleteMany({ where: { todoId } })
    await tx.todoOwner.createMany({
      data: ownerUserIds.map((userId) => ({ todoId, userId })),
    })
    return tx.todo.findUnique({ where: { id: todoId }, include: todoInclude })
  })
}

export async function setTodoCompleted(householdId: string, todoId: string, completed: boolean) {
  const result = await prisma.todo.updateMany({
    where: { id: todoId, householdId },
    data: { completed },
  })
  if (result.count === 0) return null
  return prisma.todo.findUnique({ where: { id: todoId }, include: todoInclude })
}

export async function deleteTodo(householdId: string, todoId: string) {
  const result = await prisma.todo.deleteMany({ where: { id: todoId, householdId } })
  return result.count > 0
}
