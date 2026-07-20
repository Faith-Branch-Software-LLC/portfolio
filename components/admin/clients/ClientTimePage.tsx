'use client';

import { useState, useTransition } from 'react';
import AdminLink from '@/components/admin/AdminLink';
import { getClientTimeData } from '@/lib/actions/admin/time';
import { ClientTimePeriod, CLIENT_TIME_PERIOD_TO_PRESET } from '@/lib/time-range';
import { ChevronLeft, Clock, Copy, Check, Download } from 'lucide-react';

type Period = ClientTimePeriod;

type Entry = {
  id: string;
  date: Date;
  minutes: number;
  task: {
    title: string;
    project: { id: string; name: string };
  };
};

const PERIODS: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'yearly', label: 'This Year' },
  { value: 'lifetime', label: 'All Time' },
];

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface ClientTimePageProps {
  client: { id: string; name: string; color: string | null };
  initialEntries: Entry[];
  initialPeriod: Period;
  projects: { id: string; name: string }[];
}

export default function ClientTimePage({
  client,
  initialEntries,
  initialPeriod,
  projects,
}: ClientTimePageProps) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [projectId, setProjectId] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  const load = (newPeriod: Period, newProjectId: string) => {
    startTransition(async () => {
      const data = await getClientTimeData(
        client.id,
        newPeriod,
        newProjectId || undefined,
      );
      setEntries(data);
    });
  };

  const handlePeriod = (p: Period) => {
    setPeriod(p);
    load(p, projectId);
  };

  const handleProject = (pid: string) => {
    setProjectId(pid);
    load(period, pid);
  };

  const exportParams = () => {
    const params = new URLSearchParams({ preset: CLIENT_TIME_PERIOD_TO_PRESET[period] });
    if (projectId) params.set('projectId', projectId);
    return params;
  };

  const handleCopyText = async () => {
    setCopyState('copying');
    try {
      const params = exportParams();
      params.set('format', 'text');
      const res = await fetch(`/api/admin/clients/${client.id}/time-export?${params.toString()}`);
      if (!res.ok) throw new Error('export failed');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 1500);
    }
  };

  const pdfHref = (() => {
    const params = exportParams();
    params.set('format', 'pdf');
    return `/api/admin/clients/${client.id}/time-export?${params.toString()}`;
  })();

  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0);

  // Group by date for display
  const byDate = entries.reduce<Record<string, { date: Date; rows: Entry[] }>>((acc, e) => {
    const key = new Date(e.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = { date: new Date(e.date), rows: [] };
    acc[key].rows.push(e);
    return acc;
  }, {});

  const dateGroups = Object.values(byDate).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '18px 26px',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <AdminLink href="/admin/clients">
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#6b6580',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <ChevronLeft size={15} />
            Clients
          </button>
        </AdminLink>
        <span style={{ color: 'rgba(46,41,78,0.2)', fontSize: '16px' }}>·</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              background: client.color ?? '#888',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600,
              fontSize: '22px',
              margin: 0,
              color: '#2E294E',
            }}
          >
            {client.name} — Time
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '14px 26px',
          background: '#F4EAD4',
          borderBottom: '1.5px solid rgba(46,41,78,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {/* Period tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriod(p.value)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '12.5px',
                padding: '6px 12px',
                border: '1.5px solid #2E294E',
                borderRadius: '6px',
                cursor: 'pointer',
                background: period === p.value ? '#2E294E' : '#fff',
                color: period === p.value ? '#fff' : '#2E294E',
                transition: 'all 0.1s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Project filter */}
        {projects.length > 0 && (
          <select
            value={projectId}
            onChange={(e) => handleProject(e.target.value)}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#2E294E',
              background: '#fff',
              border: '1.5px solid rgba(46,41,78,0.28)',
              borderRadius: '6px',
              padding: '7px 10px',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All boards</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Total */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} style={{ color: '#6b6580' }} />
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
              fontSize: '15px',
              color: '#2E294E',
            }}
          >
            {isPending ? '…' : formatMinutes(totalMinutes)}
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: '11px',
              color: '#8a8499',
            }}
          >
            total
          </span>
        </div>

        {/* Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopyText}
            disabled={copyState === 'copying'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#2E294E',
              background: '#fff',
              border: '1.5px solid rgba(46,41,78,0.28)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: copyState === 'copying' ? 'default' : 'pointer',
            }}
          >
            {copyState === 'copied' ? <Check size={13} /> : <Copy size={13} />}
            {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy Text'}
          </button>
          <a
            href={pdfHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#2E294E',
              background: '#fff',
              border: '1.5px solid rgba(46,41,78,0.28)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <Download size={13} />
            Export PDF
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px' }}>
        {isPending ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#8a8499',
              fontFamily: 'Gelasio, serif',
              fontSize: '15px',
              fontStyle: 'italic',
            }}
          >
            Loading…
          </div>
        ) : dateGroups.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              color: '#8a8499',
              fontFamily: 'Gelasio, serif',
              fontSize: '15px',
              fontStyle: 'italic',
            }}
          >
            No time logged for this period.
          </div>
        ) : (
          <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dateGroups.map(({ date, rows }) => {
              const dayTotal = rows.reduce((s, r) => s + r.minutes, 0);
              const dateLabel = new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              });

              return (
                <div
                  key={new Date(date).toISOString().split('T')[0]}
                  style={{
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '10px',
                    boxShadow: '3px 3px 0 0 rgba(46,41,78,0.12)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: '#F4EAD4',
                      borderBottom: '1.5px solid rgba(46,41,78,0.1)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Fraunces, serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: '#2E294E',
                      }}
                    >
                      {dateLabel}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#2E294E',
                      }}
                    >
                      {formatMinutes(dayTotal)}
                    </span>
                  </div>

                  {/* Entries */}
                  {rows.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 16px',
                        borderBottom: '1px solid rgba(46,41,78,0.06)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '13.5px',
                            fontWeight: 600,
                            color: '#2E294E',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {entry.task.title}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: '11px',
                            color: '#8a8499',
                            marginTop: '2px',
                          }}
                        >
                          {entry.task.project.name}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 600,
                          fontSize: '13px',
                          color: '#1B998B',
                          flexShrink: 0,
                          marginLeft: '16px',
                        }}
                      >
                        {formatMinutes(entry.minutes)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
