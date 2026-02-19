'use server';

import { prisma } from '../../db';
import { ProgressReport } from '@prisma/client';

export type AutoSummaryProject = {
  id: string;
  name: string;
  newTasks: string[];    // created during period
  inProgress: string[];  // final move ended in IN_PROGRESS
  waiting: string[];     // final move ended in WAITING
  done: string[];        // final move ended in DONE
};

export type AutoSummary = {
  since: string;
  projects: AutoSummaryProject[];
};

export async function getAutoSummary(clientId: string): Promise<AutoSummary> {
  const lastReport = await prisma.progressReport.findFirst({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });

  const projects = await prisma.project.findMany({
    where: { clientId },
    select: { id: true, name: true, createdAt: true },
  });

  if (projects.length === 0) {
    const since = lastReport?.createdAt ?? new Date(0);
    return { since: since.toISOString(), projects: [] };
  }

  const since =
    lastReport?.createdAt ??
    new Date(Math.min(...projects.map((p) => p.createdAt.getTime())));

  const projectIds = projects.map((p) => p.id);

  const logs = await prisma.activityLog.findMany({
    where: {
      projectId: { in: projectIds },
      createdAt: { gt: since },
    },
    include: { task: { select: { title: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const projectMap = new Map<string, { name: string; logs: typeof logs }>(
    projects.map((p) => [p.id, { name: p.name, logs: [] }]),
  );

  for (const log of logs) {
    projectMap.get(log.projectId)?.logs.push(log);
  }

  const summaryProjects: AutoSummaryProject[] = [];

  for (const [id, { name, logs: pLogs }] of projectMap) {
    if (pLogs.length === 0) continue;

    // Group logs by task. Deleted tasks have taskId=null so key on log.id instead.
    const byTask = new Map<string, typeof pLogs>();
    for (const log of pLogs) {
      const key = log.taskId ?? `del:${log.id}`;
      if (!byTask.has(key)) byTask.set(key, []);
      byTask.get(key)!.push(log);
    }

    const newTasks: string[] = [];
    const inProgress: string[] = [];
    const waiting: string[] = [];
    const done: string[] = [];

    for (const taskLogs of byTask.values()) {
      // Title: live task relation for existing tasks, details field for deleted
      const title =
        taskLogs.find((l) => l.task?.title)?.task?.title ??
        taskLogs.find((l) => l.action === 'deleted')?.details ??
        '(unknown)';

      if (taskLogs.some((l) => l.action === 'created')) {
        newTasks.push(title);
      }

      // Only the FINAL move matters for which column section the task appears in.
      // Logs are already ordered asc by createdAt.
      const moveLogs = taskLogs.filter((l) => l.action === 'moved');
      const finalMove = moveLogs[moveLogs.length - 1];
      if (finalMove?.toColumn === 'IN_PROGRESS') inProgress.push(title);
      else if (finalMove?.toColumn === 'WAITING') waiting.push(title);
      else if (finalMove?.toColumn === 'DONE') done.push(title);
    }

    if (newTasks.length + inProgress.length + waiting.length + done.length === 0) continue;

    summaryProjects.push({ id, name, newTasks, inProgress, waiting, done });
  }

  return { since: since.toISOString(), projects: summaryProjects };
}

export async function createProgressReport(
  clientId: string,
  content: string,
): Promise<ProgressReport> {
  const summary = await getAutoSummary(clientId);

  return prisma.progressReport.create({
    data: {
      clientId,
      content: content || null,
      autoSummary: summary as object,
    },
  });
}
