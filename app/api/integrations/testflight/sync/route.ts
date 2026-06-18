import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/actions/authOptions";
import { getIntegration } from '@/lib/actions/admin/integrations';
import { IntegrationType, KanbanColumn, ExternalSource } from '@prisma/client';
import { prisma } from '@/lib/db';
import { listFeedback, deleteFeedback } from '@/lib/utils/testflightApi';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cronSecret = req.headers.get('x-cron-secret');
  const validCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!session && !validCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const integration = await getIntegration(IntegrationType.TESTFLIGHT);
  if (!integration) {
    return NextResponse.json({ error: 'TestFlight not connected' }, { status: 404 });
  }

  const { issuerId, keyId, privateKey, appId, targetProjectId } = integration.config as {
    issuerId: string;
    keyId: string;
    privateKey: string;
    appId: string;
    targetProjectId: string;
  };

  let feedbackList;
  try {
    feedbackList = await listFeedback(issuerId, keyId, privateKey, appId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `TestFlight API error: ${msg}` }, { status: 502 });
  }

  try {
  const existingTasks = await prisma.task.findMany({
    where: { testflightFeedbackId: { not: null }, projectId: targetProjectId },
    select: { id: true, testflightFeedbackId: true },
  });
  const existingMap = new Map(existingTasks.map((t) => [t.testflightFeedbackId!, t.id]));

  let created = 0;
  let screenshotsRefreshed = 0;
  for (const fb of feedbackList) {
    const screenshotUrl = fb.attributes.screenshots?.[0]?.url ?? null;
    const existingTaskId = existingMap.get(fb.id);

    if (existingTaskId) {
      if (screenshotUrl) {
        await prisma.task.update({ where: { id: existingTaskId }, data: { screenshotUrl } });
        screenshotsRefreshed++;
      }
      continue;
    }

    const lines: string[] = [];
    if (fb.attributes.comment) lines.push(fb.attributes.comment);
    if (fb.attributes.deviceModel) lines.push(`Device: ${fb.attributes.deviceModel}`);
    if (fb.attributes.osVersion) lines.push(`OS: ${fb.attributes.osVersion}`);
    if (fb.attributes.email) lines.push(`From: ${fb.attributes.email}`);

    const lastTask = await prisma.task.findFirst({
      where: { projectId: targetProjectId, column: KanbanColumn.BACKLOG },
      orderBy: { order: 'desc' },
    });

    await prisma.task.create({
      data: {
        title: fb.attributes.comment
          ? fb.attributes.comment.slice(0, 100)
          : `TestFlight feedback ${new Date(fb.attributes.createdDate).toLocaleDateString()}`,
        description: lines.join('\n'),
        projectId: targetProjectId,
        column: KanbanColumn.BACKLOG,
        order: (lastTask?.order ?? -1) + 1,
        testflightFeedbackId: fb.id,
        screenshotUrl,
        externalSource: ExternalSource.TESTFLIGHT,
      },
    });
    created++;
  }

  const doneTasks = await prisma.task.findMany({
    where: {
      projectId: targetProjectId,
      column: KanbanColumn.DONE,
      testflightFeedbackId: { not: null },
    },
  });

  let deleted = 0;
  for (const task of doneTasks) {
    try {
      await deleteFeedback(issuerId, keyId, privateKey, task.testflightFeedbackId!);
      await prisma.task.update({
        where: { id: task.id },
        data: { testflightFeedbackId: null },
      });
      deleted++;
    } catch {}
  }

  await prisma.integration.update({
    where: { type: IntegrationType.TESTFLIGHT },
    data: { lastSyncedAt: new Date() },
  });

  return NextResponse.json({ ok: true, created, deleted, screenshotsRefreshed });
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
