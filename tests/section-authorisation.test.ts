import assert from 'node:assert/strict'
import test from 'node:test'
import { errorResponse } from '../lib/api-errors'
import { assertSectionEnabled, ForbiddenError, requireApiSection } from '../lib/current-user'
import { lookupManagementHousehold, requireHouseholdSection } from '../lib/lookup-authorisation'
import type { SectionFlags, SectionKey } from '../lib/household-sections'

const allEnabled: SectionFlags = {
  calendar: true,
  recipes: true,
  watchlist: true,
  books: true,
}

for (const section of Object.keys(allEnabled) as SectionKey[]) {
  test(`${section} API access is allowed when the section is enabled`, () => {
    assert.doesNotThrow(() => assertSectionEnabled(allEnabled, section))
  })

  test(`${section} API access is rejected before a mutation when the section is disabled`, async () => {
    let mutationCalls = 0
    const sections = { ...allEnabled, [section]: false }

    await assert.rejects(
      (async () => {
        await requireApiSection(section, async () => ({ sections }))
        mutationCalls += 1
      })(),
      ForbiddenError
    )

    assert.equal(mutationCalls, 0)
  })
}

test('disabled upload sections are rejected before storage work', async () => {
  let uploadCalls = 0

  for (const section of ['recipes', 'books'] as const) {
    const sections = { ...allEnabled, [section]: false }
    await assert.rejects(
      (async () => {
        await requireApiSection(section, async () => ({ sections }))
        uploadCalls += 1
      })(),
      ForbiddenError
    )
  }

  assert.equal(uploadCalls, 0)
})

test('section failures are returned as JSON 403 responses', async () => {
  const response = errorResponse(new ForbiddenError('Recipes section is disabled'))

  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), { error: 'Recipes section is disabled' })
})

test('Super Admin section enforcement checks the requested target household', async () => {
  const superAdmin = { role: 'SUPER_ADMIN' as const, householdId: 'household-a' }
  const targetHouseholdId = lookupManagementHousehold(superAdmin, 'household-b')
  const loadedHouseholds: string[] = []

  await assert.rejects(
    requireHouseholdSection(targetHouseholdId, 'watchlist', async (householdId) => {
      loadedHouseholds.push(householdId)
      return { ...allEnabled, watchlist: false }
    }),
    ForbiddenError
  )

  assert.deepEqual(loadedHouseholds, ['household-b'])
})

test('Super Admin can manage an enabled section in the requested target household', async () => {
  const superAdmin = { role: 'SUPER_ADMIN' as const, householdId: 'household-a' }
  const targetHouseholdId = lookupManagementHousehold(superAdmin, 'household-b')

  await assert.doesNotReject(
    requireHouseholdSection(targetHouseholdId, 'books', async (householdId) => {
      assert.equal(householdId, 'household-b')
      return allEnabled
    })
  )
})

test('missing target households fail closed before lookup mutation', async () => {
  let mutationCalls = 0

  await assert.rejects(
    (async () => {
      await requireHouseholdSection('missing-household', 'calendar', async () => null)
      mutationCalls += 1
    })(),
    ForbiddenError
  )

  assert.equal(mutationCalls, 0)
})
