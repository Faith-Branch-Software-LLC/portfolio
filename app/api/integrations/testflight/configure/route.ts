import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/actions/authOptions";
import { createTestFlightIntegration, deleteIntegration } from '@/lib/actions/admin/integrations';
import { IntegrationType } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, issuerId, keyId, privateKey, appId, targetProjectId } = await req.json();
  if (!issuerId || !keyId || !privateKey || !appId || !targetProjectId) {
    return NextResponse.json(
      { error: 'issuerId, keyId, privateKey, appId, targetProjectId required' },
      { status: 400 },
    );
  }

  await createTestFlightIntegration(name || `App ${appId}`, issuerId, keyId, privateKey, appId, targetProjectId);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteIntegration(IntegrationType.TESTFLIGHT);
  return NextResponse.json({ ok: true });
}
