import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { KanbanColumn, Priority } from '@prisma/client';

function bearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

async function resolveProject(token: string) {
  return prisma.project.findUnique({ where: { apiToken: token } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; taskId: string }> },
) {
  const { token, taskId } = await params;
  const bearer = bearerToken(req);
  if (!bearer || bearer !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await resolveProject(token);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.projectId !== project.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.due !== undefined) updates.due = body.due ? new Date(body.due) : null;
  if (body.priority !== undefined) {
    updates.priority =
      body.priority && body.priority.toUpperCase() in Priority
        ? body.priority.toUpperCase()
        : null;
  }
  if (body.column !== undefined) {
    const col = body.column.toUpperCase();
    if (col in KanbanColumn) {
      updates.column = col as KanbanColumn;
      if (col === KanbanColumn.DONE && task.column !== KanbanColumn.DONE) {
        updates.completedAt = new Date();
      } else if (col !== KanbanColumn.DONE && task.column === KanbanColumn.DONE) {
        updates.completedAt = null;
      }
    }
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data: updates });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    column: updated.column,
    priority: updated.priority,
    due: updated.due,
    completedAt: updated.completedAt,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; taskId: string }> },
) {
  const { token, taskId } = await params;
  const bearer = bearerToken(req);
  if (!bearer || bearer !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await resolveProject(token);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.projectId !== project.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.task.delete({ where: { id: taskId } });
  return new NextResponse(null, { status: 204 });
}
