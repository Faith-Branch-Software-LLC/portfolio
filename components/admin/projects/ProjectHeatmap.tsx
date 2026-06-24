'use client';

import { useState, useCallback } from 'react';
import { heatCellColor } from '@/lib/utils/heatmap';
import { useHeatmapTweak } from '../HeatmapTweakContext';

interface ProjectHeatmapProps {
  grid: number[][];
  alignedStart?: string; // YYYY-MM-DD
  cellSize?: number;
  gap?: number;
  fillHeight?: boolean;
}

interface HoveredCell {
  weekIdx: number;
  dayIdx: number;
  x: number;
  yTop: number;
  yBottom: number;
}

function getCellDate(alignedStart: string, weekIdx: number, dayIdx: number): Date {
  const [y, m, d] = alignedStart.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + weekIdx * 7 + dayIdx);
  return base;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProjectHeatmap({
  grid,
  alignedStart,
  cellSize = 4,
  gap = 1,
  fillHeight = false,
}: ProjectHeatmapProps) {
  const tweak = useHeatmapTweak();
  const resolvedGap = tweak.gap ?? gap;
  const resolvedCellSize = tweak.cellSize ?? cellSize;

  const [hovered, setHovered] = useState<HoveredCell | null>(null);

  const handleEnter = useCallback((e: React.MouseEvent, weekIdx: number, dayIdx: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHovered({ weekIdx, dayIdx, x: rect.left + rect.width / 2, yTop: rect.top, yBottom: rect.bottom });
  }, []);

  const handleLeave = useCallback(() => setHovered(null), []);

  function renderTooltip() {
    if (!hovered || !alignedStart) return null;
    const count = grid[hovered.weekIdx]?.[hovered.dayIdx] ?? -1;
    if (count < 0) return null;

    const date = getCellDate(alignedStart, hovered.weekIdx, hovered.dayIdx);
    const dayLabel = DAY_LABELS[date.getDay()];
    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const countLabel = count === 0 ? 'No activity' : `${count} activit${count === 1 ? 'y' : 'ies'}`;

    const TOOLTIP_HEIGHT = 56;
    const GAP = 8;
    const above = hovered.yTop - GAP >= TOOLTIP_HEIGHT;

    return (
      <div
        style={{
          position: 'fixed',
          left: hovered.x,
          top: above ? hovered.yTop - GAP : hovered.yBottom + GAP,
          transform: above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          zIndex: 9999,
          background: '#2E294E',
          color: '#fff',
          borderRadius: '6px',
          padding: '5px 9px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700 }}>
          {dayLabel}, {dateLabel}
        </div>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: count === 0 ? 'rgba(255,255,255,0.5)' : '#C5D86D', marginTop: '1px' }}>
          {countLabel}
        </div>
        {/* Arrow */}
        <div style={{
          position: 'absolute',
          [above ? 'bottom' : 'top']: '-5px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          [above ? 'borderTop' : 'borderBottom']: '5px solid #2E294E',
        }} />
      </div>
    );
  }

  if (fillHeight) {
    return (
      <>
        <div style={{ display: 'flex', gap: `${resolvedGap}px`, height: '100%', alignItems: 'stretch' }}>
          {grid.map((week, w) => (
            <div
              key={w}
              style={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 1fr)',
                gap: `${resolvedGap}px`,
                flexShrink: 0,
              }}
            >
              {week.map((count, d) => (
                <span
                  key={d}
                  onMouseEnter={count >= 0 && alignedStart ? (e) => handleEnter(e, w, d) : undefined}
                  onMouseLeave={count >= 0 ? handleLeave : undefined}
                  style={{
                    aspectRatio: '1',
                    width: '100%',
                    borderRadius: '1px',
                    background: heatCellColor(count),
                    display: 'block',
                    cursor: count >= 0 && alignedStart ? 'default' : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        {renderTooltip()}
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: `${resolvedGap}px`, alignItems: 'flex-start', flexShrink: 0 }}>
        {grid.map((week, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: `${resolvedGap}px` }}>
            {week.map((count, d) => (
              <span
                key={d}
                onMouseEnter={count >= 0 && alignedStart ? (e) => handleEnter(e, w, d) : undefined}
                onMouseLeave={count >= 0 ? handleLeave : undefined}
                style={{
                  width: `${resolvedCellSize}px`,
                  height: `${resolvedCellSize}px`,
                  borderRadius: '1px',
                  background: heatCellColor(count),
                  display: 'inline-block',
                  flexShrink: 0,
                  cursor: count >= 0 && alignedStart ? 'default' : undefined,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {renderTooltip()}
    </>
  );
}
