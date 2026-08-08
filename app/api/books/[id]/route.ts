import { NextRequest, NextResponse } from 'next/server'
import { requireApiSection } from '@/lib/current-user'
import { bookInputSchema, deleteBook, updateBook } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('books')
    const input = bookInputSchema.parse(await request.json())
    const book = await updateBook(user.householdId, id, input)
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    return NextResponse.json(book)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('books')
    const deleted = await deleteBook(user.householdId, id)
    if (!deleted) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
