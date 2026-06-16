'use client';

import { useState } from 'react';
import { Client, Priority, Project, ProjectStatus } from '@prisma/client';
import { archiveProject, deleteProject, unarchiveProject } from '@/lib/actions/admin/projects';
import { Plus, ArchiveRestore, LayoutList, Pencil, Archive, Trash2, Flag } from 'lucide-react';
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

export default function ProjectList({ projects, clients }: ProjectListProps) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);
  const visible = showArchived ? projects : active;

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
              marginBottom: '16px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visible.map((project) =>
              editing?.id === project.id ? (
                <div
                  key={project.id}
                  style={{
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '10px',
                    boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
                    padding: '22px',
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
                    boxShadow: '4px 4px 0 0 rgba(46,41,78,0.18)',
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: '16px',
                    padding: '15px 18px',
                    opacity: project.archived ? 0.7 : 1,
                  }}
                >
                  {/* Client color bar */}
                  <div
                    style={{
                      width: '6px',
                      borderRadius: '4px',
                      background: project.client.color ?? '#888',
                      flexShrink: 0,
                      alignSelf: 'stretch',
                      minHeight: '42px',
                    }}
                  />

                  {/* Info + actions wrapper */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                    {/* Project info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Fraunces, serif',
                            fontWeight: 600,
                            fontSize: '16px',
                            color: '#2E294E',
                          }}
                        >
                          {project.name}
                        </span>
                        <span
                          style={{
                            background: STATUS_COLORS[project.status].bg,
                            color: STATUS_COLORS[project.status].color,
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '3px 10px',
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
                              fontSize: '11px',
                              fontWeight: 600,
                              color: PRIORITY_COLORS[project.priority],
                            }}
                          >
                            <Flag size={11} />
                            {PRIORITY_LABELS[project.priority]}
                          </span>
                        )}
                        {project.archived && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              color: '#8a8499',
                              fontStyle: 'italic',
                            }}
                          >
                            Archived
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: '11.5px',
                          color: '#8a8499',
                          marginTop: '4px',
                        }}
                      >
                        {project.client.name}
                        {project.due && (
                          <> · due {new Date(project.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <AdminLink href={`/admin/projects/${project.id}`}>
                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            background: '#2E294E',
                            color: '#fff',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: '13px',
                            padding: '8px 13px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <LayoutList size={14} />
                          <span className="hidden sm:inline">Open board</span>
                        </button>
                      </AdminLink>

                      <button
                        onClick={() => setEditing(project)}
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
                        <Pencil size={14} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={() =>
                          project.archived
                            ? unarchiveProject(project.id)
                            : archiveProject(project.id)
                        }
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
                        {project.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                        <span className="hidden sm:inline">{project.archived ? 'Restore' : 'Archive'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete "${project.name}"? This cannot be undone.`))
                            deleteProject(project.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ffffff',
                          color: '#D7263D',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '13px',
                          padding: '8px 12px',
                          border: '1.5px solid rgba(215,38,61,0.4)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
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
