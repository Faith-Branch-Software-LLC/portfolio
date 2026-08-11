import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { markBasecampCommentsSeen } from '@/lib/actions/admin/tasks';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await markBasecampCommentsSeen(id);
  return new NextResponse(null, { status: 204 });
});
