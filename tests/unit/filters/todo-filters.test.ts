import assert from 'node:assert/strict'
import test from 'node:test'
import { ALL_MEMBERS } from '../../../lib/member-filters'
import {
  TODO_PRIORITY_ALL,
  TODO_STATUS_ALL,
  TODO_STATUS_COMPLETED,
  TODO_STATUS_NOT_COMPLETED,
  filterAndOrderTodos,
} from '../../../lib/todo-filters'

const todos = [
  { id: 'normal-new', completed: false, priority: 'NORMAL' as const, createdAt: new Date('2030-03-01'), owners: [{ userId: 'user-1' }] },
  { id: 'high-old', completed: false, priority: 'HIGH' as const, createdAt: new Date('2030-01-01'), owners: [{ userId: 'user-2' }] },
  { id: 'high-new', completed: true, priority: 'HIGH' as const, createdAt: new Date('2030-02-01'), owners: [{ userId: 'user-1' }, { userId: 'user-2' }] },
  { id: 'low', completed: false, priority: 'LOW' as const, createdAt: new Date('2030-04-01'), owners: [{ userId: 'user-1' }] },
]

test('To-do defaults filter to current owner and not completed, then order by priority and newest', () => {
  assert.deepEqual(
    filterAndOrderTodos(todos, {
      statusFilter: TODO_STATUS_NOT_COMPLETED,
      priorityFilter: TODO_PRIORITY_ALL,
      ownerFilter: 'user-1',
    }).map(({ id }) => id),
    ['normal-new', 'low']
  )
})

test('To-do filters combine status, priority, and owner assignment', () => {
  assert.deepEqual(
    filterAndOrderTodos(todos, {
      statusFilter: TODO_STATUS_COMPLETED,
      priorityFilter: 'HIGH',
      ownerFilter: 'user-2',
    }).map(({ id }) => id),
    ['high-new']
  )
  assert.deepEqual(
    filterAndOrderTodos(todos, {
      statusFilter: TODO_STATUS_ALL,
      priorityFilter: TODO_PRIORITY_ALL,
      ownerFilter: ALL_MEMBERS,
    }).map(({ id }) => id),
    ['high-new', 'high-old', 'normal-new', 'low']
  )
})
