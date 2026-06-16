import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProjectBoardPage from '@/components/admin/projects/ProjectBoardPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;

  const [project, clients] = await Promise.all([
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
  ]);

  if (!project) notFound();

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
        client: { name: project.client.name, color: project.client.color },
      }}
      clients={clients}
      tasks={project.tasks}
    />
  );
}
