import { prisma } from '@/lib/db';
import ProjectList from '@/components/admin/projects/ProjectList';

export default async function ProjectsPage() {
  const [projects, clients, activeTimers] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ archived: 'asc' }, { createdAt: 'desc' }],
      include: { client: true },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.activeTimer.findMany({ select: { task: { select: { projectId: true } } } }),
  ]);

  const activeTimerProjectIds = activeTimers.map((t) => t.task.projectId);

  return <ProjectList projects={projects} clients={clients} activeTimerProjectIds={activeTimerProjectIds} />;
}
