import { notFound } from 'next/navigation'
import { RecipeForm } from '@/components/recipes/recipe-form'
import { Page } from '@/components/ui/page'
import { PageHeader } from '@/components/ui/page-header'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { getRecipe } from '@/lib/recipes'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { id: currentUserId, householdId } = await requireSection('recipes')
  const [recipe, householdUsers] = await Promise.all([
    getRecipe(householdId, id),
    listHouseholdUsers(householdId),
  ])

  if (!recipe) notFound()

  return (
    <Page>
      <PageHeader title="Edit recipe" />
      <RecipeForm
        initialRecipe={recipe}
        householdUsers={householdUsers}
        currentUserId={currentUserId}
      />
    </Page>
  )
}
