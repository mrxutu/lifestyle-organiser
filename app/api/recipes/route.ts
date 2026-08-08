import { NextRequest, NextResponse } from 'next/server'
import { requireApiSection } from '@/lib/current-user'
import { createRecipe, recipeInputSchema } from '@/lib/recipes'
import { errorResponse } from '@/lib/api-errors'
import { parseCreateImage, parseJsonFormField } from '@/lib/image-form'
import { createWithImage } from '@/lib/image-mutations'
import { imageServices } from '@/lib/image-storage'

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSection('recipes')
    const form = await request.formData()
    const input = parseJsonFormField(form, recipeInputSchema)
    const recipe = await createWithImage({
      feature: 'recipes',
      file: parseCreateImage(form),
      create: (imageUrl) => createRecipe(user.householdId, user.id, input, imageUrl),
      services: imageServices,
    })
    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
