import Link from 'next/link'
import { ChefHat } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { listRecipes } from '@/lib/recipes'

export function RecipeCard({
  recipe,
}: {
  recipe: Awaited<ReturnType<typeof listRecipes>>[number]
}) {
  const meta = [
    recipe.servings && `${recipe.servings} servings`,
    recipe.prepMinutes && `${recipe.prepMinutes}m prep`,
    recipe.cookMinutes && `${recipe.cookMinutes}m cook`,
  ].filter(Boolean)

  return (
    <Link href={`/recipes/${recipe.id}`} className="block">
      <Card className="pt-0 transition-colors hover:bg-muted/50">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.imageUrl} alt={recipe.title} className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted">
            <ChefHat className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <CardContent className="flex flex-col gap-2">
          <p className="font-medium">{recipe.title}</p>
          {recipe.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
          )}
          {meta.length > 0 && <p className="text-xs text-muted-foreground">{meta.join(' · ')}</p>}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {recipe._count.ingredients} ingredient{recipe._count.ingredients === 1 ? '' : 's'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
