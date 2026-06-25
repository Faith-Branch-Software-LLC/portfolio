import { prisma } from '@/lib/db';
import PortfolioAdmin from '@/components/admin/portfolio/PortfolioAdmin';

export default async function AdminPortfolioPage() {
  const items = await prisma.portfolioItem.findMany({ orderBy: { order: 'asc' } });
  return <PortfolioAdmin items={items} />;
}
