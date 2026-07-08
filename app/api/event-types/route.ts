import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { createEventType, eventTypeInputSchema } from '@/lib/event-types'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    await getCurrentUser()
    const input = eventTypeInputSchema.parse(await request.json())
    const eventType = await createEventType(input)
    return NextResponse.json(eventType, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
