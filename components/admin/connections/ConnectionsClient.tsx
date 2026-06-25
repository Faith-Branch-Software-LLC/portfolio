'use client';

import { useState, useEffect } from 'react';
import { Zap, RefreshCw, Trash2, ChevronDown, ChevronUp, CheckCircle, Circle, Plus, Calendar, Bug, Bot, Copy, Eye, EyeOff } from 'lucide-react';
import { useAdminToast } from '@/components/ui/toast-context';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { generateMcpApiKey, revokeMcpApiKey } from '@/lib/actions/admin/integrations';

// ─── types ───────────────────────────────────────────────────────────────────

interface IntegrationRow {
  id: string;
  name: string;
  lastSyncedAt: string | null;
  config?: Record<string, unknown>;
}

interface Project {
  id: string;
  name: string;
  basecampProjectId: string | null;
  basecampTodolistId: string | null;
  client: { name: string; color: string | null };
}

interface BcProject {
  id: string;
  name: string;
  todolists: { id: number; title: string }[];
}

interface Client {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  basecampConnected: boolean;
  basecampLastSync: string | null;
  testflightIntegrations: IntegrationRow[];
  googleCalIntegrations: IntegrationRow[];
  appleCalIntegrations: IntegrationRow[];
  projects: Project[];
  clients: Client[];
  mcpApiKey: string | null;
}

// ─── styles ──────────────────────────────────────────────────────────────────

const panel = {
  background: '#ffffff',
  border: '2px solid #2E294E',
  borderRadius: '10px',
  boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
  padding: '22px 24px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  fontFamily: "'Courier New', monospace",
  fontSize: '13px',
  border: '1.5px solid rgba(46,41,78,0.3)',
  borderRadius: '6px',
  background: '#F7F3EA',
  color: '#2E294E',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#2E294E',
  display: 'block',
  marginBottom: '5px',
};

const btnPrimary = (color = '#1B998B') => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  background: color,
  color: '#fff',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: '13.5px',
  padding: '9px 16px',
  border: '2px solid #2E294E',
  borderRadius: '6px',
  boxShadow: '3px 3px 0 0 #2E294E',
  cursor: 'pointer',
});

const btnOutline = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  background: '#fff',
  color: '#2E294E',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: '13.5px',
  padding: '9px 16px',
  border: '2px solid #2E294E',
  borderRadius: '6px',
  boxShadow: '3px 3px 0 0 #2E294E',
  cursor: 'pointer',
};

const btnSmall = (color = '#2E294E') => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  background: 'transparent',
  color,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: '12.5px',
  padding: '6px 10px',
  border: `1.5px solid ${color}`,
  borderRadius: '5px',
  cursor: 'pointer',
});

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: connected ? '#d4f7f0' : '#f0eeff', color: connected ? '#0d7a68' : '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, border: `1px solid ${connected ? '#1B998B' : '#c8c3e0'}` }}>
      {connected ? <CheckCircle size={12} /> : <Circle size={12} />}
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}

function LastSync({ ts }: { ts: string | null }) {
  if (!ts) return <span style={{ fontSize: '12px', color: '#9990b0', fontFamily: "'DM Sans', sans-serif" }}>Never synced</span>;
  return <span style={{ fontSize: '12px', color: '#6b6580', fontFamily: "'DM Sans', sans-serif" }}>Last sync: {new Date(ts).toLocaleString()}</span>;
}

function ConnectedRow({
  name,
  lastSync,
  onSync,
  syncing,
  onDelete,
  onDebug,
  debugLabel,
}: {
  name: string;
  lastSync: string | null;
  onSync?: () => void;
  syncing?: boolean;
  onDelete: () => void;
  onDebug?: () => void;
  debugLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#F7F3EA', borderRadius: '7px', border: '1.5px solid rgba(46,41,78,0.12)', flexWrap: 'wrap' }}>
      <CheckCircle size={14} color="#1B998B" style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#2E294E', flex: 1, minWidth: 0 }}>{name}</span>
      <LastSync ts={lastSync} />
      {onSync && (
        <button style={btnSmall()} onClick={onSync} disabled={syncing}>
          <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : undefined }} />
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      )}
      {onDebug && (
        <button style={btnSmall()} onClick={onDebug}>
          <Bug size={12} />{debugLabel ?? 'Debug'}
        </button>
      )}
      <button style={btnSmall('#e74c3c')} onClick={onDelete}>
        <Trash2 size={12} /> Remove
      </button>
    </div>
  );
}

