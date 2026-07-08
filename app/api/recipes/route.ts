import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/current-user'
import { createRecipe, recipeInputSchema } from '@/lib/recipes'
import { errorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const input = recipeInputSchema.parse(await request.json())
    const recipe = await createRecipe(user.householdId, user.id, input)
    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
