import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getActiveTimerForTask } from '@/lib/actions/admin/time';

type Ctx = { params: Promise<{ taskId: string }> };

export const GET = withMobileAuth<Ctx>(async (req, { params }) => {
  const { taskId } = await params;
  const timer = await getActiveTimerForTask(taskId);
  return NextResponse.json(timer);
});
