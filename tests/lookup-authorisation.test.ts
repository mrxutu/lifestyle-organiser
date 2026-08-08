import assert from 'node:assert/strict'
import test from 'node:test'
import { ForbiddenError } from '../lib/current-user'
import { lookupManagementHousehold } from '../lib/lookup-authorisation'
import { HOUSEHOLD_LOOKUP_DEFAULTS } from '../lib/lookup-defaults'

test('Admin lookup management is pinned to their own household', () => {
  const admin = { role: 'ADMIN' as const, householdId: 'household-a' }

  assert.equal(lookupManagementHousehold(admin), 'household-a')
  assert.throws(
    () => lookupManagementHousehold(admin, 'household-b'),
    (error) => error instanceof ForbiddenError
  )
})

test('Member cannot manage lookup data', () => {
  assert.throws(
    () => lookupManagementHousehold({ role: 'MEMBER', householdId: 'household-a' }),
    (error) => error instanceof ForbiddenError
  )
})

test('Super Admin can manage lookup data for any household', () => {
  const superAdmin = { role: 'SUPER_ADMIN' as const, householdId: 'household-a' }

  assert.equal(lookupManagementHousehold(superAdmin, 'household-b'), 'household-b')
  assert.equal(lookupManagementHousehold(superAdmin), 'household-a')
})

test('new-household lookup defaults match the approved product values', () => {
  assert.deepEqual(HOUSEHOLD_LOOKUP_DEFAULTS.eventTypes.map(({ name }) => name), [
    'Appointment',
    'Reminder',
    'Renewal',
  ])
  assert.deepEqual(HOUSEHOLD_LOOKUP_DEFAULTS.watchlistSources.map(({ name }) => name), [
    'Netflix',
    'Apple TV',
    'Terrestrial',
    'Prime TV',
  ])
  assert.deepEqual(HOUSEHOLD_LOOKUP_DEFAULTS.bookSources.map(({ name }) => name), [
    'Kindle',
    'Physical Book',
  ])
})
