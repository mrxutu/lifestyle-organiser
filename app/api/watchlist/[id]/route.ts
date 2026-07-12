import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { deleteWatchlistEntry, updateWatchlistEntry, watchlistEntryInputSchema } from '@/lib/watchlist'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const input = watchlistEntryInputSchema.parse(await request.json())
    const entry = await updateWatchlistEntry(user.householdId, id, input)
    if (!entry) return NextResponse.json({ error: 'Watchlist entry not found' }, { status: 404 })
    return NextResponse.json(entry)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const deleted = await deleteWatchlistEntry(user.householdId, id)
    if (!deleted) return NextResponse.json({ error: 'Watchlist entry not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
