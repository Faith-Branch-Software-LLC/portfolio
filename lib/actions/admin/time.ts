'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../db';

function getLocalDateMidnightUTC(timezone: string): Date {
  const localStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  return new Date(localStr + 'T00:00:00.000Z');
}

async function getStoredTimezone(): Promise<string> {
  const setting = await prisma.adminSetting.findUnique({ where: { key: 'timezone' } });
  return setting?.value ?? 'America/New_York';
}

export async function clockIn(taskId: string) {
  const timer = await prisma.activeTimer.create({ data: { taskId } });
  revalidatePath('/admin/clock');
  return { id: timer.id, clockedIn: timer.clockedIn };
}

export async function clockOut(timerId: string) {
  const timer = await prisma.activeTimer.findUnique({
    where: { id: timerId },
    include: { task: { select: { projectId: true } } },
  });
  if (!timer) return;

  const timezone = await getStoredTimezone();
  const now = new Date();
  const minutes = Math.max(1, Math.round((now.getTime() - timer.clockedIn.getTime()) / 60000));
  const date = getLocalDateMidnightUTC(timezone);

  await prisma.$transaction([
    prisma.timeEntry.upsert({
      where: { taskId_date: { taskId: timer.taskId, date } },
      create: { taskId: timer.taskId, date, minutes },
      update: { minutes: { increment: minutes } },
    }),
    prisma.activeTimer.delete({ where: { id: timerId } }),
  ]);

  revalidatePath('/admin/clock');
  revalidatePath(`/admin/projects/${timer.task.projectId}`);
}

export async function getActiveTimerForTask(taskId: string) {
  const timer = await prisma.activeTimer.findUnique({ where: { taskId } });
  if (!timer) return null;
  return { id: timer.id, clockedIn: timer.clockedIn };
}

export async function getActiveTimers() {
  const timers = await prisma.activeTimer.findMany({
    include: {
      task: {
        include: {
          project: {
            include: { client: { select: { name: true, color: true } } },
          },
        },
      },
    },
    orderBy: { clockedIn: 'asc' },
  });

  return timers.map((t) => ({
    id: t.id,
    clockedIn: t.clockedIn,
    taskId: t.taskId,
    taskTitle: t.task.title,
    projectId: t.task.projectId,
    projectName: t.task.project.name,
    clientName: t.task.project.client.name,
    clientColor: t.task.project.client.color,
  }));
}

export async function getTaskTimeEntries(taskId: string) {
  return prisma.timeEntry.findMany({
    where: { taskId },
    orderBy: { date: 'desc' },
    select: { id: true, date: true, minutes: true },
  });
}

export async function updateTimeEntry(id: string, minutes: number) {
  if (minutes < 1) {
    await prisma.timeEntry.delete({ where: { id } });
  } else {
    await prisma.timeEntry.update({ where: { id }, data: { minutes } });
  }
}

export async function deleteTimeEntry(id: string) {
  await prisma.timeEntry.delete({ where: { id } });
}

export async function getProjectTotalMinutes(projectId: string): Promise<number> {
  const result = await prisma.timeEntry.aggregate({
    where: { task: { projectId } },
    _sum: { minutes: true },
  });
  return result._sum.minutes ?? 0;
}

export async function getClientTimeData(
  clientId: string,
  period: 'lifetime' | 'yearly' | 'monthly' | 'weekly',
  projectId?: string,
) {
  const now = new Date();
  let since: Date | undefined;

  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    since = d;
  } else if (period === 'monthly') {
    since = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'yearly') {
    since = new Date(now.getFullYear(), 0, 1);
  }

  return prisma.timeEntry.findMany({
    where: {
      task: {
        project: {
          clientId,
          ...(projectId ? { id: projectId } : {}),
        },
      },
      ...(since ? { date: { gte: since } } : {}),
    },
    include: {
      task: {
        select: {
          title: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getClientProjects(clientId: string) {
  return prisma.project.findMany({
    where: { clientId, archived: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function getTimezone(): Promise<string> {
  return getStoredTimezone();
}

export async function setTimezone(tz: string): Promise<void> {
  await prisma.adminSetting.upsert({
    where: { key: 'timezone' },
    create: { key: 'timezone', value: tz },
    update: { value: tz },
  });
  revalidatePath('/admin/clock');
}
