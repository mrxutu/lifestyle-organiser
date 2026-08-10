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

type RouteUser = {
  id: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
}

let currentUser: RouteUser | null = null
let cascadeRoute: (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>

test.before(async () => {
  await mock.module('../../lib/current-user.ts', {
    namedExports: {
      ForbiddenError,
      requireSuperAdmin: async () => {
        if (!currentUser || currentUser.role !== 'SUPER_ADMIN') throw new ForbiddenError('Super admin access required')
        return currentUser
      },
    },
  })
  cascadeRoute = (await import('../../app/api/admin/households/[id]/cascade-delete/route')).POST
})

function request(confirmationName?: string) {
  return new NextRequest('http://localhost/api/admin/households/target/cascade-delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(confirmationName === undefined ? {} : { confirmationName }),
  })
}

test('cascade route rejects Member and Admin callers', async () => {
  const fixture = new DatabaseFixture()
  try {
    const household = await fixture.createHousehold('route-auth')
    const member = await fixture.createUser(household.id, 'route-member')
    const admin = await fixture.createUser(household.id, 'route-admin')

    currentUser = { id: member.id, role: 'MEMBER' }
    assert.equal((await cascadeRoute(request(household.name), { params: Promise.resolve({ id: household.id }) })).status, 403)
    currentUser = { id: admin.id, role: 'ADMIN' }
    assert.equal((await cascadeRoute(request(household.name), { params: Promise.resolve({ id: household.id }) })).status, 403)
    assert.equal(await prisma.household.count({ where: { id: household.id } }), 1)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})

test('cascade route requires an exact confirmation name and deletes for a revalidated Super Admin', async () => {
  const fixture = new DatabaseFixture()
  try {
    const actorHousehold = await fixture.createHousehold('route-actor')
    const actor = await fixture.createUser(actorHousehold.id, 'route-actor')
    await prisma.user.update({ where: { id: actor.id }, data: { role: 'SUPER_ADMIN' } })
    currentUser = { id: actor.id, role: 'SUPER_ADMIN' }

    const missingTarget = await fixture.createHousehold('route-missing-name')
    const missing = await cascadeRoute(request(), { params: Promise.resolve({ id: missingTarget.id }) })
    assert.equal(missing.status, 400)
    assert.equal(await prisma.household.count({ where: { id: missingTarget.id } }), 1)

    const wrongTarget = await fixture.createHousehold('Route Exact Name')
    const wrong = await cascadeRoute(request(wrongTarget.name.toLowerCase()), {
      params: Promise.resolve({ id: wrongTarget.id }),
    })
    assert.equal(wrong.status, 400)
    assert.equal(await prisma.household.count({ where: { id: wrongTarget.id } }), 1)

    const target = await fixture.createHousehold('route-success')
    await fixture.createUser(target.id, 'route-target-member')
    const success = await cascadeRoute(request(target.name), { params: Promise.resolve({ id: target.id }) })
    assert.equal(success.status, 200)
    assert.equal((await success.json()).databaseDeleted, true)
    assert.equal(await prisma.household.count({ where: { id: target.id } }), 0)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})
