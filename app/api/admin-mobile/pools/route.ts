import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getPools, createPool } from '@/lib/actions/admin/pools';
import { ChemicalType } from '@prisma/client';

export const GET = withMobileAuth(async () => {
  const pools = await getPools();
  return NextResponse.json(pools);
});

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.address) {
    return NextResponse.json({ error: 'name and address required' }, { status: 400 });
  }

  const chemicalType: ChemicalType = body.chemicalType && body.chemicalType.toUpperCase() in ChemicalType
    ? (body.chemicalType.toUpperCase() as ChemicalType)
    : ChemicalType.CHLORINE;

  const pool = await createPool({
    name: body.name,
    address: body.address,
    contactName: body.contactName,
    chemicalType,
    notes: body.notes,
  });
  return NextResponse.json(pool, { status: 201 });
});
