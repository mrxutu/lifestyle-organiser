import assert from 'node:assert/strict'
import test from 'node:test'
import { ForbiddenError } from '../../../lib/current-user'
import { listHouseholds } from '../../../lib/admin-households'
import { prisma } from '../../../lib/prisma'
import { DatabaseFixture } from '../../fixtures/database'

test('household statistics are isolated, include edit data, and use qualifying creation dates only', async () => {
  const fixture = new DatabaseFixture()

  try {
    const populated = await fixture.createHousehold('statistics-populated')
    const empty = await fixture.createHousehold('statistics-empty')
    const other = await fixture.createHousehold('statistics-other')
    const member = await fixture.createUser(populated.id, 'statistics-member')
    await fixture.createUser(empty.id, 'empty-member')
    const otherMember = await fixture.createUser(other.id, 'other-member')

    const eventType = await prisma.eventType.create({
      data: { householdId: populated.id, name: `${fixture.prefix}-event-type`, color: '#3b82f6' },
    })
    const watchlistSource = await prisma.watchlistSource.create({
      data: { householdId: populated.id, name: `${fixture.prefix}-watchlist-source` },
    })
    const bookSource = await prisma.bookSource.create({
      data: { householdId: populated.id, name: `${fixture.prefix}-book-source` },
    })
    const otherBookSource = await prisma.bookSource.create({
      data: { householdId: other.id, name: `${fixture.prefix}-other-book-source` },
    })
    fixture.addCleanup(() => prisma.eventType.deleteMany({ where: { id: eventType.id } }))
    fixture.addCleanup(() => prisma.watchlistSource.deleteMany({ where: { id: watchlistSource.id } }))
    fixture.addCleanup(() =>
      prisma.bookSource.deleteMany({ where: { id: { in: [bookSource.id, otherBookSource.id] } } })
    )

    const event = await prisma.event.create({
      data: {
        householdId: populated.id,
        creatorId: member.id,
        eventTypeId: eventType.id,
        title: `${fixture.prefix}-reminder-event`,
        startAt: new Date('2040-01-01T00:00:00.000Z'),
        leadTimeDays: 7,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        attendees: { create: { userId: member.id } },
      },
    })
    const recipe = await prisma.recipe.create({
      data: {
        householdId: populated.id,
        authorId: member.id,
        chefId: member.id,
        title: `${fixture.prefix}-recipe`,
        tags: [],
        createdAt: new Date('2026-04-04T10:00:00.000Z'),
        ingredients: { create: { name: 'Test ingredient', order: 0 } },
      },
    })
    const watchlistEntry = await prisma.watchlistEntry.create({
      data: {
        householdId: populated.id,
        sourceId: watchlistSource.id,
        name: `${fixture.prefix}-watchlist-entry`,
        createdAt: new Date('2026-02-02T10:00:00.000Z'),
        viewers: { create: { userId: member.id } },
      },
    })
    const book = await prisma.book.create({
      data: {
        householdId: populated.id,
        sourceId: bookSource.id,
        readerId: member.id,
        title: `${fixture.prefix}-book`,
        author: 'Test Author',
        dateRead: new Date('2041-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-03-03T10:00:00.000Z'),
      },
    })
    const todo = await prisma.todo.create({
      data: {
        householdId: populated.id,
        title: `${fixture.prefix}-todo`,
        createdAt: new Date('2026-04-20T10:00:00.000Z'),
        owners: { create: { userId: member.id } },
      },
    })
    const otherBook = await prisma.book.create({
      data: {
        householdId: other.id,
        sourceId: otherBookSource.id,
        readerId: otherMember.id,
        title: `${fixture.prefix}-other-book`,
        author: 'Other Author',
        createdAt: new Date('2026-05-05T10:00:00.000Z'),
      },
    })
    fixture.addCleanup(() => prisma.event.deleteMany({ where: { id: event.id } }))
    fixture.addCleanup(() => prisma.recipe.deleteMany({ where: { id: recipe.id } }))
    fixture.addCleanup(() => prisma.watchlistEntry.deleteMany({ where: { id: watchlistEntry.id } }))
    fixture.addCleanup(() =>
      prisma.book.deleteMany({ where: { id: { in: [book.id, otherBook.id] } } })
    )
    fixture.addCleanup(() => prisma.todo.deleteMany({ where: { id: todo.id } }))

    await prisma.watchlistEntry.update({
      where: { id: watchlistEntry.id },
      data: { updatedAt: new Date('2042-01-01T00:00:00.000Z') },
    })
    await prisma.todo.update({ where: { id: todo.id }, data: { completed: true, title: `${fixture.prefix}-edited-todo` } })

    const households = await listHouseholds({ role: 'SUPER_ADMIN' })
    const populatedResult = households.find((household) => household.id === populated.id)
    const emptyResult = households.find((household) => household.id === empty.id)
    const otherResult = households.find((household) => household.id === other.id)

    assert.ok(populatedResult)
    assert.deepEqual(populatedResult.statistics, {
      events: 1,
      todos: 1,
      recipes: 1,
      watchlistItems: 1,
      books: 1,
      lastActivityAt: new Date('2026-04-20T10:00:00.000Z'),
    })
    assert.equal(populatedResult._count.users, 1)
    assert.deepEqual(populatedResult.eventTypes.map(({ id }) => id), [eventType.id])
    assert.deepEqual(populatedResult.watchlistSources.map(({ id }) => id), [watchlistSource.id])
    assert.deepEqual(populatedResult.bookSources.map(({ id }) => id), [bookSource.id])

    assert.ok(emptyResult)
    assert.deepEqual(emptyResult.statistics, {
      events: 0,
      todos: 0,
      recipes: 0,
      watchlistItems: 0,
      books: 0,
      lastActivityAt: null,
    })
    assert.equal(emptyResult._count.users, 1)

    assert.ok(otherResult)
    assert.equal(otherResult.statistics.books, 1)
    assert.equal(otherResult.statistics.events, 0)
    assert.equal(otherResult.statistics.todos, 0)
    assert.deepEqual(otherResult.statistics.lastActivityAt, new Date('2026-05-05T10:00:00.000Z'))
  } finally {
    await fixture.cleanup()
  }
})

test('household statistics reject non-Super-Admin callers before querying', async () => {
  await assert.rejects(listHouseholds({ role: 'ADMIN' }), ForbiddenError)
  await assert.rejects(listHouseholds({ role: 'MEMBER' }), ForbiddenError)
})
