import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { updateTask, deleteTask } from '@/lib/actions/admin/tasks';
import { prisma } from '@/lib/db';
import { Priority } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

async function requireProjectId(taskId: string): Promise<string | null> {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  return task?.projectId ?? null;
}

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const projectId = await requireProjectId(id);
  if (!projectId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const priority = body.priority === null
    ? null
    : body.priority && body.priority.toUpperCase() in Priority
      ? (body.priority.toUpperCase() as Priority)
      : undefined;

  const task = await updateTask(id, projectId, {
    title: body.title,
    description: body.description,
    priority,
    due: body.due === null ? null : body.due ? new Date(body.due) : undefined,
  });
  return NextResponse.json(task);
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const projectId = await requireProjectId(id);
  if (!projectId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteTask(id, projectId);
  return new NextResponse(null, { status: 204 });
});
