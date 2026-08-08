import { NextRequest, NextResponse } from 'next/server'
import { ForbiddenError, requireHouseholdAdmin } from '@/lib/current-user'
import { createUser, createUserInputSchema } from '@/lib/admin-users'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireHouseholdAdmin()
    const input = createUserInputSchema.parse(await request.json())

    if (currentUser.role === 'ADMIN' && input.householdId !== currentUser.householdId) {
      throw new ForbiddenError('Cannot manage users outside your household')
    }

    const user = await createUser(input, currentUser)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
