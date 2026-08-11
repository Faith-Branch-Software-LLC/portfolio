import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { moveTask } from '@/lib/actions/admin/tasks';
import { prisma } from '@/lib/db';
import { KanbanColumn } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.newColumn || !Array.isArray(body?.orderedIds)) {
    return NextResponse.json({ error: 'newColumn and orderedIds required' }, { status: 400 });
  }
  const newColumn = body.newColumn.toUpperCase();
  if (!(newColumn in KanbanColumn)) {
    return NextResponse.json({ error: 'invalid newColumn' }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await moveTask(id, task.projectId, newColumn as KanbanColumn, body.orderedIds);
  return new NextResponse(null, { status: 204 });
});
