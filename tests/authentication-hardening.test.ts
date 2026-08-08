import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PASSWORD_MAX_UTF8_BYTES,
  canSendPasswordReset,
  GENERIC_FORGOT_PASSWORD_MESSAGE,
  isAuthSessionCurrent,
  normalizeEmail,
  validatePassword,
} from '../lib/auth-input'
import {
  AUTH_RATE_LIMIT_POLICIES,
  getTrustedSourceIp,
  hashRateLimitIdentifier,
} from '../lib/auth-rate-limit'
import { assertPasswordEmailAccepted, hashPasswordResetToken } from '../lib/password-reset'

test('email normalization is consistently trimmed and lowercased', () => {
  assert.equal(normalizeEmail('  Paul.Example@Example.COM  '), 'paul.example@example.com')
})

test('password policy accepts spaces and Unicode without composition rules', () => {
  assert.equal(validatePassword('twelve words ✓'), null)
  assert.equal(validatePassword('all lowercase but long enough'), null)
})

test('password policy rejects short, common, and over-72-byte passwords', () => {
  assert.match(validatePassword('short') ?? '', /at least 12/)
  assert.match(validatePassword('password1234') ?? '', /less common/)
  assert.equal(new TextEncoder().encode('é'.repeat(36)).length, PASSWORD_MAX_UTF8_BYTES)
  assert.equal(validatePassword('é'.repeat(36)), null)
  assert.match(validatePassword(`a${'é'.repeat(36)}`) ?? '', /72 UTF-8 bytes/)
})

test('reset tokens are represented at rest by deterministic SHA-256 hashes', () => {
  const rawToken = 'raw-reset-token-that-must-not-be-stored'
  const tokenHash = hashPasswordResetToken(rawToken)

  assert.equal(tokenHash.length, 64)
  assert.notEqual(tokenHash, rawToken)
  assert.equal(tokenHash, hashPasswordResetToken(rawToken))
})

test('forgot-password delivery eligibility never changes the generic security response', () => {
  assert.equal(canSendPasswordReset(true, true, true), true)
  assert.equal(canSendPasswordReset(true, true, false), false)
  assert.equal(canSendPasswordReset(false, true, true), false)
  assert.equal(canSendPasswordReset(true, false, true), false)
  assert.equal(GENERIC_FORGOT_PASSWORD_MESSAGE, "If that email is registered, we've sent a reset link.")
})

test('Resend returned errors are treated as delivery failures', () => {
  assert.doesNotThrow(() => assertPasswordEmailAccepted({ error: null }))
  assert.throws(
    () => assertPasswordEmailAccepted({ error: { message: 'provider rejected request' } }),
    /Resend rejected password email/,
  )
})

test('rate-limit identifiers are action-scoped HMACs containing no raw identifier', () => {
  const previousSecret = process.env.AUTH_RATE_LIMIT_SECRET
  process.env.AUTH_RATE_LIMIT_SECRET = 'unit-test-rate-limit-secret'
  try {
    const email = 'person@example.com'
    const accountHash = hashRateLimitIdentifier('LOGIN_ACCOUNT', email)
    const forgotHash = hashRateLimitIdentifier('FORGOT_PASSWORD_ACCOUNT', email)

    assert.equal(accountHash.length, 64)
    assert.equal(accountHash.includes(email), false)
    assert.notEqual(accountHash, forgotHash)
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_RATE_LIMIT_SECRET
    else process.env.AUTH_RATE_LIMIT_SECRET = previousSecret
  }
})

test('trusted source IP ignores spoofable forwarding headers on Vercel', () => {
  const previousVercel = process.env.VERCEL
  process.env.VERCEL = '1'
  try {
    const request = new Request('https://example.test', {
      headers: {
        'x-vercel-forwarded-for': '203.0.113.8, 10.0.0.1',
        'x-forwarded-for': '198.51.100.99',
      },
    })
    assert.equal(getTrustedSourceIp(request), '203.0.113.8')

    const spoofOnly = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '198.51.100.99' },
    })
    assert.equal(getTrustedSourceIp(spoofOnly), 'unknown')
  } finally {
    if (previousVercel === undefined) delete process.env.VERCEL
    else process.env.VERCEL = previousVercel
  }
})

test('all auth rate-limit policies are role-independent and bounded', () => {
  assert.deepEqual(AUTH_RATE_LIMIT_POLICIES.LOGIN_ACCOUNT, { limit: 5, windowMs: 15 * 60 * 1000 })
  assert.deepEqual(AUTH_RATE_LIMIT_POLICIES.FORGOT_PASSWORD_ACCOUNT, { limit: 3, windowMs: 60 * 60 * 1000 })
  assert.deepEqual(AUTH_RATE_LIMIT_POLICIES.RESET_PASSWORD_TOKEN, { limit: 5, windowMs: 15 * 60 * 1000 })
})

test('session revocation rejects legacy, stale, disabled, and missing-user sessions for every role', () => {
  const roles = ['SUPER_ADMIN', 'ADMIN', 'MEMBER'] as const
  for (const role of roles) {
    const user = { authVersion: 4, isActive: true, role }
    assert.equal(isAuthSessionCurrent(4, user), true)
    assert.equal(isAuthSessionCurrent(undefined, user), false)
    assert.equal(isAuthSessionCurrent(3, user), false)
    assert.equal(isAuthSessionCurrent(4, { ...user, isActive: false }), false)
    assert.equal(isAuthSessionCurrent(4, null), false)
  }
})
