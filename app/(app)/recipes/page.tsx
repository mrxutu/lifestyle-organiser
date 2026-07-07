import { ChefHat } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { RecipeGrid } from '@/components/recipes/recipe-grid'
import { getCurrentUser } from '@/lib/current-user'
import { listRecipes } from '@/lib/recipes'

export default async function RecipesPage() {
  const { householdId } = await getCurrentUser()
  const recipes = await listRecipes(householdId)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Recipes</h1>
      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No recipes yet"
          description="Saved recipes with ingredients and steps will appear here."
        />
      ) : (
        <RecipeGrid recipes={recipes} />
      )}
    </div>
  )
}
