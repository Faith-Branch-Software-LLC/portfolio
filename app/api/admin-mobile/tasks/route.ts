import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { createTask } from '@/lib/actions/admin/tasks';
import { KanbanColumn, Priority } from '@prisma/client';

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.projectId) {
    return NextResponse.json({ error: 'title and projectId required' }, { status: 400 });
  }

  const column = body.column && body.column.toUpperCase() in KanbanColumn ? (body.column.toUpperCase() as KanbanColumn) : undefined;
  const priority = body.priority && body.priority.toUpperCase() in Priority ? (body.priority.toUpperCase() as Priority) : undefined;

  const task = await createTask({
    title: body.title,
    projectId: body.projectId,
    column,
    description: body.description,
    priority,
    due: body.due ? new Date(body.due) : undefined,
  });
  return NextResponse.json(task, { status: 201 });
});
