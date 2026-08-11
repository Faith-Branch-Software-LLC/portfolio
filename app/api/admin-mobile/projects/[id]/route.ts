import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getProject, updateProject, deleteProject } from '@/lib/actions/admin/projects';
import { Priority, ProjectStatus } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
});

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const status = body.status && body.status.toUpperCase() in ProjectStatus ? (body.status.toUpperCase() as ProjectStatus) : undefined;
  const priority = body.priority && body.priority.toUpperCase() in Priority ? (body.priority.toUpperCase() as Priority) : undefined;

  const project = await updateProject(id, {
    name: body.name,
    clientId: body.clientId,
    status,
    priority,
    due: body.due === null ? null : body.due ? new Date(body.due) : undefined,
    description: body.description,
  });
  return NextResponse.json(project);
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await deleteProject(id);
  return new NextResponse(null, { status: 204 });
});
