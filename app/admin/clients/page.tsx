import { prisma } from '@/lib/db';
import ClientList from '@/components/admin/clients/ClientList';

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { projects: true } } },
  });

  return <ClientList clients={clients} />;
}
