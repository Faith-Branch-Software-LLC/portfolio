import { prisma } from '@/lib/db';
import ClientList from '@/components/admin/clients/ClientList';

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <ClientList clients={clients} />
    </div>
  );
}
