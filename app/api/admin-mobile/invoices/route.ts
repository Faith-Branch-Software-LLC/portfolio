import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { listInvoicesForMobile } from '@/lib/actions/admin/invoices';

export const GET = withMobileAuth(async () => {
  const summary = await listInvoicesForMobile();
  return NextResponse.json(summary);
});
