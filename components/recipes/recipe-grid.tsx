'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { RecipeCard } from '@/components/recipes/recipe-card'
import type { listRecipes } from '@/lib/recipes'

export function RecipeGrid({
  recipes,
}: {
  recipes: Awaited<ReturnType<typeof listRecipes>>
}) {
  const [search, setSearch] = useState('')

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return recipes
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(query))
  }, [recipes, search])

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="search"
        placeholder="Search recipes by title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search recipes by title"
      />

      {filteredRecipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recipes match &ldquo;{search}&rdquo;.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
