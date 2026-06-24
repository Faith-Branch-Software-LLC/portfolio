import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { deleteIntegrationById, getIntegration, updateIntegrationLastSync } from '@/lib/actions/admin/integrations';
import { IntegrationType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { listFeedback, deleteFeedback } from '@/lib/utils/testflightApi';
import { KanbanColumn, ExternalSource } from '@prisma/client';
import { decryptConfig } from '@/lib/utils/encryption';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteIntegrationById(id);
  return NextResponse.json({ ok: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const cronSecret = req.headers.get('x-cron-secret');
  const validCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  if (!session && !validCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  if (!integration || integration.type !== IntegrationType.TESTFLIGHT) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  const { issuerId, keyId, privateKey, appId, targetProjectId } = decryptConfig<{ issuerId: string; keyId: string; privateKey: string; appId: string; targetProjectId: string }>(integration.config);

  const project = await prisma.project.findUnique({ where: { id: targetProjectId } });
  if (!project) return NextResponse.json({ error: 'Target project not found' }, { status: 404 });

  const feedbackItems = await listFeedback(issuerId, keyId, privateKey, appId);
  const existing = await prisma.task.findMany({
    where: { projectId: targetProjectId, externalSource: ExternalSource.TESTFLIGHT },
    select: { id: true, testflightFeedbackId: true, column: true },
  });
  const existingMap = new Map(existing.map((t) => [t.testflightFeedbackId, t]));
  const feedbackIds = new Set(feedbackItems.map((f: { id: string }) => f.id));

  let created = 0;
  for (const f of feedbackItems as Array<{ id: string; attributes: { comment?: string; timestamp?: string } }>) {
    if (existingMap.has(f.id)) continue;
    await prisma.task.create({
      data: {
        title: (f.attributes.comment ?? '').slice(0, 120) || `Feedback ${f.id}`,
        projectId: targetProjectId,
        column: KanbanColumn.BACKLOG,
        order: 0,
        externalSource: ExternalSource.TESTFLIGHT,
        testflightFeedbackId: f.id,
      },
    });
    created++;
  }

  // Delete tasks whose feedback was removed
  let deleted = 0;
  for (const task of existing) {
    if (task.testflightFeedbackId && !feedbackIds.has(task.testflightFeedbackId) && task.column === KanbanColumn.DONE) {
      await deleteFeedback(issuerId, keyId, privateKey, task.testflightFeedbackId);
      await prisma.task.delete({ where: { id: task.id } });
      deleted++;
    }
  }

  await updateIntegrationLastSync(id);
  return NextResponse.json({ ok: true, created, deleted });
}

// GET = debug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const integration = await prisma.integration.findUnique({ where: { id } });
  if (!integration || integration.type !== IntegrationType.TESTFLIGHT) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  const { issuerId, keyId, privateKey, appId } = decryptConfig<{ issuerId: string; keyId: string; privateKey: string; appId: string }>(integration.config);

  const { probeFeedbackPath } = await import('@/lib/utils/testflightApi');
  const results = await probeFeedbackPath(issuerId, keyId, privateKey, appId);
  return NextResponse.json(results);
}
