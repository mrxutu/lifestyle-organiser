import { RecipeForm } from '@/components/recipes/recipe-form'

export default function NewRecipePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add recipe</h1>
      <RecipeForm />
    </div>
  )
}
