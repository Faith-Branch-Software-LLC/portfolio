'use client';

import { useEffect, useState } from 'react';

function formatInET(date: Date) {
  const dateStr = date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const etLabel =
    date
      .toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short',
      })
      .split(', ')
      .pop() ?? 'ET';

  return { dateStr, timeStr, etLabel };
}

interface DashboardClockProps {
  taskCount?: number;
}

export default function DashboardClock({ taskCount }: DashboardClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const { dateStr, timeStr, etLabel } = formatInET(now);

  return (
    <div>
      <h1
        className="text-[18px] sm:text-[25px]"
        style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.01em',
          color: '#2E294E',
        }}
      >
        {dateStr}
      </h1>
      <p
        style={{
          margin: '2px 0 0',
          fontFamily: "'Courier New', monospace",
          fontSize: '12.5px',
          color: '#6b6580',
        }}
      >
        {timeStr} {etLabel}
        {taskCount !== undefined && taskCount > 0 && (
          <> · {taskCount} task{taskCount !== 1 ? 's' : ''} in flight</>
        )}
      </p>
    </div>
  );
}
