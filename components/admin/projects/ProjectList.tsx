'use client';

import { useState } from 'react';
import { Client, Priority, Project, ProjectStatus } from '@prisma/client';
import { archiveProject, deleteProject, unarchiveProject } from '@/lib/actions/admin/projects';
import { Plus, ArchiveRestore, LayoutList, Pencil, Archive, Trash2, Flag, ArrowUpDown } from 'lucide-react';
import ProjectForm from './ProjectForm';
import AdminLink from '@/components/admin/AdminLink';

type ProjectWithClient = Project & { client: Client };

interface ProjectListProps {
  projects: ProjectWithClient[];
  clients: Client[];
}

const STATUS_COLORS: Record<ProjectStatus, { bg: string; color: string }> = {
  NOT_STARTED: { bg: 'rgba(46,41,78,0.12)', color: '#2E294E' },
  IN_PROGRESS: { bg: '#1B998B', color: '#fff' },
  ON_HOLD: { bg: '#F46036', color: '#fff' },
  COMPLETED: { bg: '#C5D86D', color: '#2E294E' },
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#00bfff',
  MEDIUM: '#ffaf00',
  HIGH: '#ff3b3b',
  URGENT: '#ff0000',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

type SortKey = 'name' | 'client' | 'status' | 'priority' | 'due' | 'created';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'created', label: 'Date created' },
  { value: 'name', label: 'Name' },
  { value: 'client', label: 'Client' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'due', label: 'Due date' },
];

const STATUS_ORDER: Record<ProjectStatus, number> = {
  IN_PROGRESS: 0,
  ON_HOLD: 1,
  NOT_STARTED: 2,
  COMPLETED: 3,
};

const PRIORITY_ORDER: Record<Priority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function sortProjects(projects: ProjectWithClient[], key: SortKey): ProjectWithClient[] {
  return [...projects].sort((a, b) => {
    switch (key) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'client':
        return a.client.name.localeCompare(b.client.name);
      case 'status':
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      case 'priority': {
        const pa = a.priority ? PRIORITY_ORDER[a.priority] : 99;
        const pb = b.priority ? PRIORITY_ORDER[b.priority] : 99;
        return pa - pb;
      }
      case 'due': {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due).getTime() - new Date(b.due).getTime();
      }
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });
}

export default function ProjectList({ projects, clients }: ProjectListProps) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    if (typeof window === 'undefined') return 'created';
    return (localStorage.getItem('projects:sortKey') as SortKey) ?? 'created';
  });

  function handleSortChange(key: SortKey) {
    setSortKey(key);
    localStorage.setItem('projects:sortKey', key);
  }

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);
  const visible = sortProjects(showArchived ? projects : active, sortKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header bar */}
      <div
        className="px-4 sm:px-[26px]"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 26px',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600,
              fontSize: '25px',
              margin: 0,
              color: '#2E294E',
            }}
          >
            Projects
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Courier New', monospace",
              fontSize: '12.5px',
              color: '#6b6580',
            }}
          >
            {active.length} active
            {archived.length > 0 ? ` · ${archived.length} archived` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={13} style={{ color: '#6b6580', flexShrink: 0 }} />
            <select
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value as SortKey)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
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
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {archived.length > 0 && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                color: '#2E294E',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                padding: '8px 12px',
                border: '1.5px solid rgba(46,41,78,0.28)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Archive size={14} />
              <span className="hidden sm:inline">{showArchived ? 'Hide archived' : `Archived (${archived.length})`}</span>
            </button>
          )}
          <button
            onClick={() => setCreating(true)}
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
            <span className="hidden sm:inline">New project</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-[24px_26px]" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* New project form */}
        {creating && (
          <div
            style={{
              background: '#fff',
              border: '2px solid #2E294E',
              borderRadius: '10px',
              boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
              padding: '22px',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 600,
                fontSize: '17px',
                margin: '0 0 16px',
                color: '#2E294E',
              }}
            >
              New Project
            </h2>
            <ProjectForm
              clients={clients}
              onSuccess={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {visible.length === 0 && !creating ? (
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
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {visible.map((project) =>
              editing?.id === project.id ? (
                <div
                  key={project.id}
                  style={{
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '10px',
                    boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
                    padding: '20px',
                    gridColumn: '1 / -1',
                  }}
                >
                  <ProjectForm
                    project={project}
                    clients={clients}
                    onSuccess={() => setEditing(null)}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <div
                  key={project.id}
                  style={{
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '8px',
                    boxShadow: '3px 3px 0 0 rgba(46,41,78,0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: project.archived ? 0.65 : 1,
                    overflow: 'hidden',
                  }}
                >
                  {/* Top color bar */}
                  <div
                    style={{
                      height: '4px',
                      background: project.client.color ?? '#888',
                      flexShrink: 0,
                    }}
                  />

                  {/* Card body */}
                  <div style={{ padding: '14px 14px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Name + badges */}
                    <div>
                      <span
                        style={{
                          fontFamily: 'Fraunces, serif',
                          fontWeight: 600,
                          fontSize: '15px',
                          color: '#2E294E',
                          display: 'block',
                          marginBottom: '6px',
                          lineHeight: 1.3,
                        }}
                      >
                        {project.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: STATUS_COLORS[project.status].bg,
                            color: STATUS_COLORS[project.status].color,
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '20px',
                          }}
                        >
                          {STATUS_LABELS[project.status]}
                        </span>
                        {project.priority && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                              fontWeight: 600,
                              color: PRIORITY_COLORS[project.priority],
                            }}
                          >
                            <Flag size={10} />
                            {PRIORITY_LABELS[project.priority]}
                          </span>
                        )}
                        {project.archived && (
                          <span style={{ fontSize: '10px', color: '#8a8499', fontStyle: 'italic' }}>
                            Archived
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: '11px',
                        color: '#8a8499',
                        marginTop: 'auto',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: project.client.color ?? '#888',
                          marginRight: '5px',
                          verticalAlign: 'middle',
                        }}
                      />
                      {project.client.name}
                      {project.due && (
                        <span style={{ display: 'block', marginTop: '2px' }}>
                          Due {new Date(project.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card footer — actions */}
                  <div
                    style={{
                      borderTop: '1.5px solid rgba(46,41,78,0.1)',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AdminLink href={`/admin/projects/${project.id}`} style={{ flex: 1 }}>
                      <button
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#2E294E',
                          color: '#fff',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        <LayoutList size={13} />
                        Board
                      </button>
                    </AdminLink>

                    <button
                      onClick={() => setEditing(project)}
                      title="Edit"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        color: '#2E294E',
                        padding: '6px 8px',
                        border: '1.5px solid rgba(46,41,78,0.2)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      onClick={() =>
                        project.archived ? unarchiveProject(project.id) : archiveProject(project.id)
                      }
                      title={project.archived ? 'Restore' : 'Archive'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        color: '#2E294E',
                        padding: '6px 8px',
                        border: '1.5px solid rgba(46,41,78,0.2)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {project.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete "${project.name}"? This cannot be undone.`))
                          deleteProject(project.id);
                      }}
                      title="Delete"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        color: '#D7263D',
                        padding: '6px 8px',
                        border: '1.5px solid rgba(215,38,61,0.3)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
