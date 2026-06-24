'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnEnum } from '@prisma/client';
import { Plus } from 'lucide-react';
import { TaskWithTags } from '@/lib/types/pm';
import TaskCard from './TaskCard';

const COLUMN_DOT: Record<KanbanColumnEnum, string> = {
  BACKLOG: '#8a8499',
  TODO: '#2E294E',
  IN_PROGRESS: '#1B998B',
  WAITING: '#F46036',
  DONE: '#C5D86D',
};

interface KanbanColumnProps {
  column: KanbanColumnEnum;
  label: string;
  tasks: TaskWithTags[];
  activeTimerTaskIds: Set<string>;
  onTaskClick: (task: TaskWithTags) => void;
  onAddTask: (column: KanbanColumnEnum) => void;
}

export default function KanbanColumnComponent({
  column,
  label,
  tasks,
  activeTimerTaskIds,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const isInProgress = column === KanbanColumnEnum.IN_PROGRESS;
  const dot = COLUMN_DOT[column];

  return (
    <div
      className="flex-shrink-0 w-[280px] md:flex-1 md:min-w-0 md:w-auto flex flex-col max-h-full"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          borderRadius: '9px',
          border: isInProgress
            ? '1.5px solid rgba(27,153,139,0.45)'
            : `1.5px solid ${isOver ? '#1B998B' : 'rgba(46,41,78,0.16)'}`,
          background: isInProgress
            ? 'rgba(27,153,139,0.14)'
            : isOver
            ? 'rgba(27,153,139,0.06)'
            : 'rgba(255,255,255,0.5)',
          transition: 'background 0.15s ease, border-color 0.15s ease',
          maxHeight: '100%',
        }}
      >
        {/* Column header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 12px 9px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                background: dot,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 600,
                fontSize: '14px',
                color: '#2E294E',
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: '11px',
                borderRadius: '10px',
                padding: '1px 7px',
                background: isInProgress
                  ? 'rgba(27,153,139,0.2)'
                  : 'rgba(46,41,78,0.1)',
                color: '#2E294E',
              }}
            >
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => onAddTask(column)}
            title={`Add task to ${label}`}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#8a8499',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              borderRadius: '4px',
            }}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Tasks */}
        <div
          ref={setNodeRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 9px 4px',
            minHeight: 0,
          }}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '2px' }}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} hasActiveTimer={activeTimerTaskIds.has(task.id)} />
              ))}
              {tasks.length === 0 && (
                <div
                  style={{
                    height: '56px',
                    borderRadius: '6px',
                    border: '1.5px dashed rgba(46,41,78,0.2)',
                  }}
                />
              )}
            </div>
          </SortableContext>
        </div>

        {/* Add task footer */}
        <button
          onClick={() => onAddTask(column)}
          style={{
            margin: 'auto 9px 9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'transparent',
            border: '1.5px dashed rgba(46,41,78,0.3)',
            borderRadius: '6px',
            padding: '8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b6580',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Plus size={13} />
          Add task
        </button>
      </div>
    </div>
  );
}
