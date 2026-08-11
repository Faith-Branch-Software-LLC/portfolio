import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { clockOut } from '@/lib/actions/admin/time';

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.timerId) return NextResponse.json({ error: 'timerId required' }, { status: 400 });

  await clockOut(body.timerId);
  return new NextResponse(null, { status: 204 });
});
