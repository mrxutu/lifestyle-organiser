import assert from 'node:assert/strict'
import test from 'node:test'
import { ALL_MEMBERS } from '../lib/member-filters'
import { filterBooks } from '../lib/book-filters'
import { filterRecipes } from '../lib/recipe-filters'
import { filterWatchlistEntries } from '../lib/watchlist-filters'

test('recipe filtering defaults to all chefs and ignores author provenance', () => {
  const recipes = [
    { title: 'Soup', chefId: 'user-1', authorId: 'user-2' },
    { title: 'Pie', chefId: 'user-2', authorId: 'user-1' },
  ]

  assert.deepEqual(filterRecipes(recipes, { search: '', chefFilter: ALL_MEMBERS }), recipes)
  assert.deepEqual(filterRecipes(recipes, { search: '', chefFilter: 'user-1' }), [recipes[0]])
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
})

test('book filtering defaults to all readers and filters by reader assignment', () => {
  const books = [
    { title: 'Dune', rating: 5, readerId: 'user-1' },
    { title: 'Piranesi', rating: null, readerId: 'user-2' },
  ]

  const baseFilters = { search: '', ratingFilter: 'ALL' }
  assert.deepEqual(filterBooks(books, { ...baseFilters, readerFilter: ALL_MEMBERS }), books)
  assert.deepEqual(filterBooks(books, { ...baseFilters, readerFilter: 'user-2' }), [books[1]])
})
