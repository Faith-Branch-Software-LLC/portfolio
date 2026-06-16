'use client';

import { useState } from 'react';
import { KanbanColumn, Priority } from '@prisma/client';
import { moveTask } from '@/lib/actions/admin/tasks';
import { Pause } from 'lucide-react';
import AdminLink from './AdminLink';

const priorityColors: Record<Priority, string> = {
  LOW: '#00bfff',
  MEDIUM: '#ffaf00',
  HIGH: '#ff3b3b',
  URGENT: '#ff0000',
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export type ActiveTask = {
  id: string;
  title: string;
  column: KanbanColumn;
  priority: Priority | null;
  project: { id: string; name: string; client: { name: string; color: string | null } };
};

interface WorkToDoProps {
  initialTasks: ActiveTask[];
}

export default function WorkToDo({ initialTasks }: WorkToDoProps) {
  const [tasks, setTasks] = useState<ActiveTask[]>(initialTasks);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const handleWaiting = async (task: ActiveTask) => {
    if (pending.has(task.id)) return;
    setPending((p) => new Set(p).add(task.id));
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await moveTask(task.id, task.project.id, KanbanColumn.WAITING, [task.id]);
    setPending((p) => {
      const next = new Set(p);
      next.delete(task.id);
      return next;
    });
  };

  const byProject = tasks.reduce<Record<string, ActiveTask[]>>((acc, task) => {
    (acc[task.project.id] ??= []).push(task);
    return acc;
  }, {});

  if (tasks.length === 0) {
    return (
      <p style={{ fontFamily: "'Gelasio', serif", fontSize: '14px', color: '#8a8499', fontStyle: 'italic' }}>
        No active tasks right now.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {Object.values(byProject).map((projectTasks) => {
        const { project } = projectTasks[0];
        return (
          <div key={project.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: project.client.color ?? '#888',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <AdminLink href={`/admin/projects/${project.id}`}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '13.5px',
                    color: '#2E294E',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(46,41,78,0.3)',
                  }}
                >
                  {project.name}
                </span>
              </AdminLink>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#8a8499' }}>
                {project.client.name}
              </span>
            </div>

            <div
              style={{
                border: '1.5px solid rgba(46,41,78,0.14)',
                borderRadius: '7px',
                overflow: 'hidden',
              }}
            >
              {projectTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '9px 12px',
                    borderBottom: '1px solid rgba(46,41,78,0.08)',
                    background: '#ffffff',
                  }}
                >
                  <button
                    onClick={() => handleWaiting(task)}
                    disabled={pending.has(task.id)}
                    title="Send to waiting"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#ffffff',
                      border: '1.5px solid rgba(46,41,78,0.28)',
                      borderRadius: '5px',
                      padding: '4px 8px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#2E294E',
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: pending.has(task.id) ? 0.4 : 1,
                    }}
                  >
                    <Pause size={12} />
                    Waiting
                  </button>

                  <span
                    style={{
                      background:
                        task.column === KanbanColumn.IN_PROGRESS
                          ? '#1B998B'
                          : 'rgba(46,41,78,0.1)',
                      color:
                        task.column === KanbanColumn.IN_PROGRESS ? '#fff' : '#2E294E',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      flexShrink: 0,
                    }}
                  >
                    {task.column === KanbanColumn.IN_PROGRESS ? 'In Progress' : 'To Do'}
                  </span>

                  <span style={{ flex: 1, fontSize: '13px', color: '#2E294E' }}>{task.title}</span>

                  {task.priority && (
                    <span
                      style={{
                        background: priorityColors[task.priority],
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
