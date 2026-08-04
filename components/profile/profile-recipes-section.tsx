import Link from 'next/link'
import { ChefHat } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { RecipeGrid } from '@/components/recipes/recipe-grid'
import type { listRecipes } from '@/lib/recipes'

export function ProfileRecipesSection({
  recipes,
}: {
  recipes: Awaited<ReturnType<typeof listRecipes>>
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Recipes</h2>
        <Link href="/recipes" className="text-sm text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No recipes yet"
          description="Recipes you've added will appear here."
        />
      ) : (
        <RecipeGrid recipes={recipes} />
      )}
    </div>
  )
}
