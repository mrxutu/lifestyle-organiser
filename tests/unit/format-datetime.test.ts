import assert from 'node:assert/strict'
import test from 'node:test'
import { formatHouseholdActivityDate } from '../../lib/format-datetime'

test('household activity dates use the Europe/London en-GB calendar date', () => {
  assert.equal(formatHouseholdActivityDate(new Date('2026-03-31T23:30:00.000Z')), '1 Apr 2026')
})
