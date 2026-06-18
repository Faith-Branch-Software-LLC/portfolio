import { prisma } from '@/lib/db';
import { KanbanColumn } from '@prisma/client';
import AdminLink from '@/components/admin/AdminLink';
import WorkToDo, { ActiveTask } from '@/components/admin/WorkToDo';
import DashboardClock from '@/components/admin/DashboardClock';
import { Check, Clock, Plus, Code } from 'lucide-react';

function etDayBoundaries(date: Date): { start: Date; end: Date } {
  const etDate = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
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
  if (pct < 30) return '#D7263D';
  if (pct < 70) return '#F46036';
  return '#1B998B';
}

function statusStyle(s: string): { bg: string; color: string } {
  if (s === 'IN_PROGRESS') return { bg: '#1B998B', color: '#fff' };
  if (s === 'COMPLETED') return { bg: '#C5D86D', color: '#2E294E' };
  if (s === 'ON_HOLD') return { bg: '#F46036', color: '#fff' };
  return { bg: 'rgba(46,41,78,0.12)', color: '#2E294E' };
}

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#00bfff',
  MEDIUM: '#ffaf00',
  HIGH: '#ff3b3b',
  URGENT: '#ff0000',
};

function buildHeatmap(logs: { createdAt: Date }[]): number[] {
  const now = new Date();
  const counts: number[] = Array(14).fill(0);
  for (const log of logs) {
    const diffDays = Math.floor(
      (now.getTime() - log.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays >= 0 && diffDays < 14) counts[13 - diffDays]++;
  }
  return counts;
}

function heatColor(count: number) {
  return count === 0 ? 'rgba(46,41,78,0.1)' : count === 1 ? '#C5D86D' : '#1B998B';
}

type DoneEntry = {
  id: string;
  toColumn: KanbanColumn | null;
  task: { title: string } | null;
  project: { id: string; name: string; client: { name: string; color: string | null } };
};

export default async function AdminDashboard() {
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

  const doneByProject = lastTimeDone.reduce<Record<string, DoneEntry[]>>((acc, entry) => {
    (acc[entry.project.id] ??= []).push(entry);
    return acc;
  }, {});

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

  const allProjects = await prisma.project.findMany({
    where: { archived: false },
    include: {
      client: { select: { name: true, color: true } },
      tasks: { select: { column: true, title: true } },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { createdAt: true },
      },
    },
  });

  const sortedProjects = [...allProjects].sort((a, b) => {
    const aLast = a.activityLogs[0]?.createdAt?.getTime() ?? a.createdAt.getTime();
    const bLast = b.activityLogs[0]?.createdAt?.getTime() ?? b.createdAt.getTime();
    return bLast - aLast;
  });

  const projects = sortedProjects.slice(0, 3);
  const remainingCount = sortedProjects.length - projects.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header bar */}
      <div
        className="px-4 sm:px-[26px]"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 26px',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
        }}
      >
        <DashboardClock taskCount={activeTasks.length} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <AdminLink href="/admin/api-docs">
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#2E294E',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                padding: '10px 15px',
                border: '2px solid #2E294E',
                borderRadius: '6px',
                boxShadow: '3px 3px 0 0 #2E294E',
                cursor: 'pointer',
              }}
            >
              <Code size={16} />
              <span className="hidden sm:inline">API Docs</span>
            </button>
          </AdminLink>
          <AdminLink href="/admin/projects">
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F46036',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                padding: '10px 15px',
                border: '2px solid #2E294E',
                borderRadius: '6px',
                boxShadow: '3px 3px 0 0 #2E294E',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New project</span>
            </button>
          </AdminLink>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="p-4 sm:p-[22px_26px]" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* Active projects */}
        {projects.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 600,
                  fontSize: '18px',
                  margin: 0,
                  color: '#2E294E',
                }}
              >
                Active projects
              </h2>
              <span
                className="hidden sm:inline-block"
                style={{
                  fontFamily: '"Send Flowers", cursive',
                  fontSize: '17px',
                  color: '#F46036',
                  transform: 'rotate(-2deg)',
                  display: 'inline-block',
                }}
              >
                click one to open its board ↓
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {

                const total = project.tasks.filter(
                  (t) => t.column !== KanbanColumn.BACKLOG,
                ).length;
                const done = project.tasks.filter(
                  (t) => t.column === KanbanColumn.DONE,
                ).length;
                const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                const heatmap = buildHeatmap(project.activityLogs);
                const st = statusStyle(project.status);
                const nextTask = project.tasks.find(
                  (t) => t.column === KanbanColumn.IN_PROGRESS || t.column === KanbanColumn.TODO,
                );

                return (
                  <AdminLink
                    key={project.id}
                    href={`/admin/projects/${project.id}`}
                    className="block"
                  >
                    <div
                      style={{
                        background: '#ffffff',
                        border: '2px solid #2E294E',
                        borderRadius: '9px',
                        boxShadow: '4px 4px 0 0 rgba(46,41,78,0.18)',
                        padding: '15px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Client + name */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          marginBottom: '7px',
                        }}
                      >
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: project.client.color ?? '#888',
                            display: 'inline-block',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: '11px',
                            color: '#8a8499',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {project.client.name}
                        </span>
                      </div>

                      <div
                        style={{
                          fontFamily: 'Fraunces, serif',
                          fontWeight: 600,
                          fontSize: '17px',
                          marginBottom: '9px',
                          color: '#2E294E',
                        }}
                      >
                        {project.name}
                      </div>

                      {/* Status + priority */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          marginBottom: '11px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            background: st.bg,
                            color: st.color,
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '20px',
                          }}
                        >
                          {STATUS_LABELS[project.status] ?? project.status}
                        </span>
                        {project.priority && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: PRIORITY_COLORS[project.priority] ?? '#888',
                            }}
                          >
                            ⚑ {project.priority.charAt(0) + project.priority.slice(1).toLowerCase()}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div
                        style={{
                          height: '9px',
                          borderRadius: '5px',
                          background: 'rgba(46,41,78,0.1)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: progressColor(pct),
                            borderRadius: '5px',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: '11px',
                          color: '#8a8499',
                          margin: '6px 0 10px',
                        }}
                      >
                        {pct}% · {done}/{total} tasks
                      </div>

                      {/* Heatmap */}
                      <div
                        style={{ display: 'flex', gap: '3px', marginBottom: '11px' }}
                      >
                        {heatmap.map((count, i) => (
                          <span
                            key={i}
                            title={`${count} activit${count === 1 ? 'y' : 'ies'}`}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '2px',
                              background: heatColor(count),
                              display: 'inline-block',
                            }}
                          />
                        ))}
                      </div>

                      {/* Next task */}
                      <div
                        style={{
                          borderTop: '1px solid rgba(46,41,78,0.1)',
                          paddingTop: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ color: '#1B998B', display: 'inline-flex' }}>▶</span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#3b3550',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {nextTask ? nextTask.title : 'all done'}
                        </span>
                      </div>
                    </div>
                  </AdminLink>
                );
              })}
            </div>

            {remainingCount > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminLink href="/admin/projects">
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      color: '#2E294E',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: '13px',
                      padding: '8px 14px',
                      border: '1.5px solid rgba(46,41,78,0.28)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    +{remainingCount} more project{remainingCount !== 1 ? 's' : ''} →
                  </button>
                </AdminLink>
              </div>
            )}
          </section>
        )}

        {/* Bottom row: Work to do + Upcoming / Work Done */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">

          {/* Work to do */}
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #2E294E',
              borderRadius: '8px',
              boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
              padding: '20px 22px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                marginBottom: '14px',
              }}
            >
              <span style={{ color: '#F46036', display: 'inline-flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="6" height="6" rx="1"/><path d="M4.5 6.7L5.7 8 8 5.3"/>
                  <rect x="3" y="14" width="6" height="6" rx="1"/>
                  <path d="M12 6h9M12 12h9M12 18h9"/>
                </svg>
              </span>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 600,
                  fontSize: '17px',
                  margin: 0,
                  color: '#2E294E',
                }}
              >
                Work to do
              </h2>
            </div>
            <WorkToDo initialTasks={activeTasks} />
          </div>

          {/* Right column: Upcoming + Work done */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Upcoming meetings */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #2E294E',
                borderRadius: '8px',
                boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
                padding: '20px 22px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span style={{ color: '#1B998B', display: 'inline-flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M3 10h18M8 3v4M16 3v4"/>
                    </svg>
                  </span>
                  <h2
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontWeight: 600,
                      fontSize: '17px',
                      margin: 0,
                      color: '#2E294E',
                    }}
                  >
                    Upcoming
                  </h2>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: '11.5px',
                  color: '#8a8499',
                  margin: '0 0 12px',
                }}
              >
                from your connected calendars
              </p>
              <AdminLink href="/admin/connections">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#1B998B',
                    cursor: 'pointer',
                  }}
                >
                  Connect calendars →
                </span>
              </AdminLink>
            </div>

            {/* Work done last time */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #2E294E',
                borderRadius: '8px',
                boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
                padding: '20px 22px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontWeight: 600,
                    fontSize: '17px',
                    margin: 0,
                    color: '#2E294E',
                  }}
                >
                  Last session
                </h2>
                {lastActiveDate && (
                  <span
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '11px',
                      color: '#8a8499',
                    }}
                  >
                    {lastActiveDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'America/New_York',
                    })}
                  </span>
                )}
              </div>

              {!lastActiveDate ? (
                <p style={{ fontSize: '13px', color: '#8a8499', fontStyle: 'italic' }}>
                  No activity recorded yet.
                </p>
              ) : lastTimeDone.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#8a8499', fontStyle: 'italic' }}>
                  Nothing moved to done or waiting.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.values(doneByProject).map((entries) => {
                    const { project } = entries[0];
                    return (
                      <div key={project.id}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px',
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: project.client.color ?? '#888',
                              flexShrink: 0,
                              display: 'inline-block',
                            }}
                          />
                          <span
                            style={{ fontSize: '12.5px', fontWeight: 600, color: '#2E294E' }}
                          >
                            {project.name}
                          </span>
                        </div>
                        <ul
                          style={{
                            margin: 0,
                            padding: '0 0 0 15px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          {entries.map((entry) => (
                            <li
                              key={entry.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12.5px',
                                color: '#3b3550',
                                listStyle: 'none',
                              }}
                            >
                              {entry.toColumn === KanbanColumn.DONE ? (
                                <Check
                                  size={12}
                                  style={{ color: '#1B998B', flexShrink: 0 }}
                                />
                              ) : (
                                <Clock
                                  size={12}
                                  style={{ color: '#F46036', flexShrink: 0 }}
                                />
                              )}
                              <span>{entry.task?.title ?? '(deleted task)'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
