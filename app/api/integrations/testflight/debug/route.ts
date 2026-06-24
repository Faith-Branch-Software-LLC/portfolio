import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { getIntegration } from '@/lib/actions/admin/integrations';
import { IntegrationType } from '@prisma/client';
import { probeFeedbackPath } from '@/lib/utils/testflightApi';
import { decryptConfig } from '@/lib/utils/encryption';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integration = await getIntegration(IntegrationType.TESTFLIGHT);
  if (!integration) return NextResponse.json({ error: 'Not connected' }, { status: 404 });

  const { issuerId, keyId, privateKey, appId } = decryptConfig<{ issuerId: string; keyId: string; privateKey: string; appId: string }>(integration.config);

  const results = await probeFeedbackPath(issuerId, keyId, privateKey, appId);
  return NextResponse.json(results);
}
