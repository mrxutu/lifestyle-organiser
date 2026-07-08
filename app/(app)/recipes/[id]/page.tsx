import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChefHat, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MethodView } from '@/components/recipes/method-view'
import { getCurrentUser } from '@/lib/current-user'
import { getRecipe } from '@/lib/recipes'
import { formatIngredientLine } from '@/lib/measurement-units'

export default async function RecipeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { householdId } = await getCurrentUser()
  const recipe = await getRecipe(householdId, id)

  if (!recipe) notFound()

  const meta = [
    recipe.servings && `${recipe.servings} servings`,
    recipe.prepMinutes && `${recipe.prepMinutes}m prep`,
    recipe.cookMinutes && `${recipe.cookMinutes}m cook`,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{recipe.title}</h1>
        <Button asChild size="sm" variant="outline">
          <Link href={`/recipes/${recipe.id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      </div>

      {recipe.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="aspect-video w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted">
          <ChefHat className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      {recipe.description && <p className="text-muted-foreground">{recipe.description}</p>}

      {meta.length > 0 && <p className="text-sm text-muted-foreground">{meta.join(' · ')}</p>}

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Ingredients</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id}>{formatIngredientLine(ingredient)}</li>
            ))}
          </ul>
        </div>
      )}

      {recipe.method && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Method</h2>
          <MethodView method={recipe.method} />
        </div>
      )}
    </div>
  )
}
