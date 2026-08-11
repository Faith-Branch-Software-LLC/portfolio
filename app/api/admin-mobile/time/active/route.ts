import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getActiveTimers } from '@/lib/actions/admin/time';

export const GET = withMobileAuth(async () => {
  const timers = await getActiveTimers();
  return NextResponse.json(timers);
});
