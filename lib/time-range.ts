export type TimeRangePreset =
  | 'today'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'allTime'
  | 'custom';

export const TIME_RANGE_PRESETS: { value: TimeRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'allTime', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const PRESET_VALUES = new Set(TIME_RANGE_PRESETS.map((p) => p.value));

export function isTimeRangePreset(value: string): value is TimeRangePreset {
  return PRESET_VALUES.has(value as TimeRangePreset);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function presetRange(
  preset: TimeRangePreset,
  custom?: { from: string; to: string },
): { from: Date; to: Date } | null {
  if (preset === 'custom') {
    if (!custom?.from || !custom?.to) return null;
    const from = new Date(`${custom.from}T00:00:00`);
    const to = new Date(new Date(`${custom.to}T00:00:00`).getTime() + 24 * 60 * 60 * 1000);
    return { from, to };
  }

  const now = new Date();
  const to = new Date(startOfDay(now).getTime() + 24 * 60 * 60 * 1000);

  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to };
    case 'thisWeek': {
      const from = startOfDay(now);
      from.setDate(from.getDate() - from.getDay());
      return { from, to };
    }
    case 'lastWeek': {
      const thisWeekStart = startOfDay(now);
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      const from = new Date(thisWeekStart);
      from.setDate(from.getDate() - 7);
      return { from, to: thisWeekStart };
    }
    case 'thisMonth':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case 'lastMonth':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case 'thisYear':
      return { from: new Date(now.getFullYear(), 0, 1), to };
    case 'allTime':
      return { from: new Date(2000, 0, 1), to };
  }
}

export type ClientTimePeriod = 'lifetime' | 'yearly' | 'monthly' | 'weekly' | 'lastMonth';

export const CLIENT_TIME_PERIOD_TO_PRESET: Record<ClientTimePeriod, TimeRangePreset> = {
  lifetime: 'allTime',
  yearly: 'thisYear',
  monthly: 'thisMonth',
  weekly: 'thisWeek',
  lastMonth: 'lastMonth',
};

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function rangeLabel(preset: TimeRangePreset, from: Date, to: Date): string {
  const inclusiveEnd = new Date(to.getTime() - 24 * 60 * 60 * 1000);

  switch (preset) {
    case 'today':
      return from.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    case 'thisWeek':
    case 'lastWeek':
      return `Week of ${from.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    case 'thisMonth':
    case 'lastMonth':
      return from.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'thisYear':
      return `${from.getFullYear()}`;
    case 'allTime':
      return 'All Time';
    case 'custom': {
      const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const toStr = inclusiveEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
    }
  }
}
