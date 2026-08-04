import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/current-user'
import { createUser, createUserInputSchema } from '@/lib/admin-users'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const input = createUserInputSchema.parse(await request.json())
    const user = await createUser(input, request.nextUrl.origin)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
