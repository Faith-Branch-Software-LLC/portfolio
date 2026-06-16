'use client';

import { useState } from 'react';
import { useTransitionRouter } from 'next-transition-router';
import { Client, KanbanColumn, Priority, ProjectStatus } from '@prisma/client';
import { TaskWithTags } from '@/lib/types/pm';
import KanbanBoard from '../kanban/KanbanBoard';
import ProjectForm from './ProjectForm';
import { Plus, Zap, Pencil, ChevronLeft, X } from 'lucide-react';

interface ProjectBoardPageProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    clientId: string;
    status: ProjectStatus;
    priority: Priority | null;
    due: Date | null;
    client: { name: string; color: string | null };
  };
  clients: Client[];
  tasks: TaskWithTags[];
}

export default function ProjectBoardPage({ project, clients, tasks }: ProjectBoardPageProps) {
  const router = useTransitionRouter();
  const [pendingAddColumn, setPendingAddColumn] = useState<KanbanColumn | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        className="px-4 sm:px-[26px] py-[15px] sm:py-[15px]"
        style={{
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
        }}
      >
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
          }}
        >
          <ChevronLeft size={15} />
          Back to projects
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
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
          </div>

          <div style={{ display: 'flex', gap: '9px', flexShrink: 0 }}>
            {/* Link up — placeholder */}
            <button
              title="Link up (coming soon)"
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
      </div>

      {/* Board */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <KanbanBoard
          projectId={project.id}
          initialTasks={tasks}
          pendingAddColumn={pendingAddColumn}
          onPendingAddConsumed={() => setPendingAddColumn(null)}
        />
      </div>

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
