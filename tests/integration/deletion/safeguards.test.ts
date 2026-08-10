import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CannotDeleteSelfError,
  deleteUser,
  LastSuperAdminError,
  UserHasContentError,
} from '../../../lib/admin-users'
import { deleteHousehold, HouseholdInUseError } from '../../../lib/admin-households'
import { BookSourceInUseError, deleteBookSource } from '../../../lib/books'
import { deleteEventType, EventTypeInUseError } from '../../../lib/event-types'
import { deleteWatchlistSource, WatchlistSourceInUseError } from '../../../lib/watchlist'
import { prisma } from '../../../lib/prisma'
import { DatabaseFixture } from '../../fixtures/database'

test('User deletion protects self, linked users, and the last active Super Admin', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('user-deletion')
    const superAdmin = await fixture.createUser(household.id, 'only-super-admin')
    await prisma.user.update({ where: { id: superAdmin.id }, data: { role: 'SUPER_ADMIN' } })
    const member = await fixture.createUser(household.id, 'member')

    await assert.rejects(deleteUser(superAdmin.id, superAdmin.id), CannotDeleteSelfError)
    await assert.rejects(deleteUser(superAdmin.id, member.id), LastSuperAdminError)

    const source = await prisma.bookSource.create({
      data: { householdId: household.id, name: `${fixture.prefix}-book-source` },
    })
    fixture.addCleanup(() => prisma.bookSource.deleteMany({ where: { id: source.id } }))
    const book = await prisma.book.create({
      data: {
        householdId: household.id,
        title: `${fixture.prefix}-linked-book`,
        author: 'Test Author',
        sourceId: source.id,
        readerId: member.id,
      },
    })
    fixture.addCleanup(() => prisma.book.deleteMany({ where: { id: book.id } }))

    await assert.rejects(deleteUser(member.id, superAdmin.id), UserHasContentError)
    assert.equal(await prisma.user.count({ where: { id: member.id } }), 1)

    await prisma.book.delete({ where: { id: book.id } })
    await deleteUser(member.id, superAdmin.id)
    assert.equal(await prisma.user.count({ where: { id: member.id } }), 0)
  } finally {
    await fixture.cleanup()
  }
})

test('Household deletion is blocked by dependencies and succeeds after they are removed', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('household-deletion')
    const member = await fixture.createUser(household.id, 'member')

    await assert.rejects(deleteHousehold(household.id), HouseholdInUseError)
    assert.equal(await prisma.household.count({ where: { id: household.id } }), 1)

    await prisma.user.delete({ where: { id: member.id } })
    await deleteHousehold(household.id)
    assert.equal(await prisma.household.count({ where: { id: household.id } }), 0)
  } finally {
    await fixture.cleanup()
  }
})

test('Lookup values in use are protected and can be deleted after their content is removed', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('lookup-deletion')
    const user = await fixture.createUser(household.id, 'lookup-user')
    const eventType = await prisma.eventType.create({
      data: { householdId: household.id, name: `${fixture.prefix}-event-type`, color: '#3b82f6' },
    })
    const watchlistSource = await prisma.watchlistSource.create({
      data: { householdId: household.id, name: `${fixture.prefix}-watch-source` },
    })
    const bookSource = await prisma.bookSource.create({
      data: { householdId: household.id, name: `${fixture.prefix}-book-source` },
    })
    fixture.addCleanup(() => prisma.eventType.deleteMany({ where: { id: eventType.id } }))
    fixture.addCleanup(() => prisma.watchlistSource.deleteMany({ where: { id: watchlistSource.id } }))
    fixture.addCleanup(() => prisma.bookSource.deleteMany({ where: { id: bookSource.id } }))

    const event = await prisma.event.create({
      data: {
        householdId: household.id,
        creatorId: user.id,
        eventTypeId: eventType.id,
        title: `${fixture.prefix}-event`,
        startAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    })
    const entry = await prisma.watchlistEntry.create({
      data: { householdId: household.id, sourceId: watchlistSource.id, name: `${fixture.prefix}-entry` },
    })
    const book = await prisma.book.create({
      data: {
        householdId: household.id,
        sourceId: bookSource.id,
        readerId: user.id,
        title: `${fixture.prefix}-book`,
        author: 'Test Author',
      },
    })
    fixture.addCleanup(() => prisma.event.deleteMany({ where: { id: event.id } }))
    fixture.addCleanup(() => prisma.watchlistEntry.deleteMany({ where: { id: entry.id } }))
    fixture.addCleanup(() => prisma.book.deleteMany({ where: { id: book.id } }))

    await assert.rejects(deleteEventType(household.id, eventType.id), EventTypeInUseError)
    await assert.rejects(deleteWatchlistSource(household.id, watchlistSource.id), WatchlistSourceInUseError)
    await assert.rejects(deleteBookSource(household.id, bookSource.id), BookSourceInUseError)

    await prisma.event.delete({ where: { id: event.id } })
    await prisma.watchlistEntry.delete({ where: { id: entry.id } })
    await prisma.book.delete({ where: { id: book.id } })
    assert.equal(await deleteEventType(household.id, eventType.id), true)
    assert.equal(await deleteWatchlistSource(household.id, watchlistSource.id), true)
    assert.equal(await deleteBookSource(household.id, bookSource.id), true)
  } finally {
    await fixture.cleanup()
  }
})

test('Content deletion cascades assignment rows while user relations remain restricted', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('cascade-rules')
    const user = await fixture.createUser(household.id, 'cascade-user')
    const eventType = await prisma.eventType.create({
      data: { householdId: household.id, name: `${fixture.prefix}-event-type`, color: '#3b82f6' },
    })
    const watchSource = await prisma.watchlistSource.create({
      data: { householdId: household.id, name: `${fixture.prefix}-watch-source` },
    })
    fixture.addCleanup(() => prisma.eventType.deleteMany({ where: { id: eventType.id } }))
    fixture.addCleanup(() => prisma.watchlistSource.deleteMany({ where: { id: watchSource.id } }))

    const event = await prisma.event.create({
      data: {
        householdId: household.id,
        creatorId: user.id,
        eventTypeId: eventType.id,
        title: `${fixture.prefix}-event`,
        startAt: new Date('2030-01-01T00:00:00.000Z'),
        attendees: { create: { userId: user.id } },
      },
    })
    const recipe = await prisma.recipe.create({
      data: {
        householdId: household.id,
        authorId: user.id,
        chefId: user.id,
        title: `${fixture.prefix}-recipe`,
        tags: [],
        ingredients: { create: { name: 'Ingredient', order: 0 } },
      },
    })
    const entry = await prisma.watchlistEntry.create({
      data: {
        householdId: household.id,
        sourceId: watchSource.id,
        name: `${fixture.prefix}-entry`,
        viewers: { create: { userId: user.id } },
      },
    })

    await assert.rejects(prisma.user.delete({ where: { id: user.id } }))
    await prisma.event.delete({ where: { id: event.id } })
    await prisma.recipe.delete({ where: { id: recipe.id } })
    await prisma.watchlistEntry.delete({ where: { id: entry.id } })
    assert.equal(await prisma.eventAttendee.count({ where: { eventId: event.id } }), 0)
    assert.equal(await prisma.ingredient.count({ where: { recipeId: recipe.id } }), 0)
    assert.equal(await prisma.watchlistViewer.count({ where: { watchlistEntryId: entry.id } }), 0)
  } finally {
    await fixture.cleanup()
  }
})
