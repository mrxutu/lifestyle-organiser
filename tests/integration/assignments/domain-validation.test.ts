import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createEvent,
  InvalidAttendeesError,
  InvalidEventTypeError,
  updateEvent,
  type EventInput,
} from '../../../lib/events'
import { createRecipe, InvalidChefError, updateRecipe, type RecipeInput } from '../../../lib/recipes'
import {
  createWatchlistEntry,
  InvalidViewersError,
  InvalidWatchlistSourceError,
  updateWatchlistEntry,
  type WatchlistEntryInput,
} from '../../../lib/watchlist'
import { prisma } from '../../../lib/prisma'
import { DatabaseFixture } from '../../fixtures/database'

test('Events validate attendees and Event Type ownership on create and update', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('events-household')
    const foreignHousehold = await fixture.createHousehold('events-foreign-household')
    const creator = await fixture.createUser(household.id, 'event-creator')
    const attendee = await fixture.createUser(household.id, 'event-attendee')
    const foreignAttendee = await fixture.createUser(foreignHousehold.id, 'foreign-attendee')
    const eventType = await prisma.eventType.create({
      data: { householdId: household.id, name: `${fixture.prefix}-type`, color: '#3b82f6' },
    })
    const foreignEventType = await prisma.eventType.create({
      data: { householdId: foreignHousehold.id, name: `${fixture.prefix}-foreign-type`, color: '#ef4444' },
    })
    fixture.addCleanup(() => prisma.eventType.deleteMany({ where: { id: { in: [eventType.id, foreignEventType.id] } } }))

    const input = (title: string, attendeeUserIds: string[], eventTypeId = eventType.id): EventInput => ({
      title,
      description: null,
      startAt: new Date('2030-01-01T10:00:00.000Z'),
      endAt: null,
      allDay: false,
      location: null,
      eventTypeId,
      remindMinutesBefore: null,
      recurrence: 'NONE',
      leadTimeDays: null,
      attendeeUserIds,
    })

    const event = await createEvent(household.id, creator.id, input(`${fixture.prefix}-valid`, [attendee.id]))
    fixture.addCleanup(() => prisma.event.deleteMany({ where: { id: event.id } }))
    assert.deepEqual(event.attendees.map(({ userId }) => userId), [attendee.id])

    for (const invalid of [
      { error: InvalidAttendeesError, input: input(`${fixture.prefix}-foreign-attendee-create`, [foreignAttendee.id]) },
      { error: InvalidEventTypeError, input: input(`${fixture.prefix}-foreign-type-create`, [attendee.id], foreignEventType.id) },
    ]) {
      await assert.rejects(createEvent(household.id, creator.id, invalid.input), invalid.error)
      assert.equal(await prisma.event.count({ where: { title: invalid.input.title } }), 0)
    }

    for (const invalid of [
      { error: InvalidAttendeesError, input: input(`${fixture.prefix}-foreign-attendee-update`, [foreignAttendee.id]) },
      { error: InvalidEventTypeError, input: input(`${fixture.prefix}-foreign-type-update`, [attendee.id], foreignEventType.id) },
    ]) {
      await assert.rejects(updateEvent(household.id, event.id, invalid.input), invalid.error)
      const unchanged = await prisma.event.findUniqueOrThrow({
        where: { id: event.id },
        include: { attendees: true },
      })
      assert.equal(unchanged.title, `${fixture.prefix}-valid`)
      assert.equal(unchanged.eventTypeId, eventType.id)
      assert.deepEqual(unchanged.attendees.map(({ userId }) => userId), [attendee.id])
    }
  } finally {
    await fixture.cleanup()
  }
})

