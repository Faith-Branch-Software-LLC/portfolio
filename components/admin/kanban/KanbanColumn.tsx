'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnEnum } from '@prisma/client';
import { Plus } from 'lucide-react';
import { TaskWithTags } from '@/lib/types/pm';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  column: KanbanColumnEnum;
  label: string;
  tasks: TaskWithTags[];
  onTaskClick: (task: TaskWithTags) => void;
  onAddTask: (column: KanbanColumnEnum) => void;
}

export default function KanbanColumnComponent({
  column,
  label,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <div className="flex flex-col w-72 flex-shrink-0 h-full">
      <div
        className={`flex flex-col flex-1 rounded-xl transition-colors ${
          isOver ? 'bg-blue-100 ring-2 ring-blue-300' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{label}</h3>
            <span className="text-xs text-gray-400 bg-black/5 rounded-full px-2 py-0.5 min-w-[24px] text-center tabular-nums">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => onAddTask(column)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors"
            title={`Add task to ${label}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Task list — scrollable */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto px-2 min-h-0"
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 py-1">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
              ))}
              {/* Empty drop target padding */}
              {tasks.length === 0 && (
                <div className="h-16 rounded-lg border-2 border-dashed border-black/10" />
              )}
            </div>
          </SortableContext>
        </div>

        {/* Add task footer */}
        <button
          onClick={() => onAddTask(column)}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors rounded-b-xl flex-shrink-0 border-t border-black/5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
}
