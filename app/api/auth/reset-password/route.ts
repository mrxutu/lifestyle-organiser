import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import {
  deletePasswordResetToken,
  findValidPasswordResetToken,
  resetPasswordInputSchema,
} from '@/lib/password-reset'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = resetPasswordInputSchema.parse(await request.json())

    const resetToken = await findValidPasswordResetToken(token)
    if (!resetToken) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    await deletePasswordResetToken(resetToken.id)

    return NextResponse.json({ message: 'Password reset. You can now log in.' })
  } catch (error) {
    return errorResponse(error)
  }
}
