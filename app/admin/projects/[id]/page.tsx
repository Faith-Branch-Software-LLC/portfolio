import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import ProjectBoardPage from '@/components/admin/projects/ProjectBoardPage';
import { getProjectTotalMinutes } from '@/lib/actions/admin/time';
import { buildHeatmapGrid } from '@/lib/utils/heatmap';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;

  const heatmapStartDate = new Date();
  heatmapStartDate.setFullYear(heatmapStartDate.getFullYear() - 1);

  const [project, clients, tfIntegration, totalMinutes, activityLogs] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: {
          orderBy: { order: 'asc' },
          include: { tags: { include: { tag: true } } },
        },
      },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
    prisma.integration.findFirst({ where: { type: IntegrationType.TESTFLIGHT } }),
    getProjectTotalMinutes(id),
    prisma.activityLog.findMany({
      where: { projectId: id, createdAt: { gte: heatmapStartDate } },
      select: { createdAt: true },
    }),
  ]);

  if (!project) notFound();

  const { grid: heatmapGrid, alignedStart: heatmapAlignedStart } = buildHeatmapGrid(activityLogs, project.createdAt);

  const isTestFlightTarget =
    !!tfIntegration &&
    (tfIntegration.config as { targetProjectId?: string }).targetProjectId === id;
  const isBasecampLinked = !!project.basecampTodolistId;

  return (
    <ProjectBoardPage
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        clientId: project.clientId,
        status: project.status,
        priority: project.priority,
        due: project.due,
        apiToken: project.apiToken,
        basecampTodolistId: project.basecampTodolistId,
        client: { name: project.client.name, color: project.client.color },
      }}
      clients={clients}
      tasks={project.tasks}
      totalMinutes={totalMinutes}
      heatmapGrid={heatmapGrid}
      heatmapAlignedStart={heatmapAlignedStart}
      isTestFlightTarget={isTestFlightTarget}
      isBasecampLinked={isBasecampLinked}
    />
  );
}
