import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().email(),
})

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function createPasswordResetToken(userId: string) {
  await prisma.passwordResetToken.deleteMany({
    where: { userId, expiresAt: { gt: new Date() } },
  })

  return prisma.passwordResetToken.create({
    data: {
      userId,
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })
}

export async function findValidPasswordResetToken(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, email: true } } },
  })
}

export async function deletePasswordResetToken(id: string) {
  await prisma.passwordResetToken.delete({ where: { id } })
}

async function sendPasswordSetupEmail(
  user: { id: string; email: string },
  { subject, text }: { subject: string; text: string },
) {
  try {
    const resetToken = await createPasswordResetToken(user.id)
    const resetUrl = new URL('/reset-password', process.env.HOSTNAME)
    resetUrl.searchParams.set('token', resetToken.token)

    const resend = new Resend(process.env.RESEND_API)
    await resend.emails.send({
      from: `Lifestyle Organiser <${process.env.SENDER_EMAIL}>`,
      to: user.email,
      subject,
      text: text.replace('{{resetUrl}}', resetUrl.toString()),
    })
  } catch (sendError) {
    // Swallowed deliberately: callers (e.g. forgot-password) must not let a delivery
    // failure change their response, since that could be used to enumerate emails.
    console.error('Failed to send password setup email', sendError)
  }
}

export async function sendPasswordResetEmail(user: { id: string; email: string }) {
  await sendPasswordSetupEmail(user, {
    subject: 'Reset your password',
    text: `We received a request to reset your password. This link expires in 1 hour:\n\n{{resetUrl}}\n\nIf you didn't request this, you can ignore this email.`,
  })
}

export async function sendNewUserSetPasswordEmail(user: { id: string; email: string }) {
  await sendPasswordSetupEmail(user, {
    subject: 'Welcome to Lifestyle Organiser — set your password',
    text: `An account has been created for you on Lifestyle Organiser. Set your password to get started — this link expires in 1 hour:\n\n{{resetUrl}}\n\nIf you weren't expecting this, you can ignore this email.`,
  })
}
