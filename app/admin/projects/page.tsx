import { prisma } from '@/lib/db';
import ProjectList from '@/components/admin/projects/ProjectList';

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ archived: 'asc' }, { createdAt: 'desc' }],
      include: { client: true },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return <ProjectList projects={projects} clients={clients} />;
}
