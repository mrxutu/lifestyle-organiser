import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { createEventType, eventTypeInputSchema } from '@/lib/event-types'
import { errorResponse } from '@/lib/api-errors'
import { lookupManagementHousehold, requireHouseholdSection } from '@/lib/lookup-authorisation'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    await requireHouseholdSection(householdId, 'calendar')
    const input = eventTypeInputSchema.parse(await request.json())
    const eventType = await createEventType(householdId, input)
    return NextResponse.json(eventType, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
