import { RecipeForm } from '@/components/recipes/recipe-form'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'

export default async function NewRecipePage() {
  const { id: currentUserId, householdId } = await requireSection('recipes')
  const householdUsers = await listHouseholdUsers(householdId)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add recipe</h1>
      <RecipeForm householdUsers={householdUsers} currentUserId={currentUserId} />
    </div>
  )
}
