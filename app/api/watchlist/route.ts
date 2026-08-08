import { NextRequest, NextResponse } from 'next/server'
import { requireApiSection } from '@/lib/current-user'
import { createWatchlistEntry, watchlistEntryInputSchema } from '@/lib/watchlist'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSection('watchlist')
    const input = watchlistEntryInputSchema.parse(await request.json())
    const entry = await createWatchlistEntry(user.householdId, input)
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
