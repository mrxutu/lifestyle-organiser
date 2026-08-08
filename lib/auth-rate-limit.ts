import { createHmac } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export type AuthRateLimitAction =
  | 'LOGIN_ACCOUNT'
  | 'LOGIN_IP'
  | 'FORGOT_PASSWORD_ACCOUNT'
  | 'FORGOT_PASSWORD_IP'
  | 'RESET_PASSWORD_TOKEN'
  | 'RESET_PASSWORD_IP'

type RateLimitPolicy = {
  limit: number
  windowMs: number
}

export const AUTH_RATE_LIMIT_POLICIES: Record<AuthRateLimitAction, RateLimitPolicy> = {
  LOGIN_ACCOUNT: { limit: 5, windowMs: 15 * 60 * 1000 },
  LOGIN_IP: { limit: 20, windowMs: 15 * 60 * 1000 },
  FORGOT_PASSWORD_ACCOUNT: { limit: 3, windowMs: 60 * 60 * 1000 },
  FORGOT_PASSWORD_IP: { limit: 10, windowMs: 60 * 60 * 1000 },
  RESET_PASSWORD_TOKEN: { limit: 5, windowMs: 15 * 60 * 1000 },
  RESET_PASSWORD_IP: { limit: 20, windowMs: 15 * 60 * 1000 },
}

function rateLimitSecret() {
  const secret = process.env.AUTH_RATE_LIMIT_SECRET?.trim() || process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error('AUTH_RATE_LIMIT_SECRET or AUTH_SECRET is required')
  return secret
}

export function hashRateLimitIdentifier(action: AuthRateLimitAction, identifier: string) {
  return createHmac('sha256', rateLimitSecret())
    .update(`${action}\0${identifier}`)
    .digest('hex')
}

export function getTrustedSourceIp(request: Request) {
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0]!.trim()

  if (!process.env.VERCEL) {
    const forwardedIp = request.headers.get('x-forwarded-for')
    if (forwardedIp) return forwardedIp.split(',')[0]!.trim()
  }

  return 'unknown'
}

export async function consumeAuthRateLimit(
  action: AuthRateLimitAction,
  identifier: string,
  now = new Date(),
) {
  const policy = AUTH_RATE_LIMIT_POLICIES[action]
  const identifierHash = hashRateLimitIdentifier(action, identifier)
  const expiresAt = new Date(now.getTime() + policy.windowMs)

  const rows = await prisma.$queryRaw<Array<{ attempts: number; expiresAt: Date }>>(Prisma.sql`
    INSERT INTO "AuthRateLimit" (
      "action", "identifierHash", "attempts", "windowStartedAt", "expiresAt", "updatedAt"
    )
    VALUES (${action}, ${identifierHash}, 1, ${now}, ${expiresAt}, ${now})
    ON CONFLICT ("action", "identifierHash") DO UPDATE SET
      "attempts" = CASE
        WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN 1
        ELSE "AuthRateLimit"."attempts" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN ${now}
        ELSE "AuthRateLimit"."windowStartedAt"
      END,
      "expiresAt" = CASE
        WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "AuthRateLimit"."expiresAt"
      END,
      "updatedAt" = ${now}
    RETURNING "attempts", "expiresAt"
  `)

  const result = rows[0]
  if (!result) throw new Error('Rate limiter did not return a result')

  return {
    allowed: result.attempts <= policy.limit,
    attempts: result.attempts,
    limit: policy.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((result.expiresAt.getTime() - now.getTime()) / 1000)),
  }
}

export async function clearAuthRateLimit(action: AuthRateLimitAction, identifier: string) {
  await prisma.authRateLimit.deleteMany({
    where: { action, identifierHash: hashRateLimitIdentifier(action, identifier) },
  })
}

export async function cleanupExpiredAuthRateLimits(now = new Date()) {
  await prisma.authRateLimit.deleteMany({ where: { expiresAt: { lte: now } } })
}
