import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { consumeAuthRateLimit, hashRateLimitIdentifier } from '../../../lib/auth-rate-limit'
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  findValidPasswordResetToken,
  hashPasswordResetToken,
} from '../../../lib/password-reset'
import { prisma } from '../../../lib/prisma'
import { POST as forgotPasswordPost } from '../../../app/api/auth/forgot-password/route'
import { POST as resetPasswordPost } from '../../../app/api/auth/reset-password/route'
import { GENERIC_FORGOT_PASSWORD_MESSAGE } from '../../../lib/auth-input'
import { updateUser } from '../../../lib/admin-users'
import { handlers } from '../../../lib/auth'

test('real PostgreSQL token issuance remains atomic under eight concurrent requests', async () => {
  const suffix = randomUUID()
  const user = await prisma.user.create({
    data: { email: `auth-issuance-${suffix}@example.test`, name: 'Auth issuance test' },
  })

  try {
    const issued = await Promise.all(
      Array.from({ length: 8 }, () => createPasswordResetToken(user.id)),
    )
    const stored = await prisma.passwordResetToken.findMany({ where: { userId: user.id } })
    const valid = await Promise.all(issued.map(({ token }) => findValidPasswordResetToken(token)))

    assert.equal(stored.length, 1)
    assert.equal(valid.filter(Boolean).length, 1)
    assert.equal(issued.some(({ token }) => hashPasswordResetToken(token) === stored[0]?.tokenHash), true)
  } finally {
    await prisma.user.delete({ where: { id: user.id } })
  }
})

test('real PostgreSQL token consumption has exactly one winner and revokes sessions', async () => {
  const suffix = randomUUID()
  const user = await prisma.user.create({
    data: { email: `auth-consumption-${suffix}@example.test`, name: 'Auth consumption test' },
  })

  try {
    const { token } = await createPasswordResetToken(user.id)
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) => consumePasswordResetToken(token, `test-hash-${index}`)),
    )
    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    const remainingTokens = await prisma.passwordResetToken.count({ where: { userId: user.id } })

    assert.equal(results.filter(Boolean).length, 1)
    assert.equal(updatedUser.authVersion, 1)
    assert.equal(remainingTokens, 0)
  } finally {
    await prisma.user.delete({ where: { id: user.id } })
  }
})

test('real PostgreSQL rate-limit increments are atomic under concurrent requests', async () => {
  const identifier = `atomic-${randomUUID()}`
  const action = 'LOGIN_IP' as const
  const results = await Promise.all(
    Array.from({ length: 50 }, () => consumeAuthRateLimit(action, identifier)),
  )

  try {
    assert.deepEqual(results.map(({ attempts }) => attempts).sort((a, b) => a - b),
      Array.from({ length: 50 }, (_, index) => index + 1))
    assert.equal(results.filter(({ allowed }) => allowed).length, 20)
  } finally {
    await prisma.authRateLimit.deleteMany({
      where: { action, identifierHash: hashRateLimitIdentifier(action, identifier) },
    })
  }
})

