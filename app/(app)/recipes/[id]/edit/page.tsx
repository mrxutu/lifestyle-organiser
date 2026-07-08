import { notFound } from 'next/navigation'
import { RecipeForm } from '@/components/recipes/recipe-form'
import { getCurrentUser } from '@/lib/current-user'
import { getRecipe } from '@/lib/recipes'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { householdId } = await getCurrentUser()
  const recipe = await getRecipe(householdId, id)

  if (!recipe) notFound()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit recipe</h1>
      <RecipeForm initialRecipe={recipe} />
    </div>
  )
}
