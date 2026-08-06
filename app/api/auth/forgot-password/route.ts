import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordInputSchema, sendPasswordResetEmail } from '@/lib/password-reset'
import { errorResponse } from '@/lib/api-errors'

const GENERIC_MESSAGE = "If that email is registered, we've sent a reset link."

export async function POST(request: NextRequest) {
  try {
    const { email } = forgotPasswordInputSchema.parse(await request.json())

    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      await sendPasswordResetEmail(user)
    }

    return NextResponse.json({ message: GENERIC_MESSAGE })
  } catch (error) {
    return errorResponse(error)
  }
}
