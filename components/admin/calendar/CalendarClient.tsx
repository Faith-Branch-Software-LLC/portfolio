'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
  Plug,
  Plus,
  Loader2,
  RefreshCw,
  Settings,
  Video,
  Link as LinkIcon,
  Flag,
} from 'lucide-react';
import { useTransitionRouter } from 'next-transition-router';
import type { NormalizedEvent, CacheEntry, AppleCalendarInfo, AppleCalendarSetting, GoogleCalendarInfo, GoogleCalendarSetting } from '@/lib/types/calendar';

// ─── types ────────────────────────────────────────────────────────────────────

interface CalSource {
  id: string;
  name: string;
  type: 'google' | 'apple';
  color: string;
}

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  sourceId: string;
  calendarName: string;
  calendarColor: string;
  location?: string;
  description?: string;
  url?: string;
  meetingUrl?: string;
  googleEventId?: string;
  appleHref?: string;
  taskHref?: string;
}

type ViewMode = 'month' | 'week' | '2day';

interface TaskDueEvent {
  id: string;
  title: string;
  due: string;
  projectId: string;
  projectName: string;
  color: string;
}

interface Props {
  googleCalSources: { id: string; name: string }[];
  appleCalSources: { id: string; name: string }[];
  taskDueEvents?: TaskDueEvent[];
}

// ─── constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_PX = 56;
const GUTTER_PX = 52;

const GOOGLE_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335'];
const APPLE_COLORS  = ['#1B998B', '#9B3D7A', '#7A5C1B', '#1B5F9B'];

