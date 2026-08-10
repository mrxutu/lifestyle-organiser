import type { TodoPriority } from '@/generated/prisma/enums'
import { ALL_MEMBERS } from '@/lib/member-filters'

export const TODO_STATUS_NOT_COMPLETED = 'NOT_COMPLETED'
export const TODO_STATUS_COMPLETED = 'COMPLETED'
export const TODO_STATUS_ALL = 'ALL'
export const TODO_PRIORITY_ALL = 'ALL'

export type TodoStatusFilter =
  | typeof TODO_STATUS_NOT_COMPLETED
  | typeof TODO_STATUS_COMPLETED
  | typeof TODO_STATUS_ALL

type FilterableTodo = {
  completed: boolean
  priority: TodoPriority
  createdAt: Date
  owners: { userId: string }[]
}

const priorityOrder: Record<TodoPriority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }

export function filterAndOrderTodos<T extends FilterableTodo>(
  todos: T[],
  {
    statusFilter,
    priorityFilter,
    ownerFilter,
  }: {
    statusFilter: TodoStatusFilter
    priorityFilter: string
    ownerFilter?: string
  }
): T[] {
  return todos
    .filter((todo) => {
      if (statusFilter === TODO_STATUS_NOT_COMPLETED && todo.completed) return false
      if (statusFilter === TODO_STATUS_COMPLETED && !todo.completed) return false
      if (priorityFilter !== TODO_PRIORITY_ALL && todo.priority !== priorityFilter) return false
      if (
        ownerFilter &&
        ownerFilter !== ALL_MEMBERS &&
        !todo.owners.some((owner) => owner.userId === ownerFilter)
      ) {
        return false
      }
      return true
    })
    .toSorted((left, right) => {
      const priorityDifference = priorityOrder[left.priority] - priorityOrder[right.priority]
      if (priorityDifference !== 0) return priorityDifference
      return right.createdAt.getTime() - left.createdAt.getTime()
    })
}