// ─── TestFlight add-form ──────────────────────────────────────────────────────

function TFAddForm({ projects, onAdded }: { projects: Project[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [issuerId, setIssuerId] = useState('');
  const [keyId, setKeyId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [appId, setAppId] = useState('');
  const [targetProject, setTargetProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  async function submit() {
    if (!issuerId || !keyId || !privateKey || !appId || !targetProject) { setErr('All fields required'); return; }
    setLoading(true); setErr('');
    const res = await fetch('/api/integrations/testflight/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: appName || `App ${appId}`, issuerId, keyId, privateKey, appId, targetProjectId: targetProject }),
    });
    setLoading(false);
    if (res.ok) { setOpen(false); setAppName(''); setIssuerId(''); setKeyId(''); setPrivateKey(''); setAppId(''); setTargetProject(''); onAdded(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'Failed'); }
  }

  if (!open) return (
    <button style={{ ...btnOutline, fontSize: '13px', padding: '8px 14px' }} onClick={() => setOpen(true)}>
      <Plus size={14} /> Add TestFlight app
    </button>
  );

  return (
    <div style={{ background: '#F7F3EA', borderRadius: '8px', padding: '16px', border: '1.5px solid rgba(46,41,78,0.14)', marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '15px', color: '#2E294E' }}>Add TestFlight app</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12px' }} onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <button onClick={() => setShowInstructions(!showInstructions)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', padding: '0 0 10px', marginBottom: '4px' }}>
        {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Setup instructions
      </button>
      {showInstructions && (
        <ol style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#3b3550', lineHeight: 1.7, paddingLeft: '18px', margin: '0 0 14px' }}>
          <li>Go to <strong>App Store Connect → Users and Access → Integrations → App Store Connect API</strong></li>
          <li>Create a key with <strong>Developer</strong> role → download the <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>.p8</code> file</li>
          <li>Copy the <strong>Issuer ID</strong> shown at the top of the Keys page</li>
          <li>Copy the <strong>Key ID</strong> shown next to your key</li>
          <li>Find the App ID: <strong>App Store Connect → Apps → [Your App] → General → Apple ID</strong></li>
        </ol>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={labelStyle}>App name</label>
          <input style={inputStyle} placeholder="Ferric" value={appName} onChange={(e) => setAppName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Issuer ID</label>
          <input style={inputStyle} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={issuerId} onChange={(e) => setIssuerId(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Key ID</label>
          <input style={inputStyle} placeholder="XXXXXXXXXX" value={keyId} onChange={(e) => setKeyId(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Private Key (.p8 contents)</label>
          <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical', fontSize: '11px' }} placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>App ID (Apple ID)</label>
          <input style={inputStyle} placeholder="1234567890" value={appId} onChange={(e) => setAppId(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Import feedback into board</label>
          <select style={inputStyle} value={targetProject} onChange={(e) => setTargetProject(e.target.value)}>
            <option value="">Select project board…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.client.name})</option>)}
          </select>
        </div>
      </div>
      {err && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', margin: '10px 0 0' }}>{err}</p>}
      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        <button style={btnPrimary('#1B998B')} disabled={loading} onClick={submit}>
          <Zap size={14} /> {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

// ─── Apple Calendar add-form ──────────────────────────────────────────────────

function AppleCalAddForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [serverUrl, setServerUrl] = useState('https://caldav.icloud.com');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!serverUrl || !username || !password) { setErr('Server URL, username, and password required'); return; }
    setLoading(true); setErr('');
    const res = await fetch('/api/integrations/apple-calendar/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || username, serverUrl, username, password }),
    });
    setLoading(false);
    if (res.ok) { setOpen(false); setName(''); setUsername(''); setPassword(''); onAdded(); }
    else { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'Failed'); }
  }

  if (!open) return (
    <button style={{ ...btnOutline, fontSize: '13px', padding: '8px 14px' }} onClick={() => setOpen(true)}>
      <Plus size={14} /> Add Apple Calendar
    </button>
  );

  return (
    <div style={{ background: '#F7F3EA', borderRadius: '8px', padding: '16px', border: '1.5px solid rgba(46,41,78,0.14)', marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '15px', color: '#2E294E' }}>Add Apple Calendar</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12px' }} onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#3b3550', lineHeight: 1.6, margin: '0 0 14px' }}>
        Uses CalDAV for full read/write access. For iCloud, use your Apple ID email and an <strong>app-specific password</strong> from <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>appleid.apple.com → Security</code>.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Display name</label>
          <input style={inputStyle} placeholder="Personal" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>CalDAV server URL</label>
          <input style={inputStyle} placeholder="https://caldav.icloud.com" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Username (Apple ID / email)</label>
          <input style={inputStyle} placeholder="you@icloud.com" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>App-specific password</label>
          <input style={inputStyle} type="password" placeholder="xxxx-xxxx-xxxx-xxxx" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
      {err && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', margin: '10px 0 0' }}>{err}</p>}
      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        <button style={btnPrimary('#1B998B')} disabled={loading} onClick={submit}>
          <Zap size={14} /> {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ConnectionsClient({
  basecampConnected: initBcConnected,
  basecampLastSync: initBcSync,
  testflightIntegrations: initTfIntegrations,
  googleCalIntegrations: initGcalIntegrations,
  appleCalIntegrations: initAcalIntegrations,
  projects,
  clients,
  mcpApiKey: initMcpKey,
}: Props) {
  const { toast } = useAdminToast();
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // ── MCP ───────────────────────────────────────────────────────────────────
  const [mcpKey, setMcpKey] = useState(initMcpKey);
  const [mcpKeyVisible, setMcpKeyVisible] = useState(false);
  const [mcpGenerating, setMcpGenerating] = useState(false);

  async function handleGenerateMcpKey() {
    setMcpGenerating(true);
    try {
      const key = await generateMcpApiKey();
      setMcpKey(key);
      setMcpKeyVisible(true);
      toast({ title: 'MCP API key generated' });
    } catch {
      toast({ title: 'Failed to generate key' });
    } finally {
      setMcpGenerating(false);
    }
  }

  async function handleRevokeMcpKey() {
    setConfirmDialog({
      message: 'Revoke the MCP API key? Claude will lose access until you generate a new one.',
      onConfirm: async () => {
        await revokeMcpApiKey();
        setMcpKey(null);
        setMcpKeyVisible(false);
        setConfirmDialog(null);
        toast({ title: 'MCP API key revoked' });
      },
    });
  }

  // ── Basecamp ──────────────────────────────────────────────────────────────
  const [bcConnected, setBcConnected] = useState(initBcConnected);
  const [bcLastSync, setBcLastSync] = useState(initBcSync);
  const [bcSyncing, setBcSyncing] = useState(false);
  const [bcError, setBcError] = useState('');
  const [bcProjects, setBcProjects] = useState<BcProject[]>([]);
  const [bcProjectsLoading, setBcProjectsLoading] = useState(false);
  const [bcShowInstructions, setBcShowInstructions] = useState(false);
  const [importClient, setImportClient] = useState('');
  const [importBcProject, setImportBcProject] = useState('');
  const [importSaving, setImportSaving] = useState(false);

  // ── TestFlight ────────────────────────────────────────────────────────────
  const [tfIntegrations, setTfIntegrations] = useState(initTfIntegrations);
  const [tfSyncing, setTfSyncing] = useState<Record<string, boolean>>({});
  const [tfError, setTfError] = useState<Record<string, string>>({});
  const [tfDebugOpen, setTfDebugOpen] = useState(false);
  const [tfDebugLoading, setTfDebugLoading] = useState(false);
  const [tfDebugData, setTfDebugData] = useState('');

  // ── Google Calendar ───────────────────────────────────────────────────────
  const [gcalIntegrations, setGcalIntegrations] = useState(initGcalIntegrations);
  const [gcalError, setGcalError] = useState('');
  const [gcalNameInput, setGcalNameInput] = useState('');
  const [gcalShowNameForm, setGcalShowNameForm] = useState(false);

  // ── Apple Calendar ────────────────────────────────────────────────────────
  const [acalIntegrations, setAcalIntegrations] = useState(initAcalIntegrations);

  // ── parse URL params on mount ─────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bc_connected') === '1') { setBcConnected(true); loadBcProjects(); window.history.replaceState({}, '', window.location.pathname); }
    const bcErr = params.get('bc_error');
    if (bcErr) { setBcError(`OAuth error: ${bcErr.replace(/_/g, ' ')}`); window.history.replaceState({}, '', window.location.pathname); }
    if (params.get('gcal_connected') === '1') { window.history.replaceState({}, '', window.location.pathname); window.location.reload(); }
    const gcalErr = params.get('gcal_error');
    if (gcalErr) { setGcalError(`OAuth error: ${gcalErr.replace(/_/g, ' ')}`); window.history.replaceState({}, '', window.location.pathname); }
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────

  async function parseErr(res: Response, fallback: string) {
    try { const t = await res.text(); if (!t) return `${fallback} (${res.status})`; const j = JSON.parse(t); return j.error ?? fallback; } catch { return `${fallback} (${res.status})`; }
  }

  // ── Basecamp ──────────────────────────────────────────────────────────────

  async function disconnectBasecamp() {
    setConfirmDialog({
      message: 'Disconnect Basecamp? Project mappings will be cleared.',
      onConfirm: async () => {
        await fetch('/api/integrations/basecamp/configure', { method: 'DELETE' });
        setBcConnected(false); setBcProjects([]);
      },
    });
  }

  async function syncBasecamp() {
    setBcSyncing(true); setBcError('');
    const res = await fetch('/api/integrations/basecamp/sync', { method: 'POST' });
    setBcSyncing(false);
    if (res.ok) { const d = await res.json(); setBcLastSync(new Date().toISOString()); toast({ title: 'Basecamp synced', description: `Created: ${d.created}, updated: ${d.updated}, pushed: ${d.pushed}` }); }
    else { setBcError(await parseErr(res, 'Sync failed')); }
  }

  async function loadBcProjects() {
    setBcProjectsLoading(true);
    const res = await fetch('/api/integrations/basecamp/projects');
    setBcProjectsLoading(false);
    if (res.ok) setBcProjects(await res.json());
  }

  async function importBcProjectAsBoards() {
    if (!importClient || !importBcProject) return;
    const bcProject = bcProjects.find((p) => p.id === importBcProject);
    if (!bcProject) return;
    setImportSaving(true);
    const { importBasecampTodolistsAsProjects } = await import('@/lib/actions/admin/integrations');
    const todolists = bcProject.todolists.map((t) => ({ id: String(t.id), title: t.title }));
    await importBasecampTodolistsAsProjects(importClient, importBcProject, todolists);
    setImportSaving(false);
    setImportClient(''); setImportBcProject('');
    window.location.reload();
  }

  async function removeMapping(projectId: string) {
    const { unlinkProjectFromBasecamp } = await import('@/lib/actions/admin/integrations');
    await unlinkProjectFromBasecamp(projectId);
    window.location.reload();
  }

  // ── TestFlight ────────────────────────────────────────────────────────────

  async function syncTf(id: string) {
    setTfSyncing((s) => ({ ...s, [id]: true })); setTfError((e) => ({ ...e, [id]: '' }));
    const res = await fetch(`/api/integrations/testflight/${id}`, { method: 'POST' });
    setTfSyncing((s) => ({ ...s, [id]: false }));
    if (res.ok) { const d = await res.json(); toast({ title: 'TestFlight synced', description: `Created: ${d.created}, deleted: ${d.deleted}` }); window.location.reload(); }
    else { const msg = await parseErr(res, 'Sync failed'); setTfError((e) => ({ ...e, [id]: msg })); }
  }

  async function deleteTf(id: string) {
    setConfirmDialog({
      message: 'Remove this TestFlight integration?',
      onConfirm: async () => {
        await fetch(`/api/integrations/testflight/${id}`, { method: 'DELETE' });
        setTfIntegrations((prev) => prev.filter((i) => i.id !== id));
      },
    });
  }

  async function debugTf(id: string) {
    setTfDebugLoading(true); setTfDebugData(''); setTfDebugOpen(true);
    try { const res = await fetch(`/api/integrations/testflight/${id}`); setTfDebugData(await res.text()); }
    catch (e) { setTfDebugData(String(e)); }
    setTfDebugLoading(false);
  }

  // ── Google Calendar ───────────────────────────────────────────────────────

  async function deleteGcal(id: string) {
    setConfirmDialog({
      message: 'Disconnect this Google Calendar?',
      onConfirm: async () => {
        await fetch(`/api/integrations/google-calendar/configure?id=${id}`, { method: 'DELETE' });
        setGcalIntegrations((prev) => prev.filter((i) => i.id !== id));
      },
    });
  }

  // ── Apple Calendar ────────────────────────────────────────────────────────

  async function deleteAcal(id: string) {
    setConfirmDialog({
      message: 'Disconnect this Apple Calendar?',
      onConfirm: async () => {
        await fetch(`/api/integrations/apple-calendar/configure?id=${id}`, { method: 'DELETE' });
        setAcalIntegrations((prev) => prev.filter((i) => i.id !== id));
      },
    });
  }

  const linkedProjects = projects.filter((p) => p.basecampTodolistId);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 26px' }}>
      <div style={{ maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="flex flex-col lg:flex-row" style={{ gap: '20px' }}>

        {/* ── Basecamp ───────────────────────────────────────────────────── */}
        <div style={{ ...panel, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#2E294E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Fraunces, serif', color: '#C5D86D', fontWeight: 700, fontSize: '15px' }}>B</span>
              </div>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', color: '#2E294E' }}>Basecamp</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580' }}>bidirectional task sync</div>
              </div>
            </div>
            <StatusBadge connected={bcConnected} />
          </div>

          {!bcConnected && (
            <>
              <button onClick={() => setBcShowInstructions(!bcShowInstructions)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', padding: '0 0 10px', marginBottom: '4px' }}>
                {bcShowInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Setup instructions
              </button>
              {bcShowInstructions && (
                <ol style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#3b3550', lineHeight: 1.7, paddingLeft: '18px', margin: '0 0 14px' }}>
                  <li>Go to <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>launchpad.37signals.com/integrations</code> → <strong>Register application</strong></li>
                  <li>Add redirect URI: <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>{process.env.NEXTAUTH_URL ?? 'https://your-domain.com'}/api/integrations/basecamp/oauth/callback</code></li>
                  <li>Add <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>BASECAMP_CLIENT_ID</code> and <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>BASECAMP_CLIENT_SECRET</code> to <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>.env.local</code></li>
                  <li>Restart dev server → click Connect below</li>
                </ol>
              )}
              {bcError && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', marginBottom: '10px' }}>{bcError}</p>}
              <a href="/api/integrations/basecamp/oauth/start" style={{ ...btnPrimary(), textDecoration: 'none' }}>
                <Zap size={14} /> Connect with Basecamp
              </a>
            </>
          )}

          {bcConnected && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button style={btnPrimary()} disabled={bcSyncing} onClick={syncBasecamp}>
                  <RefreshCw size={13} style={{ animation: bcSyncing ? 'spin 1s linear infinite' : undefined }} />
                  {bcSyncing ? 'Syncing…' : 'Sync now'}
                </button>
                <button style={{ ...btnOutline, borderColor: '#e74c3c', color: '#e74c3c', boxShadow: '2px 2px 0 0 #e74c3c' }} onClick={disconnectBasecamp}>
                  <Trash2 size={13} /> Disconnect
                </button>
                <LastSync ts={bcLastSync} />
              </div>
              {bcError && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', marginBottom: '10px' }}>{bcError}</p>}
              {linkedProjects.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: '#2E294E', marginBottom: '8px' }}>Linked boards</div>
                  {linkedProjects.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#F7F3EA', borderRadius: '6px', border: '1.5px solid rgba(46,41,78,0.12)', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.client.color ?? '#888', display: 'inline-block' }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#2E294E' }}>{p.name}</span>
                        <span style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580' }}>→ Basecamp #{p.basecampTodolistId}</span>
                      </div>
                      <button onClick={() => removeMapping(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9990b0', padding: '2px' }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: '#F7F3EA', borderRadius: '8px', padding: '14px', border: '1.5px solid rgba(46,41,78,0.12)' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: '#2E294E', marginBottom: '4px' }}>Import Basecamp project</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580', marginBottom: '10px' }}>each task list → new board</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select style={inputStyle} value={importClient} onChange={(e) => setImportClient(e.target.value)}>
                    <option value="">Select client…</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {bcProjectsLoading ? (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6b6580' }}>Loading Basecamp projects…</p>
                  ) : bcProjects.length === 0 ? (
                    <button style={{ ...btnOutline, fontSize: '12.5px', padding: '7px 12px' }} onClick={loadBcProjects}>Load Basecamp projects</button>
                  ) : (
                    <select style={inputStyle} value={importBcProject} onChange={(e) => setImportBcProject(e.target.value)}>
                      <option value="">Select Basecamp project…</option>
                      {bcProjects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.todolists.length} lists)</option>)}
                    </select>
                  )}
                  {importBcProject && bcProjects.find((p) => p.id === importBcProject) && (
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580', paddingLeft: '4px' }}>
                      {bcProjects.find((p) => p.id === importBcProject)!.todolists.map((t) => <div key={t.id}>→ {t.title}</div>)}
                    </div>
                  )}
                  <button style={btnPrimary('#2E294E')} disabled={importSaving || !importClient || !importBcProject} onClick={importBcProjectAsBoards}>
                    {importSaving ? 'Importing…' : 'Import as boards'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── TestFlight ──────────────────────────────────────────────────── */}
        <div style={{ ...panel, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1B998B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', color: '#fff', fontWeight: 700, fontSize: '13px' }}>TF</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', color: '#2E294E' }}>TestFlight</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580' }}>beta feedback → tasks · multiple apps</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {tfIntegrations.map((tf) => (
              <div key={tf.id}>
                <ConnectedRow
                  name={tf.name}
                  lastSync={tf.lastSyncedAt}
                  onSync={() => syncTf(tf.id)}
                  syncing={tfSyncing[tf.id]}
                  onDelete={() => deleteTf(tf.id)}
                  onDebug={() => debugTf(tf.id)}
                  debugLabel="Debug API"
                />
                {tfError[tf.id] && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', margin: '4px 0 0 12px' }}>{tfError[tf.id]}</p>}
              </div>
            ))}
          </div>

          <TFAddForm projects={projects} onAdded={() => window.location.reload()} />

          {tfIntegrations.length > 0 && (
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', lineHeight: 1.6, marginTop: '12px' }}>
              Sync pulls beta feedback and creates tasks in the target board. For automatic polling, hit <code style={{ background: '#2E294E', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>/api/integrations/testflight/sync</code> via cron.
            </p>
          )}
        </div>
      </div>

      {/* ── Calendar integrations ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row" style={{ maxWidth: '1200px', gap: '20px' }}>

        {/* Google Calendar */}
        <div style={{ ...panel, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', color: '#2E294E' }}>Google Calendar</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580' }}>read/write · multiple accounts</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {gcalIntegrations.map((gcal) => (
              <ConnectedRow
                key={gcal.id}
                name={gcal.name}
                lastSync={gcal.lastSyncedAt}
                onDelete={() => deleteGcal(gcal.id)}
              />
            ))}
          </div>

          {gcalError && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', marginBottom: '10px' }}>{gcalError}</p>}

          {/* Add Google Cal — optional name form */}
          {gcalShowNameForm ? (
            <div style={{ background: '#F7F3EA', borderRadius: '8px', padding: '14px', border: '1.5px solid rgba(46,41,78,0.12)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Label (optional — defaults to Google account email)</label>
                <input style={inputStyle} placeholder="Work calendar" value={gcalNameInput} onChange={(e) => setGcalNameInput(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`/api/integrations/google-calendar/oauth/start${gcalNameInput ? `?name=${encodeURIComponent(gcalNameInput)}` : ''}`} style={{ ...btnPrimary('#4285F4'), textDecoration: 'none' }}>
                  <Zap size={14} /> Connect with Google
                </a>
                <button style={{ ...btnOutline, padding: '8px 12px', fontSize: '12.5px' }} onClick={() => { setGcalShowNameForm(false); setGcalNameInput(''); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button style={{ ...btnOutline, fontSize: '13px', padding: '8px 14px' }} onClick={() => setGcalShowNameForm(true)}>
              <Plus size={14} /> Add Google Calendar
            </button>
          )}

          <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', lineHeight: 1.6, marginTop: '12px' }}>
            Events appear in the Calendar tab. You can create and edit events from there — changes sync back to Google. Requires <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>GOOGLE_CLIENT_ID</code> + <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>GOOGLE_CLIENT_SECRET</code> in <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>.env.local</code>.
          </p>
        </div>

        {/* Apple Calendar */}
        <div style={{ ...panel, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1B998B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', color: '#2E294E' }}>Apple Calendar</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580' }}>CalDAV read/write · multiple accounts</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {acalIntegrations.map((acal) => (
              <ConnectedRow
                key={acal.id}
                name={acal.name}
                lastSync={acal.lastSyncedAt}
                onDelete={() => deleteAcal(acal.id)}
              />
            ))}
          </div>

          <AppleCalAddForm onAdded={() => window.location.reload()} />
        </div>
      </div>

      {/* ── Claude MCP ─────────────────────────────────────────────────────── */}
      <div style={{ ...panel }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#CC785C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', color: '#2E294E' }}>Claude MCP</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580' }}>give claude read/write access to your admin</div>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: mcpKey ? '#d4f7f0' : '#f0eeff', color: mcpKey ? '#0d7a68' : '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, border: `1px solid ${mcpKey ? '#1B998B' : '#c8c3e0'}` }}>
            {mcpKey ? <CheckCircle size={12} /> : <Circle size={12} />}
            {mcpKey ? 'Key active' : 'No key'}
          </span>
        </div>

        {mcpKey ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                readOnly
                type={mcpKeyVisible ? 'text' : 'password'}
                value={mcpKey}
                style={{ ...inputStyle, flex: 1, fontFamily: "'Courier New', monospace", fontSize: '12px' }}
              />
              <button style={btnSmall()} onClick={() => setMcpKeyVisible(!mcpKeyVisible)}>
                {mcpKeyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button style={btnSmall()} onClick={() => { navigator.clipboard.writeText(mcpKey!); toast({ title: 'Copied to clipboard' }); }}>
                <Copy size={13} /> Copy
              </button>
            </div>
            <p style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580', margin: 0 }}>
              Add to <code style={{ background: '#2E294E', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>~/.claude/mcp.json</code> →{' '}
              <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px' }}>Authorization: Bearer {'<key>'}</code>
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button style={btnSmall()} onClick={handleGenerateMcpKey} disabled={mcpGenerating}>
                <RefreshCw size={12} /> Rotate key
              </button>
              <button style={btnSmall('#c0392b')} onClick={handleRevokeMcpKey}>
                <Trash2 size={12} /> Revoke
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13.5px', color: '#3b3550', lineHeight: 1.6, margin: '0 0 14px' }}>
              Generate an API key to connect Claude Code to your admin via MCP. Claude can then read tasks, calendar events, and trigger syncs directly from your terminal.
            </p>
            <button style={btnPrimary('#CC785C')} onClick={handleGenerateMcpKey} disabled={mcpGenerating}>
              <Bot size={14} /> {mcpGenerating ? 'Generating…' : 'Generate API key'}
            </button>
          </div>
        )}
      </div>
      </div>

      {/* TF Debug modal */}
      {tfDebugOpen && (
        <>
          <div onClick={() => setTfDebugOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.45)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 61, background: '#F4EAD4', border: '2px solid #2E294E', borderRadius: '12px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.25)', width: '90%', maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1.5px solid rgba(46,41,78,0.15)' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', color: '#2E294E' }}>TestFlight API Debug</span>
              <button onClick={() => setTfDebugOpen(false)} style={{ background: '#fff', border: '1.5px solid #2E294E', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#2E294E', fontFamily: "'DM Sans', sans-serif", fontSize: '12px' }}>Close</button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
              {tfDebugLoading
                ? <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#6b6580' }}>Probing API paths…</p>
                : <pre style={{ margin: 0, fontFamily: "'Courier New', monospace", fontSize: '11.5px', color: '#2E294E', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{tfDebugData || 'No data'}</pre>
              }
            </div>
          </div>
        </>
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          confirmLabel="Confirm"
          danger
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
