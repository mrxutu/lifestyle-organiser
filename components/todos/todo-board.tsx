'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListTodo, Pencil } from 'lucide-react'
import type { TodoPriority } from '@/generated/prisma/enums'
import type { TodoWithOwners } from '@/lib/todos'
import {
  TODO_PRIORITY_ALL,
  TODO_STATUS_ALL,
  TODO_STATUS_COMPLETED,
  TODO_STATUS_NOT_COMPLETED,
  filterAndOrderTodos,
  type TodoStatusFilter,
} from '@/lib/todo-filters'
import { ALL_MEMBERS, memberFilterLabel } from '@/lib/member-filters'
import { formatFriendlyDate } from '@/lib/format-datetime'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/empty-state'
import { ResponsiveDialog } from '@/components/responsive-dialog'
import { TodoForm } from '@/components/todos/todo-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const priorityLabels: Record<TodoPriority, string> = { HIGH: 'High', NORMAL: 'Normal', LOW: 'Low' }
const priorityVariants: Record<TodoPriority, 'destructive' | 'secondary' | 'outline'> = {
  HIGH: 'destructive',
  NORMAL: 'secondary',
  LOW: 'outline',
}

type BoardState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; todo: TodoWithOwners }

type TodoBoardProps = {
  todos: TodoWithOwners[]
  householdUsers: { id: string; name: string | null }[]
  currentUserId: string
  includeOwnerFilter: boolean
}

export function TodoContent({ todos, householdUsers, currentUserId, includeOwnerFilter }: TodoBoardProps) {
  const router = useRouter()
  const [state, setState] = useState<BoardState>({ mode: 'closed' })
  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>(TODO_STATUS_NOT_COMPLETED)
  const [priorityFilter, setPriorityFilter] = useState(TODO_PRIORITY_ALL)
  const [ownerFilter, setOwnerFilter] = useState(includeOwnerFilter ? currentUserId : ALL_MEMBERS)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const filteredTodos = useMemo(
    () => filterAndOrderTodos(todos, { statusFilter, priorityFilter, ownerFilter }),
    [todos, statusFilter, priorityFilter, ownerFilter]
  )

  function close() { setState({ mode: 'closed' }) }
  function handleSuccess() { close(); router.refresh() }

  async function toggleCompleted(todo: TodoWithOwners) {
    setTogglingId(todo.id)
    setToggleError(null)
    const response = await fetch(`/api/todos/${todo.id}/completion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    })
    setTogglingId(null)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setToggleError(data?.error ?? 'Could not update the to-do')
      return
    }
    router.refresh()
  }

  const formOpen = state.mode === 'create' || state.mode === 'edit'

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TodoStatusFilter)}>
            <SelectTrigger className="w-[170px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODO_STATUS_NOT_COMPLETED}>Not completed</SelectItem>
              <SelectItem value={TODO_STATUS_COMPLETED}>Completed</SelectItem>
              <SelectItem value={TODO_STATUS_ALL}>All statuses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODO_PRIORITY_ALL}>All priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
          {includeOwnerFilter && (
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-[170px]" aria-label="Filter by owner"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MEMBERS}>All owners</SelectItem>
                {householdUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>{memberFilterLabel(user, currentUserId)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {toggleError && <p className="text-sm text-destructive">{toggleError}</p>}

        {todos.length === 0 && (
          <EmptyState icon={ListTodo} title="No to-dos yet" description="Tasks that do not need a date or time will appear here." />
        )}
        {todos.length > 0 && filteredTodos.length === 0 && (
          <p className="text-sm text-muted-foreground">No to-dos match the selected filters.</p>
        )}
        {filteredTodos.length > 0 && (
          <div className="flex flex-col gap-3">
            {filteredTodos.map((todo) => (
              <Card key={todo.id}>
                <CardContent className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    checked={todo.completed}
                    disabled={togglingId === todo.id}
                    onCheckedChange={() => toggleCompleted(todo)}
                    aria-label={`${todo.completed ? 'Reopen' : 'Complete'} ${todo.title}`}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className={cn('font-medium', todo.completed && 'text-muted-foreground line-through')}>{todo.title}</p>
                      <Badge variant={priorityVariants[todo.priority]}>{priorityLabels[todo.priority]}</Badge>
                    </div>
                    {todo.description && <p className="line-clamp-2 text-sm text-muted-foreground">{todo.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Owners: {todo.owners.map((owner) => owner.user.id === currentUserId ? 'Me' : (owner.user.name ?? 'Unnamed household member')).join(', ')}</span>
                      <time dateTime={todo.createdAt.toISOString()}>Created {formatFriendlyDate(todo.createdAt)}</time>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setState({ mode: 'edit', todo })} aria-label={`Edit ${todo.title}`}>
                    <Pencil className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ResponsiveDialog open={formOpen} onOpenChange={(open) => !open && close()} title={state.mode === 'edit' ? 'Edit to-do' : 'Add to-do'}>
        <TodoForm
          initialTodo={state.mode === 'edit' ? state.todo : null}
          householdUsers={householdUsers}
          currentUserId={currentUserId}
          onSuccess={handleSuccess}
          onCancel={close}
        />
      </ResponsiveDialog>
    </>
  )
}

export function TodoPageContent(props: Omit<TodoBoardProps, 'includeOwnerFilter'>) {
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  return (
    <>
      <PageHeader title="To-do" actions={<Button type="button" size="sm" onClick={() => setCreating(true)}>Add to-do</Button>} />
      <TodoContent {...props} includeOwnerFilter />
      <ResponsiveDialog open={creating} onOpenChange={setCreating} title="Add to-do">
        <TodoForm {...props} onSuccess={() => { setCreating(false); router.refresh() }} onCancel={() => setCreating(false)} />
      </ResponsiveDialog>
    </>
  )
}
