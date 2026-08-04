import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken, forgotPasswordInputSchema } from '@/lib/password-reset'
import { errorResponse } from '@/lib/api-errors'

const GENERIC_MESSAGE = "If that email is registered, we've sent a reset link."

export async function POST(request: NextRequest) {
  try {
    const { email } = forgotPasswordInputSchema.parse(await request.json())

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      try {
        const resetToken = await createPasswordResetToken(user.id)
        const resetUrl = new URL('/reset-password', request.nextUrl.origin)
        resetUrl.searchParams.set('token', resetToken.token)

        const resend = new Resend(process.env.RESEND_API)
        await resend.emails.send({
          from: `Lifestyle Organiser <${process.env.SENDER_EMAIL}>`,
          to: user.email,
          subject: 'Reset your password',
          text: `We received a request to reset your password. This link expires in 1 hour:\n\n${resetUrl.toString()}\n\nIf you didn't request this, you can ignore this email.`,
        })
      } catch (sendError) {
        // Swallowed deliberately: the response must stay identical whether or not
        // the account exists, so a delivery failure can't be used to enumerate emails.
        console.error('Failed to send password reset email', sendError)
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE })
  } catch (error) {
    return errorResponse(error)
  }
}
