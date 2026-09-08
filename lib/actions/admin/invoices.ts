'use server';

import { AkauntingClient } from '../../akaunting';

const OUTSTANDING_STATUSES = new Set(['sent', 'partial', 'overdue']);

export interface MobileInvoice {
  id: string;
  documentNumber: string;
  clientName: string;
  amount: number;
  currencyCode: string;
  status: string;
  issuedAt: string;
  dueAt: string;
}

export interface MobileInvoicesSummary {
  connected: boolean;
  invoices: MobileInvoice[];
  unpaidTotal: number;
  overdueCount: number;
}

export async function listInvoicesForMobile(): Promise<MobileInvoicesSummary> {
  const client = await AkauntingClient.fromDb();
  if (!client) {
    return { connected: false, invoices: [], unpaidTotal: 0, overdueCount: 0 };
  }

  const { data } = await client.getInvoices(1);

  const invoices: MobileInvoice[] = data.map((inv) => ({
    id: String(inv.id),
    documentNumber: inv.document_number,
    clientName: inv.contact_name,
    amount: inv.amount,
    currencyCode: inv.currency_code,
    status: inv.status,
    issuedAt: inv.issued_at,
    dueAt: inv.due_at,
  }));

  const unpaidTotal = invoices
    .filter((inv) => OUTSTANDING_STATUSES.has(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  return { connected: true, invoices, unpaidTotal, overdueCount };
}
