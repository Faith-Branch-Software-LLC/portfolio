'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KanbanColumn, Priority } from '@prisma/client';
import { createTask, deleteTask, updateTask } from '@/lib/actions/admin/tasks';
import { TaskWithTags } from '@/lib/types/pm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { X, Trash2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  due: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const columnLabels: Record<KanbanColumn, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  DONE: 'Done',
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

interface TaskSidebarProps {
  open: boolean;
  task: TaskWithTags | null;
  column: KanbanColumn | null;
  projectId: string;
  onClose: () => void;
  onCreated: (task: TaskWithTags) => void;
  onUpdated: (task: TaskWithTags) => void;
  onDeleted: (taskId: string) => void;
}

export default function TaskSidebar({
  open,
  task,
  column,
  projectId,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: TaskSidebarProps) {
  const isEditing = !!task;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: undefined,
      due: '',
    },
  });

  // Reset form whenever the sidebar target changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority ?? undefined,
        due: task.due ? task.due.toISOString().split('T')[0] : '',
      });
    } else {
      form.reset({ title: '', description: '', priority: undefined, due: '' });
    }
  }, [task, open]);

  const onSubmit = async (values: FormValues) => {
    const data = {
      ...values,
      due: values.due ? new Date(values.due) : undefined,
      priority: values.priority ?? undefined,
    };

    if (isEditing) {
      const updated = await updateTask(task.id, projectId, data);
      onUpdated(updated);
    } else {
      const created = await createTask({ ...data, projectId, column: column ?? KanbanColumn.BACKLOG });
      onCreated(created);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Delete this task?')) return;
    await deleteTask(task.id, projectId);
    onDeleted(task.id);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-black/10 shadow-xl z-50 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-500">
            {isEditing
              ? columnLabels[task.column]
              : column
                ? `New task — ${columnLabels[column]}`
                : 'New task'}
          </p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <Form {...form}>
            <form id="task-sidebar-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        autoFocus
                        placeholder="Task title"
                        className="w-full text-lg font-medium bg-transparent border-0 border-b border-black/10 pb-2 focus:outline-none focus:border-black/30 placeholder:text-gray-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-400 uppercase tracking-wide">Notes</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={5}
                        placeholder="Add notes, context, links..."
                        className="w-full rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Priority + Due */}
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-gray-400 uppercase tracking-wide">Priority</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full h-9 rounded-lg border border-black/10 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                        >
                          <option value="">None</option>
                          {Object.entries(priorityLabels).map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="due"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-gray-400 uppercase tracking-wide">Due date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-sm border-black/10 bg-gray-50" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-black/10 flex-shrink-0">
          {isEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="task-sidebar-form" size="sm">
              {isEditing ? 'Save' : 'Create task'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
