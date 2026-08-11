import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getPoolHoursSummary } from '@/lib/actions/admin/pools';

export const GET = withMobileAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to query params required' }, { status: 400 });
  }

  const summary = await getPoolHoursSummary(new Date(from), new Date(to));
  return NextResponse.json(summary);
});
