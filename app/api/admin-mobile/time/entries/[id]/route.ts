import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { updateTimeEntry, deleteTimeEntry } from '@/lib/actions/admin/time';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.minutes !== 'number') {
    return NextResponse.json({ error: 'minutes required' }, { status: 400 });
  }
  await updateTimeEntry(id, body.minutes);
  return new NextResponse(null, { status: 204 });
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await deleteTimeEntry(id);
  return new NextResponse(null, { status: 204 });
});
