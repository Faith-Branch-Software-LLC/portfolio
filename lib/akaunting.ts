import { encrypt, decrypt } from './utils/encryption';
import { prisma } from './db';

export interface AkauntingConfig {
  url: string;
  email: string;
  password: string;
  companyId: string;
}

export interface AkauntingContact {
  id: number;
  name: string;
  email: string | null;
  type: string;
}

export interface AkauntingInvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface AkauntingInvoice {
  id: number;
  type: string;
  status: string;
  contact_name: string;
  amount: number;
  currency_code: string;
  issued_at: string;
  due_at: string;
  document_number: string;
}

export interface AkauntingTransaction {
  id: number;
  paid_at: string;
  amount: number;
  currency_code: string;
  description: string | null;
  account_name: string | null;
}

export interface AkauntingInvoiceDetail extends AkauntingInvoice {
  contact_email: string | null;
  contact_address: string | null;
  notes: string | null;
  paid_at: string | null;
  transactions: AkauntingTransaction[];
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

const CONFIG_KEY = 'accounting_config';

export async function getAkauntingConfig(): Promise<AkauntingConfig | null> {
  const row = await prisma.adminSetting.findUnique({ where: { key: CONFIG_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(decrypt(row.value)) as AkauntingConfig;
  } catch {
    return null;
  }
}

export async function saveAkauntingConfig(config: AkauntingConfig): Promise<void> {
  const value = encrypt(JSON.stringify(config));
  await prisma.adminSetting.upsert({
    where: { key: CONFIG_KEY },
    update: { value },
    create: { key: CONFIG_KEY, value },
  });
}

export async function deleteAkauntingConfig(): Promise<void> {
  await prisma.adminSetting.deleteMany({ where: { key: CONFIG_KEY } });
}

export class AkauntingClient {
  private headers: HeadersInit;
  private baseUrl: string;
  private companyId: string;

  constructor(config: AkauntingConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.companyId = config.companyId;
    const auth = Buffer.from(`${config.email}:${config.password}`).toString('base64');
    this.headers = {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  static async fromDb(): Promise<AkauntingClient | null> {
    const config = await getAkauntingConfig();
    if (!config) return null;
    return new AkauntingClient(config);
  }

  private url(path: string, params?: Record<string, string>) {
    const u = new URL(`${this.baseUrl}/api/${path}`);
    u.searchParams.set('company_id', this.companyId);
    if (params) {
      for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    }
    return u.toString();
  }

  async testConnection(): Promise<{ ok: boolean; companyName?: string; error?: string }> {
    try {
      const res = await fetch(this.url(`companies/${this.companyId}`), {
        headers: this.headers,
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 401) return { ok: false, error: 'Invalid credentials' };
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const data = await res.json();
      return { ok: true, companyName: data.data?.name ?? 'Connected' };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async getContacts(): Promise<AkauntingContact[]> {
    const res = await fetch(this.url('contacts', { search: 'type:customer' }), {
      headers: this.headers,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${body ? `: ${body}` : ''}`);
    }
    const data = await res.json();
    return (data.data ?? []) as AkauntingContact[];
  }

  async createContact(name: string, email?: string): Promise<AkauntingContact> {
    const body: Record<string, unknown> = {
      company_id: parseInt(this.companyId),
      type: 'customer',
      name,
    };
    if (email) body.email = email;
    const res = await fetch(this.url('contacts'), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data as AkauntingContact;
  }

  async findOrCreateContact(name: string, email?: string): Promise<AkauntingContact> {
    const contacts = await this.getContacts();
    const existing = contacts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    return this.createContact(name, email);
  }

  async getInvoiceById(id: number): Promise<AkauntingInvoiceDetail> {
    const [docRes, txRes] = await Promise.all([
      fetch(this.url(`documents/${id}`, { search: 'type:invoice' }), { headers: this.headers }),
      fetch(this.url('transactions', { search: `document_id:${id} type:income` }), { headers: this.headers }),
    ]);
    if (!docRes.ok) {
      const body = await docRes.text().catch(() => '');
      throw new Error(`HTTP ${docRes.status}${body ? `: ${body}` : ''}`);
    }
    const data = await docRes.json();
    const invoice = data.data as AkauntingInvoiceDetail & { items?: unknown; transactions?: unknown };

    // normalize items
    const rawItems = invoice.items;
    if (!Array.isArray(rawItems)) {
      const obj = rawItems as Record<string, unknown> | null | undefined;
      invoice.items = Array.isArray(obj?.data)
        ? (obj.data as AkauntingInvoiceDetail['items'])
        : (Object.values(obj ?? {}).filter((v) => v && typeof v === 'object') as AkauntingInvoiceDetail['items']);
    }

    // normalize transactions — first try embedded in doc response, then from transactions API
    const rawTx = txRes.ok ? ((await txRes.json()).data ?? []) : (invoice.transactions ?? []);
    const txArr: AkauntingTransaction[] = (Array.isArray(rawTx) ? rawTx : Object.values(rawTx as object))
      .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
      .map((t) => ({
        id: t.id as number,
        paid_at: (t.paid_at as string) ?? '',
        amount: t.amount as number,
        currency_code: (t.currency_code as string) ?? invoice.currency_code,
        description: (t.description as string | null) ?? null,
        account_name: ((t.account as Record<string, unknown> | null)?.name as string | null) ?? null,
      }));
    invoice.transactions = txArr;

    return invoice;
  }

  async getInvoices(page = 1): Promise<{ data: AkauntingInvoice[]; total: number }> {
    const res = await fetch(
      this.url('documents', { search: 'type:invoice', page: String(page) }),
      { headers: this.headers }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${body ? `: ${body}` : ''}`);
    }
    const data = await res.json();
    return {
      data: (data.data ?? []) as AkauntingInvoice[],
      total: (data.meta as { total?: number })?.total ?? 0,
    };
  }

  async createInvoice(params: {
    contactId: number;
    issuedAt: string;
    dueAt: string;
    items: AkauntingInvoiceItem[];
    notes?: string;
    currencyCode?: string;
  }): Promise<AkauntingInvoice> {
    const body = {
      company_id: parseInt(this.companyId),
      type: 'invoice',
      status: 'draft',
      contact_id: params.contactId,
      issued_at: params.issuedAt,
      due_at: params.dueAt,
      currency_code: params.currencyCode ?? 'USD',
      notes: params.notes ?? '',
      items: params.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        tax_ids: [],
      })),
    };
    const res = await fetch(this.url('documents', { search: 'type:invoice' }), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data as AkauntingInvoice;
  }
}
