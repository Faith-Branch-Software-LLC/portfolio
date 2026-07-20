'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../db';
import { ClientTimePeriod, CLIENT_TIME_PERIOD_TO_PRESET, presetRange } from '@/lib/time-range';

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
  period: ClientTimePeriod,
  projectId?: string,
) {
  const range = presetRange(CLIENT_TIME_PERIOD_TO_PRESET[period]);

  return prisma.timeEntry.findMany({
    where: {
      task: {
        project: {
          clientId,
          ...(projectId ? { id: projectId } : {}),
        },
      },
      ...(range ? { date: { gte: range.from, lt: range.to } } : {}),
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

export interface ClientTimeRangeTask {
  id: string;
  title: string;
  minutes: number;
}

export interface ClientTimeRangeProject {
  id: string;
  name: string;
  minutes: number;
  tasks: ClientTimeRangeTask[];
}

export interface ClientTimeRangeSummary {
  totalMinutes: number;
  projects: ClientTimeRangeProject[];
}

export async function getClientTimeRangeSummary(
  clientId: string,
  from: Date,
  to: Date,
  projectId?: string,
): Promise<ClientTimeRangeSummary> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      task: {
        project: {
          clientId,
          ...(projectId ? { id: projectId } : {}),
        },
      },
      date: { gte: from, lt: to },
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);

  const projectMap = new Map<
    string,
    { id: string; name: string; minutes: number; tasks: Map<string, ClientTimeRangeTask> }
  >();

  for (const e of entries) {
    const p = e.task.project;
    let project = projectMap.get(p.id);
    if (!project) {
      project = { id: p.id, name: p.name, minutes: 0, tasks: new Map() };
      projectMap.set(p.id, project);
    }
    project.minutes += e.minutes;

    const existingTask = project.tasks.get(e.task.id);
    if (existingTask) existingTask.minutes += e.minutes;
    else project.tasks.set(e.task.id, { id: e.task.id, title: e.task.title, minutes: e.minutes });
  }

  const projects = Array.from(projectMap.values())
    .map((p) => ({
      id: p.id,
      name: p.name,
      minutes: p.minutes,
      tasks: Array.from(p.tasks.values()).sort((a, b) => b.minutes - a.minutes),
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return { totalMinutes, projects };
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
