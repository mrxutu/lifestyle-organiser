import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/current-user'
import { deleteUser, updateUser, updateUserInputSchema } from '@/lib/admin-users'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await requireAdmin()
    const input = updateUserInputSchema.parse(await request.json())
    const user = await updateUser(id, input, currentUser.id)
    return NextResponse.json(user)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await requireAdmin()
    await deleteUser(id, currentUser.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
