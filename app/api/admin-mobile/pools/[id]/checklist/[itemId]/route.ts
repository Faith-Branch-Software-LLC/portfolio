import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { updateChecklistItem, deleteChecklistItem } from '@/lib/actions/admin/pools';

type Ctx = { params: Promise<{ id: string; itemId: string }> };

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id, itemId } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.label) return NextResponse.json({ error: 'label required' }, { status: 400 });

  const item = await updateChecklistItem(itemId, id, body.label);
  return NextResponse.json(item);
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id, itemId } = await params;
  await deleteChecklistItem(itemId, id);
  return new NextResponse(null, { status: 204 });
});
