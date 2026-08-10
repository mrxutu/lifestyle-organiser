import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { Resend } from 'resend'
import { Prisma } from '@/generated/prisma/client'
import { normalizeEmail, validatePassword } from '@/lib/auth-input'
import { prisma } from '@/lib/prisma'

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
export const NEW_USER_PASSWORD_SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().email().transform(normalizeEmail),
})

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().superRefine((password, context) => {
    const error = validatePassword(password)
    if (error) context.addIssue({ code: 'custom', message: error })
  }),
})

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createPasswordResetToken(userId: string, ttlMs: number) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashPasswordResetToken(token)
  const expiresAt = new Date(Date.now() + ttlMs)

  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lte: new Date() } } })

  const storedToken = await prisma.passwordResetToken.upsert({
    where: { userId },
    create: { userId, tokenHash, expiresAt },
    update: { tokenHash, expiresAt, createdAt: new Date() },
  })

  return { ...storedToken, token }
}

export async function findValidPasswordResetToken(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashPasswordResetToken(token), expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, email: true } } },
  })
}

export async function consumePasswordResetToken(token: string, passwordHash: string) {
  const tokenHash = hashPasswordResetToken(token)
  const now = new Date()

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.$queryRaw<Array<{ userId: string }>>(Prisma.sql`
      DELETE FROM "PasswordResetToken"
      WHERE "tokenHash" = ${tokenHash} AND "expiresAt" > ${now}
      RETURNING "userId"
    `)

    const userId = claimed[0]?.userId
    if (!userId) return null

    await transaction.user.update({
      where: { id: userId },
      data: { passwordHash, authVersion: { increment: 1 } },
    })
    await transaction.passwordResetToken.deleteMany({ where: { userId } })

    return { userId }
  })
}

export function hasPasswordResetEmailConfiguration() {
  return Boolean(process.env.RESEND_API?.trim() && process.env.SENDER_EMAIL?.trim() && process.env.HOSTNAME?.trim())
}

export function assertPasswordEmailAccepted(result: { error?: { message: string } | null }) {
  if (result.error) throw new Error(`Resend rejected password email: ${result.error.message}`)
}

async function sendPasswordSetupEmail(
  user: { id: string; email: string },
  { subject, text, ttlMs }: { subject: string; text: string; ttlMs: number },
) {
  if (!hasPasswordResetEmailConfiguration()) {
    return
  }

  try {
    const resetToken = await createPasswordResetToken(user.id, ttlMs)
    const resetUrl = new URL('/reset-password', process.env.HOSTNAME)
    resetUrl.searchParams.set('token', resetToken.token)

    const resend = new Resend(process.env.RESEND_API)
    const result = await resend.emails.send({
      from: `Lifestyle Organiser <${process.env.SENDER_EMAIL}>`,
      to: user.email,
      subject,
      text: text.replace('{{resetUrl}}', resetUrl.toString()),
    })
    assertPasswordEmailAccepted(result)
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
    ttlMs: PASSWORD_RESET_TOKEN_TTL_MS,
  })
}

export async function sendNewUserSetPasswordEmail(user: { id: string; email: string }) {
  await sendPasswordSetupEmail(user, {
    subject: 'Welcome to Lifestyle Organiser — set your password',
    text: `An account has been created for you on Lifestyle Organiser. Set your password to get started — this link expires in 7 days:\n\n{{resetUrl}}\n\nIf you weren't expecting this, you can ignore this email.`,
    ttlMs: NEW_USER_PASSWORD_SETUP_TOKEN_TTL_MS,
  })
}
