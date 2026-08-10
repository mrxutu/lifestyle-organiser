import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test, { mock } from 'node:test'
import { NextRequest } from 'next/server'
import { prisma } from '../../lib/prisma'
import { DatabaseFixture } from '../fixtures/database'
import { listUsersForContext } from '../../lib/admin-users'

class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

type TestUser = {
  id: string
  email: string
  name: string | null
  householdId: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  isActive: boolean
  sections: { calendar: boolean; recipes: boolean; watchlist: boolean; books: boolean }
}

let currentUser: TestUser | null = null

function assertSectionEnabled(sections: TestUser['sections'], section: keyof TestUser['sections']) {
  if (!sections[section]) throw new ForbiddenError(`${section} section is disabled`)
}

let createBookRoute: (request: NextRequest) => Promise<Response>
let createEventTypeRoute: (request: NextRequest) => Promise<Response>
let createUserRoute: (request: NextRequest) => Promise<Response>
let updateUserRoute: (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>
let deleteUserRoute: (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>

test.before(async () => {
  await mock.module('../../lib/current-user.ts', {
    namedExports: {
      ForbiddenError,
      assertSectionEnabled,
      getCurrentUser: async () => {
        if (!currentUser) throw new ForbiddenError('Authentication required')
        return currentUser
      },
      requireApiSection: async (section: keyof TestUser['sections']) => {
        if (!currentUser) throw new ForbiddenError('Authentication required')
        assertSectionEnabled(currentUser.sections, section)
        return currentUser
      },
      requireHouseholdAdmin: async () => {
        if (!currentUser) throw new ForbiddenError('Authentication required')
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Household admin access required')
        }
        return currentUser
      },
    },
  })

  createBookRoute = (await import('../../app/api/books/route')).POST
  createEventTypeRoute = (await import('../../app/api/event-types/route')).POST
  createUserRoute = (await import('../../app/api/admin/users/route')).POST
  const userDetailRoute = await import('../../app/api/admin/users/[id]/route')
  updateUserRoute = userDetailRoute.PATCH
  deleteUserRoute = userDetailRoute.DELETE
})

function asCurrentUser(
  user: { id: string; email: string; name: string | null; householdId: string | null; role: TestUser['role']; isActive: boolean },
  sections: Partial<TestUser['sections']> = {},
) {
  if (!user.householdId) throw new Error('Route test user requires a household')
  currentUser = {
    ...user,
    householdId: user.householdId,
    sections: { calendar: true, recipes: true, watchlist: true, books: true, ...sections },
  }
}

function bookRequest(input: Record<string, unknown>) {
  const form = new FormData()
  form.set('data', JSON.stringify(input))
  return new NextRequest('http://localhost/api/books', { method: 'POST', body: form })
}

test('normal/image-bearing Book route rejects unauthenticated and disabled-section requests before mutation', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('route-books')
    const user = await fixture.createUser(household.id, 'route-user')
    const source = await prisma.bookSource.create({
      data: { householdId: household.id, name: `${fixture.prefix}-source` },
    })
    fixture.addCleanup(() => prisma.bookSource.deleteMany({ where: { id: source.id } }))
    const input = {
      title: `${fixture.prefix}-book`,
      author: 'Test Author',
      summary: null,
      dateRead: null,
      rating: null,
      status: 'TO_READ',
      sourceId: source.id,
      notes: null,
      readerId: user.id,
    }

    currentUser = null
    const unauthenticated = await createBookRoute(bookRequest(input))
    assert.equal(unauthenticated.status, 403)

    asCurrentUser(user, { books: false })
    const disabled = await createBookRoute(bookRequest(input))
    assert.equal(disabled.status, 403)
    assert.equal(await prisma.book.count({ where: { title: input.title } }), 0)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})

test('Book route accepts an authorised same-household mutation and rejects foreign assignments', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('route-books')
    const foreignHousehold = await fixture.createHousehold('route-books-foreign')
    const user = await fixture.createUser(household.id, 'route-user')
    const foreignReader = await fixture.createUser(foreignHousehold.id, 'foreign-reader')
    const source = await prisma.bookSource.create({
      data: { householdId: household.id, name: `${fixture.prefix}-source` },
    })
    fixture.addCleanup(() => prisma.bookSource.deleteMany({ where: { id: source.id } }))
    asCurrentUser(user)
    const input = {
      title: `${fixture.prefix}-book`,
      author: 'Test Author',
      summary: null,
      dateRead: null,
      rating: null,
      status: 'TO_READ',
      sourceId: source.id,
      notes: null,
      readerId: user.id,
    }

    const accepted = await createBookRoute(bookRequest(input))
    assert.equal(accepted.status, 201)
    const book = await prisma.book.findFirstOrThrow({ where: { title: input.title } })
    fixture.addCleanup(() => prisma.book.deleteMany({ where: { id: book.id } }))

    const rejected = await createBookRoute(bookRequest({
      ...input,
      title: `${fixture.prefix}-foreign-reader`,
      readerId: foreignReader.id,
    }))
    assert.equal(rejected.status, 400)
    assert.equal(await prisma.book.count({ where: { title: `${fixture.prefix}-foreign-reader` } }), 0)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})

