import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getClientTimeData, getClientProjects } from '@/lib/actions/admin/time';
import ClientTimePage from '@/components/admin/clients/ClientTimePage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientTimePageRoute({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: { id: true, name: true, color: true },
  });

  if (!client) notFound();

  const [initialEntries, projects] = await Promise.all([
    getClientTimeData(id, 'monthly'),
    getClientProjects(id),
  ]);

  return (
    <ClientTimePage
      client={client}
      initialEntries={initialEntries}
      initialPeriod="monthly"
      projects={projects}
    />
  );
}
