import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/current-user'
import { createHousehold, householdInputSchema } from '@/lib/admin-households'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const input = householdInputSchema.parse(await request.json())
    const household = await createHousehold(input)
    return NextResponse.json(household, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
