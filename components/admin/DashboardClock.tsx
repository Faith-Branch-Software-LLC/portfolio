'use client';

import { useEffect, useState } from 'react';

function formatInET(date: Date) {
  const dateStr = date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // EST vs EDT
  const etLabel = date
    .toLocaleDateString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' })
    .split(', ')
    .pop() ?? 'ET';

  return { dateStr, timeStr, etLabel };
}

export default function DashboardClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const { dateStr, timeStr, etLabel } = formatInET(now);

  return (
    <div className="mb-2">
      <p className="text-2xl font-fraunces font-semibold">{dateStr}</p>
      <p className="text-sm text-gray-400 mt-0.5">
        {timeStr} <span className="text-xs">{etLabel}</span>
      </p>
    </div>
  );
}
