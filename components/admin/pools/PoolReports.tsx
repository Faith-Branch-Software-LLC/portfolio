'use client';

import { useState } from 'react';
import { ChevronLeft, Download } from 'lucide-react';
import AdminLink from '@/components/admin/AdminLink';
import { TimeRangePreset } from '@/lib/time-range';

const HOURS_PRESETS: { value: TimeRangePreset; label: string }[] = [
  { value: 'lastTwoWeeks', label: 'Last Two Weeks' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '2px solid #2E294E',
  borderRadius: '10px',
  boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
  padding: 'clamp(16px, 4vw, 22px)',
  maxWidth: '520px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#8a8499',
  marginBottom: '7px',
};

const fieldWrapStyle: React.CSSProperties = {
  background: '#F7F3EA',
  border: '1.5px solid rgba(46,41,78,0.2)',
  borderRadius: '7px',
  padding: '11px 12px',
  minHeight: '44px',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '16px',
  color: '#2E294E',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
};

const downloadButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  minHeight: '46px',
  width: '100%',
  background: '#1B998B',
  color: '#fff',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: '14px',
  padding: '10px 16px',
  border: '2px solid #2E294E',
  borderRadius: '6px',
  boxShadow: '3px 3px 0 0 #2E294E',
  cursor: 'pointer',
  textDecoration: 'none',
  boxSizing: 'border-box',
};

export default function PoolReports() {
  const [preset, setPreset] = useState<TimeRangePreset>('lastTwoWeeks');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [month, setMonth] = useState(currentMonthValue());

  const hoursHref = (() => {
    const params = new URLSearchParams({ preset });
    if (preset === 'custom') {
      params.set('from', customFrom);
      params.set('to', customTo);
    }
    return `/api/admin/pools/reports/hours?${params.toString()}`;
  })();

  const monthlyHref = `/api/admin/pools/reports/monthly?month=${month}`;

  const hoursDisabled = preset === 'custom' && (!customFrom || !customTo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: 'clamp(10px, 3vw, 18px) clamp(14px, 4vw, 26px)',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <AdminLink href="/admin/pools">
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              minHeight: '40px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#6b6580',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '0 4px 0 0',
            }}
          >
            <ChevronLeft size={15} />
            Pools
          </button>
        </AdminLink>
        <span style={{ color: 'rgba(46,41,78,0.2)', fontSize: '16px' }}>·</span>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'clamp(18px, 5vw, 22px)', margin: 0, color: '#2E294E' }}>
          Pool Cleaning Reports
        </h1>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: 'clamp(14px, 4vw, 24px) clamp(14px, 4vw, 26px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Hours report */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '16px', margin: '0 0 4px', color: '#2E294E' }}>
            Hours Report
          </h2>
          <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', margin: '0 0 16px' }}>
            Hours logged per pool for a date range. Defaults to the last two full weeks.
          </p>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Range</label>
            <div style={fieldWrapStyle}>
              <select value={preset} onChange={(e) => setPreset(e.target.value as TimeRangePreset)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {HOURS_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {preset === 'custom' && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>From</label>
                <div style={fieldWrapStyle}>
                  <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>To</label>
                <div style={fieldWrapStyle}>
                  <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {hoursDisabled ? (
            <span style={{ ...downloadButtonStyle, opacity: 0.5, cursor: 'default', pointerEvents: 'none' }}>
              <Download size={14} />
              Download PDF
            </span>
          ) : (
            <a href={hoursHref} style={downloadButtonStyle}>
              <Download size={14} />
              Download PDF
            </a>
          )}
        </div>

        {/* Monthly report */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '16px', margin: '0 0 4px', color: '#2E294E' }}>
            Monthly Report
          </h2>
          <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', margin: '0 0 16px' }}>
            Every pool cleaned that month, with visit dates and chemicals used.
          </p>

          <div style={{ marginBottom: '16px', maxWidth: '220px' }}>
            <label style={labelStyle}>Month</label>
            <div style={fieldWrapStyle}>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <a href={monthlyHref} style={downloadButtonStyle}>
            <Download size={14} />
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}
