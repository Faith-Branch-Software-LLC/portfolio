import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { reorderPortfolioItems } from '@/lib/actions/admin/portfolio';

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.ids)) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  await reorderPortfolioItems(body.ids);
  return new NextResponse(null, { status: 204 });
});
