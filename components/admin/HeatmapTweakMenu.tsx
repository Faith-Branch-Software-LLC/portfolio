'use client';

import { useState } from 'react';
import { useHeatmapTweak } from './HeatmapTweakContext';

export default function HeatmapTweakMenu() {
  const { cellSize, gap, setCellSize, setGap } = useHeatmapTweak();
  const [open, setOpen] = useState(false);

  const cs = cellSize ?? '—';
  const g = gap ?? '—';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '18px',
        right: '18px',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {open && (
        <div
          style={{
            background: '#fff',
            border: '2px solid #2E294E',
            borderRadius: '10px',
            boxShadow: '4px 4px 0 0 rgba(46,41,78,0.22)',
            padding: '14px 16px',
            width: '220px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2E294E', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Heatmap Tweak
          </div>

          {/* Cell size */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: '#6b6580', fontWeight: 600 }}>Cell size</label>
              <span style={{ fontSize: '12px', fontFamily: "'Courier New', monospace", color: '#2E294E', fontWeight: 700 }}>
                {cellSize ?? 'default'}px
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={20}
              step={1}
              value={cellSize ?? 8}
              onChange={(e) => setCellSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1B998B' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
              <span>3</span><span>20</span>
            </div>
          </div>

          {/* Gap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: '#6b6580', fontWeight: 600 }}>Gap</label>
              <span style={{ fontSize: '12px', fontFamily: "'Courier New', monospace", color: '#2E294E', fontWeight: 700 }}>
                {gap ?? 'default'}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={gap ?? 1}
              onChange={(e) => setGap(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1B998B' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
              <span>0</span><span>4</span>
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setCellSize(null); setGap(null); }}
            style={{
              background: 'rgba(46,41,78,0.08)',
              border: '1.5px solid rgba(46,41,78,0.2)',
              borderRadius: '5px',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#2E294E',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            Reset to defaults
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title="Heatmap size tweaks"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: open ? '#2E294E' : '#fff',
          border: '2px solid #2E294E',
          boxShadow: '3px 3px 0 0 rgba(46,41,78,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          color: open ? '#fff' : '#2E294E',
          transition: 'all 0.15s',
        }}
      >
        ▦
      </button>
    </div>
  );
}
