import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { createWatchlistSource, watchlistSourceInputSchema } from '@/lib/watchlist'
import { errorResponse } from '@/lib/api-errors'
import { lookupManagementHousehold } from '@/lib/lookup-authorisation'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    const input = watchlistSourceInputSchema.parse(await request.json())
    const source = await createWatchlistSource(householdId, input)
    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
