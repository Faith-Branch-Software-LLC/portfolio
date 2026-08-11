import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getPool, updatePool, deletePool } from '@/lib/actions/admin/pools';
import { ChemicalType } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const pool = await getPool(id);
  if (!pool) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(pool);
});

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const chemicalType: ChemicalType | undefined = body.chemicalType && body.chemicalType.toUpperCase() in ChemicalType
    ? (body.chemicalType.toUpperCase() as ChemicalType)
    : undefined;

  const pool = await updatePool(id, {
    name: body.name,
    address: body.address,
    contactName: body.contactName,
    chemicalType,
    notes: body.notes,
  });
  return NextResponse.json(pool);
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await deletePool(id);
  return new NextResponse(null, { status: 204 });
});
