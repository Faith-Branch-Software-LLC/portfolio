'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Download, Copy, Check } from 'lucide-react';
import { getClientTimeRangeSummary } from '@/lib/actions/admin/time';
import { TIME_RANGE_PRESETS, TimeRangePreset, presetRange, formatMinutes } from '@/lib/time-range';

const selectClass =
  'text-sm rounded-lg border border-black/10 bg-gray-50 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/10';

const exportButtonClass =
  'inline-flex items-center gap-1.5 text-sm rounded-lg border border-black/10 bg-gray-50 px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50';

interface TimeRangeSummaryProps {
  clientId: string;
}

export default function TimeRangeSummary({ clientId }: TimeRangeSummaryProps) {
  const [preset, setPreset] = useState<TimeRangePreset>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getClientTimeRangeSummary>> | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  const range = useMemo(
    () => presetRange(preset, { from: customFrom, to: customTo }),
    [preset, customFrom, customTo],
  );

  useEffect(() => {
    if (!range) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getClientTimeRangeSummary(clientId, range.from, range.to).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, range]);

  const exportParams = useMemo(() => {
    const params = new URLSearchParams({ preset });
    if (preset === 'custom') {
      if (!customFrom || !customTo) return null;
      params.set('from', customFrom);
      params.set('to', customTo);
    }
    return params;
  }, [preset, customFrom, customTo]);

  const handleCopyText = async () => {
    if (!exportParams) return;
    setCopyState('copying');
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/time-export?${exportParams.toString()}&format=text`);
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

  return (
    <div className="bg-white rounded-xl border border-black/10 p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-semibold text-gray-500">Work Summary</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as TimeRangePreset)}
            className={selectClass}
          >
            {TIME_RANGE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={selectClass}
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className={selectClass}
              />
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : !data || data.totalMinutes === 0 ? (
        <p className="text-sm text-gray-400 italic">No work logged in this range.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-3xl font-fraunces font-semibold">{formatMinutes(data.totalMinutes)}</p>
          <div className="space-y-2">
            {data.projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{p.name}</span>
                <span className="text-gray-500 font-medium">{formatMinutes(p.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {exportParams && data && data.totalMinutes > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-black/5">
          <button
            type="button"
            onClick={handleCopyText}
            disabled={copyState === 'copying'}
            className={exportButtonClass}
          >
            {copyState === 'copied' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy Text'}
          </button>
          <a
            href={`/api/admin/clients/${clientId}/time-export?${exportParams.toString()}&format=pdf`}
            className={exportButtonClass}
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </a>
        </div>
      )}
    </div>
  );
}
