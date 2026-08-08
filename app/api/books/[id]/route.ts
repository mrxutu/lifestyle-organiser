import { NextRequest, NextResponse } from 'next/server'
import { requireApiSection } from '@/lib/current-user'
import { bookInputSchema, deleteBook, getBook, updateBook } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'
import { parseImageChange, parseJsonFormField } from '@/lib/image-form'
import { deleteWithImage, updateWithImage } from '@/lib/image-mutations'
import { imageServices } from '@/lib/image-storage'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('books')
    const existing = await getBook(user.householdId, id)
    if (!existing) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    const form = await request.formData()
    const input = parseJsonFormField(form, bookInputSchema)
    const book = await updateWithImage({
      feature: 'books',
      oldUrl: existing.imageUrl,
      change: parseImageChange(form),
      update: (imageUrl) => updateBook(user.householdId, id, input, imageUrl),
      services: imageServices,
    })
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
    const existing = await getBook(user.householdId, id)
    if (!existing) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    const deleted = await deleteWithImage({
      feature: 'books',
      oldUrl: existing.imageUrl,
      remove: () => deleteBook(user.householdId, id),
      services: imageServices,
    })
    if (!deleted) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
