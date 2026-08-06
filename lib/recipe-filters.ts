import { ALL_MEMBERS } from '@/lib/member-filters'

type FilterableRecipe = {
  title: string
  chefId: string
}

export function filterRecipes<T extends FilterableRecipe>(
  recipes: T[],
  { search, chefFilter }: { search: string; chefFilter: string }
): T[] {
  const query = search.trim().toLowerCase()

  return recipes.filter((recipe) => {
    if (query && !recipe.title.toLowerCase().includes(query)) return false
    if (chefFilter !== ALL_MEMBERS && recipe.chefId !== chefFilter) return false
    return true
  })
}
