import { NextRequest, NextResponse } from 'next/server'
import { ForbiddenError, requireHouseholdAdmin } from '@/lib/current-user'
import { deleteUser, updateUser, updateUserInputSchema } from '@/lib/admin-users'
import { errorResponse } from '@/lib/api-errors'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await requireHouseholdAdmin()
    const input = updateUserInputSchema.parse(await request.json())

    if (currentUser.role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { householdId: true } })
      if (!targetUser || targetUser.householdId !== currentUser.householdId) {
        throw new ForbiddenError('Cannot manage users outside your household')
      }
      if (input.householdId !== currentUser.householdId) {
        throw new ForbiddenError('Cannot manage users outside your household')
      }
    }

    const user = await updateUser(id, input, currentUser.id, currentUser)
    return NextResponse.json(user)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await requireHouseholdAdmin()

    if (currentUser.role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({ where: { id }, select: { householdId: true } })
      if (!targetUser || targetUser.householdId !== currentUser.householdId) {
        throw new ForbiddenError('Cannot manage users outside your household')
      }
    }

    await deleteUser(id, currentUser.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
