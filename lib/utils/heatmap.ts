export interface HeatmapGridResult {
  grid: number[][];
  alignedStart: string; // ISO date string YYYY-MM-DD (local midnight of first Sunday)
}

export function buildHeatmapGrid(
  logs: { createdAt: Date | string }[],
  projectCreatedAt: Date | string,
): HeatmapGridResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const created = new Date(projectCreatedAt);
  created.setHours(0, 0, 0, 0);

  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const startDay = created > oneYearAgo ? new Date(created) : new Date(oneYearAgo);

  const countMap = new Map<string, number>();
  for (const log of logs) {
    const d = new Date(log.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  // Align to Sunday
  const alignedStart = new Date(startDay);
  alignedStart.setDate(alignedStart.getDate() - alignedStart.getDay());
  alignedStart.setHours(0, 0, 0, 0);

  const alignedStartStr = `${alignedStart.getFullYear()}-${String(alignedStart.getMonth() + 1).padStart(2, '0')}-${String(alignedStart.getDate()).padStart(2, '0')}`;

  const grid: number[][] = [];
  const cursor = new Date(alignedStart);

  while (cursor <= today) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(cursor);
      cell.setDate(cell.getDate() + d);
      if (cell < startDay || cell > today) {
        week.push(-1);
      } else {
        const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
        week.push(countMap.get(key) ?? 0);
      }
    }
    grid.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }

  return { grid, alignedStart: alignedStartStr };
}

export function heatCellColor(count: number): string {
  if (count < 0) return 'transparent';
  if (count === 0) return 'rgba(46,41,78,0.1)';
  if (count <= 2) return '#C5D86D';
  if (count <= 5) return '#1B998B';
  return '#2E294E';
}
