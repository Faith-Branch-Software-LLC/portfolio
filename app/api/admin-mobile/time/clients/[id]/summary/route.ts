import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getClientTimeRangeSummary } from '@/lib/actions/admin/time';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withMobileAuth<Ctx>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const projectId = searchParams.get('projectId') ?? undefined;

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to query params required' }, { status: 400 });
  }

  const summary = await getClientTimeRangeSummary(id, new Date(from), new Date(to), projectId);
  return NextResponse.json(summary);
});
