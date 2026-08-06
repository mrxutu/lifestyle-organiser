'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RecipeCard } from '@/components/recipes/recipe-card'
import type { listRecipes } from '@/lib/recipes'
import { ALL_MEMBERS, memberFilterLabel } from '@/lib/member-filters'
import { filterRecipes } from '@/lib/recipe-filters'

export function RecipeGrid({
  recipes,
  householdUsers,
  currentUserId,
}: {
  recipes: Awaited<ReturnType<typeof listRecipes>>
  householdUsers?: { id: string; name: string | null }[]
  currentUserId?: string
}) {
  const [search, setSearch] = useState('')
  const [chefFilter, setChefFilter] = useState(ALL_MEMBERS)

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, { search, chefFilter }),
    [recipes, search, chefFilter]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          placeholder="Search recipes by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search recipes by title"
          className="sm:flex-1"
        />
        {householdUsers && currentUserId && (
          <Select value={chefFilter} onValueChange={setChefFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by chef">
              <SelectValue placeholder="All chefs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MEMBERS}>All chefs</SelectItem>
              {householdUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {memberFilterLabel(user, currentUserId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filteredRecipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recipes match the current filters.</p>
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
