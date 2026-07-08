import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { deleteEventType, eventTypeInputSchema, updateEventType } from '@/lib/event-types'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await getCurrentUser()
    const input = eventTypeInputSchema.parse(await request.json())
    const eventType = await updateEventType(id, input)
    return NextResponse.json(eventType)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await getCurrentUser()
    await deleteEventType(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
