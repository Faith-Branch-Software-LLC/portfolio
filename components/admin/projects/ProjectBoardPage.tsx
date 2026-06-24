'use client';

import { useState } from 'react';
import { useTransitionRouter } from 'next-transition-router';
import { Client, KanbanColumn, Priority, ProjectStatus } from '@prisma/client';
import { TaskWithTags } from '@/lib/types/pm';
import KanbanBoard from '../kanban/KanbanBoard';
import ProjectForm from './ProjectForm';
import { Plus, Zap, Pencil, ChevronLeft, X, Copy, RefreshCw, Clock } from 'lucide-react';
import { generateProjectApiToken } from '@/lib/actions/admin/integrations';
import ProjectHeatmap from './ProjectHeatmap';

interface ProjectBoardPageProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    clientId: string;
    status: ProjectStatus;
    priority: Priority | null;
    due: Date | null;
    apiToken: string | null;
    basecampTodolistId: string | null;
    client: { name: string; color: string | null };
  };
  clients: Client[];
  tasks: TaskWithTags[];
  totalMinutes?: number;
  heatmapGrid?: number[][];
  heatmapAlignedStart?: string;
  isTestFlightTarget?: boolean;
  isBasecampLinked?: boolean;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function ProjectBoardPage({ project, clients, tasks, totalMinutes, heatmapGrid, heatmapAlignedStart, isTestFlightTarget, isBasecampLinked }: ProjectBoardPageProps) {
  const router = useTransitionRouter();
  const [pendingAddColumn, setPendingAddColumn] = useState<KanbanColumn | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const integrationLinked = isTestFlightTarget || isBasecampLinked;
  const syncEndpoint = isBasecampLinked
    ? '/api/integrations/basecamp/sync'
    : '/api/integrations/testflight/sync';
  const syncLabel = isBasecampLinked ? 'Basecamp' : 'TestFlight';

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch(syncEndpoint, { method: 'POST' });
      if (res.ok) { router.refresh(); }
      else { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Sync failed'); }
    } finally {
      setSyncing(false);
    }
  }
  const [apiToken, setApiToken] = useState(project.apiToken);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerateToken() {
    setGeneratingToken(true);
    const token = await generateProjectApiToken(project.id);
    setApiToken(token);
    setGeneratingToken(false);
  }

  function copyToken() {
    if (!apiToken) return;
    navigator.clipboard.writeText(apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="px-4 sm:px-[26px] py-[15px] sm:py-[15px]"
        style={{
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: back button + project info */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => router.push('/admin/projects')}
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
              marginBottom: '9px',
              alignSelf: 'flex-start',
            }}
          >
            <ChevronLeft size={15} />
            Back to projects
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: project.client.color ?? '#888',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <h1
                className="text-[18px] sm:text-[24px]"
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 600,
                  margin: 0,
                  color: '#2E294E',
                }}
              >
                {project.name}
              </h1>
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px',
                  color: '#8a8499',
                }}
              >
                {project.client.name}
              </span>
            </div>
            {project.description && (
              <p
                style={{
                  margin: '5px 0 0',
                  fontFamily: 'Gelasio, serif',
                  fontSize: '13.5px',
                  color: '#6b6580',
                  maxWidth: '520px',
                }}
              >
                {project.description}
              </p>
            )}
            {totalMinutes != null && totalMinutes > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '6px',
                  background: 'rgba(27,153,139,0.1)',
                  border: '1px solid rgba(27,153,139,0.3)',
                  borderRadius: '5px',
                  padding: '3px 8px',
                }}
              >
                <Clock size={12} style={{ color: '#1B998B' }} />
                <span
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1B998B',
                  }}
                >
                  {formatMinutes(totalMinutes)} logged
                </span>
              </div>
            )}
          </div>
        </div>{/* end left column */}

        {heatmapGrid && heatmapGrid.length > 0 && (
            <div
              className="hidden md:flex"
              style={{ flex: 1, justifyContent: 'center', overflow: 'hidden', paddingLeft: '16px' }}
            >
              <ProjectHeatmap grid={heatmapGrid} alignedStart={heatmapAlignedStart} fillHeight />
            </div>
          )}

          <div style={{ display: 'flex', gap: '9px', flexShrink: 0, alignItems: 'center' }}>
            {integrationLinked ? (
              <button
                onClick={handleSync}
                disabled={syncing}
                title={`Sync with ${syncLabel}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#1B998B',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '10px 15px',
                  border: '2px solid #2E294E',
                  borderRadius: '6px',
                  boxShadow: '3px 3px 0 0 #2E294E',
                  cursor: syncing ? 'default' : 'pointer',
                  opacity: syncing ? 0.7 : 1,
                }}
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">{syncing ? 'Syncing…' : `Sync ${syncLabel}`}</span>
              </button>
            ) : (
              <button
                onClick={() => setLinkOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#1B998B',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '10px 15px',
                  border: '2px solid #2E294E',
                  borderRadius: '6px',
                  boxShadow: '3px 3px 0 0 #2E294E',
                  cursor: 'pointer',
                }}
              >
                <Zap size={16} />
                <span className="hidden sm:inline">Link up</span>
              </button>
            )}

            {/* Edit project */}
            <button
              title="Edit project"
              onClick={() => setEditOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#2E294E',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                padding: '10px 15px',
                border: '2px solid #2E294E',
                borderRadius: '6px',
                boxShadow: '3px 3px 0 0 #2E294E',
                cursor: 'pointer',
              }}
            >
              <Pencil size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Add task */}
            <button
              onClick={() => setPendingAddColumn(KanbanColumn.BACKLOG)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F46036',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                padding: '10px 15px',
                border: '2px solid #2E294E',
                borderRadius: '6px',
                boxShadow: '3px 3px 0 0 #2E294E',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add task</span>
            </button>
          </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <KanbanBoard
          projectId={project.id}
          projectName={project.name}
          initialTasks={tasks}
          pendingAddColumn={pendingAddColumn}
          onPendingAddConsumed={() => setPendingAddColumn(null)}
        />
      </div>

      {/* Link up modal */}
      {linkOpen && (
        <>
          <div
            onClick={() => setLinkOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.35)', zIndex: 50 }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              background: '#F4EAD4',
              border: '2px solid #2E294E',
              borderRadius: '12px',
              boxShadow: '8px 8px 0 0 rgba(0,0,0,0.25)',
              width: '100%',
              maxWidth: '480px',
              padding: '28px 28px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '19px', color: '#2E294E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} />
                Link up
              </h2>
              <button
                onClick={() => setLinkOpen(false)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: '#fff', border: '1.5px solid #2E294E', borderRadius: '6px', cursor: 'pointer', color: '#2E294E' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* API Token */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#2E294E', marginBottom: '6px' }}>
                API Token
              </div>
              <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', margin: '0 0 10px', lineHeight: 1.5 }}>
                Use this token to push tasks into this board from external apps. Pass it as{' '}
                <code style={{ background: '#2E294E', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>Authorization: Bearer …</code>
              </p>
              {apiToken ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ flex: 1, background: '#fff', border: '1.5px solid rgba(46,41,78,0.25)', borderRadius: '6px', padding: '9px 12px', fontFamily: "'Courier New', monospace", fontSize: '11.5px', color: '#2E294E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {apiToken}
                  </code>
                  <button
                    onClick={copyToken}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: copied ? '#1B998B' : '#fff', color: copied ? '#fff' : '#2E294E', border: '1.5px solid #2E294E', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, transition: 'all 0.15s', flexShrink: 0 }}
                  >
                    <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateToken}
                  disabled={generatingToken}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#2E294E', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13.5px', padding: '9px 16px', border: '2px solid #2E294E', borderRadius: '6px', boxShadow: '3px 3px 0 0 rgba(0,0,0,0.2)', cursor: 'pointer' }}
                >
                  <RefreshCw size={14} style={{ animation: generatingToken ? 'spin 1s linear infinite' : undefined }} />
                  {generatingToken ? 'Generating…' : 'Generate API token'}
                </button>
              )}
            </div>

            {/* Basecamp link status */}
            <div style={{ borderTop: '1.5px solid rgba(46,41,78,0.15)', paddingTop: '16px' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#2E294E', marginBottom: '6px' }}>
                Basecamp
              </div>
              {project.basecampTodolistId ? (
                <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#1B998B', margin: 0 }}>
                  Linked to Basecamp todolist #{project.basecampTodolistId}. Manage mappings in <strong>Connections</strong>.
                </p>
              ) : (
                <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', margin: 0 }}>
                  Not linked to a Basecamp task list. Link it from the <strong>Connections</strong> page.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit project modal */}
      {editOpen && (
        <>
          <div
            onClick={() => setEditOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(46,41,78,0.35)',
              zIndex: 50,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              background: '#F4EAD4',
              border: '2px solid #2E294E',
              borderRadius: '12px',
              boxShadow: '8px 8px 0 0 rgba(0,0,0,0.25)',
              width: '100%',
              maxWidth: '520px',
              padding: '28px 28px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '19px', color: '#2E294E', margin: 0 }}>
                Edit project
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  background: '#fff',
                  border: '1.5px solid #2E294E',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#2E294E',
                }}
              >
                <X size={15} />
              </button>
            </div>
            <ProjectForm
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                clientId: project.clientId,
                status: project.status,
                priority: project.priority,
                due: project.due,
              } as Parameters<typeof ProjectForm>[0]['project']}
              clients={clients}
              onSuccess={() => { setEditOpen(false); router.refresh(); }}
              onCancel={() => setEditOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
