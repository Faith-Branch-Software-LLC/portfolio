import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { closePool } from '@/lib/actions/admin/pools';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await closePool(id);
  return new NextResponse(null, { status: 204 });
});
