import { TodoPageContent } from '@/components/todos/todo-board'
import { Page } from '@/components/ui/page'
import { listHouseholdUsers, requireSection } from '@/lib/current-user'
import { listTodos } from '@/lib/todos'

export default async function TodoPage() {
  const { id: currentUserId, householdId } = await requireSection('todos')
  const [todos, householdUsers] = await Promise.all([
    listTodos(householdId),
    listHouseholdUsers(householdId),
  ])
  return <Page><TodoPageContent todos={todos} householdUsers={householdUsers} currentUserId={currentUserId} /></Page>
}
