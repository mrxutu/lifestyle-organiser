import { RecipeCard } from '@/components/recipes/recipe-card'
import type { listRecipes } from '@/lib/recipes'

export function RecipeGrid({
  recipes,
}: {
  recipes: Awaited<ReturnType<typeof listRecipes>>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
