import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { deleteEventType, eventTypeInputSchema, updateEventType } from '@/lib/event-types'
import { errorResponse } from '@/lib/api-errors'
import { lookupManagementHousehold, requireHouseholdSection } from '@/lib/lookup-authorisation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    await requireHouseholdSection(householdId, 'calendar')
    const input = eventTypeInputSchema.parse(await request.json())
    const eventType = await updateEventType(householdId, id, input)
    if (!eventType) return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
    return NextResponse.json(eventType)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    await requireHouseholdSection(householdId, 'calendar')
    const deleted = await deleteEventType(householdId, id)
    if (!deleted) return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
