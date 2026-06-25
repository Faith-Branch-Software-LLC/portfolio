import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createTask, moveTask, updateTask } from '@/lib/actions/admin/tasks';
import { clockIn, clockOut, getActiveTimers, getClientTimeData } from '@/lib/actions/admin/time';
import { getAutoSummary } from '@/lib/actions/admin/reports';
import { KanbanColumn, Priority, ProjectStatus } from '@prisma/client';
import type { NormalizedEvent } from '@/lib/types/calendar';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function json(data: unknown) {
  return text(JSON.stringify(data, null, 2));
}

async function internalPost(path: string): Promise<{ ok: boolean; data: unknown }> {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return { ok: false, data: { error: 'CRON_SECRET env var not set — required for sync operations' } };
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'x-cron-secret': cronSecret },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function internalGet(path: string): Promise<{ ok: boolean; data: unknown }> {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return { ok: false, data: { error: 'CRON_SECRET env var not set — required for calendar refresh' } };
  const res = await fetch(`${base}${path}`, {
    headers: { 'x-cron-secret': cronSecret },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'portfolio-admin', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {} } },
  );

  // ── list_projects ────────────────────────────────────────────────────────────
  server.registerTool('list_projects', {
    description: 'List all projects, optionally filtered by status or archived state',
    inputSchema: {
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']).optional().describe('Filter by project status'),
      archived: z.boolean().optional().describe('Include archived projects (default: false)'),
    },
  }, async ({ status, archived }) => {
    const projects = await prisma.project.findMany({
      where: {
        ...(status ? { status: status as ProjectStatus } : {}),
        archived: archived ?? false,
      },
      include: {
        client: { select: { name: true, color: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return json(projects);
  });

  // ── list_tasks ───────────────────────────────────────────────────────────────
  server.registerTool('list_tasks', {
    description: 'List tasks, optionally filtered by project, column, or priority',
    inputSchema: {
      projectId: z.string().optional().describe('Filter by project ID'),
      column: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING', 'DONE']).optional().describe('Filter by kanban column'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('Filter by priority'),
    },
  }, async ({ projectId, column, priority }) => {
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(column ? { column: column as KanbanColumn } : {}),
        ...(priority ? { priority: priority as Priority } : {}),
      },
      include: {
        tags: { include: { tag: true } },
        project: { select: { name: true, client: { select: { name: true } } } },
        activeTimer: { select: { clockedIn: true } },
      },
      orderBy: [{ column: 'asc' }, { order: 'asc' }],
    });
    return json(tasks);
  });

  // ── get_task ─────────────────────────────────────────────────────────────────
  server.registerTool('get_task', {
    description: 'Get a single task by ID',
    inputSchema: {
      taskId: z.string().describe('Task ID'),
    },
  }, async ({ taskId }) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        tags: { include: { tag: true } },
        project: { select: { name: true, client: { select: { name: true } } } },
        activeTimer: true,
        timeEntries: { orderBy: { date: 'desc' }, take: 10 },
      },
    });
    if (!task) return { content: [{ type: 'text' as const, text: 'Task not found' }], isError: true };
    return json(task);
  });

  // ── create_task ──────────────────────────────────────────────────────────────
  server.registerTool('create_task', {
    description: 'Create a new task in a project',
    inputSchema: {
      title: z.string().describe('Task title'),
      projectId: z.string().describe('Project ID to add the task to'),
      column: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING', 'DONE']).optional().describe('Column (default: BACKLOG)'),
      description: z.string().optional().describe('Task description'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('Priority level'),
      due: z.string().optional().describe('Due date as ISO string'),
    },
  }, async ({ title, projectId, column, description, priority, due }) => {
    const task = await createTask({
      title,
      projectId,
      column: column as KanbanColumn | undefined,
      description,
      priority: priority as Priority | undefined,
      due: due ? new Date(due) : undefined,
    });
    return json(task);
  });

  // ── move_task ────────────────────────────────────────────────────────────────
  server.registerTool('move_task', {
    description: 'Move a task to a different kanban column',
    inputSchema: {
      taskId: z.string().describe('Task ID'),
      column: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING', 'DONE']).describe('Target column'),
    },
  }, async ({ taskId, column }) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { content: [{ type: 'text' as const, text: 'Task not found' }], isError: true };

    const existingInCol = await prisma.task.findMany({
      where: { projectId: task.projectId, column: column as KanbanColumn, id: { not: taskId } },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    const orderedIds = [...existingInCol.map((t) => t.id), taskId];
    await moveTask(taskId, task.projectId, column as KanbanColumn, orderedIds);
    return text(`Task "${task.title}" moved to ${column}`);
  });

  // ── update_task ──────────────────────────────────────────────────────────────
  server.registerTool('update_task', {
    description: 'Update a task\'s title, description, priority, or due date',
    inputSchema: {
      taskId: z.string().describe('Task ID'),
      projectId: z.string().describe('Project ID the task belongs to'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().nullable().describe('New description (null to clear)'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().nullable().describe('New priority (null to clear)'),
      due: z.string().optional().nullable().describe('New due date as ISO string (null to clear)'),
    },
  }, async ({ taskId, projectId, title, description, priority, due }) => {
    const task = await updateTask(taskId, projectId, {
      title,
      description: description ?? undefined,
      priority: (priority as Priority | null | undefined) ?? undefined,
      due: due === null ? null : due ? new Date(due) : undefined,
    });
    return json(task);
  });

  // ── list_calendar_events ─────────────────────────────────────────────────────
  server.registerTool('list_calendar_events', {
    description: 'List upcoming calendar events from the cached event data',
    inputSchema: {
      daysAhead: z.number().int().min(1).max(180).optional().describe('Number of days ahead to include (default: 14)'),
      includeAllDay: z.boolean().optional().describe('Include all-day events (default: true)'),
    },
  }, async ({ daysAhead = 14, includeAllDay = true }) => {
    const caches = await prisma.calendarEventCache.findMany({
      include: { integration: { select: { name: true, type: true } } },
    });
    const now = new Date();
    const cutoff = new Date(now.getTime() + daysAhead * 86_400_000);
    const allEvents: NormalizedEvent[] = [];

    for (const cache of caches) {
      const events = cache.events as unknown as NormalizedEvent[];
      for (const ev of events) {
        const start = new Date(ev.startIso);
        if (start >= now && start <= cutoff) {
          if (!includeAllDay && ev.allDay) continue;
          allEvents.push(ev);
        }
      }
    }

    allEvents.sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());
    const cacheAge = caches.length > 0
      ? Math.round((Date.now() - Math.min(...caches.map((c) => new Date(c.cachedAt).getTime()))) / 60_000)
      : null;

    return json({ events: allEvents, count: allEvents.length, cacheAgeMinutes: cacheAge });
  });

  // ── refresh_calendar ─────────────────────────────────────────────────────────
  server.registerTool('refresh_calendar', {
    description: 'Trigger a fresh fetch from all connected Google and Apple calendar integrations and update the cache',
    inputSchema: {},
  }, async () => {
    const integrations = await prisma.integration.findMany({
      where: { type: { in: ['GOOGLE_CALENDAR', 'APPLE_CALENDAR'] } },
      select: { id: true, name: true, type: true },
    });

    if (!integrations.length) return text('No calendar integrations configured');

    const results = await Promise.allSettled(integrations.map(async (int) => {
      const path = int.type === 'GOOGLE_CALENDAR'
        ? '/api/integrations/google-calendar/events'
        : `/api/integrations/apple-calendar/${int.id}/events`;
      const res = await internalGet(path);
      return { name: int.name || int.type, ...res };
    }));

    const summary = results.map((r) =>
      r.status === 'fulfilled' ? r.value : { name: 'unknown', ok: false, data: r.reason },
    );
    return json({ refreshed: summary });
  });

  // ── sync_basecamp ────────────────────────────────────────────────────────────
  server.registerTool('sync_basecamp', {
    description: 'Pull the latest todos from Basecamp and sync them into the kanban boards',
    inputSchema: {},
  }, async () => {
    const result = await internalPost('/api/integrations/basecamp/sync');
    if (!result.ok) return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }], isError: true };
    return json(result.data);
  });

  // ── sync_testflight ──────────────────────────────────────────────────────────
  server.registerTool('sync_testflight', {
    description: 'Pull the latest TestFlight feedback and import it as tasks',
    inputSchema: {},
  }, async () => {
    const result = await internalPost('/api/integrations/testflight/sync');
    if (!result.ok) return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }], isError: true };
    return json(result.data);
  });

  // ── get_active_timers ────────────────────────────────────────────────────────
  server.registerTool('get_active_timers', {
    description: 'Get all currently running timers with task and project details',
    inputSchema: {},
  }, async () => {
    const timers = await getActiveTimers();
    return json(timers);
  });

  // ── clock_in ─────────────────────────────────────────────────────────────────
  server.registerTool('clock_in', {
    description: 'Start a timer for a task',
    inputSchema: {
      taskId: z.string().describe('Task ID to clock in on'),
    },
  }, async ({ taskId }) => {
    const existing = await prisma.activeTimer.findUnique({ where: { taskId } });
    if (existing) return text(`Timer already running for this task since ${existing.clockedIn.toISOString()}`);
    const timer = await clockIn(taskId);
    return json(timer);
  });

  // ── clock_out ────────────────────────────────────────────────────────────────
  server.registerTool('clock_out', {
    description: 'Stop a running timer and save the time entry',
    inputSchema: {
      timerId: z.string().describe('Active timer ID (from get_active_timers)'),
    },
  }, async ({ timerId }) => {
    await clockOut(timerId);
    return text('Timer stopped and time entry saved');
  });

  // ── get_time_summary ─────────────────────────────────────────────────────────
  server.registerTool('get_time_summary', {
    description: 'Get time tracking summary for a client, optionally filtered by project and period',
    inputSchema: {
      clientId: z.string().describe('Client ID'),
      period: z.enum(['lifetime', 'yearly', 'monthly', 'weekly']).optional().describe('Time period (default: monthly)'),
      projectId: z.string().optional().describe('Filter to a specific project'),
    },
  }, async ({ clientId, period = 'monthly', projectId }) => {
    const entries = await getClientTimeData(clientId, period, projectId);
    const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return json({ period, totalMinutes, formatted: `${hours}h ${mins}m`, entries });
  });

  // ── list_clients ─────────────────────────────────────────────────────────────
  server.registerTool('list_clients', {
    description: 'List all clients with their project counts',
    inputSchema: {},
  }, async () => {
    const clients = await prisma.client.findMany({
      include: {
        _count: { select: { projects: true } },
        projects: {
          where: { archived: false },
          select: { id: true, name: true, status: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return json(clients);
  });

  // ── generate_report ──────────────────────────────────────────────────────────
  server.registerTool('generate_report', {
    description: 'Generate an auto-summary progress report for a client based on recent activity',
    inputSchema: {
      clientId: z.string().describe('Client ID'),
    },
  }, async ({ clientId }) => {
    const summary = await getAutoSummary(clientId);
    return json(summary);
  });

  // ── Resource: portfolio://dashboard ─────────────────────────────────────────
  server.registerResource(
    'portfolio-dashboard',
    'portfolio://dashboard',
    {
      description: 'Current state snapshot: active tasks, today\'s calendar events, and running timers',
      mimeType: 'application/json',
    },
    async () => {
      const [tasks, timers, caches] = await Promise.all([
        prisma.task.findMany({
          where: { column: { in: [KanbanColumn.IN_PROGRESS, KanbanColumn.TODO] } },
          include: {
            project: { select: { name: true, client: { select: { name: true } } } },
            tags: { include: { tag: true } },
          },
          orderBy: [{ column: 'asc' }, { order: 'asc' }],
        }),
        getActiveTimers(),
        prisma.calendarEventCache.findMany(),
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayEvents: NormalizedEvent[] = [];
      for (const cache of caches) {
        const evs = cache.events as unknown as NormalizedEvent[];
        for (const ev of evs) {
          const start = new Date(ev.startIso);
          if (start >= todayStart && start <= todayEnd) todayEvents.push(ev);
        }
      }
      todayEvents.sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());

      return {
        contents: [{
          uri: 'portfolio://dashboard',
          mimeType: 'application/json',
          text: JSON.stringify({ activeTasks: tasks, todayEvents, activeTimers: timers }, null, 2),
        }],
      };
    },
  );

  // ── Resource: portfolio://projects ───────────────────────────────────────────
  server.registerResource(
    'portfolio-projects',
    'portfolio://projects',
    {
      description: 'Full list of all active projects with client info and task counts',
      mimeType: 'application/json',
    },
    async () => {
      const projects = await prisma.project.findMany({
        where: { archived: false },
        include: {
          client: { select: { name: true, color: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { name: 'asc' },
      });
      return {
        contents: [{
          uri: 'portfolio://projects',
          mimeType: 'application/json',
          text: JSON.stringify(projects, null, 2),
        }],
      };
    },
  );

  return server;
}
