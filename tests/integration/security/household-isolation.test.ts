import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createBook,
  deleteBook,
  deleteBookSource,
  getBook,
  listBooks,
  listBookSources,
  updateBook,
  updateBookSource,
  type BookInput,
} from '../../../lib/books'
import {
  createEventType,
  deleteEventType,
  listEventTypes,
  updateEventType,
} from '../../../lib/event-types'
import { createEvent, deleteEvent, listEvents, updateEvent, type EventInput } from '../../../lib/events'
import { createRecipe, deleteRecipe, getRecipe, listRecipes, updateRecipe, type RecipeInput } from '../../../lib/recipes'
import {
  createWatchlistEntry,
  deleteWatchlistEntry,
  deleteWatchlistSource,
  listWatchlistEntries,
  listWatchlistSources,
  updateWatchlistEntry,
  updateWatchlistSource,
  type WatchlistEntryInput,
} from '../../../lib/watchlist'
import { prisma } from '../../../lib/prisma'
import { DatabaseFixture } from '../../fixtures/database'

test('Events and Event Types are isolated across household reads and mutations', async () => {
  const fixture = new DatabaseFixture()

  try {
    const householdA = await fixture.createHousehold('events-a')
    const householdB = await fixture.createHousehold('events-b')
    const creatorA = await fixture.createUser(householdA.id, 'creator-a')
    const creatorB = await fixture.createUser(householdB.id, 'creator-b')
    const typeA = await createEventType(householdA.id, { name: `${fixture.prefix}-type-a`, color: '#3b82f6' })
    const typeB = await createEventType(householdB.id, { name: `${fixture.prefix}-type-b`, color: '#ef4444' })
    fixture.addCleanup(() => prisma.eventType.deleteMany({ where: { id: { in: [typeA.id, typeB.id] } } }))
    const input = (title: string, typeId: string, attendeeId: string): EventInput => ({
      title,
      description: null,
      startAt: new Date('2030-02-01T10:00:00.000Z'),
      endAt: null,
      allDay: false,
      location: null,
      eventTypeId: typeId,
      remindMinutesBefore: null,
      recurrence: 'NONE',
      leadTimeDays: null,
      attendeeUserIds: [attendeeId],
    })
    const eventA = await createEvent(householdA.id, creatorA.id, input(`${fixture.prefix}-event-a`, typeA.id, creatorA.id))
    const eventB = await createEvent(householdB.id, creatorB.id, input(`${fixture.prefix}-event-b`, typeB.id, creatorB.id))
    fixture.addCleanup(() => prisma.event.deleteMany({ where: { id: { in: [eventA.id, eventB.id] } } }))

    assert.deepEqual((await listEvents(householdA.id)).map(({ id }) => id), [eventA.id])
    assert.deepEqual((await listEventTypes(householdA.id)).map(({ id }) => id), [typeA.id])

    assert.equal(
      await updateEvent(householdA.id, eventB.id, input(`${fixture.prefix}-hijacked`, typeA.id, creatorA.id)),
      null,
    )
    assert.equal(await deleteEvent(householdA.id, eventB.id), false)
    assert.equal((await prisma.event.findUniqueOrThrow({ where: { id: eventB.id } })).title, `${fixture.prefix}-event-b`)

    assert.equal(await updateEventType(householdA.id, typeB.id, { name: 'Hijacked', color: '#3b82f6' }), null)
    assert.equal(await deleteEventType(householdA.id, typeB.id), false)
    assert.equal((await prisma.eventType.findUniqueOrThrow({ where: { id: typeB.id } })).name, `${fixture.prefix}-type-b`)
  } finally {
    await fixture.cleanup()
  }
})

test('Recipes are isolated across household reads and mutations', async () => {
  const fixture = new DatabaseFixture()

  try {
    const householdA = await fixture.createHousehold('recipes-a')
    const householdB = await fixture.createHousehold('recipes-b')
    const userA = await fixture.createUser(householdA.id, 'recipe-user-a')
    const userB = await fixture.createUser(householdB.id, 'recipe-user-b')
    const input = (title: string, chefId: string): RecipeInput => ({
      title,
      description: null,
      servings: null,
      prepMinutes: null,
      cookMinutes: null,
      method: null,
      tags: [],
      ingredients: [],
      chefId,
    })
    const recipeA = await createRecipe(householdA.id, userA.id, input(`${fixture.prefix}-recipe-a`, userA.id), null)
    const recipeB = await createRecipe(householdB.id, userB.id, input(`${fixture.prefix}-recipe-b`, userB.id), null)
    fixture.addCleanup(() => prisma.recipe.deleteMany({ where: { id: { in: [recipeA.id, recipeB.id] } } }))

    assert.deepEqual((await listRecipes(householdA.id)).map(({ id }) => id), [recipeA.id])
    assert.equal(await getRecipe(householdA.id, recipeB.id), null)
    assert.equal(await updateRecipe(householdA.id, recipeB.id, input('Hijacked', userA.id), null), null)
    assert.equal(await deleteRecipe(householdA.id, recipeB.id), false)
    assert.equal((await prisma.recipe.findUniqueOrThrow({ where: { id: recipeB.id } })).title, `${fixture.prefix}-recipe-b`)
  } finally {
    await fixture.cleanup()
  }
})

