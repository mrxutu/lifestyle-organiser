import { RecipeForm } from '@/components/recipes/recipe-form'
import { requireSection } from '@/lib/current-user'

export default async function NewRecipePage() {
  await requireSection('recipes')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add recipe</h1>
      <RecipeForm />
    </div>
  )
}
