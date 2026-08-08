import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/current-user'
import { deleteHousehold, householdInputSchema, updateHousehold } from '@/lib/admin-households'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireSuperAdmin()
    const input = householdInputSchema.parse(await request.json())
    const household = await updateHousehold(id, input)
    return NextResponse.json(household)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireSuperAdmin()
    await deleteHousehold(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
