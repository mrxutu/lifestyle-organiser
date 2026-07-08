import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getCurrentUser } from '@/lib/current-user'
import { errorResponse } from '@/lib/api-errors'

const MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    await getCurrentUser()

    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be under 8MB' }, { status: 400 })
    }

    const blob = await put(`recipes/${crypto.randomUUID()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    return errorResponse(error)
  }
}