test('forgot-password responses stay generic for existing, nonexistent, and throttled accounts', async () => {
  const suffix = randomUUID()
  const existingEmail = `auth-response-${suffix}@example.test`
  const missingEmail = `missing-${suffix}@example.test`
  const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`
  const user = await prisma.user.create({ data: { email: existingEmail, name: 'Auth response test' } })
  const previousConfig = {
    resend: process.env.RESEND_API,
    sender: process.env.SENDER_EMAIL,
    hostname: process.env.HOSTNAME,
  }
  delete process.env.RESEND_API
  delete process.env.SENDER_EMAIL
  delete process.env.HOSTNAME

  const request = (email: string) => new NextRequest('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': ip },
    body: JSON.stringify({ email }),
  })

  try {
    const existing = await forgotPasswordPost(request(existingEmail))
    const nonexistent = await forgotPasswordPost(request(missingEmail))
    const throttled = await Promise.all(
      Array.from({ length: 3 }, () => forgotPasswordPost(request(existingEmail))),
    )
    const responses = [existing, nonexistent, ...throttled]

    for (const response of responses) {
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { message: GENERIC_FORGOT_PASSWORD_MESSAGE })
    }
  } finally {
    if (previousConfig.resend !== undefined) process.env.RESEND_API = previousConfig.resend
    if (previousConfig.sender !== undefined) process.env.SENDER_EMAIL = previousConfig.sender
    if (previousConfig.hostname !== undefined) process.env.HOSTNAME = previousConfig.hostname
    await prisma.authRateLimit.deleteMany({
      where: {
        OR: [
          { action: 'FORGOT_PASSWORD_ACCOUNT', identifierHash: hashRateLimitIdentifier('FORGOT_PASSWORD_ACCOUNT', existingEmail) },
          { action: 'FORGOT_PASSWORD_ACCOUNT', identifierHash: hashRateLimitIdentifier('FORGOT_PASSWORD_ACCOUNT', missingEmail) },
          { action: 'FORGOT_PASSWORD_IP', identifierHash: hashRateLimitIdentifier('FORGOT_PASSWORD_IP', ip) },
        ],
      },
    })
    await prisma.user.delete({ where: { id: user.id } })
  }
})

test('account disable and re-enable each revoke existing sessions without changing role', async () => {
  const suffix = randomUUID()
  const household = await prisma.household.create({ data: { name: `Auth version ${suffix}` } })
  const user = await prisma.user.create({
    data: {
      email: `auth-version-${suffix}@example.test`,
      name: 'Auth version test',
      householdId: household.id,
      role: 'ADMIN',
    },
  })
  const actor = { role: 'SUPER_ADMIN' as const, householdId: household.id }

  try {
    const disabled = await updateUser(user.id, {
      name: user.name!,
      householdId: household.id,
      role: 'ADMIN',
      isActive: false,
    }, 'different-current-user', actor)
    const enabled = await updateUser(user.id, {
      name: user.name!,
      householdId: household.id,
      role: 'ADMIN',
      isActive: true,
    }, 'different-current-user', actor)

    assert.equal(disabled.authVersion, 1)
    assert.equal(enabled.authVersion, 2)
    assert.equal(enabled.role, 'ADMIN')
  } finally {
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.household.delete({ where: { id: household.id } })
  }
})

test('reset-password route consumes a token once, updates the password, and revokes sessions', async () => {
  const suffix = randomUUID()
  const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`
  const oldHash = await bcrypt.hash('old password value', 4)
  const user = await prisma.user.create({
    data: { email: `reset-route-${suffix}@example.test`, passwordHash: oldHash },
  })
  const { token } = await createPasswordResetToken(user.id)
  const request = () => new NextRequest('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': ip },
    body: JSON.stringify({ token, password: 'a new secure password' }),
  })

  try {
    const first = await resetPasswordPost(request())
    const replay = await resetPasswordPost(request())
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })

    assert.equal(first.status, 200)
    assert.deepEqual(await first.json(), { message: 'Password reset. You can now log in.' })
    assert.equal(replay.status, 400)
    assert.deepEqual(await replay.json(), { error: 'This reset link is invalid or has expired.' })
    assert.equal(updated.authVersion, 1)
    assert.equal(await bcrypt.compare('a new secure password', updated.passwordHash!), true)
    assert.equal(await prisma.passwordResetToken.count({ where: { userId: user.id } }), 0)
  } finally {
    await prisma.authRateLimit.deleteMany({
      where: {
        OR: [
          { action: 'RESET_PASSWORD_TOKEN', identifierHash: hashRateLimitIdentifier('RESET_PASSWORD_TOKEN', hashPasswordResetToken(token)) },
          { action: 'RESET_PASSWORD_IP', identifierHash: hashRateLimitIdentifier('RESET_PASSWORD_IP', ip) },
        ],
      },
    })
    await prisma.user.delete({ where: { id: user.id } })
  }
})

