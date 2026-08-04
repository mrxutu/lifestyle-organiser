import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import { EventTypeInUseError } from '@/lib/event-types'
import { InvalidAttendeesError } from '@/lib/events'
import { WatchlistSourceInUseError } from '@/lib/watchlist'
import { BookSourceInUseError } from '@/lib/books'
import { CannotDeleteSelfError, CannotDisableSelfError, LastAdminError, UserHasContentError } from '@/lib/admin-users'
import { HouseholdInUseError } from '@/lib/admin-households'
import { ForbiddenError } from '@/lib/current-user'

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  if (
    error instanceof CannotDeleteSelfError ||
    error instanceof CannotDisableSelfError ||
    error instanceof LastAdminError ||
    error instanceof InvalidAttendeesError
  ) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (
    error instanceof EventTypeInUseError ||
    error instanceof WatchlistSourceInUseError ||
    error instanceof BookSourceInUseError ||
    error instanceof UserHasContentError ||
    error instanceof HouseholdInUseError
  ) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  console.error(error)
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}
