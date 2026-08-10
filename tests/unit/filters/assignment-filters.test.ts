import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { ALL_MEMBERS } from '../../../lib/member-filters'
import { filterBooks } from '../../../lib/book-filters'
import { ALL_EVENT_TYPES, filterEventsByTypeAndUser } from '../../../lib/event-filters'
import { filterRecipes } from '../../../lib/recipe-filters'
import { filterWatchlistEntries } from '../../../lib/watchlist-filters'
import { isDueSoon, isVisibleOnReminders } from '../../../lib/reminder-urgency'

test('event filtering combines type and multi-user OR semantics', () => {
  const events = [
    { id: 'a', eventTypeId: 'appointment', attendees: [{ userId: 'user-1' }] },
    { id: 'b', eventTypeId: 'appointment', attendees: [{ userId: 'user-2' }, { userId: 'user-3' }] },
    { id: 'c', eventTypeId: 'holiday', attendees: [{ userId: 'user-3' }] },
  ]

  assert.deepEqual(
    filterEventsByTypeAndUser(events, { eventTypeId: ALL_EVENT_TYPES, userFilter: [] }),
    events,
  )
  assert.deepEqual(
    filterEventsByTypeAndUser(events, { eventTypeId: 'appointment', userFilter: ['user-1', 'user-3'] }),
    [events[0], events[1]],
  )
  assert.deepEqual(
    filterEventsByTypeAndUser(events, { eventTypeId: 'holiday', userFilter: ['user-1'] }),
    [],
  )
})

test('recipe filtering defaults to all chefs and ignores author provenance', () => {
  const recipes = [
    { title: 'Soup', chefId: 'user-1', authorId: 'user-2' },
    { title: 'Pie', chefId: 'user-2', authorId: 'user-1' },
  ]

  assert.deepEqual(filterRecipes(recipes, { search: '', chefFilter: ALL_MEMBERS }), recipes)
  assert.deepEqual(filterRecipes(recipes, { search: '', chefFilter: 'user-1' }), [recipes[0]])
  assert.deepEqual(filterRecipes(recipes, { search: ' SOU ', chefFilter: 'user-1' }), [recipes[0]])
  assert.deepEqual(filterRecipes(recipes, { search: 'soup', chefFilter: 'user-2' }), [])
})

test('watchlist filtering defaults to all viewers and filters by assignment membership', () => {
  const entries = [
    { sourceId: 'source', status: 'TO_WATCH' as const, rating: null, viewers: [{ userId: 'user-1' }] },
    { sourceId: 'source', status: 'WATCHING' as const, rating: 4, viewers: [{ userId: 'user-2' }] },
  ]

  const baseFilters = { statusFilter: 'ALL', sourceFilter: 'ALL', ratingFilter: 'ALL' }
  assert.deepEqual(
    filterWatchlistEntries(entries, { ...baseFilters, viewerFilter: ALL_MEMBERS }),
    entries
  )
  assert.deepEqual(
    filterWatchlistEntries(entries, { ...baseFilters, viewerFilter: 'user-2' }),
    [entries[1]]
  )
  assert.deepEqual(
    filterWatchlistEntries(entries, {
      statusFilter: 'WATCHING',
      sourceFilter: 'source',
      ratingFilter: '4',
      viewerFilter: 'user-2',
    }),
    [entries[1]],
  )
  assert.deepEqual(
    filterWatchlistEntries(entries, {
      statusFilter: 'WATCHING',
      sourceFilter: 'source',
      ratingFilter: 'UNRATED',
      viewerFilter: 'user-2',
    }),
    [],
  )
})

test('book filtering defaults to all readers and filters by reader assignment', () => {
  const books = [
    { title: 'Dune', rating: 5, readerId: 'user-1' },
    { title: 'Piranesi', rating: null, readerId: 'user-2' },
  ]

  const baseFilters = { search: '', ratingFilter: 'ALL' }
  assert.deepEqual(filterBooks(books, { ...baseFilters, readerFilter: ALL_MEMBERS }), books)
  assert.deepEqual(filterBooks(books, { ...baseFilters, readerFilter: 'user-2' }), [books[1]])
  assert.deepEqual(
    filterBooks(books, { search: ' dune ', ratingFilter: '5', readerFilter: 'user-1' }),
    [books[0]],
  )
  assert.deepEqual(
    filterBooks(books, { search: 'dune', ratingFilter: 'UNRATED', readerFilter: 'user-1' }),
    [],
  )
})

test('reminder visibility and due-soon boundaries use a deterministic clock', () => {
  mock.timers.enable({ apis: ['Date'], now: new Date('2030-01-10T12:00:00.000Z') })
  try {
    assert.equal(isVisibleOnReminders({ startAt: new Date('2030-01-10T23:59:00.000Z'), leadTimeDays: 1 }), true)
    assert.equal(isVisibleOnReminders({ startAt: new Date('2030-01-11T12:00:00.000Z'), leadTimeDays: 1 }), false)
    assert.equal(isVisibleOnReminders({ startAt: new Date('2030-01-20T12:00:00.000Z'), leadTimeDays: 0 }), true)
    assert.equal(isVisibleOnReminders({ startAt: new Date('2030-01-09T12:00:00.000Z'), leadTimeDays: 0 }), false)
    assert.equal(isVisibleOnReminders({ startAt: new Date('2030-01-10T12:00:00.000Z'), leadTimeDays: null }), false)
    assert.equal(isDueSoon({ startAt: new Date('2030-01-12T12:00:00.000Z') }), true)
    assert.equal(isDueSoon({ startAt: new Date('2030-01-13T12:00:00.000Z') }), false)
    assert.equal(isDueSoon({ startAt: new Date('2030-01-09T12:00:00.000Z') }), false)
  } finally {
    mock.timers.reset()
  }
})