test('Recipes validate chef household and active state on create and update', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('recipes-household')
    const foreignHousehold = await fixture.createHousehold('recipes-foreign-household')
    const author = await fixture.createUser(household.id, 'recipe-author')
    const chef = await fixture.createUser(household.id, 'chef')
    const foreignChef = await fixture.createUser(foreignHousehold.id, 'foreign-chef')
    const inactiveChef = await fixture.createUser(household.id, 'inactive-chef', false)
    const input = (title: string, chefId: string): RecipeInput => ({
      title,
      description: null,
      servings: null,
      prepMinutes: null,
      cookMinutes: null,
      method: null,
      tags: [],
      ingredients: [{ name: 'Ingredient', amount: 1, unit: 'G', order: 0 }],
      chefId,
    })

    const recipe = await createRecipe(household.id, author.id, input(`${fixture.prefix}-valid`, chef.id), null)
    fixture.addCleanup(() => prisma.recipe.deleteMany({ where: { id: recipe.id } }))
    assert.equal(recipe.chefId, chef.id)

    for (const invalidChef of [foreignChef, inactiveChef]) {
      const createTitle = `${fixture.prefix}-${invalidChef.id}-create`
      await assert.rejects(
        createRecipe(household.id, author.id, input(createTitle, invalidChef.id), null),
        InvalidChefError,
      )
      assert.equal(await prisma.recipe.count({ where: { title: createTitle } }), 0)

      await assert.rejects(
        updateRecipe(household.id, recipe.id, input(`${fixture.prefix}-invalid-update`, invalidChef.id), null),
        InvalidChefError,
      )
      const unchanged = await prisma.recipe.findUniqueOrThrow({
        where: { id: recipe.id },
        include: { ingredients: true },
      })
      assert.equal(unchanged.title, `${fixture.prefix}-valid`)
      assert.equal(unchanged.chefId, chef.id)
      assert.equal(unchanged.ingredients.length, 1)
    }
  } finally {
    await fixture.cleanup()
  }
})

test('Watchlist validates viewers and Source ownership on create and update', async () => {
  const fixture = new DatabaseFixture()

  try {
    const household = await fixture.createHousehold('watchlist-household')
    const foreignHousehold = await fixture.createHousehold('watchlist-foreign-household')
    const viewer = await fixture.createUser(household.id, 'viewer')
    const foreignViewer = await fixture.createUser(foreignHousehold.id, 'foreign-viewer')
    const inactiveViewer = await fixture.createUser(household.id, 'inactive-viewer', false)
    const source = await prisma.watchlistSource.create({
      data: { householdId: household.id, name: `${fixture.prefix}-source` },
    })
    const foreignSource = await prisma.watchlistSource.create({
      data: { householdId: foreignHousehold.id, name: `${fixture.prefix}-foreign-source` },
    })
    fixture.addCleanup(() => prisma.watchlistSource.deleteMany({ where: { id: { in: [source.id, foreignSource.id] } } }))

    const input = (
      name: string,
      viewerUserIds: string[],
      sourceId = source.id,
    ): WatchlistEntryInput => ({
      name,
      sourceId,
      season: null,
      episode: null,
      status: 'TO_WATCH',
      rating: null,
      viewerUserIds,
    })

    const entry = await createWatchlistEntry(household.id, input(`${fixture.prefix}-valid`, [viewer.id]))
    fixture.addCleanup(() => prisma.watchlistEntry.deleteMany({ where: { id: entry.id } }))
    assert.deepEqual(entry.viewers.map(({ userId }) => userId), [viewer.id])

    for (const invalid of [
      { error: InvalidViewersError, input: input(`${fixture.prefix}-foreign-viewer-create`, [foreignViewer.id]) },
      { error: InvalidViewersError, input: input(`${fixture.prefix}-inactive-viewer-create`, [inactiveViewer.id]) },
      { error: InvalidWatchlistSourceError, input: input(`${fixture.prefix}-foreign-source-create`, [viewer.id], foreignSource.id) },
    ]) {
      await assert.rejects(createWatchlistEntry(household.id, invalid.input), invalid.error)
      assert.equal(await prisma.watchlistEntry.count({ where: { name: invalid.input.name } }), 0)
    }

    for (const invalid of [
      { error: InvalidViewersError, input: input(`${fixture.prefix}-foreign-viewer-update`, [foreignViewer.id]) },
      { error: InvalidViewersError, input: input(`${fixture.prefix}-inactive-viewer-update`, [inactiveViewer.id]) },
      { error: InvalidWatchlistSourceError, input: input(`${fixture.prefix}-foreign-source-update`, [viewer.id], foreignSource.id) },
    ]) {
      await assert.rejects(updateWatchlistEntry(household.id, entry.id, invalid.input), invalid.error)
      const unchanged = await prisma.watchlistEntry.findUniqueOrThrow({
        where: { id: entry.id },
        include: { viewers: true },
      })
      assert.equal(unchanged.name, `${fixture.prefix}-valid`)
      assert.equal(unchanged.sourceId, source.id)
      assert.deepEqual(unchanged.viewers.map(({ userId }) => userId), [viewer.id])
    }
  } finally {
    await fixture.cleanup()
  }
})
