import assert from 'node:assert/strict'
import test from 'node:test'
import { deleteHousehold, HouseholdInUseError } from '../../../lib/admin-households'
import { deleteUser, UserHasContentError } from '../../../lib/admin-users'
import { prisma } from '../../../lib/prisma'
import {
  InvalidTodoOwnersError,
  createTodo,
  deleteTodo,
  listTodos,
  listTodosForOwner,
  setTodoCompleted,
  updateTodo,
  type TodoInput,
} from '../../../lib/todos'
import { DatabaseFixture } from '../../fixtures/database'

function input(title: string, ownerUserIds: string[]): TodoInput {
  return { title, description: null, priority: 'NORMAL', ownerUserIds }
}

test('To-dos require unique active owners from the same household on create and update', async () => {
  const fixture = new DatabaseFixture()
  try {
    const household = await fixture.createHousehold('todos')
    const foreignHousehold = await fixture.createHousehold('todos-foreign')
    const owner = await fixture.createUser(household.id, 'owner')
    const secondOwner = await fixture.createUser(household.id, 'second-owner')
    const inactiveOwner = await fixture.createUser(household.id, 'inactive-owner', false)
    const foreignOwner = await fixture.createUser(foreignHousehold.id, 'foreign-owner')

    const todo = await createTodo(household.id, input(`${fixture.prefix}-valid`, [owner.id, secondOwner.id]))
    fixture.addCleanup(() => prisma.todo.deleteMany({ where: { id: todo.id } }))
    assert.deepEqual(todo.owners.map(({ userId }) => userId).sort(), [owner.id, secondOwner.id].sort())

    for (const ownerIds of [[], [owner.id, owner.id], [inactiveOwner.id], [foreignOwner.id]]) {
      const title = `${fixture.prefix}-invalid-${ownerIds.join('-') || 'empty'}`
      await assert.rejects(createTodo(household.id, input(title, ownerIds)), InvalidTodoOwnersError)
      assert.equal(await prisma.todo.count({ where: { title } }), 0)
      await assert.rejects(updateTodo(household.id, todo.id, input('invalid update', ownerIds)), InvalidTodoOwnersError)
      const unchanged = await prisma.todo.findUniqueOrThrow({ where: { id: todo.id }, include: { owners: true } })
      assert.equal(unchanged.title, `${fixture.prefix}-valid`)
      assert.deepEqual(unchanged.owners.map(({ userId }) => userId).sort(), [owner.id, secondOwner.id].sort())
    }
  } finally {
    await fixture.cleanup()
  }
})

test('To-do reads and mutations are household isolated, including completion and reopening', async () => {
  const fixture = new DatabaseFixture()
  try {
    const householdA = await fixture.createHousehold('todos-a')
    const householdB = await fixture.createHousehold('todos-b')
    const ownerA = await fixture.createUser(householdA.id, 'owner-a')
    const ownerB = await fixture.createUser(householdB.id, 'owner-b')
    const todoA = await createTodo(householdA.id, input(`${fixture.prefix}-a`, [ownerA.id]))
    const todoB = await createTodo(householdB.id, input(`${fixture.prefix}-b`, [ownerB.id]))
    fixture.addCleanup(() => prisma.todo.deleteMany({ where: { id: { in: [todoA.id, todoB.id] } } }))

    assert.deepEqual((await listTodos(householdA.id)).map(({ id }) => id), [todoA.id])
    assert.equal(await updateTodo(householdA.id, todoB.id, input('hijacked', [ownerA.id])), null)
    assert.equal(await setTodoCompleted(householdA.id, todoB.id, true), null)
    assert.equal(await deleteTodo(householdA.id, todoB.id), false)

    const createdAt = todoA.createdAt
    assert.equal((await setTodoCompleted(householdA.id, todoA.id, true))?.completed, true)
    assert.equal((await setTodoCompleted(householdA.id, todoA.id, false))?.completed, false)
    await updateTodo(householdA.id, todoA.id, { ...input(`${fixture.prefix}-edited`, [ownerA.id]), priority: 'HIGH' })
    assert.deepEqual((await prisma.todo.findUniqueOrThrow({ where: { id: todoA.id } })).createdAt, createdAt)
    assert.equal((await prisma.todo.findUniqueOrThrow({ where: { id: todoB.id } })).title, `${fixture.prefix}-b`)
  } finally {
    await fixture.cleanup()
  }
})

test('Profile To-do query requires both household and current owner assignment', async () => {
  const fixture = new DatabaseFixture()
  try {
    const household = await fixture.createHousehold('todo-profile')
    const foreignHousehold = await fixture.createHousehold('todo-profile-foreign')
    const currentUser = await fixture.createUser(household.id, 'current-user')
    const otherUser = await fixture.createUser(household.id, 'other-user')
    const foreignUser = await fixture.createUser(foreignHousehold.id, 'foreign-user')
    const mine = await createTodo(household.id, input(`${fixture.prefix}-mine`, [currentUser.id]))
    const shared = await createTodo(household.id, input(`${fixture.prefix}-shared`, [currentUser.id, otherUser.id]))
    const theirs = await createTodo(household.id, input(`${fixture.prefix}-theirs`, [otherUser.id]))
    const foreign = await createTodo(foreignHousehold.id, input(`${fixture.prefix}-foreign`, [foreignUser.id]))
    fixture.addCleanup(() => prisma.todo.deleteMany({ where: { id: { in: [mine.id, shared.id, theirs.id, foreign.id] } } }))

    assert.deepEqual(
      (await listTodosForOwner(household.id, currentUser.id)).map(({ id }) => id).sort(),
      [mine.id, shared.id].sort()
    )
    assert.deepEqual(await listTodosForOwner(foreignHousehold.id, currentUser.id), [])
  } finally {
    await fixture.cleanup()
  }
})

test('To-do deletion cascades assignments and linked users and households remain protected', async () => {
  const fixture = new DatabaseFixture()
  try {
    const household = await fixture.createHousehold('todo-deletion')
    const owner = await fixture.createUser(household.id, 'owner')
    const otherUser = await fixture.createUser(household.id, 'current-user')
    const todo = await createTodo(household.id, input(`${fixture.prefix}-todo`, [owner.id]))

    await assert.rejects(deleteUser(owner.id, otherUser.id), UserHasContentError)
    await assert.rejects(deleteHousehold(household.id), HouseholdInUseError)
    assert.equal(await deleteTodo(household.id, todo.id), true)
    assert.equal(await prisma.todoOwner.count({ where: { todoId: todo.id } }), 0)
  } finally {
    await fixture.cleanup()
  }
})
