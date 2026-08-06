import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { PoolMonthlyReportPool } from '@/lib/actions/admin/pools';

const PURPLE = '#2E294E';
const GRAY = '#6b6580';
const LGRAY = '#f4f3f8';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: PURPLE, backgroundColor: WHITE, padding: 0 },
  headerBand: { backgroundColor: PURPLE, padding: '28 40 22 40' },
  headerTitle: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: WHITE },
  headerSubtitle: { fontSize: 11, color: WHITE, opacity: 0.85, marginTop: 4 },
  body: { padding: '28 40', flex: 1 },
  poolBlock: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e8e6f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  poolHeader: { backgroundColor: PURPLE, paddingVertical: 8, paddingHorizontal: 12 },
  poolName: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: WHITE },
  poolMeta: { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  visitBlock: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6f0',
    backgroundColor: LGRAY,
  },
  visitDate: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: PURPLE, marginBottom: 3 },
  chemicalRow: { fontSize: 9, color: GRAY },
  noChemicals: { fontSize: 9, color: GRAY, fontStyle: 'italic' },
  footer: { padding: '14 40', marginTop: 'auto' },
  footerText: { fontSize: 8, color: GRAY },
});

interface PoolMonthlyReportProps {
  monthLabel: string;
  pools: PoolMonthlyReportPool[];
}

function PoolMonthlyReportDocument({ monthLabel, pools }: PoolMonthlyReportProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <Text style={styles.headerTitle}>Pool Cleaning — Monthly Report</Text>
          <Text style={styles.headerSubtitle}>{monthLabel}</Text>
        </View>

        <View style={styles.body}>
          {pools.length === 0 ? (
            <Text style={{ fontSize: 10, color: GRAY, fontStyle: 'italic' }}>No pools cleaned this month.</Text>
          ) : (
            pools.map((pool) => (
              <View key={pool.id} style={styles.poolBlock}>
                <View style={styles.poolHeader}>
                  <Text style={styles.poolName}>{pool.name}</Text>
                  <Text style={styles.poolMeta}>
                    {pool.address}{pool.contactName ? ` · ${pool.contactName}` : ''}
                  </Text>
                </View>
                {pool.visits.map((visit) => (
                  <View key={visit.id} style={styles.visitBlock}>
                    <Text style={styles.visitDate}>
                      {new Date(visit.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </Text>
                    {visit.chemicals.length === 0 ? (
                      <Text style={styles.noChemicals}>No chemicals recorded</Text>
                    ) : (
                      visit.chemicals.map((c, i) => (
                        <Text key={i} style={styles.chemicalRow}>
                          {c.name}{c.amount ? ` — ${c.amount}` : ''}
                        </Text>
                      ))
                    )}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated {generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderPoolMonthlyReportPdf(props: PoolMonthlyReportProps): Promise<Buffer> {
  return renderToBuffer(<PoolMonthlyReportDocument {...props} />);
}
