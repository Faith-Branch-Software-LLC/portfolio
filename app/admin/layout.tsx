import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/actions/authOptions';
import AdminNav from '@/components/admin/AdminNav';
import { prisma } from '@/lib/db';
import { KanbanColumn } from '@prisma/client';
import { HeatmapTweakProvider } from '@/components/admin/HeatmapTweakContext';
import { AdminToastProvider } from '@/components/ui/toast-context';

export type NavProject = {
  id: string;
  name: string;
  clientColor: string;
  pct: number;
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const activeTimers = await prisma.activeTimer.findMany({
    select: { task: { select: { projectId: true } } },
  });
  const activeTimerProjectIds = new Set(activeTimers.map((t) => t.task.projectId));

  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      client: { select: { color: true } },
      tasks: { select: { column: true } },
    },
  });

  const navProjects: NavProject[] = projects.map((p) => {
    const total = p.tasks.filter((t) => t.column !== KanbanColumn.BACKLOG).length;
    const done = p.tasks.filter((t) => t.column === KanbanColumn.DONE).length;
    return {
      id: p.id,
      name: p.name,
      clientColor: p.client.color ?? '#888888',
      pct: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });

  return (
    <HeatmapTweakProvider>
    <AdminToastProvider>
      <div
        className="h-screen flex overflow-hidden"
        style={{ background: '#EFE9DC', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <AdminNav projects={navProjects} hasActiveTimer={activeTimerProjectIds.size > 0} activeTimerProjectIds={activeTimerProjectIds} />
        <main className="flex-1 min-h-0 overflow-hidden pt-14 md:pt-0">{children}</main>
      </div>
    </AdminToastProvider>
    </HeatmapTweakProvider>
  );
}
