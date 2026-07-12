import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { createWatchlistSource, watchlistSourceInputSchema } from '@/lib/watchlist'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    await getCurrentUser()
    const input = watchlistSourceInputSchema.parse(await request.json())
    const source = await createWatchlistSource(input)
    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
