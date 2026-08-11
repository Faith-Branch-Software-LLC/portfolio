import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { unarchiveProject } from '@/lib/actions/admin/projects';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await unarchiveProject(id);
  return new NextResponse(null, { status: 204 });
});
