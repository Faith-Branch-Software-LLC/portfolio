'use client';

import { useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnEnum } from '@prisma/client';
import { moveTask } from '@/lib/actions/admin/tasks';
import { TaskWithTags } from '@/lib/types/pm';
import KanbanColumnComponent from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskSidebar from './TaskSidebar';

const COLUMNS: { key: KanbanColumnEnum; label: string }[] = [
  { key: KanbanColumnEnum.BACKLOG, label: 'Backlog' },
  { key: KanbanColumnEnum.TODO, label: 'To Do' },
  { key: KanbanColumnEnum.IN_PROGRESS, label: 'In Progress' },
  { key: KanbanColumnEnum.WAITING, label: 'Waiting' },
  { key: KanbanColumnEnum.DONE, label: 'Done' },
];

interface KanbanBoardProps {
  projectId: string;
  initialTasks: TaskWithTags[];
}

export default function KanbanBoard({ projectId, initialTasks }: KanbanBoardProps) {
  // useRef keeps tasks always current inside DnD event handlers (avoids stale closure)
  const tasksRef = useRef<TaskWithTags[]>(initialTasks);
  const [tasks, setTasksState] = useState<TaskWithTags[]>(initialTasks);
  const dragOverColumnRef = useRef<KanbanColumnEnum | null>(null);
  const [activeTask, setActiveTask] = useState<TaskWithTags | null>(null);

  // Sidebar state
  const [sidebarTask, setSidebarTask] = useState<TaskWithTags | null>(null);
  const [sidebarColumn, setSidebarColumn] = useState<KanbanColumnEnum | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Always update both state and ref together
  const setTasks = (updater: TaskWithTags[] | ((prev: TaskWithTags[]) => TaskWithTags[])) => {
    setTasksState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      tasksRef.current = next;
      return next;
    });
  };

  const getColumnTasks = (column: KanbanColumnEnum, list = tasksRef.current) =>
    list.filter((t) => t.column === column).sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // ── Sidebar handlers ──────────────────────────────────────────────────────

  const openTask = (task: TaskWithTags) => {
    setSidebarTask(task);
    setSidebarColumn(null);
    setSidebarOpen(true);
  };

  const openCreate = (column: KanbanColumnEnum) => {
    setSidebarTask(null);
    setSidebarColumn(column);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSidebarTask(null);
    setSidebarColumn(null);
  };

  const handleTaskCreated = (task: TaskWithTags) => {
    setTasks((prev) => [...prev, task]);
    closeSidebar();
  };

  const handleTaskUpdated = (task: TaskWithTags) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    setSidebarTask(task); // keep sidebar showing fresh data
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    closeSidebar();
  };

  // ── DnD handlers ──────────────────────────────────────────────────────────

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasksRef.current.find((t) => t.id === active.id) ?? null);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const current = tasksRef.current;

    const dragged = current.find((t) => t.id === activeId);
    if (!dragged) return;

    const destColumn =
      Object.values(KanbanColumnEnum).includes(overId as KanbanColumnEnum)
        ? (overId as KanbanColumnEnum)
        : current.find((t) => t.id === overId)?.column;

    if (!destColumn || dragged.column === destColumn) return;

    dragOverColumnRef.current = destColumn;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, column: destColumn, order: getColumnTasks(destColumn, prev).length }
          : t,
      ),
    );
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    const destColumn = dragOverColumnRef.current;
    dragOverColumnRef.current = null;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const current = tasksRef.current;

    const task = current.find((t) => t.id === activeId);
    if (!task) return;

    // If it's a same-column reorder (destColumn was never set by onDragOver)
    if (!destColumn) {
      const col = task.column;
      const columnTasks = getColumnTasks(col, current);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      const updated = current.map((t) => {
        const idx = reordered.findIndex((r) => r.id === t.id);
        return idx !== -1 ? { ...t, order: idx } : t;
      });
      setTasks(updated);

      const finalIds = getColumnTasks(col, updated).map((t) => t.id);
      await moveTask(activeId, projectId, col, finalIds);
      return;
    }

    // Cross-column move — state already updated optimistically in onDragOver
    const finalIds = getColumnTasks(destColumn, current).map((t) => t.id);
    await moveTask(activeId, projectId, destColumn, finalIds);
  };

  return (
    <div className="flex h-full min-h-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 flex-1 h-full">
          {COLUMNS.map(({ key, label }) => (
            <KanbanColumnComponent
              key={key}
              column={key}
              label={label}
              tasks={getColumnTasks(key)}
              onTaskClick={openTask}
              onAddTask={openCreate}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onTaskClick={() => {}} isDragOverlay />}
        </DragOverlay>
      </DndContext>

      <TaskSidebar
        open={sidebarOpen}
        task={sidebarTask}
        column={sidebarColumn}
        projectId={projectId}
        onClose={closeSidebar}
        onCreated={handleTaskCreated}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}
