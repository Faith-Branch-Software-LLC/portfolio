'use client';

import { useState, useEffect } from 'react';
import { Zap, RefreshCw, Trash2, ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react';

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
  testflightConnected: boolean;
  testflightLastSync: string | null;
  testflightTargetProjectId: string | null;
  projects: Project[];
  clients: Client[];
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '20px',
        background: connected ? '#d4f7f0' : '#f0eeff',
        color: connected ? '#0d7a68' : '#6b6580',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        fontWeight: 600,
        border: `1px solid ${connected ? '#1B998B' : '#c8c3e0'}`,
      }}
    >
      {connected ? <CheckCircle size={12} /> : <Circle size={12} />}
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}

function LastSync({ ts }: { ts: string | null }) {
  if (!ts) return <span style={{ fontSize: '12px', color: '#9990b0', fontFamily: "'DM Sans', sans-serif" }}>Never synced</span>;
  return (
    <span style={{ fontSize: '12px', color: '#6b6580', fontFamily: "'DM Sans', sans-serif" }}>
      Last sync: {new Date(ts).toLocaleString()}
    </span>
  );
}

export default function ConnectionsClient({
  basecampConnected: initBcConnected,
  basecampLastSync: initBcSync,
  testflightConnected: initTfConnected,
  testflightLastSync: initTfSync,
  testflightTargetProjectId: initTfTarget,
  projects,
  clients,
}: Props) {
  const [bcConnected, setBcConnected] = useState(initBcConnected);
  const [bcLastSync, setBcLastSync] = useState(initBcSync);
  const [bcSyncing, setBcSyncing] = useState(false);
  const [bcError, setBcError] = useState('');
  const [bcProjects, setBcProjects] = useState<BcProject[]>([]);
  const [bcProjectsLoading, setBcProjectsLoading] = useState(false);
  const [bcShowInstructions, setBcShowInstructions] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bc_connected') === '1') {
      setBcConnected(true);
      loadBcProjects();
      window.history.replaceState({}, '', window.location.pathname);
    }
    const err = params.get('bc_error');
    if (err) {
      setBcError(`OAuth error: ${err.replace(/_/g, ' ')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const [tfConnected, setTfConnected] = useState(initTfConnected);
  const [tfLastSync, setTfLastSync] = useState(initTfSync);
  const [tfTargetProject, setTfTargetProject] = useState(initTfTarget ?? '');
  const [tfIssuerId, setTfIssuerId] = useState('');
  const [tfKeyId, setTfKeyId] = useState('');
  const [tfPrivateKey, setTfPrivateKey] = useState('');
  const [tfAppId, setTfAppId] = useState('');
  const [tfSyncing, setTfSyncing] = useState(false);
  const [tfConnecting, setTfConnecting] = useState(false);
  const [tfError, setTfError] = useState('');
  const [tfShowInstructions, setTfShowInstructions] = useState(false);
  const [tfDebugOpen, setTfDebugOpen] = useState(false);
  const [tfDebugLoading, setTfDebugLoading] = useState(false);
  const [tfDebugData, setTfDebugData] = useState<string>('');

  const [importClient, setImportClient] = useState('');
  const [importBcProject, setImportBcProject] = useState('');
  const [importSaving, setImportSaving] = useState(false);

  async function parseErrMsg(res: Response, fallback: string): Promise<string> {
    try {
      const text = await res.text();
      if (!text) return `${fallback} (${res.status})`;
      const j = JSON.parse(text);
      return j.error ?? fallback;
    } catch {
      return `${fallback} (${res.status})`;
    }
  }

  async function disconnectBasecamp() {
    if (!confirm('Disconnect Basecamp? Project mappings will be cleared.')) return;
    await fetch('/api/integrations/basecamp/configure', { method: 'DELETE' });
    setBcConnected(false); setBcProjects([]);
  }

  async function syncBasecamp() {
    setBcSyncing(true); setBcError('');
    const res = await fetch('/api/integrations/basecamp/sync', { method: 'POST' });
    setBcSyncing(false);
    if (res.ok) { const d = await res.json(); setBcLastSync(new Date().toISOString()); alert(`Synced — created: ${d.created}, updated: ${d.updated}, pushed: ${d.pushed}`); }
    else { setBcError(await parseErrMsg(res, 'Sync failed')); }
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

  async function connectTestFlight() {
    if (!tfIssuerId || !tfKeyId || !tfPrivateKey || !tfAppId || !tfTargetProject) {
      setTfError('All fields required'); return;
    }
    setTfConnecting(true); setTfError('');
    const res = await fetch('/api/integrations/testflight/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuerId: tfIssuerId,
        keyId: tfKeyId,
        privateKey: tfPrivateKey,
        appId: tfAppId,
        targetProjectId: tfTargetProject,
      }),
    });
    setTfConnecting(false);
    if (res.ok) { setTfConnected(true); setTfIssuerId(''); setTfKeyId(''); setTfPrivateKey(''); setTfAppId(''); }
    else { setTfError(await parseErrMsg(res, 'Connection failed')); }
  }

  async function disconnectTestFlight() {
    if (!confirm('Disconnect TestFlight?')) return;
    await fetch('/api/integrations/testflight/configure', { method: 'DELETE' });
    setTfConnected(false);
  }

  async function runTfDebug() {
    setTfDebugLoading(true);
    setTfDebugData('');
    setTfDebugOpen(true);
    try {
      const res = await fetch('/api/integrations/testflight/debug');
      const text = await res.text();
      setTfDebugData(text);
    } catch (e) {
      setTfDebugData(String(e));
    }
    setTfDebugLoading(false);
  }

  async function syncTestFlight() {
    setTfSyncing(true); setTfError('');
    const res = await fetch('/api/integrations/testflight/sync', { method: 'POST' });
    setTfSyncing(false);
    if (res.ok) { const d = await res.json(); setTfLastSync(new Date().toISOString()); alert(`Synced — created: ${d.created}, deleted: ${d.deleted}, screenshots refreshed: ${d.screenshotsRefreshed}`); }
    else { setTfError(await parseErrMsg(res, 'Sync failed')); }
  }

  const linkedProjects = projects.filter((p) => p.basecampTodolistId);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 26px' }}>
      <div
        className="flex flex-col lg:flex-row"
        style={{ maxWidth: '1000px', gap: '20px' }}
      >
        {/* ── Basecamp ───────────────────────────────────────────────── */}
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
              <button
                onClick={() => setBcShowInstructions(!bcShowInstructions)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', padding: '0 0 10px', marginBottom: '4px' }}
              >
                {bcShowInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Setup instructions
              </button>
              {bcShowInstructions && (
                <ol style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#3b3550', lineHeight: 1.7, paddingLeft: '18px', margin: '0 0 14px' }}>
                  <li>Go to <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>launchpad.37signals.com/integrations</code> → <strong>Register application</strong></li>
                  <li>Add both redirect URIs (one per line):<br />
                    <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>http://localhost:3000/api/integrations/basecamp/oauth/callback</code><br />
                    <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>https://faithbranch.com/api/integrations/basecamp/oauth/callback</code>
                  </li>
                  <li>Copy <strong>Client ID</strong> and <strong>Client secret</strong> → add to <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>.env.local</code>:<br />
                    <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>BASECAMP_CLIENT_ID=...</code><br />
                    <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>BASECAMP_CLIENT_SECRET=...</code>
                  </li>
                  <li>Restart dev server → click <strong>Connect with Basecamp</strong> below</li>
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

              {/* Mapped projects */}
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
                      <button onClick={() => removeMapping(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9990b0', padding: '2px' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Import Basecamp project as boards */}
              <div style={{ background: '#F7F3EA', borderRadius: '8px', padding: '14px', border: '1.5px solid rgba(46,41,78,0.12)' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: '#2E294E', marginBottom: '4px' }}>Import Basecamp project</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580', marginBottom: '10px' }}>each task list → new board</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select style={inputStyle} value={importClient} onChange={(e) => setImportClient(e.target.value)}>
                    <option value="">Select client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
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
                      {bcProjects.find((p) => p.id === importBcProject)!.todolists.map((t) => (
                        <div key={t.id}>→ {t.title}</div>
                      ))}
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

        {/* ── TestFlight ─────────────────────────────────────────────── */}
        <div style={{ ...panel, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1B998B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Fraunces, serif', color: '#fff', fontWeight: 700, fontSize: '15px' }}>TF</span>
              </div>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', color: '#2E294E' }}>TestFlight</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#6b6580' }}>Ferric beta feedback → tasks</div>
              </div>
            </div>
            <StatusBadge connected={tfConnected} />
          </div>

          {!tfConnected && (
            <>
              <button
                onClick={() => setTfShowInstructions(!tfShowInstructions)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6580', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', padding: '0 0 10px', marginBottom: '4px' }}
              >
                {tfShowInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Setup instructions
              </button>
              {tfShowInstructions && (
                <ol style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#3b3550', lineHeight: 1.7, paddingLeft: '18px', margin: '0 0 14px' }}>
                  <li>Go to <strong>App Store Connect → Users and Access → Integrations → App Store Connect API</strong></li>
                  <li>Create a key with <strong>Developer</strong> role → download the <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>.p8</code> file</li>
                  <li>Copy the <strong>Issuer ID</strong> shown at the top of the Keys page</li>
                  <li>Copy the <strong>Key ID</strong> shown next to your key</li>
                  <li>Open the <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>.p8</code> file and paste the full contents (including <code style={{ background: '#eee', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>-----BEGIN/END-----</code> lines)</li>
                  <li>Find the App ID: <strong>App Store Connect → Apps → Ferric → General → Apple ID</strong></li>
                </ol>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Issuer ID</label>
                  <input style={inputStyle} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={tfIssuerId} onChange={(e) => setTfIssuerId(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Key ID</label>
                  <input style={inputStyle} placeholder="XXXXXXXXXX" value={tfKeyId} onChange={(e) => setTfKeyId(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Private Key (.p8 contents)</label>
                  <textarea
                    style={{ ...inputStyle, height: '90px', resize: 'vertical', fontFamily: "'Courier New', monospace", fontSize: '11px' }}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    value={tfPrivateKey}
                    onChange={(e) => setTfPrivateKey(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>App ID (Apple ID)</label>
                  <input style={inputStyle} placeholder="1234567890" value={tfAppId} onChange={(e) => setTfAppId(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Import feedback into board</label>
                  <select style={inputStyle} value={tfTargetProject} onChange={(e) => setTfTargetProject(e.target.value)}>
                    <option value="">Select project board…</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.client.name})</option>)}
                  </select>
                </div>
              </div>
              {tfError && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', marginBottom: '10px' }}>{tfError}</p>}
              <button style={btnPrimary('#1B998B')} disabled={tfConnecting} onClick={connectTestFlight}>
                <Zap size={14} /> {tfConnecting ? 'Connecting…' : 'Connect TestFlight'}
              </button>
            </>
          )}

          {tfConnected && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button style={btnPrimary('#1B998B')} disabled={tfSyncing} onClick={syncTestFlight}>
                  <RefreshCw size={13} style={{ animation: tfSyncing ? 'spin 1s linear infinite' : undefined }} />
                  {tfSyncing ? 'Syncing…' : 'Sync now'}
                </button>
                <button style={{ ...btnOutline, fontSize: '13px', padding: '7px 12px' }} onClick={runTfDebug}>
                  Debug API
                </button>
                <button style={{ ...btnOutline, borderColor: '#e74c3c', color: '#e74c3c', boxShadow: '2px 2px 0 0 #e74c3c' }} onClick={disconnectTestFlight}>
                  <Trash2 size={13} /> Disconnect
                </button>
                <LastSync ts={tfLastSync} />
              </div>
              {tfError && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', marginBottom: '10px' }}>{tfError}</p>}
              {tfTargetProject && (
                <div style={{ padding: '10px 12px', background: '#F7F3EA', borderRadius: '7px', border: '1.5px solid rgba(46,41,78,0.12)' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6b6580' }}>Feedback lands in: </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#2E294E' }}>
                    {projects.find((p) => p.id === tfTargetProject)?.name ?? tfTargetProject}
                  </span>
                </div>
              )}
              <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', lineHeight: 1.6, marginTop: '12px' }}>
                Sync pulls new beta feedback from TestFlight and creates tasks in the board above.
                Completing a feedback task here will delete the corresponding feedback from TestFlight.
                For automatic polling, hit <code style={{ background: '#2E294E', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>/api/integrations/testflight/sync</code> via cron with an <code style={{ background: '#2E294E', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '11.5px' }}>x-cron-secret</code> header.
              </p>
            </>
          )}
        </div>
      </div>

      {tfDebugOpen && (
        <>
          <div
            onClick={() => setTfDebugOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.45)', zIndex: 60 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 61, background: '#F4EAD4', border: '2px solid #2E294E', borderRadius: '12px',
            boxShadow: '8px 8px 0 0 rgba(0,0,0,0.25)', width: '90%', maxWidth: '700px',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
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
    </div>
  );
}
