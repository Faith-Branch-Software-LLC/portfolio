import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { AkauntingInvoiceDetail } from './akaunting';

const TEAL    = '#5ABFB8';
const CORAL   = '#E07268';
const NAVY    = '#2D2D2D';
const GRAY    = '#6b6b6b';
const LGRAY   = '#f4f4f4';
const WHITE   = '#ffffff';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: NAVY,
    backgroundColor: WHITE,
    padding: 0,
  },

  // ── teal header band ──────────────────────────────────────────────────────
  headerBand: {
    backgroundColor: TEAL,
    padding: '28 40 24 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: WHITE,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    color: WHITE,
    opacity: 0.85,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerCompanyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: WHITE,
    marginBottom: 4,
  },
  headerCompanyDetail: {
    fontSize: 9,
    color: WHITE,
    opacity: 0.9,
    lineHeight: 1.5,
    textAlign: 'right',
  },

  // ── body ──────────────────────────────────────────────────────────────────
  body: {
    padding: '28 40',
    flex: 1,
  },

  // ── meta row (billed from / receipt info) ─────────────────────────────────
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 24,
  },
  metaBlock: { flex: 1 },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metaLine: { fontSize: 10, color: NAVY, lineHeight: 1.6 },
  metaLineBold: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY, lineHeight: 1.6 },
  metaKV: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  metaKLabel: { fontSize: 10, color: GRAY },
  metaKValue: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY },

  // ── paid stamp ────────────────────────────────────────────────────────────
  paidStampWrap: {
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  paidStamp: {
    borderWidth: 2.5,
    borderColor: TEAL,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  paidStampText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: TEAL,
    letterSpacing: 3,
  },

  // ── table ─────────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: TEAL,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  tableRowAlt: { backgroundColor: LGRAY },
  cellDesc:   { flex: 4, fontSize: 10, color: NAVY },
  cellQty:    { flex: 1, fontSize: 10, color: NAVY, textAlign: 'right' },
  cellRate:   { flex: 1.5, fontSize: 10, color: NAVY, textAlign: 'right' },
  cellAmt:    { flex: 1.5, fontSize: 10, color: NAVY, textAlign: 'right' },
  cellDescH:  { flex: 4 },
  cellQtyH:   { flex: 1, textAlign: 'right' },
  cellRateH:  { flex: 1.5, textAlign: 'right' },
  cellAmtH:   { flex: 1.5, textAlign: 'right' },

  // ── totals ────────────────────────────────────────────────────────────────
  totalsSection: {
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 28,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 220,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  subtotalLabel: { flex: 1, fontSize: 10, color: GRAY, textAlign: 'right', paddingRight: 16 },
  subtotalValue: { width: 80, fontSize: 10, color: NAVY, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: TEAL,
    width: 220,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 11, color: WHITE },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: WHITE },

  // ── payments section ──────────────────────────────────────────────────────
  paymentsBox: {
    backgroundColor: LGRAY,
    borderRadius: 4,
    padding: '10 12',
    marginBottom: 20,
  },
  paymentsTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  paymentRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paymentMeta: { fontSize: 10, color: NAVY },
  paymentMetaSub: { fontSize: 8, color: GRAY, marginTop: 1 },
  paymentAmt: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: TEAL },

  // ── coral footer band ─────────────────────────────────────────────────────
  footerBand: {
    backgroundColor: CORAL,
    padding: '14 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 9,
    color: WHITE,
    flex: 1,
    lineHeight: 1.5,
  },
  footerDate: {
    fontSize: 8,
    color: WHITE,
    opacity: 0.85,
    textAlign: 'right',
  },
});

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

interface ReceiptProps {
  invoice: AkauntingInvoiceDetail;
}

