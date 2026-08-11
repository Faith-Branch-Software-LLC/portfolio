import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { clockIn } from '@/lib/actions/admin/time';

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

  const timer = await clockIn(body.taskId);
  return NextResponse.json(timer, { status: 201 });
});
