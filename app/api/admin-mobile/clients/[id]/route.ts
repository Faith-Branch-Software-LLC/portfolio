import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { updateClient, deleteClient } from '@/lib/actions/admin/clients';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const client = await updateClient(id, { name: body.name, color: body.color });
  return NextResponse.json(client);
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await deleteClient(id);
  return new NextResponse(null, { status: 204 });
});
