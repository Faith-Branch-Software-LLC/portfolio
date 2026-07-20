import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { ClientTimeRangeSummary } from '@/lib/actions/admin/time';
import { formatMinutes } from '@/lib/time-range';

const PURPLE = '#2E294E';
const GRAY = '#6b6580';
const LGRAY = '#f4f3f8';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: PURPLE,
    backgroundColor: WHITE,
    padding: 0,
  },
  headerBand: {
    backgroundColor: PURPLE,
    padding: '28 40 22 40',
  },
  headerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: WHITE,
  },
  headerSubtitle: {
    fontSize: 11,
    color: WHITE,
    opacity: 0.85,
    marginTop: 4,
  },
  body: {
    padding: '28 40',
    flex: 1,
  },
  totalBox: {
    backgroundColor: LGRAY,
    borderRadius: 4,
    padding: '14 16',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: PURPLE,
  },
  projectBlock: {
    marginBottom: 18,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PURPLE,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 3,
  },
  projectName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: WHITE,
  },
  projectMinutes: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: WHITE,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6f0',
  },
  taskTitle: {
    fontSize: 10,
    color: PURPLE,
    flex: 1,
  },
  taskMinutes: {
    fontSize: 10,
    color: GRAY,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    padding: '14 40',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 8,
    color: GRAY,
  },
});

interface TimeReportDocumentProps {
  clientName: string;
  rangeLabel: string;
  summary: ClientTimeRangeSummary;
}

function TimeReportDocument({ clientName, rangeLabel, summary }: TimeReportDocumentProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <Text style={styles.headerTitle}>{clientName} — Work Summary</Text>
          <Text style={styles.headerSubtitle}>{rangeLabel}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Time Worked</Text>
            <Text style={styles.totalValue}>{formatMinutes(summary.totalMinutes)}</Text>
          </View>

          {summary.projects.length === 0 ? (
            <Text style={{ fontSize: 10, color: GRAY, fontStyle: 'italic' }}>
              No work logged in this range.
            </Text>
          ) : (
            summary.projects.map((project) => (
              <View key={project.id} style={styles.projectBlock}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectMinutes}>{formatMinutes(project.minutes)}</Text>
                </View>
                {project.tasks.map((task) => (
                  <View key={task.id} style={styles.taskRow}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskMinutes}>{formatMinutes(task.minutes)}</Text>
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

export async function renderTimeReportPdf(props: TimeReportDocumentProps): Promise<Buffer> {
  return renderToBuffer(<TimeReportDocument {...props} />);
}
