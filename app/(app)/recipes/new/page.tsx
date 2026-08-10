import { RecipeForm } from '@/components/recipes/recipe-form'
import { Page } from '@/components/ui/page'
import { PageHeader } from '@/components/ui/page-header'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'

export default async function NewRecipePage() {
  const { id: currentUserId, householdId } = await requireSection('recipes')
  const householdUsers = await listHouseholdUsers(householdId)

  return (
    <Page>
      <PageHeader title="Add recipe" />
      <RecipeForm householdUsers={householdUsers} currentUserId={currentUserId} />
    </Page>
  )
}
