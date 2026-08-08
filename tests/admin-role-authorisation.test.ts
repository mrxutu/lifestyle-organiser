import assert from 'node:assert/strict'
import test from 'node:test'
import { getRoleScopedUserInput } from '../lib/admin-users'

type CurrentUserContext = { role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'; householdId?: string | null }

test('Super Admin can create a user with an elevated role and any household', () => {
  const input = {
    name: 'Casey',
    email: 'casey@example.com',
    householdId: 'household-b',
    role: 'ADMIN' as const,
  }

  const result = getRoleScopedUserInput(
    { role: 'SUPER_ADMIN', householdId: 'household-a' } satisfies CurrentUserContext,
    input
  )

  assert.deepEqual(result, input)
})

test('Admin is pinned to their own household and can only create member users', () => {
  const input = {
    name: 'Casey',
    email: 'casey@example.com',
    householdId: 'household-b',
    role: 'ADMIN' as const,
  }

  const result = getRoleScopedUserInput(
    { role: 'ADMIN', householdId: 'household-a' } satisfies CurrentUserContext,
    input
  )

  assert.deepEqual(result, {
    name: 'Casey',
    email: 'casey@example.com',
    householdId: 'household-a',
    role: 'MEMBER',
  })
})
