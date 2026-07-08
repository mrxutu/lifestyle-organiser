import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import { EventTypeInUseError } from '@/lib/event-types'

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  if (error instanceof EventTypeInUseError) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  console.error(error)
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}
