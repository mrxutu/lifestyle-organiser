import { NextRequest, NextResponse } from 'next/server'
import { requireApiSection } from '@/lib/current-user'
import { bookInputSchema, createBook } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'
import { parseCreateImage, parseJsonFormField } from '@/lib/image-form'
import { createWithImage } from '@/lib/image-mutations'
import { imageServices } from '@/lib/image-storage'

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSection('books')
    const form = await request.formData()
    const input = parseJsonFormField(form, bookInputSchema)
    const book = await createWithImage({
      feature: 'books',
      file: parseCreateImage(form),
      create: (imageUrl) => createBook(user.householdId, input, imageUrl),
      services: imageServices,
    })
    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