test('lookup-management route enforces Member, Admin household, and section boundaries', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('route-lookups')
    const foreignHousehold = await fixture.createHousehold('route-lookups-foreign')
    const member = await fixture.createUser(household.id, 'member')
    const admin = await fixture.createUser(household.id, 'admin')
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    admin.role = 'ADMIN'
    const body = JSON.stringify({ name: `${fixture.prefix}-type`, color: '#3b82f6' })

    asCurrentUser(member)
    const memberResponse = await createEventTypeRoute(new NextRequest(
      'http://localhost/api/event-types',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body },
    ))
    assert.equal(memberResponse.status, 403)

    asCurrentUser(admin)
    const foreignResponse = await createEventTypeRoute(new NextRequest(
      `http://localhost/api/event-types?householdId=${foreignHousehold.id}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body },
    ))
    assert.equal(foreignResponse.status, 403)

    asCurrentUser(admin, { calendar: false })
    await prisma.household.update({ where: { id: household.id }, data: { showCalendar: false } })
    const disabledResponse = await createEventTypeRoute(new NextRequest(
      'http://localhost/api/event-types',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body },
    ))
    assert.equal(disabledResponse.status, 403)
    assert.equal(await prisma.eventType.count({ where: { name: `${fixture.prefix}-type` } }), 0)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})

test('Admin user route rejects Member access and cross-household creation', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('route-admin')
    const foreignHousehold = await fixture.createHousehold('route-admin-foreign')
    const member = await fixture.createUser(household.id, 'member')
    const admin = await fixture.createUser(household.id, 'admin')
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    admin.role = 'ADMIN'
    const email = `route-created-${randomUUID()}@example.test`
    const request = () => new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Route created', email, householdId: foreignHousehold.id, role: 'MEMBER' }),
    })

    asCurrentUser(member)
    assert.equal((await createUserRoute(request())).status, 403)

    asCurrentUser(admin)
    assert.equal((await createUserRoute(request())).status, 403)
    assert.equal(await prisma.user.count({ where: { email } }), 0)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})

test('Admin user reads and update/delete routes cannot cross household boundaries', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('route-admin-scope')
    const foreignHousehold = await fixture.createHousehold('route-admin-scope-foreign')
    const admin = await fixture.createUser(household.id, 'admin')
    const ownMember = await fixture.createUser(household.id, 'own-member')
    const foreignMember = await fixture.createUser(foreignHousehold.id, 'foreign-member')
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    admin.role = 'ADMIN'
    asCurrentUser(admin)

    const listed = await listUsersForContext({ role: 'ADMIN', householdId: household.id })
    assert.deepEqual(new Set(listed.map(({ id }) => id)), new Set([admin.id, ownMember.id]))

    const updateResponse = await updateUserRoute(new NextRequest('http://localhost/api/admin/users/foreign', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Hijacked',
        householdId: household.id,
        role: 'MEMBER',
        isActive: true,
      }),
    }), { params: Promise.resolve({ id: foreignMember.id }) })
    assert.equal(updateResponse.status, 403)

    const deleteResponse = await deleteUserRoute(
      new NextRequest('http://localhost/api/admin/users/foreign', { method: 'DELETE' }),
      { params: Promise.resolve({ id: foreignMember.id }) },
    )
    assert.equal(deleteResponse.status, 403)
    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: foreignMember.id } })
    assert.equal(unchanged.name, 'foreign-member test user')
    assert.equal(unchanged.householdId, foreignHousehold.id)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})

test('Admin DELETE route returns a client error when protecting the last active Super Admin', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('route-last-super-admin')
    const admin = await fixture.createUser(household.id, 'admin')
    const superAdmin = await fixture.createUser(household.id, 'super-admin')
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    await prisma.user.update({ where: { id: superAdmin.id }, data: { role: 'SUPER_ADMIN' } })
    admin.role = 'ADMIN'
    asCurrentUser(admin)

    const response = await deleteUserRoute(
      new NextRequest('http://localhost/api/admin/users/super-admin', { method: 'DELETE' }),
      { params: Promise.resolve({ id: superAdmin.id }) },
    )

    assert.equal(response.status, 400)
    assert.equal(await prisma.user.count({ where: { id: superAdmin.id } }), 1)
  } finally {
    currentUser = null
    await fixture.cleanup()
  }
})
