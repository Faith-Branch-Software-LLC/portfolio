import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { updateVisit, deleteVisit } from '@/lib/actions/admin/pools';
import { prisma } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

async function requirePoolId(visitId: string): Promise<string | null> {
  const visit = await prisma.poolVisit.findUnique({ where: { id: visitId }, select: { poolId: true } });
  return visit?.poolId ?? null;
}

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const poolId = await requirePoolId(id);
  if (!poolId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body?.date || typeof body?.minutes !== 'number') {
    return NextResponse.json({ error: 'date and minutes required' }, { status: 400 });
  }

  try {
    const visit = await updateVisit(id, {
      poolId,
      date: new Date(body.date),
      minutes: body.minutes,
      notes: body.notes,
      saltReading: body.saltReading,
      phReading: body.phReading,
      chlorineReading: body.chlorineReading,
      chemicals: Array.isArray(body.chemicals) ? body.chemicals : [],
      checkedItemIds: Array.isArray(body.checkedItemIds) ? body.checkedItemIds : [],
    });
    return NextResponse.json(visit);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update visit';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const poolId = await requirePoolId(id);
  if (!poolId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteVisit(id, poolId);
  return new NextResponse(null, { status: 204 });
});
