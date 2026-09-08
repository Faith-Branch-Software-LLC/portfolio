import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getSyncHash } from '@/lib/actions/admin/sync';

export const GET = withMobileAuth(async () => {
  const status = await getSyncHash();
  return NextResponse.json(status);
});
