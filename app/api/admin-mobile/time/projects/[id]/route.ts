import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getProjectTotalMinutes } from '@/lib/actions/admin/time';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const totalMinutes = await getProjectTotalMinutes(id);
  return NextResponse.json({ totalMinutes });
});
