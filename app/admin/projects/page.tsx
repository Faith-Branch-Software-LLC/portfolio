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

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <ProjectList projects={projects} clients={clients} />
    </div>
  );
}
