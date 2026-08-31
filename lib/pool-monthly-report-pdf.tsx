import { Document, Page, Text, View, StyleSheet, Svg, Rect, Circle, Polyline, renderToBuffer } from '@react-pdf/renderer';
import type { PoolMonthlyReportPool, PoolMonthlyReportVisit } from '@/lib/actions/admin/pools';

const PURPLE = '#2E294E';
const GRAY = '#6b6580';
const LGRAY = '#f4f3f8';
const WHITE = '#ffffff';
const TEAL = '#1B998B';
const RED = '#D7263D';
const OLIVE = '#C5D86D';

const CHART_CARD_WIDTH = 150;
const CHART_WIDTH = 138;
const CHART_PLOT_WIDTH = 128;
const CHART_PLOT_HEIGHT = 32;
const CHART_PAD_X = 5;
const CHART_PAD_Y = 4;

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: PURPLE, backgroundColor: WHITE, padding: 0 },
  headerBand: { backgroundColor: PURPLE, padding: '28 40 22 40' },
  headerName: { fontFamily: 'Helvetica-Bold', fontSize: 26, color: WHITE },
  headerSubtitle: { fontSize: 13, color: WHITE, opacity: 0.9, marginTop: 6 },
  headerMonth: { fontSize: 10, color: WHITE, opacity: 0.7, marginTop: 2 },
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
  chartsSection: { padding: 12, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#e8e6f0' },
  chartsSectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: GRAY, marginBottom: 6, letterSpacing: 0.5 },
  chartsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chartCard: {
    width: CHART_CARD_WIDTH,
    borderWidth: 1,
    borderColor: '#e8e6f0',
    borderRadius: 4,
    padding: 6,
  },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 },
  chartName: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: PURPLE },
  chartValue: { fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  chartLegendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  chartLegendDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: OLIVE },
  chartLegendText: { fontSize: 6, color: GRAY, marginLeft: 3 },
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

const A4_HEIGHT = 841.89;
const BODY_VPADDING = 56;
const PAGE_RESERVE = 40;
const USABLE_PAGE_HEIGHT = A4_HEIGHT - BODY_VPADDING - PAGE_RESERVE;

interface Metric {
  key: string;
  label: string;
  unit: string;
  good: [number, number];
  rangeLabel: string;
  read: (visit: PoolMonthlyReportVisit) => number | null;
}

/** Converts a salt cell's dial reading (~2.0-8.4) to ppm per the test kit's conversion chart. */
const SALT_TABLE: [number, number][] = [
  [2.0, 380], [2.2, 430], [2.4, 480], [2.6, 540], [2.8, 600],
  [3.0, 670], [3.2, 730], [3.4, 810], [3.6, 880], [3.8, 970],
  [4.0, 1050], [4.2, 1150], [4.4, 1240], [4.6, 1350], [4.8, 1460],
  [5.0, 1590], [5.2, 1720], [5.4, 1860], [5.6, 2010], [5.8, 2180],
  [6.0, 2360], [6.2, 2560], [6.4, 2770], [6.6, 3010], [6.8, 3270],
  [7.0, 3570], [7.2, 3890], [7.4, 4250], [7.6, 4660], [7.8, 5130],
  [8.0, 5670], [8.2, 6280], [8.4, 7010],
];

function saltPpmForDial(dial: number): number {
  const first = SALT_TABLE[0];
  const last = SALT_TABLE[SALT_TABLE.length - 1];
  if (dial <= first[0]) return first[1];
  if (dial >= last[0]) return last[1];
  for (let i = 0; i < SALT_TABLE.length - 1; i++) {
    const [aDial, aPpm] = SALT_TABLE[i];
    const [bDial, bPpm] = SALT_TABLE[i + 1];
    if (dial >= aDial && dial <= bDial) {
      const t = (dial - aDial) / (bDial - aDial);
      return aPpm + (bPpm - aPpm) * t;
    }
  }
  return dial;
}

function normalizedSaltPpm(raw: number): number {
  return raw <= 10 ? saltPpmForDial(raw) : raw;
}

