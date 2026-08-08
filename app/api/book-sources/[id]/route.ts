import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { bookSourceInputSchema, deleteBookSource, updateBookSource } from '@/lib/books'
import { errorResponse } from '@/lib/api-errors'
import { lookupManagementHousehold, requireHouseholdSection } from '@/lib/lookup-authorisation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    await requireHouseholdSection(householdId, 'books')
    const input = bookSourceInputSchema.parse(await request.json())
    const source = await updateBookSource(householdId, id, input)
    if (!source) return NextResponse.json({ error: 'Book source not found' }, { status: 404 })
    return NextResponse.json(source)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const householdId = lookupManagementHousehold(user, request.nextUrl.searchParams.get('householdId'))
    await requireHouseholdSection(householdId, 'books')
    const deleted = await deleteBookSource(householdId, id)
    if (!deleted) return NextResponse.json({ error: 'Book source not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
