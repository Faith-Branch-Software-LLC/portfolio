import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { PoolHoursSummary } from '@/lib/actions/admin/pools';
import { formatMinutes } from '@/lib/time-range';

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
  totalBox: {
    backgroundColor: LGRAY,
    borderRadius: 4,
    padding: '14 16',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.8 },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: PURPLE },
  poolBlock: { marginBottom: 18 },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PURPLE,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 3,
  },
  poolName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: WHITE },
  poolMinutes: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: WHITE },
  poolAddress: { fontSize: 9, color: GRAY, paddingHorizontal: 12, paddingTop: 6 },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6f0',
  },
  visitDate: { fontSize: 10, color: PURPLE, flex: 1 },
  visitMinutes: { fontSize: 10, color: GRAY, fontFamily: 'Helvetica-Bold' },
  footer: { padding: '14 40', marginTop: 'auto' },
  footerText: { fontSize: 8, color: GRAY },
});

interface PoolHoursReportProps {
  rangeLabel: string;
  summary: PoolHoursSummary;
}

function PoolHoursReportDocument({ rangeLabel, summary }: PoolHoursReportProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <Text style={styles.headerTitle}>Pool Cleaning — Hours</Text>
          <Text style={styles.headerSubtitle}>{rangeLabel}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Hours</Text>
            <Text style={styles.totalValue}>{formatMinutes(summary.totalMinutes)}</Text>
          </View>

          {summary.pools.length === 0 ? (
            <Text style={{ fontSize: 10, color: GRAY, fontStyle: 'italic' }}>No visits logged in this range.</Text>
          ) : (
            summary.pools.map((pool) => (
              <View key={pool.id} style={styles.poolBlock}>
                <View style={styles.poolHeader}>
                  <Text style={styles.poolName}>{pool.name}</Text>
                  <Text style={styles.poolMinutes}>{formatMinutes(pool.minutes)}</Text>
                </View>
                <Text style={styles.poolAddress}>{pool.address}</Text>
                {pool.visits.map((visit) => (
                  <View key={visit.id} style={styles.visitRow}>
                    <Text style={styles.visitDate}>
                      {new Date(visit.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </Text>
                    <Text style={styles.visitMinutes}>{formatMinutes(visit.minutes)}</Text>
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

export async function renderPoolHoursReportPdf(props: PoolHoursReportProps): Promise<Buffer> {
  return renderToBuffer(<PoolHoursReportDocument {...props} />);
}
