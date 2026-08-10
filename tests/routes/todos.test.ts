import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { NextRequest } from 'next/server'
import { prisma } from '../../lib/prisma'
import { DatabaseFixture } from '../fixtures/database'

class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

type TestUser = {
  id: string
  householdId: string
  sections: { calendar: boolean; todos: boolean; recipes: boolean; watchlist: boolean; books: boolean }
}

let currentUser: TestUser | null = null
let createRoute: (request: NextRequest) => Promise<Response>
let updateRoute: (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>
let deleteRoute: (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>
let completionRoute: (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>

test.before(async () => {
  await mock.module('../../lib/current-user.ts', {
    namedExports: {
      ForbiddenError,
      requireApiSection: async (section: keyof TestUser['sections']) => {
        if (!currentUser) throw new ForbiddenError('Authentication required')
        if (!currentUser.sections[section]) throw new ForbiddenError(`${section} section is disabled`)
        return currentUser
      },
    },
  })
  createRoute = (await import('../../app/api/todos/route')).POST
  const detail = await import('../../app/api/todos/[id]/route')
  updateRoute = detail.PATCH
  deleteRoute = detail.DELETE
  completionRoute = (await import('../../app/api/todos/[id]/completion/route')).PATCH
})

function authenticate(user: { id: string; householdId: string | null }, todos = true) {
  if (!user.householdId) throw new Error('Route test user requires a household')
  currentUser = {
    id: user.id,
    householdId: user.householdId,
    sections: { calendar: true, todos, recipes: true, watchlist: true, books: true },
  }
}

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('To-do routes enforce authentication, section access, and owner validation', async () => {
  const fixture = new DatabaseFixture()
  try {
    const household = await fixture.createHousehold('todo-routes')
    const foreignHousehold = await fixture.createHousehold('todo-routes-foreign')
    const user = await fixture.createUser(household.id, 'user')
    const foreignUser = await fixture.createUser(foreignHousehold.id, 'foreign-user')
    const body = { title: `${fixture.prefix}-todo`, description: null, priority: 'NORMAL', ownerUserIds: [user.id] }

    currentUser = null
    assert.equal((await createRoute(jsonRequest('http://localhost/api/todos', 'POST', body))).status, 403)
    authenticate(user, false)
    assert.equal((await createRoute(jsonRequest('http://localhost/api/todos', 'POST', body))).status, 403)
    authenticate(user)
    assert.equal((await createRoute(jsonRequest('http://localhost/api/todos', 'POST', { ...body, ownerUserIds: [foreignUser.id] }))).status, 400)
    assert.equal(await prisma.todo.count({ where: { title: body.title } }), 0)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})

test('To-do routes create, update, complete, reopen, and delete without full-data completion writes', async () => {
  const fixture = new DatabaseFixture()
  try {
    const household = await fixture.createHousehold('todo-route-crud')
    const user = await fixture.createUser(household.id, 'user')
    authenticate(user)
    const body = { title: `${fixture.prefix}-todo`, description: null, priority: 'NORMAL', ownerUserIds: [user.id] }

    const createdResponse = await createRoute(jsonRequest('http://localhost/api/todos', 'POST', body))
    assert.equal(createdResponse.status, 201)
    const created = await createdResponse.json()
    fixture.addCleanup(() => prisma.todo.deleteMany({ where: { id: created.id } }))

    const context = { params: Promise.resolve({ id: created.id as string }) }
    const updated = await updateRoute(
      jsonRequest(`http://localhost/api/todos/${created.id}`, 'PATCH', { ...body, title: `${fixture.prefix}-edited`, priority: 'HIGH' }),
      context
    )
    assert.equal(updated.status, 200)

    const invalidCompletion = await completionRoute(
      jsonRequest(`http://localhost/api/todos/${created.id}/completion`, 'PATCH', { completed: true, title: 'stale' }),
      context
    )
    assert.equal(invalidCompletion.status, 400)
    assert.equal((await prisma.todo.findUniqueOrThrow({ where: { id: created.id } })).completed, false)

    assert.equal((await completionRoute(jsonRequest(`http://localhost/api/todos/${created.id}/completion`, 'PATCH', { completed: true }), context)).status, 200)
    assert.equal((await completionRoute(jsonRequest(`http://localhost/api/todos/${created.id}/completion`, 'PATCH', { completed: false }), context)).status, 200)
    assert.equal((await deleteRoute(new NextRequest(`http://localhost/api/todos/${created.id}`, { method: 'DELETE' }), context)).status, 200)
    assert.equal(await prisma.todo.count({ where: { id: created.id } }), 0)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})