function parseReading(raw: string | null): number | null {
  if (!raw) return null;
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

const METRICS: Metric[] = [
  {
    key: 'salt',
    label: 'Salt',
    unit: 'ppm',
    good: [2800, 3200],
    rangeLabel: 'Target',
    read: (v) => {
      const raw = parseReading(v.saltReading);
      return raw === null ? null : normalizedSaltPpm(raw);
    },
  },
  { key: 'ph', label: 'pH', unit: '', good: [7, 8.1], rangeLabel: 'Good', read: (v) => parseReading(v.phReading) },
  { key: 'chlorine', label: 'Chlorine', unit: 'ppm', good: [0.6, 4], rangeLabel: 'Good', read: (v) => parseReading(v.chlorineReading) },
  { key: 'alkalinity', label: 'Alkalinity', unit: 'ppm', good: [60, 150], rangeLabel: 'Good', read: (v) => parseReading(v.alkalinityReading) },
  { key: 'stabilizer', label: 'Stabilizer', unit: 'ppm', good: [30, 125], rangeLabel: 'Good', read: (v) => parseReading(v.stabilizerReading) },
];

function formatNum(value: number): string {
  return Math.abs(value - Math.round(value)) < 0.05 ? String(Math.round(value)) : value.toFixed(1);
}

interface MetricPoint {
  value: number;
}

function ChemicalTrendChart({ metric, points }: { metric: Metric; points: MetricPoint[] }) {
  const [goodLow, goodHigh] = metric.good;
  const dataMin = Math.min(...points.map((p) => p.value));
  const dataMax = Math.max(...points.map((p) => p.value));
  const low = Math.min(dataMin, goodLow);
  const high = Math.max(dataMax, goodHigh);
  const span = high - low;
  const pad = span > 0 ? span * 0.08 : Math.max(Math.abs(high) * 0.08, 1);
  const yMin = low - pad;
  const yMax = high + pad;

  const toX = (i: number) => CHART_PAD_X + (points.length === 1 ? 0 : (i / (points.length - 1)) * CHART_PLOT_WIDTH);
  const toY = (value: number) => CHART_PAD_Y + (1 - (value - yMin) / (yMax - yMin)) * CHART_PLOT_HEIGHT;

  const bandY1 = toY(goodHigh);
  const bandY2 = toY(goodLow);
  const linePoints = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ');
  const latest = points[points.length - 1];
  const latestInRange = latest.value >= goodLow && latest.value <= goodHigh;

  return (
    <View style={styles.chartCard} wrap={false}>
      <View style={styles.chartHeaderRow}>
        <Text style={styles.chartName}>{metric.label}</Text>
        <Text style={{ ...styles.chartValue, color: latestInRange ? TEAL : RED }}>
          {formatNum(latest.value)}{metric.unit ? ` ${metric.unit}` : ''}
        </Text>
      </View>
      <Svg
        width={CHART_WIDTH}
        height={CHART_PLOT_HEIGHT + CHART_PAD_Y * 2}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_PLOT_HEIGHT + CHART_PAD_Y * 2}`}
      >
        <Rect x={CHART_PAD_X} y={bandY1} width={CHART_PLOT_WIDTH} height={Math.max(bandY2 - bandY1, 0.5)} fill={OLIVE} fillOpacity={0.28} />
        <Polyline points={linePoints} stroke={TEAL} strokeWidth={1.5} fill="none" />
        {points.map((p, i) => (
          <Circle key={i} cx={toX(i)} cy={toY(p.value)} r={2} fill={p.value >= goodLow && p.value <= goodHigh ? TEAL : RED} />
        ))}
      </Svg>
      <View style={styles.chartLegendRow}>
        <View style={styles.chartLegendDot} />
        <Text style={styles.chartLegendText}>
          {metric.rangeLabel} {formatNum(goodLow)}–{formatNum(goodHigh)}{metric.unit ? ` ${metric.unit}` : ''}
        </Text>
      </View>
    </View>
  );
}

function poolMetricSeries(pool: PoolMonthlyReportPool) {
  return METRICS.map((metric) => ({
    metric,
    points: pool.visits
      .map((v) => metric.read(v))
      .filter((value): value is number => value !== null)
      .map((value) => ({ value })),
  })).filter((s) => s.points.length >= 2);
}

/**
 * Content-height estimates (with safety margin) used to decide whether a chunk of the report
 * can be kept together on one page without risking a chunk larger than a page — react-pdf
 * can't paginate a non-wrapping node, so an oversized one must fall back to normal wrapping.
 */
const CHARTS_PER_ROW = 3;
const CHART_CARD_HEIGHT = 12 /* padding */ + 12 /* header row */ + (CHART_PLOT_HEIGHT + CHART_PAD_Y * 2) /* svg */ + 10 /* legend */;
const CHART_ROW_GAP = 8;

function estimateHeaderHeight(chartCount: number): number {
  const headerHeight = 43;
  const rows = Math.ceil(chartCount / CHARTS_PER_ROW);
  const chartsHeight =
    chartCount > 0 ? 24 /* section padding */ + 15 /* section title */ + rows * CHART_CARD_HEIGHT + (rows - 1) * CHART_ROW_GAP : 0;
  return (headerHeight + chartsHeight) * 1.1;
}

function estimateVisitHeight(visit: PoolMonthlyReportVisit): number {
  const chemLines = Math.max(1, visit.chemicals.length);
  return (30 + chemLines * 11) * 1.1;
}

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
          <Text style={styles.headerName}>Sebastian Neiswanger</Text>
          <Text style={styles.headerSubtitle}>Pool Cleaning — Monthly Report</Text>
          <Text style={styles.headerMonth}>{monthLabel}</Text>
        </View>

        <View style={styles.body}>
          {pools.length === 0 ? (
            <Text style={{ fontSize: 10, color: GRAY, fontStyle: 'italic' }}>No pools cleaned this month.</Text>
          ) : (
            pools.map((pool) => {
              const series = poolMetricSeries(pool);
              const headerTooBigForOwnPage = estimateHeaderHeight(series.length) > USABLE_PAGE_HEIGHT;

              return (
                <View key={pool.id} style={styles.poolBlock}>
                  <View wrap={!headerTooBigForOwnPage}>
                    <View style={styles.poolHeader}>
                      <Text style={styles.poolName}>{pool.name}</Text>
                      <Text style={styles.poolMeta}>
                        {pool.address}{pool.contactName ? ` · ${pool.contactName}` : ''}
                      </Text>
                    </View>

                    {series.length > 0 && (
                      <View style={styles.chartsSection}>
                        <Text style={styles.chartsSectionTitle}>CHEMICAL LEVELS THIS MONTH</Text>
                        <View style={styles.chartsGrid}>
                          {series.map(({ metric, points }) => (
                            <ChemicalTrendChart key={metric.key} metric={metric} points={points} />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {pool.visits.map((visit) => {
                    const visitTooBigForOwnPage = estimateVisitHeight(visit) > USABLE_PAGE_HEIGHT;
                    return (
                      <View key={visit.id} style={styles.visitBlock} wrap={!visitTooBigForOwnPage}>
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
                    );
                  })}
                </View>
              );
            })
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
