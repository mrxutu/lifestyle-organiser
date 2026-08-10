import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/current-user'
import { cascadeDeleteHousehold, householdCascadeInputSchema } from '@/lib/admin-households'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const currentUser = await requireSuperAdmin()
    const { confirmationName } = householdCascadeInputSchema.parse(await request.json())
    const result = await cascadeDeleteHousehold(id, confirmationName, currentUser.id)
    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
