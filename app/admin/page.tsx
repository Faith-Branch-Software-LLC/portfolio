import { prisma } from '@/lib/db';
import { KanbanColumn } from '@prisma/client';
import AdminLink from '@/components/admin/AdminLink';
import WorkToDo, { ActiveTask } from '@/components/admin/WorkToDo';
import DashboardClock from '@/components/admin/DashboardClock';
import { Check, Clock } from 'lucide-react';

/**
 * Returns the UTC timestamps for the start and end of a given date's
 * calendar day in Eastern Time (handles EST/EDT automatically).
 */
function etDayBoundaries(date: Date): { start: Date; end: Date } {
  // Get YYYY-MM-DD in ET
  const etDate = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  // ET is UTC-4 (EDT) or UTC-5 (EST). Midnight ET = 4am or 5am UTC.
  // Find the correct one by checking which candidate still falls on the same ET date.
  const candidates = [4, 5].map(
    (h) => new Date(`${etDate}T${String(h).padStart(2, '0')}:00:00Z`),
  );
  const dayStart =
    candidates.find(
      (c) => c.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) === etDate,
    ) ?? candidates[1];

  return { start: dayStart, end: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) };
}

function progressColor(pct: number) {
  if (pct < 30) return 'from-[#ff5555] to-[#ff7777]';
  if (pct < 70) return 'from-[#ffaa44] to-[#ffcc55]';
  return 'from-[#44bb44] to-[#66cc66]';
}

function buildHeatmap(logs: { createdAt: Date }[]): number[] {
  const now = new Date();
  const counts: number[] = Array(14).fill(0);

  for (const log of logs) {
    const diffMs = now.getTime() - log.createdAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 14) {
      counts[13 - diffDays]++;
    }
  }
  return counts;
}

function heatColor(count: number) {
  return count === 0 ? 'bg-black/5' : 'bg-green-400';
}

type DoneEntry = {
  id: string;
  toColumn: KanbanColumn | null;
  task: { title: string } | null;
  project: { id: string; name: string; client: { name: string; color: string | null } };
};

export default async function AdminDashboard() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Find the most recent activity to determine the "last active day"
  const lastLog = await prisma.activityLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  let lastTimeDone: DoneEntry[] = [];
  let lastActiveDate: Date | null = null;

  if (lastLog) {
    const { start: dayStart, end: dayEnd } = etDayBoundaries(lastLog.createdAt);
    lastActiveDate = dayStart;

    lastTimeDone = await prisma.activityLog.findMany({
      where: {
        action: 'moved',
        toColumn: { in: [KanbanColumn.DONE, KanbanColumn.WAITING] },
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      include: {
        task: { select: { title: true } },
        project: { include: { client: { select: { name: true, color: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    }) as DoneEntry[];
  }

  // Group by project
  const doneByProject = lastTimeDone.reduce<Record<string, DoneEntry[]>>((acc, entry) => {
    (acc[entry.project.id] ??= []).push(entry);
    return acc;
  }, {});

  // Active tasks (IN_PROGRESS first, then TODO)
  const activeTasks = await prisma.task.findMany({
    where: { column: { in: [KanbanColumn.IN_PROGRESS, KanbanColumn.TODO] } },
    orderBy: [{ column: 'desc' }, { order: 'asc' }],
    select: {
      id: true,
      title: true,
      column: true,
      priority: true,
      project: {
        select: {
          id: true,
          name: true,
          client: { select: { name: true, color: true } },
        },
      },
    },
  }) as ActiveTask[];

  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true, color: true } },
      tasks: { select: { column: true } },
      activityLogs: {
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true },
      },
    },
  });

  return (
    <div className="h-full flex">
      {/* Left — Active Projects */}
      <aside className="w-72 flex-shrink-0 overflow-y-auto border-r border-black/10 bg-white px-4 py-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
          Projects
        </p>

        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">No active projects.</p>
        ) : (
          projects.map((project) => {
            const total = project.tasks.filter(
              (t) => t.column !== KanbanColumn.BACKLOG,
            ).length;
            const done = project.tasks.filter(
              (t) => t.column === KanbanColumn.DONE,
            ).length;
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            const heatmap = buildHeatmap(project.activityLogs);
            const todayCount = heatmap[13];

            return (
              <AdminLink
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="block w-full text-left rounded-lg px-3 py-2.5 hover:bg-black/5 transition-colors group"
              >
                {/* Client label */}
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.client.color ?? '#888' }}
                  />
                  <span className="text-xs text-gray-400 truncate">
                    {project.client.name}
                  </span>
                </div>

                {/* Project name */}
                <p className="text-sm font-medium truncate group-hover:underline mb-2">
                  {project.name}
                </p>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${progressColor(pct)} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 mb-2">
                  {pct}% · {done}/{total} tasks
                </p>

                {/* Heatmap */}
                <div className="flex gap-0.5">
                  {heatmap.map((count, i) => (
                    <div
                      key={i}
                      title={`${count} activit${count === 1 ? 'y' : 'ies'}`}
                      className={`w-[7px] h-[7px] rounded-sm ${heatColor(count)} ${
                        i === 13
                          ? todayCount > 0
                            ? 'ring-1 ring-green-600 ring-offset-1'
                            : 'ring-1 ring-black/20 ring-offset-1'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </AdminLink>
            );
          })
        )}
      </aside>

      {/* Right — Dashboard sections */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <DashboardClock />

        {/* Work Done Last Time */}
        <section className="bg-white rounded-xl border border-black/10 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-700">Work Done Last Time</h2>
            {lastActiveDate && (
              <span className="text-xs text-gray-400">
                {lastActiveDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'America/New_York',
                })}
              </span>
            )}
          </div>

          {!lastActiveDate ? (
            <p className="text-sm text-gray-400">No activity recorded yet.</p>
          ) : lastTimeDone.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks completed or sent for review on this day.</p>
          ) : (
            <div className="space-y-4">
              {Object.values(doneByProject).map((entries) => {
                const { project } = entries[0];
                return (
                  <div key={project.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.client.color ?? '#888' }}
                      />
                      <span className="text-sm font-medium">{project.name}</span>
                      <span className="text-xs text-gray-400">{project.client.name}</span>
                    </div>
                    <ul className="space-y-1 pl-4">
                      {entries.map((entry) => (
                        <li key={entry.id} className="flex items-center gap-2 text-sm text-gray-600">
                          {entry.toColumn === KanbanColumn.DONE ? (
                            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          )}
                          <span>{entry.task?.title ?? '(deleted task)'}</span>
                          {entry.toColumn === KanbanColumn.WAITING && (
                            <span className="text-xs text-amber-500">waiting</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Work To Do */}
        <section className="bg-white rounded-xl border border-black/10 p-6">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">Work To Do</h2>
          <WorkToDo initialTasks={activeTasks} />
        </section>

        {/* Upcoming Meetings */}
        <section className="bg-white rounded-xl border border-black/10 p-6">
          <h2 className="font-semibold text-sm text-gray-700 mb-1">Upcoming Meetings</h2>
          <p className="text-xs text-gray-400 mb-4">
            Scheduled calls and check-ins
          </p>
          <p className="text-sm text-gray-300 italic">Coming soon.</p>
        </section>
      </main>
    </div>
  );
}