const COLOR_PRESETS = [
  '#4285F4','#34A853','#FBBC05','#EA4335','#9B59B6',
  '#1B998B','#E67E22','#E91E63','#00BCD4','#FF5722',
  '#607D8B','#3F51B5','#009688','#8BC34A','#FF9800','#795548',
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtTime(d: Date) {
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2,'0') : ''} ${h >= 12 ? 'PM' : 'AM'}`;
}
function fmtDate(d: Date) { return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function toLocalDatetimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// True if event falls on the given day (handles multi-day all-day events)
function eventOnDay(ev: CalEvent, day: Date): boolean {
  const dayStart = startOfDay(day);
  if (ev.allDay) {
    const evStart = startOfDay(ev.start);
    // iCal all-day end is exclusive; ensure at least 1 day duration
    const evEnd   = startOfDay(ev.end);
    const effectiveEnd = evEnd <= evStart ? addDays(evStart, 1) : evEnd;
    return evStart <= dayStart && dayStart < effectiveEnd;
  }
  return sameDay(ev.start, day);
}

// Convert server NormalizedEvent (ISO strings) → CalEvent (Date objects)
function normalizedToCalEvent(ev: NormalizedEvent, sourceId: string): CalEvent {
  const parseDate = (iso: string, allDay: boolean): Date => {
    if (allDay && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(iso);
  };
  return {
    id: ev.id,
    title: ev.title,
    start: parseDate(ev.startIso, ev.allDay),
    end:   parseDate(ev.endIso,   ev.allDay),
    allDay: ev.allDay,
    sourceId,
    calendarName: ev.calendarName,
    calendarColor: ev.calendarColor,
    location: ev.location,
    description: ev.description,
    url: ev.url,
    meetingUrl: ev.meetingUrl,
    googleEventId: ev.googleEventId,
    appleHref: ev.appleHref,
  };
}

// ─── demo events ──────────────────────────────────────────────────────────────

function getDemoEvents(today: Date): CalEvent[] {
  const d = (offset: number, h: number, m = 0) => { const dt = addDays(today, offset); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), h, m); };
  return [
    { id:'d1', title:'Grace — sprint review', start:d(2,10,0), end:d(2,11,0), allDay:false, sourceId:'demo-g', calendarName:'Google', calendarColor:'#4285F4', location:'Google Meet', meetingUrl:'https://meet.google.com/demo' },
    { id:'d2', title:'Team trip', start:d(4,0,0), end:d(7,0,0), allDay:true, sourceId:'demo-a', calendarName:'Family', calendarColor:'#1B998B' },
    { id:'d3', title:'Design review', start:d(7,9,0), end:d(7,10,0), allDay:false, sourceId:'demo-a', calendarName:'Personal', calendarColor:'#E67E22' },
    { id:'d4', title:'Team standup', start:d(0,9,30), end:d(0,10,0), allDay:false, sourceId:'demo-g', calendarName:'Google', calendarColor:'#4285F4' },
    { id:'d5', title:'Client proposal deadline', start:d(10,0,0), end:d(10,0,0), allDay:true, sourceId:'demo-a', calendarName:'Personal', calendarColor:'#E67E22' },
    { id:'d6', title:'Weekly sync', start:d(1,13,0), end:d(1,14,0), allDay:false, sourceId:'demo-g', calendarName:'Neisroad', calendarColor:'#34A853', meetingUrl:'https://zoom.us/j/demo' },
  ];
}

// ─── style primitives ─────────────────────────────────────────────────────────

const btn = (bg = '#2E294E', fg = '#fff') => ({
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: '6px',
  background: bg,
  color: fg,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600 as const,
  fontSize: '13px',
  padding: '8px 15px',
  border: '2px solid #2E294E',
  borderRadius: '7px',
  boxShadow: '3px 3px 0 0 rgba(46,41,78,0.22)',
  cursor: 'pointer' as const,
});

const inputStyle = {
  width: '100%',
  padding: '8px 11px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13.5px',
  border: '1.5px solid rgba(46,41,78,0.3)',
  borderRadius: '6px',
  background: '#fff',
  color: '#2E294E',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12px',
  fontWeight: 600 as const,
  color: '#2E294E',
  display: 'block' as const,
  marginBottom: '4px',
};

// ─── ModeBtn ──────────────────────────────────────────────────────────────────

function ModeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#2E294E' : '#6b6580', background: active ? '#ffffff' : 'transparent', border: active ? '1.5px solid #2E294E' : '1.5px solid transparent', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', boxShadow: active ? '2px 2px 0 0 rgba(46,41,78,0.2)' : 'none' }}>
      {label}
    </button>
  );
}

// ─── EventChip ────────────────────────────────────────────────────────────────

function EventChip({ ev, onClick, multiDay }: { ev: CalEvent; onClick: () => void; multiDay?: boolean }) {
  const isTask = !!ev.taskHref;
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 5px', borderRadius: '4px', background: `${ev.calendarColor}18`, border: `1px solid ${ev.calendarColor}44`, cursor: 'pointer', minWidth: 0, borderLeft: multiDay ? `3px solid ${ev.calendarColor}` : undefined }}>
      {isTask
        ? <Flag size={8} color={ev.calendarColor} style={{ flexShrink: 0 }} />
        : <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: ev.calendarColor, flexShrink: 0 }} />
      }
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: '#2E294E' }}>{ev.title}</span>
      {!ev.allDay && <span style={{ fontFamily: "'Courier New', monospace", fontSize: '9px', color: '#8a8499', flexShrink: 0 }}>{fmtTime(ev.start)}</span>}
      {ev.meetingUrl && <span style={{ color: ev.calendarColor, flexShrink: 0, display: 'inline-flex' }}><Video size={9} /></span>}
    </div>
  );
}

// ─── EventSheet ───────────────────────────────────────────────────────────────

function EventSheet({ ev, onClose }: { ev: CalEvent; onClose: () => void }) {
  const isMultiDay = ev.allDay && !sameDay(ev.start, addDays(ev.end, -1));
  const endDisplay = isMultiDay ? addDays(ev.end, -1) : ev.end; // end is exclusive, show last day

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.32)', zIndex: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FBF7EE', borderTop: '3px solid #2E294E', borderRadius: '18px 18px 0 0', boxShadow: '0 -8px 30px rgba(46,41,78,0.25)', padding: '14px 26px 32px', animation: 'sheetUp 0.26s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div style={{ width: '42px', height: '5px', borderRadius: '3px', background: 'rgba(46,41,78,0.25)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '13px', maxWidth: '560px', margin: '0 auto' }}>
          {ev.taskHref
            ? <Flag size={14} color={ev.calendarColor} style={{ flexShrink: 0, marginTop: '6px' }} />
            : <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: ev.calendarColor, flexShrink: 0, marginTop: '6px' }} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '21px', margin: 0, color: '#2E294E' }}>{ev.title}</h2>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#6b6580', marginTop: '3px' }}>{ev.calendarName}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '16px' }}>
              {/* Date / time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b3550' }}>
                <span style={{ color: '#8a8499', display: 'inline-flex' }}><Calendar size={16} /></span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px' }}>
                  {ev.allDay
                    ? isMultiDay
                      ? `${fmtDate(ev.start)} – ${fmtDate(endDisplay)} · All day`
                      : `${fmtDate(ev.start)} · All day`
                    : fmtDate(ev.start)}
                </span>
              </div>
              {!ev.allDay && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b3550' }}>
                  <span style={{ color: '#8a8499', display: 'inline-flex' }}><Clock size={16} /></span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px' }}>{fmtTime(ev.start)} – {fmtTime(ev.end)}</span>
                </div>
              )}
              {ev.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b3550' }}>
                  <span style={{ color: '#8a8499', display: 'inline-flex' }}><MapPin size={16} /></span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px' }}>{ev.location}</span>
                </div>
              )}
              {/* Meeting link */}
              {ev.meetingUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#8a8499', display: 'inline-flex' }}><Video size={16} /></span>
                  <a href={ev.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: ev.calendarColor, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    Join meeting
                  </a>
                </div>
              )}
              {/* URL */}
              {ev.url && !ev.meetingUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#8a8499', display: 'inline-flex' }}><LinkIcon size={16} /></span>
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#2E294E', textDecoration: 'underline', wordBreak: 'break-all' }}>{ev.url}</a>
                </div>
              )}
              {/* Task link */}
              {ev.taskHref && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#8a8499', display: 'inline-flex' }}><Flag size={16} /></span>
                  <a href={ev.taskHref} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: ev.calendarColor, fontWeight: 600, textDecoration: 'none' }}>
                    Go to task →
                  </a>
                </div>
              )}
            </div>
            {ev.description && (
              <p style={{ fontFamily: 'Gelasio, serif', fontSize: '14px', lineHeight: 1.55, color: '#3b3550', margin: '16px 0 0', whiteSpace: 'pre-wrap' }}>
                {ev.description.length > 400 ? ev.description.slice(0,400) + '…' : ev.description}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#fff', border: '2px solid #2E294E', borderRadius: '8px', boxShadow: '2px 2px 0 0 rgba(46,41,78,0.2)', cursor: 'pointer', color: '#2E294E', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NewEventModal ────────────────────────────────────────────────────────────

function NewEventModal({ sources, defaultStart, onClose, onCreated }: {
  sources: CalSource[];
  defaultStart: Date | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const defaultDt  = defaultStart ?? new Date();
  const defaultEnd = new Date(defaultDt.getTime() + 60 * 60 * 1000);

  const [title, setTitle]           = useState('');
  const [sourceId, setSourceId]     = useState(sources[0]?.id ?? '');
  const [allDay, setAllDay]         = useState(false);
  const [startStr, setStartStr]     = useState(toLocalDatetimeInput(defaultDt));
  const [endStr, setEndStr]         = useState(toLocalDatetimeInput(defaultEnd));
  const [location, setLocation]     = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');

  async function submit() {
    if (!title.trim()) { setErr('Title required'); return; }
    if (!sourceId) { setErr('Select a calendar'); return; }
    setLoading(true); setErr('');
    const source = sources.find((s) => s.id === sourceId);
    if (!source) { setErr('Invalid calendar'); setLoading(false); return; }

    const startIso = allDay ? startStr.slice(0,10) : new Date(startStr).toISOString();
    const endIso   = allDay ? endStr.slice(0,10)   : new Date(endStr).toISOString();
    const body = { title: title.trim(), startIso, endIso, allDay, location: location || undefined, description: description || undefined };
    const endpoint = source.type === 'google'
      ? `/api/integrations/google-calendar/${sourceId}/events`
      : `/api/integrations/apple-calendar/${sourceId}/events`;

    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setLoading(false);
    if (res.ok) { onCreated(); onClose(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'Failed to create event'); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FBF7EE', border: '2px solid #2E294E', borderRadius: '14px', boxShadow: '8px 8px 0 0 rgba(46,41,78,0.22)', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1.5px solid rgba(46,41,78,0.15)' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '19px', color: '#2E294E', margin: 0 }}>New event</h2>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#fff', border: '1.5px solid #2E294E', borderRadius: '7px', cursor: 'pointer', color: '#2E294E' }}><X size={15} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Calendar</label>
            <select style={inputStyle} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              {sources.map((s) => <option key={s.id} value={s.id}>[{s.type === 'google' ? 'Google' : 'Apple'}] {s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="allDay" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            <label htmlFor="allDay" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#2E294E', cursor: 'pointer' }}>All day</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Start</label><input style={inputStyle} type={allDay ? 'date' : 'datetime-local'} value={allDay ? startStr.slice(0,10) : startStr} onChange={(e) => setStartStr(e.target.value)} /></div>
            <div><label style={labelStyle}>End</label><input style={inputStyle} type={allDay ? 'date' : 'datetime-local'} value={allDay ? endStr.slice(0,10) : endStr} onChange={(e) => setEndStr(e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Location (optional)</label><input style={inputStyle} placeholder="Zoom, office, etc." value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div><label style={labelStyle}>Notes (optional)</label><textarea style={{ ...inputStyle, height: '70px', resize: 'vertical' }} placeholder="Add notes…" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          {err && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', margin: 0 }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={btn('#1B998B')} onClick={submit} disabled={loading}>
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
              {loading ? 'Creating…' : 'Create event'}
            </button>
            <button style={{ ...btn('#fff', '#2E294E'), boxShadow: 'none' }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CalendarSettingsPanel ────────────────────────────────────────────────────

function CalendarRow({
  name, color, enabled, pickerKey, activePicker, onPickerToggle, onColorChange, onEnabledChange,
}: {
  name: string; color: string; enabled: boolean; pickerKey: string;
  activePicker: string | null;
  onPickerToggle: (k: string) => void;
  onColorChange: (c: string) => void;
  onEnabledChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(46,41,78,0.08)', position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onPickerToggle(pickerKey)}
          style={{ width: '22px', height: '22px', borderRadius: '50%', background: color, border: '2px solid #2E294E', cursor: 'pointer', flexShrink: 0, display: 'inline-block', boxShadow: '1px 1px 0 0 rgba(46,41,78,0.2)' }}
        />
        {activePicker === pickerKey && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: '28px', left: 0, zIndex: 60, background: '#FBF7EE', border: '2px solid #2E294E', borderRadius: '8px', boxShadow: '4px 4px 0 0 rgba(46,41,78,0.2)', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px', width: '120px' }}
          >
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => { onColorChange(c); onPickerToggle(''); }} style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, border: c === color ? '2.5px solid #2E294E' : '1.5px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        )}
      </div>
      <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#2E294E', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6b6580' }}>Show</span>
      </label>
    </div>
  );
}

function CalendarSettingsPanel({
  googleCalSources,
  appleCalSources,
  onClose,
  onSaved,
}: {
  googleCalSources: { id: string; name: string }[];
  appleCalSources: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [googleInfos, setGoogleInfos] = useState<Record<string, GoogleCalendarInfo[]>>({});
  const [appleInfos, setAppleInfos] = useState<Record<string, AppleCalendarInfo[]>>({});
  const [googleDraft, setGoogleDraft] = useState<Record<string, Record<string, GoogleCalendarSetting>>>({});
  const [appleDraft, setAppleDraft] = useState<Record<string, Record<string, AppleCalendarSetting>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const gInfos: typeof googleInfos = {};
      const aInfos: typeof appleInfos = {};
      const gDraft: typeof googleDraft = {};
      const aDraft: typeof appleDraft = {};

      await Promise.all([
        ...googleCalSources.map(async (src) => {
          try {
            const res = await fetch(`/api/integrations/google-calendar/${src.id}/calendars`);
            if (res.ok) {
              const { calendars } = await res.json() as { calendars: GoogleCalendarInfo[] };
              gInfos[src.id] = calendars;
              gDraft[src.id] = Object.fromEntries(calendars.map((c) => [c.id, { color: c.color, enabled: c.enabled }]));
            }
          } catch {}
        }),
        ...appleCalSources.map(async (src) => {
          try {
            const res = await fetch(`/api/integrations/apple-calendar/${src.id}/calendars`);
            if (res.ok) {
              const { calendars } = await res.json() as { calendars: AppleCalendarInfo[] };
              aInfos[src.id] = calendars;
              aDraft[src.id] = Object.fromEntries(calendars.map((c) => [c.name, { color: c.color, enabled: c.enabled, order: c.order }]));
            }
          } catch {}
        }),
      ]);

      setGoogleInfos(gInfos);
      setAppleInfos(aInfos);
      setGoogleDraft(gDraft);
      setAppleDraft(aDraft);
      setLoading(false);
    }
    load();
  }, [googleCalSources, appleCalSources]);

  function updateGoogle(integId: string, calId: string, key: keyof GoogleCalendarSetting, value: unknown) {
    setGoogleDraft((p) => ({ ...p, [integId]: { ...p[integId], [calId]: { ...(p[integId]?.[calId] ?? {}), [key]: value } } }));
  }
  function updateApple(integId: string, calName: string, key: keyof AppleCalendarSetting, value: unknown) {
    setAppleDraft((p) => ({ ...p, [integId]: { ...p[integId], [calName]: { ...(p[integId]?.[calName] ?? {}), [key]: value } } }));
  }

  async function saveGoogle(integId: string) {
    setSaving(integId);
    try {
      await fetch(`/api/integrations/google-calendar/${integId}/calendars`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: googleDraft[integId] ?? {} }),
      });
    } finally { setSaving(null); }
    onSaved();
  }

  async function saveApple(integId: string) {
    setSaving(integId);
    try {
      await fetch(`/api/integrations/apple-calendar/${integId}/calendars`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: appleDraft[integId] ?? {} }),
      });
    } finally { setSaving(null); }
    onSaved();
  }

  const togglePicker = (k: string) => setActivePicker((p) => p === k ? null : k);

  const hasSaving = saving !== null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.4)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '340px', maxWidth: '100vw', background: '#FBF7EE', borderLeft: '2px solid #2E294E', boxShadow: '-8px 0 30px rgba(46,41,78,0.18)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1.5px solid rgba(46,41,78,0.15)', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '18px', color: '#2E294E', margin: 0 }}>Calendar settings</h2>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: '#fff', border: '1.5px solid #2E294E', borderRadius: '7px', cursor: 'pointer', color: '#2E294E' }}><X size={14} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8a8499', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading calendars…
            </div>
          )}

          {/* Google sources */}
          {!loading && googleCalSources.map((src) => {
            const cals = googleInfos[src.id] ?? [];
            return (
              <div key={src.id} style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4285F4', marginBottom: '10px' }}>
                  Google — {src.name || 'Calendar'}
                </div>
                {cals.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#8a8499' }}>No calendars found</div>}
                {cals.map((cal) => {
                  const d = googleDraft[src.id]?.[cal.id] ?? {};
                  return (
                    <CalendarRow
                      key={cal.id}
                      name={cal.name}
                      color={d.color ?? cal.color}
                      enabled={d.enabled !== false}
                      pickerKey={`g:${src.id}:${cal.id}`}
                      activePicker={activePicker}
                      onPickerToggle={togglePicker}
                      onColorChange={(c) => updateGoogle(src.id, cal.id, 'color', c)}
                      onEnabledChange={(v) => updateGoogle(src.id, cal.id, 'enabled', v)}
                    />
                  );
                })}
                <button onClick={() => saveGoogle(src.id)} disabled={hasSaving} style={{ marginTop: '12px', ...btn('#2E294E'), fontSize: '12px', padding: '6px 14px' }}>
                  {saving === src.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {saving === src.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            );
          })}

          {/* Apple sources */}
          {!loading && appleCalSources.map((src) => {
            const cals = appleInfos[src.id] ?? [];
            return (
              <div key={src.id} style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1B998B', marginBottom: '10px' }}>
                  Apple — {src.name}
                </div>
                {cals.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#8a8499' }}>No calendars found</div>}
                {cals.map((cal) => {
                  const d = appleDraft[src.id]?.[cal.name] ?? {};
                  return (
                    <CalendarRow
                      key={cal.name}
                      name={cal.name}
                      color={d.color ?? cal.color}
                      enabled={d.enabled !== false}
                      pickerKey={`a:${src.id}:${cal.name}`}
                      activePicker={activePicker}
                      onPickerToggle={togglePicker}
                      onColorChange={(c) => updateApple(src.id, cal.name, 'color', c)}
                      onEnabledChange={(v) => updateApple(src.id, cal.name, 'enabled', v)}
                    />
                  );
                })}
                <button onClick={() => saveApple(src.id)} disabled={hasSaving} style={{ marginTop: '12px', ...btn('#2E294E'), fontSize: '12px', padding: '6px 14px' }}>
                  {saving === src.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {saving === src.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            );
          })}

          <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(46,41,78,0.05)', borderRadius: '7px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6b6580', lineHeight: 1.5 }}>
            Color and visibility changes take effect after the next sync.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NoCals banner ────────────────────────────────────────────────────────────

function NoCalsBanner({ onGoConnect }: { onGoConnect: () => void }) {
  return (
    <div style={{ margin: '16px 26px 0', padding: '12px 16px', background: 'rgba(27,153,139,0.08)', border: '1.5px solid rgba(27,153,139,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ color: '#1B998B', display: 'inline-flex', flexShrink: 0 }}><Plug size={15} /></span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#3b3550', flex: 1 }}>
        Showing demo events. Connect Google or Apple Calendar in{' '}
        <span style={{ color: '#1B998B', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={onGoConnect}>Connections</span>{' '}
        to see your real events.
      </span>
    </div>
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────

function MonthView({ anchor, events, onSelect, onDayClick }: { anchor: Date; events: CalEvent[]; onSelect: (ev: CalEvent) => void; onDayClick: (d: Date) => void }) {
  const today = startOfDay(new Date());
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startCell = addDays(firstOfMonth, -firstOfMonth.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = addDays(startCell, i);
    const dayEvents = events
      .filter((ev) => eventOnDay(ev, day))
      .sort((a, b) => (a.allDay ? -1 : b.allDay ? 1 : a.start.getTime() - b.start.getTime()));
    const isMultiDayStart = (ev: CalEvent) => ev.allDay && !sameDay(ev.start, addDays(ev.end, -1)) && sameDay(ev.start, day);
    const isMultiDayCont  = (ev: CalEvent) => ev.allDay && !sameDay(ev.start, addDays(ev.end, -1)) && !sameDay(ev.start, day);
    return { day, dayEvents, isToday: sameDay(day, today), isCurrentMonth: day.getMonth() === anchor.getMonth(), isMultiDayStart, isMultiDayCont };
  });

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 26px' }}>
      <div style={{ background: '#fff', border: '2px solid #2E294E', borderRadius: '10px', boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#2E294E' }}>
          {WEEKDAYS.map((w) => <div key={w} style={{ padding: '9px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>{w}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(6,1fr)', gap: '1px', background: 'rgba(46,41,78,0.14)' }}>
          {cells.map(({ day, dayEvents, isToday, isCurrentMonth, isMultiDayStart, isMultiDayCont }, i) => (
            <div key={i} onClick={() => onDayClick(day)} style={{ background: isToday ? '#F4EAD4' : '#ffffff', padding: '6px', minHeight: '96px', opacity: isCurrentMonth ? 1 : 0.4, cursor: 'pointer' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: isToday ? '#2E294E' : 'transparent', color: isToday ? '#fff' : '#2E294E', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: isToday ? 700 : 400 }}>
                  {day.getDate()}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {dayEvents.slice(0,3).map((ev) => (
                  <EventChip key={ev.id} ev={ev} onClick={() => onSelect(ev)} multiDay={isMultiDayCont(ev) || isMultiDayStart(ev)} />
                ))}
                {dayEvents.length > 3 && <span style={{ fontSize: '10px', fontWeight: 600, color: '#8a8499', paddingLeft: '2px', fontFamily: "'DM Sans', sans-serif" }}>+{dayEvents.length - 3} more</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TimelineView ─────────────────────────────────────────────────────────────

function TimelineView({ anchor, events, mode, onSelect, onSlotClick }: { anchor: Date; events: CalEvent[]; mode: 'week' | '2day'; onSelect: (ev: CalEvent) => void; onSlotClick: (d: Date) => void }) {
  const today = startOfDay(new Date());
  const cols = mode === 'week'
    ? Array.from({ length: 7 }, (_, i) => addDays(addDays(anchor, -anchor.getDay()), i))
    : [startOfDay(anchor), addDays(startOfDay(anchor), 1)];
  const gridTmpl = `${GUTTER_PX}px ${cols.map(() => '1fr').join(' ')}`;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 26px 22px' }}>
      <div style={{ marginTop: '18px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', border: '2px solid #2E294E', borderRadius: '10px', boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)', overflow: 'hidden' }}>
        {/* All-day / header row */}
        <div style={{ display: 'grid', gridTemplateColumns: gridTmpl, borderBottom: '2px solid #2E294E', background: '#F4EAD4', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '6px 4px', fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a8499' }}>All-day</div>
          {cols.map((col, ci) => {
            const isToday = sameDay(col, today);
            const allDayEvs = events.filter((ev) => ev.allDay && eventOnDay(ev, col));
            return (
              <div key={ci} style={{ borderLeft: '1px solid rgba(46,41,78,0.12)', padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', color: '#8a8499' }}>{WEEKDAYS[col.getDay()]}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: isToday ? '#2E294E' : 'transparent', color: isToday ? '#fff' : '#2E294E', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: isToday ? 700 : 500 }}>{col.getDate()}</span>
                </div>
                {allDayEvs.map((ev) => <EventChip key={ev.id} ev={ev} onClick={() => onSelect(ev)} />)}
              </div>
            );
          })}
        </div>
        {/* Timed events grid */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: gridTmpl, height: `${HOURS.length * HOUR_PX}px`, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              {HOURS.map((h) => (
                <div key={h} style={{ position: 'absolute', top: `${h * HOUR_PX}px`, right: '6px', transform: 'translateY(-7px)', fontFamily: "'Courier New', monospace", fontSize: '10px', color: '#9b96a9' }}>
                  {h === 0 ? '' : `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`}
                </div>
              ))}
            </div>
            {cols.map((col, ci) => {
              const timedEvs = events.filter((ev) => !ev.allDay && sameDay(ev.start, col));
              return (
                <div key={ci} onClick={() => onSlotClick(col)} style={{ position: 'relative', borderLeft: '1px solid rgba(46,41,78,0.12)', backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${HOUR_PX-1}px, rgba(46,41,78,0.07) ${HOUR_PX-1}px, rgba(46,41,78,0.07) ${HOUR_PX}px)`, cursor: 'pointer' }}>
                  {timedEvs.map((ev) => {
                    const topMin = ev.start.getHours() * 60 + ev.start.getMinutes();
                    const durMin = Math.max(30, (ev.end.getTime() - ev.start.getTime()) / 60000);
                    return (
                      <div key={ev.id} onClick={(e) => { e.stopPropagation(); onSelect(ev); }} style={{ position: 'absolute', top: `${(topMin/60)*HOUR_PX}px`, left: '3px', right: '3px', height: `${(durMin/60)*HOUR_PX-2}px`, background: `${ev.calendarColor}22`, border: `1.5px solid ${ev.calendarColor}88`, borderLeft: `3px solid ${ev.calendarColor}`, borderRadius: '5px', padding: '3px 6px', cursor: 'pointer', overflow: 'hidden' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, color: '#2E294E', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {ev.title}
                          {ev.meetingUrl && <Video size={9} color={ev.calendarColor} style={{ flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontFamily: "'Courier New', monospace", fontSize: '9.5px', color: '#6b6580', marginTop: '1px' }}>{fmtTime(ev.start)} – {fmtTime(ev.end)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────────

export default function CalendarClient({ googleCalSources: initGcal, appleCalSources: initAcal, taskDueEvents: initTaskDues = [] }: Props) {
  const router = useTransitionRouter();

  const allSources = useRef<CalSource[]>([
    ...initGcal.map((s, i) => ({ ...s, type: 'google' as const, color: GOOGLE_COLORS[i % GOOGLE_COLORS.length] })),
    ...initAcal.map((s, i) => ({ ...s, type: 'apple'  as const, color: APPLE_COLORS [i % APPLE_COLORS.length] })),
  ]).current;

  const taskEvents = useRef<CalEvent[]>(
    initTaskDues.map((t) => {
      const due = new Date(t.due);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return {
        id: `task-${t.id}`,
        title: t.title,
        start: dueDay,
        end: new Date(dueDay.getTime() + 86400000),
        allDay: true,
        sourceId: 'tasks',
        calendarName: t.projectName,
        calendarColor: t.color,
        taskHref: `/admin/projects/${t.projectId}?task=${t.id}`,
      };
    })
  ).current;

  const withTasks = (calEvs: CalEvent[]) => [...calEvs, ...taskEvents];

  const anyConnected    = allSources.length > 0;
  const hasAnySources   = anyConnected;

  const [mode, setMode]         = useState<ViewMode>('month');
  const [anchor, setAnchor]     = useState(() => startOfDay(new Date()));
  const [events, setEvents]     = useState<CalEvent[]>(taskEvents);
  const [loadingCache, setLoadingCache] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [newEventStart, setNewEventStart] = useState<Date | null>(null);
  const [showSettings, setShowSettings]   = useState(false);

  const headLabel = (() => {
    if (mode === 'month') return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (mode === 'week') {
      const ws = addDays(anchor, -anchor.getDay()), we = addDays(ws, 6);
      return ws.getMonth() === we.getMonth() ? `${MONTHS[ws.getMonth()]} ${ws.getFullYear()}` : `${MONTHS[ws.getMonth()]} – ${MONTHS[we.getMonth()]} ${we.getFullYear()}`;
    }
    return `${MONTHS[anchor.getMonth()]} ${anchor.getDate()} – ${anchor.getDate() + 1}`;
  })();

  const navigate = (dir: -1 | 1) => {
    if (mode === 'month') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
    else if (mode === 'week') setAnchor(addDays(anchor, dir * 7));
    else setAnchor(addDays(anchor, dir * 2));
  };

  // Phase 2: live API refresh
  const refreshFromApis = useCallback(async () => {
    if (!anyConnected) return;
    setRefreshing(true);
    const allEvs: CalEvent[] = [];

    if (initGcal.length > 0) {
      try {
        const res = await fetch('/api/integrations/google-calendar/events');
        if (res.ok) {
          const { sources } = await res.json() as { sources: { integrationId: string; events: NormalizedEvent[] }[] };
          for (const src of sources) for (const ev of src.events) allEvs.push(normalizedToCalEvent(ev, src.integrationId));
        }
      } catch {}
    }

    for (const src of initAcal) {
      try {
        const res = await fetch(`/api/integrations/apple-calendar/${src.id}/events`);
        if (res.ok) {
          const { events: normalized } = await res.json() as { events: NormalizedEvent[] };
          for (const ev of normalized) allEvs.push(normalizedToCalEvent(ev, src.id));
        }
      } catch {}
    }

    if (allEvs.length > 0) setEvents(withTasks(allEvs));
    setRefreshing(false);
  }, [anyConnected, initGcal, initAcal]);

  // Phase 1: instant cache load → then API refresh in background
  useEffect(() => {
    if (!anyConnected) { setEvents(withTasks(getDemoEvents(startOfDay(new Date())))); return; }

    setLoadingCache(true);
    fetch('/api/integrations/calendar/cache')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { entries: CacheEntry[]; stale: boolean } | null) => {
        setLoadingCache(false);
        if (data?.entries?.length) {
          const cached: CalEvent[] = [];
          for (const entry of data.entries) for (const ev of entry.events) cached.push(normalizedToCalEvent(ev, entry.integrationId));
          setEvents(withTasks(cached));
        }
        refreshFromApis();
      })
      .catch(() => { setLoadingCache(false); refreshFromApis(); });
  }, [anyConnected, refreshFromApis]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes sheetUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', padding: '16px 26px', background: 'rgba(255,255,255,0.55)', borderBottom: '2px solid #2E294E', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '24px', margin: 0, minWidth: '170px', color: '#2E294E' }}>{headLabel}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#fff', border: '2px solid #2E294E', borderRadius: '7px', boxShadow: '2px 2px 0 0 rgba(46,41,78,0.2)', cursor: 'pointer', color: '#2E294E' }}><ChevronLeft size={17} /></button>
            <button onClick={() => setAnchor(startOfDay(new Date()))} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#2E294E', background: '#fff', border: '2px solid #2E294E', borderRadius: '7px', boxShadow: '2px 2px 0 0 rgba(46,41,78,0.2)', padding: '7px 14px', cursor: 'pointer' }}>Today</button>
            <button onClick={() => navigate(1)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#fff', border: '2px solid #2E294E', borderRadius: '7px', boxShadow: '2px 2px 0 0 rgba(46,41,78,0.2)', cursor: 'pointer', color: '#2E294E' }}><ChevronRight size={17} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Source legend */}
          {allSources.map((s) => (
            <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: `${s.color}18`, border: `1px solid ${s.color}44`, padding: '3px 9px', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: '#2E294E' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
              {s.name}
            </span>
          ))}

          {refreshing && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8a8499' }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
              Refreshing…
            </span>
          )}

          {anyConnected && (
            <button style={btn('#1B998B')} onClick={() => setNewEventStart(anchor)}>
              <Plus size={14} /> New event
            </button>
          )}

          {hasAnySources && (
            <button
              onClick={() => setShowSettings(true)}
              title="Calendar settings"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: showSettings ? '#2E294E' : '#fff', border: '2px solid #2E294E', borderRadius: '7px', boxShadow: '2px 2px 0 0 rgba(46,41,78,0.2)', cursor: 'pointer', color: showSettings ? '#fff' : '#2E294E' }}
            >
              <Settings size={15} />
            </button>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px', background: '#EFE7D6', border: '2px solid #2E294E', borderRadius: '9px' }}>
            <ModeBtn label="Month" active={mode === 'month'} onClick={() => setMode('month')} />
            <ModeBtn label="Week"  active={mode === 'week'}  onClick={() => setMode('week')}  />
            <ModeBtn label="2-Day" active={mode === '2day'}  onClick={() => setMode('2day')}  />
          </div>
        </div>
      </div>

      {!anyConnected && <NoCalsBanner onGoConnect={() => router.push('/admin/connections')} />}
      {loadingCache && (
        <div style={{ padding: '10px 26px', fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#8a8499', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
          Loading calendar…
        </div>
      )}

      {mode === 'month' && <MonthView anchor={anchor} events={events} onSelect={setSelected} onDayClick={(d) => setNewEventStart(d)} />}
      {(mode === 'week' || mode === '2day') && <TimelineView anchor={anchor} events={events} mode={mode} onSelect={setSelected} onSlotClick={(d) => setNewEventStart(d)} />}

      {selected && <EventSheet ev={selected} onClose={() => setSelected(null)} />}

      {newEventStart !== null && (
        <NewEventModal
          sources={allSources}
          defaultStart={newEventStart}
          onClose={() => setNewEventStart(null)}
          onCreated={() => { setNewEventStart(null); refreshFromApis(); }}
        />
      )}

      {showSettings && (
        <CalendarSettingsPanel
          googleCalSources={initGcal}
          appleCalSources={initAcal}
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); refreshFromApis(); }}
        />
      )}
    </div>
  );
}
