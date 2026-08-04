import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { bookSourceInputSchema, deleteBookSource, updateBookSource } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await getCurrentUser()
    const input = bookSourceInputSchema.parse(await request.json())
    const source = await updateBookSource(id, input)
    return NextResponse.json(source)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await getCurrentUser()
    await deleteBookSource(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