test('reset-password route rejects an expired token without changing the account', async () => {
  const suffix = randomUUID()
  const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`
  const oldHash = await bcrypt.hash('old password value', 4)
  const user = await prisma.user.create({
    data: { email: `expired-reset-${suffix}@example.test`, passwordHash: oldHash },
  })
  const { token } = await createPasswordResetToken(user.id)
  await prisma.passwordResetToken.update({
    where: { userId: user.id },
    data: { expiresAt: new Date(Date.now() - 1_000) },
  })

  try {
    const response = await resetPasswordPost(new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': ip },
      body: JSON.stringify({ token, password: 'a new secure password' }),
    }))
    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'This reset link is invalid or has expired.' })
    assert.equal(unchanged.authVersion, 0)
    assert.equal(unchanged.passwordHash, oldHash)
  } finally {
    await prisma.authRateLimit.deleteMany({
      where: {
        OR: [
          { action: 'RESET_PASSWORD_TOKEN', identifierHash: hashRateLimitIdentifier('RESET_PASSWORD_TOKEN', hashPasswordResetToken(token)) },
          { action: 'RESET_PASSWORD_IP', identifierHash: hashRateLimitIdentifier('RESET_PASSWORD_IP', ip) },
        ],
      },
    })
    await prisma.user.delete({ where: { id: user.id } })
  }
})

test('credential callback accepts valid login, stays generic for invalid accounts, and preserves disabled messaging', async () => {
  const suffix = randomUUID()
  const ip = `192.0.2.${Math.floor(Math.random() * 200) + 1}`
  const password = 'valid credential password'
  const active = await prisma.user.create({
    data: { email: `active-login-${suffix}@example.test`, passwordHash: await bcrypt.hash(password, 4) },
  })
  const passwordless = await prisma.user.create({
    data: { email: `passwordless-login-${suffix}@example.test`, passwordHash: null },
  })
  const disabled = await prisma.user.create({
    data: {
      email: `disabled-login-${suffix}@example.test`,
      passwordHash: await bcrypt.hash(password, 4),
      isActive: false,
    },
  })
  const missingEmail = `missing-login-${suffix}@example.test`

  const signIn = async (email: string, submittedPassword: string) => {
    const csrf = await handlers.GET(new NextRequest('http://localhost/api/auth/csrf'))
    const csrfBody = await csrf.json() as { csrfToken: string }
    const cookie = csrf.headers.get('set-cookie')?.split(';')[0] ?? ''
    return handlers.POST(new NextRequest('http://localhost/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie,
        'x-forwarded-for': ip,
      },
      body: new URLSearchParams({ email, password: submittedPassword, csrfToken: csrfBody.csrfToken }),
    }))
  }

  try {
    const accepted = await signIn(active.email.toUpperCase(), password)
    const wrongPassword = await signIn(active.email, 'wrong password')
    const nonexistent = await signIn(missingEmail, password)
    const noPassword = await signIn(passwordless.email, password)
    const disabledAccount = await signIn(disabled.email, password)

    assert.equal(accepted.status, 302)
    assert.match(accepted.headers.get('set-cookie') ?? '', /authjs\.session-token/)
    assert.equal(wrongPassword.headers.get('location'), nonexistent.headers.get('location'))
    assert.equal(nonexistent.headers.get('location'), noPassword.headers.get('location'))
    assert.match(nonexistent.headers.get('location') ?? '', /error=CredentialsSignin/)
    assert.match(disabledAccount.headers.get('location') ?? '', /code=account_disabled/)
  } finally {
    await prisma.authRateLimit.deleteMany({
      where: {
        OR: [
          ...[active.email, passwordless.email, disabled.email, missingEmail].map((email) => ({
            action: 'LOGIN_ACCOUNT',
            identifierHash: hashRateLimitIdentifier('LOGIN_ACCOUNT', email),
          })),
          { action: 'LOGIN_IP', identifierHash: hashRateLimitIdentifier('LOGIN_IP', ip) },
        ],
      },
    })
    await prisma.user.deleteMany({ where: { id: { in: [active.id, passwordless.id, disabled.id] } } })
  }
})
