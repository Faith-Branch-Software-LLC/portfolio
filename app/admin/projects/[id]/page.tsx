import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import KanbanBoard from '@/components/admin/kanban/KanbanBoard';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      tasks: {
        orderBy: { order: 'asc' },
        include: {
          tags: { include: { tag: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="h-full flex flex-col px-6 py-6">
      <div className="mb-4 flex-shrink-0">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Projects
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.client.color ?? '#888' }}
          />
          <h1 className="text-2xl font-fraunces font-semibold">{project.name}</h1>
          <span className="text-sm text-gray-400">{project.client.name}</span>
        </div>
        {project.description && (
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">{project.description}</p>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard projectId={project.id} initialTasks={project.tasks} />
      </div>
    </div>
  );
}
