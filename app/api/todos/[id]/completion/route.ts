import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-errors'
import { requireApiSection } from '@/lib/current-user'
import { setTodoCompleted, todoCompletionInputSchema } from '@/lib/todos'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('todos')
    const { completed } = todoCompletionInputSchema.parse(await request.json())
    const todo = await setTodoCompleted(user.householdId, id, completed)
    if (!todo) return NextResponse.json({ error: 'To-do not found' }, { status: 404 })
    return NextResponse.json(todo)
  } catch (error) {
    return errorResponse(error)
  }
}
