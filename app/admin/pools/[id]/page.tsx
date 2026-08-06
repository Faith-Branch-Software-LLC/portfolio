import { notFound } from 'next/navigation';
import { getPool } from '@/lib/actions/admin/pools';
import PoolDetail from '@/components/admin/pools/PoolDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PoolDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pool = await getPool(id);
  if (!pool) notFound();

  return <PoolDetail pool={pool} />;
}
