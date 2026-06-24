'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HeatmapTweakContextValue {
  cellSize: number | null;
  gap: number | null;
  setCellSize: (n: number | null) => void;
  setGap: (n: number | null) => void;
}

const HeatmapTweakContext = createContext<HeatmapTweakContextValue>({
  cellSize: null,
  gap: null,
  setCellSize: () => {},
  setGap: () => {},
});

export function useHeatmapTweak() {
  return useContext(HeatmapTweakContext);
}

export function HeatmapTweakProvider({ children }: { children: ReactNode }) {
  const [cellSize, setCellSizeState] = useState<number | null>(null);
  const [gap, setGapState] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('heatmapTweak');
    if (stored) {
      try {
        const { cellSize: cs, gap: g } = JSON.parse(stored);
        if (typeof cs === 'number') setCellSizeState(cs);
        if (typeof g === 'number') setGapState(g);
      } catch {}
    }
  }, []);

  function setCellSize(n: number | null) {
    setCellSizeState(n);
    const current = { cellSize: n, gap };
    localStorage.setItem('heatmapTweak', JSON.stringify(current));
  }

  function setGap(n: number | null) {
    setGapState(n);
    const current = { cellSize, gap: n };
    localStorage.setItem('heatmapTweak', JSON.stringify(current));
  }

  return (
    <HeatmapTweakContext.Provider value={{ cellSize, gap, setCellSize, setGap }}>
      {children}
    </HeatmapTweakContext.Provider>
  );
}
