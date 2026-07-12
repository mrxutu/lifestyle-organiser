import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { deleteWatchlistSource, updateWatchlistSource, watchlistSourceInputSchema } from '@/lib/watchlist'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await getCurrentUser()
    const input = watchlistSourceInputSchema.parse(await request.json())
    const source = await updateWatchlistSource(id, input)
    return NextResponse.json(source)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await getCurrentUser()
    await deleteWatchlistSource(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
