import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getClientProjects } from '@/lib/actions/admin/time';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const projects = await getClientProjects(id);
  return NextResponse.json(projects);
});
