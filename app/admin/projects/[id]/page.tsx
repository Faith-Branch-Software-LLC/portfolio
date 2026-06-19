import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import ProjectBoardPage from '@/components/admin/projects/ProjectBoardPage';
import { getProjectTotalMinutes } from '@/lib/actions/admin/time';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;

  const [project, clients, tfIntegration, totalMinutes] = await Promise.all([
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
    prisma.integration.findUnique({ where: { type: IntegrationType.TESTFLIGHT } }),
    getProjectTotalMinutes(id),
  ]);

  if (!project) notFound();

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
      isTestFlightTarget={isTestFlightTarget}
      isBasecampLinked={isBasecampLinked}
    />
  );
}
