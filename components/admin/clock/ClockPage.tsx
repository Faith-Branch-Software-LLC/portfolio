'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTransitionRouter } from 'next-transition-router';
import { Square, Play, Clock, Settings2 } from 'lucide-react';
import { clockOut, setTimezone } from '@/lib/actions/admin/time';

type ActiveTimer = {
  id: string;
  clockedIn: Date;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  clientName: string;
  clientColor: string | null;
};

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function ElapsedTimer({ clockedIn }: { clockedIn: Date }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(clockedIn).getTime()) / 1000),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(clockedIn).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockedIn]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  if (h > 0) return <>{h}h {String(m).padStart(2, '0')}m</>;
  return <>{m}:{String(s).padStart(2, '0')}</>;
}

function TimezoneCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [allZones] = useState<string[]>(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return [
        'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
        'America/Phoenix', 'America/Anchorage', 'America/Honolulu',
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
        'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
        'Australia/Sydney', 'Pacific/Auckland', 'UTC',
      ];
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? allZones.filter((z) => z.toLowerCase().includes(query.toLowerCase()))
    : allZones;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [value]);

  const select = (tz: string) => {
    setQuery(tz);
    setOpen(false);
    onChange(tz);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '320px' }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search timezone…"
        style={{
          width: '100%',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: '#2E294E',
          background: '#fff',
          border: '1.5px solid rgba(46,41,78,0.28)',
          borderRadius: '7px',
          padding: '9px 12px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1.5px solid rgba(46,41,78,0.28)',
            borderRadius: '7px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            zIndex: 100,
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {filtered.slice(0, 80).map((tz) => (
            <button
              key={tz}
              onMouseDown={() => select(tz)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: tz === value ? '#F4EAD4' : 'transparent',
                border: 'none',
                textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#2E294E',
                cursor: 'pointer',
                fontWeight: tz === value ? 600 : 400,
              }}
            >
              {tz}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ClockPageProps {
  initialTimers: ActiveTimer[];
  initialTimezone: string;
}

export default function ClockPage({ initialTimers, initialTimezone }: ClockPageProps) {
  const router = useTransitionRouter();
  const [timers, setTimers] = useState<ActiveTimer[]>(initialTimers);
  const [timezone, setTimezoneLocal] = useState(initialTimezone);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [savingTz, setSavingTz] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClockOut = async (timerId: string) => {
    setStoppingId(timerId);
    await clockOut(timerId);
    setTimers((prev) => prev.filter((t) => t.id !== timerId));
    setStoppingId(null);
    startTransition(() => router.refresh());
  };

  const handleTimezoneChange = async (tz: string) => {
    setSavingTz(true);
    setTimezoneLocal(tz);
    await setTimezone(tz);
    setSavingTz(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        className="px-4 sm:px-[26px]"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 26px',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600,
              fontSize: '25px',
              margin: 0,
              color: '#2E294E',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Clock size={22} />
            Clock
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Courier New', monospace",
              fontSize: '12.5px',
              color: '#6b6580',
            }}
          >
            {timers.length} active timer{timers.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings2 size={16} style={{ color: '#6b6580', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: '#6b6580',
              whiteSpace: 'nowrap',
            }}
          >
            Timezone
          </span>
          <TimezoneCombobox value={timezone} onChange={handleTimezoneChange} />
          {savingTz && (
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#1B998B' }}>
              saving…
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-[24px_26px]" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {timers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '72px 0',
              color: '#8a8499',
              fontFamily: 'Gelasio, serif',
              fontSize: '15px',
              fontStyle: 'italic',
            }}
          >
            No active timers. Clock in on a task to start tracking.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '680px' }}>
            {timers.map((timer) => (
              <div
                key={timer.id}
                style={{
                  background: '#fff',
                  border: '2px solid #2E294E',
                  borderRadius: '10px',
                  boxShadow: '4px 4px 0 0 rgba(46,41,78,0.18)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '3px',
                    background: timer.clientColor ?? '#888',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  {/* Pulsing dot */}
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#1B998B',
                      flexShrink: 0,
                      animation: 'pulse 1.8s ease-in-out infinite',
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'Fraunces, serif',
                        fontWeight: 600,
                        fontSize: '15px',
                        color: '#2E294E',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {timer.taskTitle}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: '11.5px',
                        color: '#8a8499',
                        marginTop: '2px',
                      }}
                    >
                      {timer.projectName} · {timer.clientName}
                    </div>
                  </div>

                  {/* Elapsed */}
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontWeight: 700,
                      fontSize: '17px',
                      color: '#1B998B',
                      flexShrink: 0,
                      minWidth: '60px',
                      textAlign: 'right',
                    }}
                  >
                    <ElapsedTimer clockedIn={timer.clockedIn} />
                  </div>

                  {/* Stop */}
                  <button
                    onClick={() => handleClockOut(timer.id)}
                    disabled={stoppingId === timer.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: stoppingId === timer.id ? '#ccc' : '#D7263D',
                      color: '#fff',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: '13px',
                      padding: '8px 13px',
                      border: '2px solid #2E294E',
                      borderRadius: '6px',
                      boxShadow: '3px 3px 0 0 #2E294E',
                      cursor: stoppingId === timer.id ? 'default' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Square size={13} />
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
