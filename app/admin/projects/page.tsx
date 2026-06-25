import { prisma } from '@/lib/db';
import ProjectList from '@/components/admin/projects/ProjectList';
import { buildHeatmapGrid } from '@/lib/utils/heatmap';

export default async function ProjectsPage() {
  const heatmapStartDate = new Date();
  heatmapStartDate.setFullYear(heatmapStartDate.getFullYear() - 1);

  const [projects, clients, activeTimers] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ archived: 'asc' }, { createdAt: 'desc' }],
      include: {
        client: true,
        activityLogs: {
          where: { createdAt: { gte: heatmapStartDate } },
          select: { createdAt: true },
        },
      },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.activeTimer.findMany({ select: { task: { select: { projectId: true } } } }),
  ]);

  const activeTimerProjectIds = activeTimers.map((t) => t.task.projectId);

  const projectsWithHeatmap = projects.map((p) => {
    const { grid, alignedStart } = buildHeatmapGrid(p.activityLogs, p.createdAt);
    return { ...p, heatmapGrid: grid, heatmapAlignedStart: alignedStart };
  });

  return <ProjectList projects={projectsWithHeatmap} clients={clients} activeTimerProjectIds={activeTimerProjectIds} />;
}
