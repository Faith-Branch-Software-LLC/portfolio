import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { listClients, createClient } from '@/lib/actions/admin/clients';

export const GET = withMobileAuth(async () => {
  const clients = await listClients();
  return NextResponse.json(clients);
});

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const client = await createClient({ name: body.name, color: body.color });
  return NextResponse.json(client, { status: 201 });
});
