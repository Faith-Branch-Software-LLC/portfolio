import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/actions/authOptions";
import { saveBasecampIntegration, deleteIntegration } from '@/lib/actions/admin/integrations';
import { IntegrationType } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token, accountId } = await req.json();
  if (!token || !accountId) {
    return NextResponse.json({ error: 'token and accountId required' }, { status: 400 });
  }

  await saveBasecampIntegration(token, accountId);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteIntegration(IntegrationType.BASECAMP);
  return NextResponse.json({ ok: true });
}
