'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Client, Priority, Project, ProjectStatus } from '@prisma/client';
import { archiveProject, deleteProject, unarchiveProject } from '@/lib/actions/admin/projects';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Archive, ArchiveRestore, ArrowRight } from 'lucide-react';
import ProjectForm from './ProjectForm';

type ProjectWithClient = Project & { client: Client };

interface ProjectListProps {
  projects: ProjectWithClient[];
  clients: Client[];
}

const statusColors: Record<ProjectStatus, string> = {
  NOT_STARTED: '#888888',
  IN_PROGRESS: '#3498db',
  ON_HOLD: '#e67e22',
  COMPLETED: '#2ecc71',
};

const statusLabels: Record<ProjectStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
};

const priorityLabels: Record<Priority, string> = {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-fraunces font-semibold">Projects</h1>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide archived' : `Show archived (${archived.length})`}
            </Button>
          )}
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {creating && (
        <div className="bg-white rounded-xl border border-black/10 p-6">
          <h2 className="font-semibold mb-4">New Project</h2>
          <ProjectForm
            clients={clients}
            onSuccess={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {visible.length === 0 && !creating ? (
        <div className="text-center py-16 text-gray-400">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((project) =>
            editing?.id === project.id ? (
              <div key={project.id} className="bg-white rounded-xl border border-black/10 p-6">
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
                className={`bg-white rounded-xl border border-black/10 px-6 py-4 flex items-center gap-4 ${project.archived ? 'opacity-60' : ''}`}
              >
                <div
                  className="w-2 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.client.color ?? '#888888' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{project.name}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: statusColors[project.status] }}
                    >
                      {statusLabels[project.status]}
                    </span>
                    {project.priority && (
                      <span className="text-xs text-gray-400">
                        {priorityLabels[project.priority]}
                      </span>
                    )}
                    {project.archived && (
                      <span className="text-xs text-gray-400 italic">Archived</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{project.client.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/projects/${project.id}`}>
                    <Button variant="ghost" size="icon" title="Open board">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(project)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={project.archived ? 'Unarchive' : 'Archive'}
                    onClick={() =>
                      project.archived
                        ? unarchiveProject(project.id)
                        : archiveProject(project.id)
                    }
                  >
                    {project.archived ? (
                      <ArchiveRestore className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`Delete "${project.name}"? This cannot be undone.`))
                        deleteProject(project.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
