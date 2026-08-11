import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { listProjects, createProject } from '@/lib/actions/admin/projects';
import { Priority, ProjectStatus } from '@prisma/client';

export const GET = withMobileAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId') ?? undefined;
  const archivedParam = searchParams.get('archived');
  const archived = archivedParam === null ? undefined : archivedParam === 'true';

  const projects = await listProjects({ clientId, archived });
  return NextResponse.json(projects);
});

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.clientId) {
    return NextResponse.json({ error: 'name and clientId required' }, { status: 400 });
  }

  const status = body.status && body.status.toUpperCase() in ProjectStatus ? (body.status.toUpperCase() as ProjectStatus) : undefined;
  const priority = body.priority && body.priority.toUpperCase() in Priority ? (body.priority.toUpperCase() as Priority) : undefined;

  const project = await createProject({
    name: body.name,
    clientId: body.clientId,
    status,
    priority,
    due: body.due ? new Date(body.due) : undefined,
    description: body.description,
  });
  return NextResponse.json(project, { status: 201 });
});
