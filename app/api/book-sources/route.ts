import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { bookSourceInputSchema, createBookSource } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'
import { lookupManagementHousehold, requireHouseholdSection } from '@/lib/lookup-authorisation'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    await requireHouseholdSection(householdId, 'books')
    const input = bookSourceInputSchema.parse(await request.json())
    const source = await createBookSource(householdId, input)
    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
