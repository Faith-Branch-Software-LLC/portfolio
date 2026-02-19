import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import ReportsList from '@/components/admin/reports/ReportsList';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientReportsPage({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      progressReports: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!client) notFound();

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Clients
      </Link>

      <ReportsList
        clientId={client.id}
        clientName={client.name}
        clientColor={client.color}
        initialReports={client.progressReports}
      />
    </div>
  );
}