test('Watchlist entries and Sources are isolated across household reads and mutations', async () => {
  const fixture = new DatabaseFixture()

  try {
    const householdA = await fixture.createHousehold('watchlist-a')
    const householdB = await fixture.createHousehold('watchlist-b')
    const userA = await fixture.createUser(householdA.id, 'watch-user-a')
    const userB = await fixture.createUser(householdB.id, 'watch-user-b')
    const sourceA = await prisma.watchlistSource.create({ data: { householdId: householdA.id, name: `${fixture.prefix}-source-a` } })
    const sourceB = await prisma.watchlistSource.create({ data: { householdId: householdB.id, name: `${fixture.prefix}-source-b` } })
    fixture.addCleanup(() => prisma.watchlistSource.deleteMany({ where: { id: { in: [sourceA.id, sourceB.id] } } }))
    const input = (name: string, sourceId: string, viewerId: string): WatchlistEntryInput => ({
      name,
      sourceId,
      season: null,
      episode: null,
      status: 'TO_WATCH',
      rating: null,
      viewerUserIds: [viewerId],
    })
    const entryA = await createWatchlistEntry(householdA.id, input(`${fixture.prefix}-entry-a`, sourceA.id, userA.id))
    const entryB = await createWatchlistEntry(householdB.id, input(`${fixture.prefix}-entry-b`, sourceB.id, userB.id))
    fixture.addCleanup(() => prisma.watchlistEntry.deleteMany({ where: { id: { in: [entryA.id, entryB.id] } } }))

    assert.deepEqual((await listWatchlistEntries(householdA.id)).map(({ id }) => id), [entryA.id])
    assert.deepEqual((await listWatchlistSources(householdA.id)).map(({ id }) => id), [sourceA.id])
    assert.equal(await updateWatchlistEntry(householdA.id, entryB.id, input('Hijacked', sourceA.id, userA.id)), null)
    assert.equal(await deleteWatchlistEntry(householdA.id, entryB.id), false)
    assert.equal((await prisma.watchlistEntry.findUniqueOrThrow({ where: { id: entryB.id } })).name, `${fixture.prefix}-entry-b`)
    assert.equal(await updateWatchlistSource(householdA.id, sourceB.id, { name: 'Hijacked' }), null)
    assert.equal(await deleteWatchlistSource(householdA.id, sourceB.id), false)
    assert.equal((await prisma.watchlistSource.findUniqueOrThrow({ where: { id: sourceB.id } })).name, `${fixture.prefix}-source-b`)
  } finally {
    await fixture.cleanup()
  }
})

test('Books and Sources are isolated across household reads and mutations', async () => {
  const fixture = new DatabaseFixture()

  try {
    const householdA = await fixture.createHousehold('books-a')
    const householdB = await fixture.createHousehold('books-b')
    const userA = await fixture.createUser(householdA.id, 'book-user-a')
    const userB = await fixture.createUser(householdB.id, 'book-user-b')
    const sourceA = await prisma.bookSource.create({ data: { householdId: householdA.id, name: `${fixture.prefix}-source-a` } })
    const sourceB = await prisma.bookSource.create({ data: { householdId: householdB.id, name: `${fixture.prefix}-source-b` } })
    fixture.addCleanup(() => prisma.bookSource.deleteMany({ where: { id: { in: [sourceA.id, sourceB.id] } } }))
    const input = (title: string, sourceId: string, readerId: string): BookInput => ({
      title,
      author: 'Test Author',
      summary: null,
      dateRead: null,
      rating: null,
      status: 'TO_READ',
      sourceId,
      notes: null,
      readerId,
    })
    const bookA = await createBook(householdA.id, input(`${fixture.prefix}-book-a`, sourceA.id, userA.id), null)
    const bookB = await createBook(householdB.id, input(`${fixture.prefix}-book-b`, sourceB.id, userB.id), null)
    fixture.addCleanup(() => prisma.book.deleteMany({ where: { id: { in: [bookA.id, bookB.id] } } }))

    assert.deepEqual((await listBooks(householdA.id)).map(({ id }) => id), [bookA.id])
    assert.deepEqual((await listBookSources(householdA.id)).map(({ id }) => id), [sourceA.id])
    assert.equal(await getBook(householdA.id, bookB.id), null)
    assert.equal(await updateBook(householdA.id, bookB.id, input('Hijacked', sourceA.id, userA.id), null), null)
    assert.equal(await deleteBook(householdA.id, bookB.id), false)
    assert.equal((await prisma.book.findUniqueOrThrow({ where: { id: bookB.id } })).title, `${fixture.prefix}-book-b`)
    assert.equal(await updateBookSource(householdA.id, sourceB.id, { name: 'Hijacked' }), null)
    assert.equal(await deleteBookSource(householdA.id, sourceB.id), false)
    assert.equal((await prisma.bookSource.findUniqueOrThrow({ where: { id: sourceB.id } })).name, `${fixture.prefix}-source-b`)
  } finally {
    await fixture.cleanup()
  }
})
