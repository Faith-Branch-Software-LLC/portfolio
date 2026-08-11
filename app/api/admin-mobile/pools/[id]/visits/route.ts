import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { createVisit } from '@/lib/actions/admin/pools';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.date || typeof body?.minutes !== 'number') {
    return NextResponse.json({ error: 'date and minutes required' }, { status: 400 });
  }

  try {
    const visit = await createVisit({
      poolId: id,
      date: new Date(body.date),
      minutes: body.minutes,
      notes: body.notes,
      chemicals: Array.isArray(body.chemicals) ? body.chemicals : [],
      checkedItemIds: Array.isArray(body.checkedItemIds) ? body.checkedItemIds : [],
    });
    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create visit';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
