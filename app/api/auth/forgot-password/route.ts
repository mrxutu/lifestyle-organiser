import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordInputSchema, sendPasswordResetEmail } from '@/lib/password-reset'
import { canSendPasswordReset, GENERIC_FORGOT_PASSWORD_MESSAGE } from '@/lib/auth-input'
import { errorResponse } from '@/lib/api-errors'
import {
  cleanupExpiredAuthRateLimits,
  consumeAuthRateLimit,
  getTrustedSourceIp,
} from '@/lib/auth-rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email } = forgotPasswordInputSchema.parse(await request.json())
    const [accountLimit, ipLimit] = await Promise.all([
      consumeAuthRateLimit('FORGOT_PASSWORD_ACCOUNT', email),
      consumeAuthRateLimit('FORGOT_PASSWORD_IP', getTrustedSourceIp(request)),
      cleanupExpiredAuthRateLimits(),
    ])

    const user = accountLimit.allowed && ipLimit.allowed
      ? await prisma.user.findUnique({ where: { email } })
      : null
    if (user && canSendPasswordReset(accountLimit.allowed, ipLimit.allowed, true)) {
      await sendPasswordResetEmail(user)
    }

    return NextResponse.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE })
  } catch (error) {
    return errorResponse(error)
  }
}
