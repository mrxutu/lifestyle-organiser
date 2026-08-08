import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { deleteWatchlistSource, updateWatchlistSource, watchlistSourceInputSchema } from '@/lib/watchlist'
import { errorResponse } from '@/lib/api-errors'
import { lookupManagementHousehold } from '@/lib/lookup-authorisation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    const input = watchlistSourceInputSchema.parse(await request.json())
    const source = await updateWatchlistSource(householdId, id, input)
    if (!source) return NextResponse.json({ error: 'Watchlist source not found' }, { status: 404 })
    return NextResponse.json(source)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    const deleted = await deleteWatchlistSource(householdId, id)
    if (!deleted) return NextResponse.json({ error: 'Watchlist source not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
