import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { bookSourceInputSchema, createBookSource } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    await getCurrentUser()
    const input = bookSourceInputSchema.parse(await request.json())
    const source = await createBookSource(input)
    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
