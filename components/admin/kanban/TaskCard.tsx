'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Priority, KanbanColumn } from '@prisma/client';
import { TaskWithTags } from '@/lib/types/pm';
import { Check } from 'lucide-react';

interface TaskCardProps {
  task: TaskWithTags;
  onTaskClick: (task: TaskWithTags) => void;
  isDragOverlay?: boolean;
}

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

export default function TaskCard({ task, onTaskClick, isDragOverlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { column: task.column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDone = task.column === KanbanColumn.DONE;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: '#ffffff',
        border: '1.5px solid rgba(46,41,78,0.16)',
        borderRadius: '7px',
        boxShadow: isDragOverlay
          ? '6px 6px 0 0 rgba(46,41,78,0.25)'
          : '2px 2px 0 0 rgba(46,41,78,0.1)',
        overflow: 'hidden',
        opacity: isDragging ? 0.4 : isDone ? 0.8 : 1,
        transform: isDragOverlay ? 'rotate(1deg)' : style.transform,
        cursor: isDragOverlay ? 'grabbing' : 'default',
      }}
    >
      {/* Priority stripe */}
      {task.priority && (
        <div
          style={{
            height: '4px',
            background: priorityColors[task.priority],
          }}
        />
      )}

      <div style={{ padding: '10px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        {/* Drag handle / done icon */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginTop: '1px',
            flexShrink: 0,
            cursor: 'grab',
            color: isDone ? '#1B998B' : '#c4c0cf',
            display: 'inline-flex',
            touchAction: 'none',
          }}
        >
          {isDone ? (
            <Check size={13} />
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.3"/>
              <circle cx="9" cy="12" r="1.3"/>
              <circle cx="9" cy="18" r="1.3"/>
              <circle cx="15" cy="6" r="1.3"/>
              <circle cx="15" cy="12" r="1.3"/>
              <circle cx="15" cy="18" r="1.3"/>
            </svg>
          )}
        </button>

        {/* Card body */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => onTaskClick(task)}
        >
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.35,
              fontWeight: isDone ? 400 : 500,
              color: isDone ? '#6b6580' : '#2E294E',
              textDecoration: isDone ? 'line-through' : 'none',
              margin: 0,
            }}
          >
            {task.title}
          </p>

          {(task.priority || task.tags.length > 0 || task.due || task.column === KanbanColumn.WAITING) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '8px',
                paddingLeft: '0',
                flexWrap: 'wrap',
              }}
            >
              {task.priority && (
                <span
                  style={{
                    background: priorityColors[task.priority],
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '4px',
                  }}
                >
                  {priorityLabels[task.priority]}
                </span>
              )}
              {task.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  style={{
                    background: tag.color ?? '#888',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '4px',
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {task.due && (
                <span
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '10px',
                    color: '#8a8499',
                  }}
                >
                  {new Date(task.due).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {task.column === KanbanColumn.WAITING && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '10px',
                    color: '#F46036',
                  }}
                >
                  {(() => {
                    const days = Math.floor(
                      (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
                    );
                    return days === 0 ? '⏳ waiting' : `⏳ ${days}d waiting`;
                  })()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
