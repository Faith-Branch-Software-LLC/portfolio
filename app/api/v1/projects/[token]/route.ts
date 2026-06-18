import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { KanbanColumn } from '@prisma/client';

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

  const project = await prisma.project.findUnique({
    where: { apiToken: token },
    include: { client: { select: { name: true, color: true } }, tasks: true },
  });

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const counts = Object.fromEntries(
    Object.values(KanbanColumn).map((col) => [
      col,
      project.tasks.filter((t) => t.column === col).length,
    ]),
  );

  return NextResponse.json({
    id: project.id,
    name: project.name,
    status: project.status,
    priority: project.priority,
    due: project.due,
    client: project.client,
    taskCounts: counts,
  });
}
