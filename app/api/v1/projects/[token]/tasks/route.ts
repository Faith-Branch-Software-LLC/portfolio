import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { KanbanColumn, Priority } from '@prisma/client';

function bearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bearer = bearerToken(req);
  if (!bearer || bearer !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({ where: { apiToken: token } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const columnParam = searchParams.get('column')?.toUpperCase();
  const column = columnParam && columnParam in KanbanColumn ? (columnParam as KanbanColumn) : undefined;

  const tasks = await prisma.task.findMany({
    where: { projectId: project.id, ...(column ? { column } : {}) },
    include: { tags: { include: { tag: true } } },
    orderBy: [{ column: 'asc' }, { order: 'asc' }],
  });

  return NextResponse.json(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      column: t.column,
      priority: t.priority,
      due: t.due,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
      tags: t.tags.map((tt) => tt.tag),
    })),
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bearer = bearerToken(req);
  if (!bearer || bearer !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({ where: { apiToken: token } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { title, description, priority, due, column } = body;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const colVal: KanbanColumn = column && column.toUpperCase() in KanbanColumn
    ? (column.toUpperCase() as KanbanColumn)
    : KanbanColumn.BACKLOG;

  const priorityVal: Priority | undefined =
    priority && priority.toUpperCase() in Priority ? (priority.toUpperCase() as Priority) : undefined;

  const lastTask = await prisma.task.findFirst({
    where: { projectId: project.id, column: colVal },
    orderBy: { order: 'desc' },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? undefined,
      priority: priorityVal,
      due: due ? new Date(due) : undefined,
      projectId: project.id,
      column: colVal,
      order: (lastTask?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(
    {
      id: task.id,
      title: task.title,
      column: task.column,
      priority: task.priority,
      createdAt: task.createdAt,
    },
    { status: 201 },
  );
}
