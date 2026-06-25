import { prisma } from '@/lib/db';
import PortfolioPageContent from '@/components/app/portfolio/PortfolioPageContent';

export default async function PortfolioPage() {
  const items = await prisma.portfolioItem.findMany({ orderBy: { order: 'asc' } });
  return <PortfolioPageContent items={items} />;
}
