import Link from 'next/link'
import { TodoContent } from '@/components/todos/todo-board'
import type { TodoWithOwners } from '@/lib/todos'

export function ProfileTodosSection({
  todos,
  householdUsers,
  currentUserId,
}: {
  todos: TodoWithOwners[]
  householdUsers: { id: string; name: string | null }[]
  currentUserId: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">To-dos</h2>
        <Link href="/todo" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
      </div>
      <TodoContent todos={todos} householdUsers={householdUsers} currentUserId={currentUserId} includeOwnerFilter={false} />
    </div>
  )
}
