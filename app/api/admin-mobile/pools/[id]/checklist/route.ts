import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { createChecklistItem } from '@/lib/actions/admin/pools';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.label) return NextResponse.json({ error: 'label required' }, { status: 400 });

  const item = await createChecklistItem(id, body.label);
  return NextResponse.json(item, { status: 201 });
});
