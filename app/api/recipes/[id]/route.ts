import { NextRequest, NextResponse } from 'next/server'
import { requireApiSection } from '@/lib/current-user'
import { deleteRecipe, getRecipe, recipeInputSchema, updateRecipe } from '@/lib/recipes'
import { errorResponse } from '@/lib/api-errors'
import { parseImageChange, parseJsonFormField } from '@/lib/image-form'
import { deleteWithImage, updateWithImage } from '@/lib/image-mutations'
import { imageServices } from '@/lib/image-storage'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('recipes')
    const existing = await getRecipe(user.householdId, id)
    if (!existing) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    const form = await request.formData()
    const input = parseJsonFormField(form, recipeInputSchema)
    const recipe = await updateWithImage({
      feature: 'recipes',
      oldUrl: existing.imageUrl,
      change: parseImageChange(form),
      update: (imageUrl) => updateRecipe(user.householdId, id, input, imageUrl),
      services: imageServices,
    })
    if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    return NextResponse.json(recipe)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('recipes')
    const existing = await getRecipe(user.householdId, id)
    if (!existing) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    const deleted = await deleteWithImage({
      feature: 'recipes',
      oldUrl: existing.imageUrl,
      remove: () => deleteRecipe(user.householdId, id),
      services: imageServices,
    })
    if (!deleted) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