function ReceiptDocument({ invoice }: ReceiptProps) {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const transactions = Array.isArray(invoice.transactions) ? invoice.transactions : [];
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const maxTxDate = transactions.length > 0
    ? transactions.reduce((max, t) => t.paid_at > max ? t.paid_at : max, transactions[0].paid_at)
    : null;
  const paidDate = invoice.paid_at ?? maxTxDate ?? new Date().toISOString().slice(0, 10);
  const generatedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── teal header band ───────────────────────────────────────────── */}
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Payment Receipt</Text>
            <Text style={styles.headerSubtitle}>For Invoice {invoice.document_number || `#${invoice.id}`}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerCompanyName}>Faith Branch Software LLC</Text>
            <Text style={styles.headerCompanyDetail}>207 S. Roanoke Ave.</Text>
            <Text style={styles.headerCompanyDetail}>Youngstown, Ohio 44515</Text>
            <Text style={styles.headerCompanyDetail}>Tax Number: 99-3136544</Text>
            <Text style={styles.headerCompanyDetail}>3309900174</Text>
            <Text style={styles.headerCompanyDetail}>sneiswanger@faithbranch.com</Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── paid stamp ───────────────────────────────────────────────── */}
          <View style={styles.paidStampWrap}>
            <View style={styles.paidStamp}>
              <Text style={styles.paidStampText}>✓ PAID</Text>
            </View>
          </View>

          {/* ── meta row ─────────────────────────────────────────────────── */}
          <View style={styles.metaRow}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Received From</Text>
              <Text style={styles.metaLineBold}>{invoice.contact_name}</Text>
              {invoice.contact_email && <Text style={styles.metaLine}>{invoice.contact_email}</Text>}
              {invoice.contact_address && <Text style={styles.metaLine}>{invoice.contact_address}</Text>}
            </View>
            <View style={[styles.metaBlock, { flex: 1.2 }]}>
              <Text style={styles.metaLabel}>Receipt Details</Text>
              <View style={styles.metaKV}>
                <Text style={styles.metaKLabel}>Invoice Number</Text>
                <Text style={styles.metaKValue}>{invoice.document_number || `#${invoice.id}`}</Text>
              </View>
              <View style={styles.metaKV}>
                <Text style={styles.metaKLabel}>Invoice Date</Text>
                <Text style={styles.metaKValue}>{fmtDate(invoice.issued_at)}</Text>
              </View>
              <View style={styles.metaKV}>
                <Text style={styles.metaKLabel}>Payment Received</Text>
                <Text style={styles.metaKValue}>{fmtDate(paidDate)}</Text>
              </View>
            </View>
          </View>

          {/* ── line items ───────────────────────────────────────────────── */}
          {items.length > 0 && (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.cellDescH]}>Services</Text>
                <Text style={[styles.tableHeaderText, styles.cellQtyH]}>Quantity</Text>
                <Text style={[styles.tableHeaderText, styles.cellRateH]}>Rate</Text>
                <Text style={[styles.tableHeaderText, styles.cellAmtH]}>Amount</Text>
              </View>
              {items.map((item, i) => (
                <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={styles.cellDesc}>{item.name}</Text>
                  <Text style={styles.cellQty}>{item.quantity}</Text>
                  <Text style={styles.cellRate}>{fmt(item.price, invoice.currency_code)}</Text>
                  <Text style={styles.cellAmt}>{fmt(item.total, invoice.currency_code)}</Text>
                </View>
              ))}
            </>
          )}

          {/* ── totals ───────────────────────────────────────────────────── */}
          <View style={styles.totalsSection}>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal:</Text>
              <Text style={styles.subtotalValue}>{fmt(subtotal || invoice.amount, invoice.currency_code)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{fmt(invoice.amount, invoice.currency_code)}</Text>
            </View>
          </View>

          {/* ── payments breakdown ───────────────────────────────────────── */}
          {transactions.length > 0 && (
            <View style={styles.paymentsBox}>
              <Text style={styles.paymentsTitle}>
                {transactions.length > 1 ? 'Payments Received' : 'Payment Received'}
              </Text>
              {transactions.map((tx, i) => {
                const isLast = i === transactions.length - 1;
                return (
                  <View key={tx.id} style={isLast ? styles.paymentRowLast : styles.paymentRow}>
                    <View>
                      <Text style={styles.paymentMeta}>{fmtDate(tx.paid_at)}</Text>
                      {tx.account_name && (
                        <Text style={styles.paymentMetaSub}>{tx.account_name}{tx.description ? ` · ${tx.description}` : ''}</Text>
                      )}
                    </View>
                    <Text style={styles.paymentAmt}>{fmt(tx.amount, tx.currency_code)}</Text>
                  </View>
                );
              })}
            </View>
          )}

        </View>

        {/* ── coral footer band ─────────────────────────────────────────── */}
        <View style={styles.footerBand}>
          <Text style={styles.footerText}>
            Thank you for being a reliable client of Faith Branch Software LLC! We look forward to a continued partnership and pray for your continued success.
          </Text>
          <Text style={styles.footerDate}>Generated {generatedDate}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function renderReceipt(invoice: AkauntingInvoiceDetail): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument invoice={invoice} />);
}
