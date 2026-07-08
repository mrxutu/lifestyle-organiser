import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { deleteRecipe, recipeInputSchema, updateRecipe } from '@/lib/recipes'
import { errorResponse } from '@/lib/api-errors'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const input = recipeInputSchema.parse(await request.json())
    const recipe = await updateRecipe(user.householdId, id, input)
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    return NextResponse.json(recipe)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const deleted = await deleteRecipe(user.householdId, id)
    if (!deleted) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
