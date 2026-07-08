import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { createEvent, eventInputSchema } from '@/lib/events'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const input = eventInputSchema.parse(await request.json())
    const event = await createEvent(user.householdId, user.id, input)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
