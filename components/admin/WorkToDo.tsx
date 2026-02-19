'use client';

import { useState } from 'react';
import { KanbanColumn, Priority } from '@prisma/client';
import { moveTask } from '@/lib/actions/admin/tasks';

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

  const handleCheck = async (task: ActiveTask) => {
    if (pending.has(task.id)) return;

    // Optimistically remove from list
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
    return <p className="text-sm text-gray-400">No active tasks right now.</p>;
  }

  return (
    <div className="space-y-5">
      {Object.values(byProject).map((projectTasks) => {
        const { project } = projectTasks[0];
        return (
          <div key={project.id}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.client.color ?? '#888' }}
              />
              <span className="text-sm font-medium">{project.name}</span>
              <span className="text-xs text-gray-400">{project.client.name}</span>
            </div>
            <div className="bg-gray-50 rounded-lg border border-black/5 divide-y divide-black/5">
              {projectTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                  {/* Checkbox → moves to Waiting */}
                  <button
                    onClick={() => handleCheck(task)}
                    disabled={pending.has(task.id)}
                    className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center flex-shrink-0 hover:border-gray-500 transition-colors disabled:opacity-40"
                    title="Mark as waiting for client"
                  />
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      task.column === KanbanColumn.IN_PROGRESS
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {task.column === KanbanColumn.IN_PROGRESS ? 'In Progress' : 'To Do'}
                  </span>
                  <span className="flex-1 text-sm">{task.title}</span>
                  {task.priority && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded text-white flex-shrink-0"
                      style={{ backgroundColor: priorityColors[task.priority] }}
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
