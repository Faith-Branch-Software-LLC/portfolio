import { getPools } from '@/lib/actions/admin/pools';
import PoolList from '@/components/admin/pools/PoolList';

export default async function PoolsPage() {
  const pools = await getPools();
  return <PoolList pools={pools} />;
}
