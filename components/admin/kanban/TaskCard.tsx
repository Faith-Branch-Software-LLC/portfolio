'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Priority } from '@prisma/client';
import { GripVertical } from 'lucide-react';
import { TaskWithTags } from '@/lib/types/pm';

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-black/10 shadow-sm transition-opacity ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${isDragOverlay ? 'shadow-lg rotate-1 cursor-grabbing' : ''}`}
    >
      {task.priority && (
        <div
          className="h-1 rounded-t-lg"
          style={{ backgroundColor: priorityColors[task.priority] }}
        />
      )}
      <div className="flex items-start gap-1.5 p-2.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Card body — click to open sidebar */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <p className="text-sm font-medium leading-snug">{task.title}</p>

          {/* Meta row */}
          {(task.priority || task.tags.length > 0 || task.due) && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {task.priority && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded text-white leading-none"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                >
                  {priorityLabels[task.priority]}
                </span>
              )}
              {task.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="text-xs px-1.5 py-0.5 rounded text-white leading-none"
                  style={{ backgroundColor: tag.color ?? '#888' }}
                >
                  {tag.name}
                </span>
              ))}
              {task.due && (
                <span className="text-xs text-gray-400">
                  {new Date(task.due).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
