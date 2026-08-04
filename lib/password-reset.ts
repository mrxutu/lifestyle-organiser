import { randomBytes } from 'node:crypto'
import { z } from 'zod'
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
