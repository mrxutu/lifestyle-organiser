import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-errors'
import { requireApiSection } from '@/lib/current-user'
import { deleteTodo, todoInputSchema, updateTodo } from '@/lib/todos'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('todos')
    const todo = await updateTodo(user.householdId, id, todoInputSchema.parse(await request.json()))
    if (!todo) return NextResponse.json({ error: 'To-do not found' }, { status: 404 })
    return NextResponse.json(todo)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireApiSection('todos')
    if (!(await deleteTodo(user.householdId, id))) return NextResponse.json({ error: 'To-do not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
