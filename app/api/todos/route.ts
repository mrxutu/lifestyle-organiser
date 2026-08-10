import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-errors'
import { requireApiSection } from '@/lib/current-user'
import { createTodo, todoInputSchema } from '@/lib/todos'

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiSection('todos')
    const input = todoInputSchema.parse(await request.json())
    return NextResponse.json(await createTodo(user.householdId, input), { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
