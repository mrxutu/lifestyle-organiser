import { NextRequest, NextResponse } from 'next/server'
import { requireApiSection } from '@/lib/current-user'
import { bookInputSchema, createBook } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSection('books')
    const input = bookInputSchema.parse(await request.json())
    const book = await createBook(user.householdId, input)
    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
