import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  consumePasswordResetToken,
  findValidPasswordResetToken,
  hashPasswordResetToken,
  resetPasswordInputSchema,
} from '@/lib/password-reset'
import { errorResponse } from '@/lib/api-errors'
import { consumeAuthRateLimit, getTrustedSourceIp } from '@/lib/auth-rate-limit'

const INVALID_TOKEN_RESPONSE = { error: 'This reset link is invalid or has expired.' }

export async function POST(request: NextRequest) {
  try {
    const { token, password } = resetPasswordInputSchema.parse(await request.json())
    const [tokenLimit, ipLimit] = await Promise.all([
      consumeAuthRateLimit('RESET_PASSWORD_TOKEN', hashPasswordResetToken(token)),
      consumeAuthRateLimit('RESET_PASSWORD_IP', getTrustedSourceIp(request)),
    ])
    if (!tokenLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 })
    }

    const resetToken = await findValidPasswordResetToken(token)
    if (!resetToken) {
      return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const consumed = await consumePasswordResetToken(token, passwordHash)
    if (!consumed) return NextResponse.json(INVALID_TOKEN_RESPONSE, { status: 400 })

    return NextResponse.json({ message: 'Password reset. You can now log in.' })
  } catch (error) {
    return errorResponse(error)
  }
}
