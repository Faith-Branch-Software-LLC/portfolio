'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KanbanColumn, Priority } from '@prisma/client';
import { createTask, deleteTask, updateTask } from '@/lib/actions/admin/tasks';
import {
  clockIn,
  clockOut,
  deleteTimeEntry,
  getActiveTimerForTask,
  getTaskTimeEntries,
  updateTimeEntry,
} from '@/lib/actions/admin/time';
import { TaskWithTags } from '@/lib/types/pm';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { Trash2, X, Check, Copy, ClipboardCheck, Play, Square, Pencil } from 'lucide-react';

type TimeEntry = { id: string; date: Date; minutes: number };
type ActiveTimerState = { id: string; clockedIn: Date } | null;

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function ElapsedTimer({ clockedIn }: { clockedIn: Date }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(clockedIn).getTime()) / 1000),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(clockedIn).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockedIn]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return <>{h}h {String(m).padStart(2, '0')}m</>;
  return <>{m}:{String(s).padStart(2, '0')}</>;
}

function TimeEntryRow({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: TimeEntry;
  onUpdate: (id: string, minutes: number) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(String(Math.floor(entry.minutes / 60)));
  const [mins, setMins] = useState(String(entry.minutes % 60));

  const dateLabel = new Date(entry.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const save = () => {
    const total = (parseInt(hours) || 0) * 60 + (parseInt(mins) || 0);
    onUpdate(entry.id, total);
    setEditing(false);
  };

  const cancel = () => {
    setHours(String(Math.floor(entry.minutes / 60)));
    setMins(String(entry.minutes % 60));
    setEditing(false);
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
    fontSize: '11.5px',
    color: '#8a8499',
  };

  const inputStyle: React.CSSProperties = {
    width: '48px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    color: '#2E294E',
    background: '#fff',
    border: '1px solid rgba(46,41,78,0.3)',
    borderRadius: '4px',
    padding: '3px 6px',
    outline: 'none',
    textAlign: 'center',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        borderBottom: '1px solid rgba(46,41,78,0.06)',
      }}
    >
      <span style={{ ...labelStyle, minWidth: '52px' }}>{dateLabel}</span>
      {editing ? (
        <>
          <input
            type="number"
            value={hours}
            min={0}
            onChange={(e) => setHours(e.target.value)}
            style={inputStyle}
          />
          <span style={labelStyle}>h</span>
          <input
            type="number"
            value={mins}
            min={0}
            max={59}
            onChange={(e) => setMins(e.target.value)}
            style={inputStyle}
          />
          <span style={labelStyle}>m</span>
          <button
            onClick={save}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1B998B', padding: '2px' }}
          >
            <Check size={14} />
          </button>
          <button
            onClick={cancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8499', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <span
            style={{
              flex: 1,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: '#2E294E',
            }}
          >
            {formatMinutes(entry.minutes)}
          </span>
          <button
            onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8499', padding: '2px' }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D7263D', padding: '2px' }}
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.string().optional(),
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

const columnDot: Record<KanbanColumn, string> = {
  BACKLOG: '#8a8499',
  TODO: '#2E294E',
  IN_PROGRESS: '#1B998B',
  WAITING: '#F46036',
  DONE: '#C5D86D',
};

const priorityOptions: [Priority, string][] = [
  ['LOW', 'Low'],
  ['MEDIUM', 'Medium'],
  ['HIGH', 'High'],
  ['URGENT', 'Urgent'],
];

const priorityColors: Record<Priority, string> = {
  LOW: '#00bfff',
  MEDIUM: '#ffaf00',
  HIGH: '#ff3b3b',
  URGENT: '#ff0000',
};

interface TaskSidebarProps {
  open: boolean;
  task: TaskWithTags | null;
  column: KanbanColumn | null;
  projectId: string;
  projectName?: string;
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
  projectName,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: TaskSidebarProps) {
  const isEditing = !!task;
  const activeColumn = task?.column ?? column ?? KanbanColumn.BACKLOG;
  const dot = columnDot[activeColumn];
  const colLabel = columnLabels[activeColumn];
  const [copied, setCopied] = useState(false);

  // Time tracking state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);

  const handleCopy = () => {
    if (!task) return;
    const payload = {
      id: task.id,
      project: projectName ?? projectId,
      title: task.title,
      status: columnLabels[task.column],
      priority: task.priority ?? null,
      description: task.description ?? null,
      due: task.due ? task.due.toISOString().split('T')[0] : null,
      tags: task.tags.map((t) => t.tag.name),
      screenshotUrl: task.screenshotUrl ?? null,
      externalSource: task.externalSource ?? null,
      basecampTodoId: task.basecampTodoId ?? null,
      testflightFeedbackId: task.testflightFeedbackId ?? null,
      createdAt: task.createdAt,
      completedAt: task.completedAt ?? null,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', priority: '', due: '' },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority ?? '',
        due: task.due ? task.due.toISOString().split('T')[0] : '',
      });
    } else {
      form.reset({ title: '', description: '', priority: '', due: '' });
    }
  }, [task, open]);

  useEffect(() => {
    if (!task) {
      setTimeEntries([]);
      setActiveTimer(null);
      return;
    }
    Promise.all([
      getTaskTimeEntries(task.id),
      getActiveTimerForTask(task.id),
    ]).then(([entries, timer]) => {
      setTimeEntries(entries);
      setActiveTimer(timer);
    });
  }, [task?.id]);

  const handleClockIn = async () => {
    if (!task) return;
    setClockingIn(true);
    const timer = await clockIn(task.id);
    setActiveTimer(timer);
    setClockingIn(false);
  };

  const handleClockOut = async () => {
    if (!activeTimer) return;
    setClockingOut(true);
    await clockOut(activeTimer.id);
    setActiveTimer(null);
    if (task) {
      const entries = await getTaskTimeEntries(task.id);
      setTimeEntries(entries);
    }
    setClockingOut(false);
  };

  const handleUpdateEntry = async (id: string, minutes: number) => {
    if (minutes < 1) {
      setTimeEntries((prev) => prev.filter((e) => e.id !== id));
      await deleteTimeEntry(id);
    } else {
      setTimeEntries((prev) => prev.map((e) => (e.id === id ? { ...e, minutes } : e)));
      await updateTimeEntry(id, minutes);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    setTimeEntries((prev) => prev.filter((e) => e.id !== id));
    await deleteTimeEntry(id);
  };

  const totalMinutes = timeEntries.reduce((sum, e) => sum + e.minutes, 0);

  const onSubmit = async (values: FormValues) => {
    const data = {
      ...values,
      due: values.due ? new Date(values.due) : undefined,
      priority: (values.priority && values.priority !== '') ? values.priority as Priority : undefined,
    };
    if (isEditing) {
      const updated = await updateTask(task.id, projectId, data);
      onUpdated(updated);
    } else {
      const created = await createTask({
        ...data,
        projectId,
        column: column ?? KanbanColumn.BACKLOG,
      });
      onCreated(created);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Delete this task?')) return;
    await deleteTask(task.id, projectId);
    onDeleted(task.id);
  };

  const priorityValue = form.watch('priority');

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(46,41,78,0.18)',
            zIndex: 40,
          }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100dvh',
          width: 'min(380px, 95vw)',
          background: '#fff',
          borderLeft: '2px solid #2E294E',
          boxShadow: '-8px 0 24px rgba(46,41,78,0.18)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.2s ease',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '2px solid #2E294E',
            background: '#F4EAD4',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
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
                fontSize: '15px',
                color: '#2E294E',
              }}
            >
              {isEditing ? colLabel : `New task — ${colLabel}`}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
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
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <Form {...form}>
            <form id="task-sidebar-form" onSubmit={form.handleSubmit(onSubmit)}>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem style={{ marginBottom: '20px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: '11px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#8a8499',
                        marginBottom: '6px',
                      }}
                    >
                      Title
                    </label>
                    <FormControl>
                      <input
                        {...field}
                        autoFocus
                        placeholder="Task title"
                        style={{
                          width: '100%',
                          fontFamily: 'Fraunces, serif',
                          fontWeight: 600,
                          fontSize: '19px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '2px solid rgba(46,41,78,0.2)',
                          paddingBottom: '9px',
                          outline: 'none',
                          color: '#2E294E',
                          boxSizing: 'border-box',
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem style={{ marginBottom: '18px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: '11px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#8a8499',
                        marginBottom: '7px',
                      }}
                    >
                      Notes
                    </label>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={5}
                        placeholder="Add notes, context, links..."
                        style={{
                          width: '100%',
                          background: '#F7F3EA',
                          border: '1.5px solid rgba(46,41,78,0.16)',
                          borderRadius: '7px',
                          padding: '11px 12px',
                          fontFamily: 'Gelasio, serif',
                          fontSize: '16px',
                          lineHeight: 1.5,
                          color: '#3b3550',
                          resize: 'none',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Screenshot */}
              {task?.screenshotUrl && (
                <div style={{ marginBottom: '18px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#8a8499',
                      marginBottom: '7px',
                    }}
                  >
                    Screenshot
                  </label>
                  <a href={task.screenshotUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <img
                      src={task.screenshotUrl}
                      alt="TestFlight screenshot"
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1.5px solid rgba(46,41,78,0.16)',
                        display: 'block',
                        objectFit: 'contain',
                        background: '#F7F3EA',
                      }}
                    />
                  </a>
                </div>
              )}

              {/* Priority + Due */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '11px',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#8a8499',
                          marginBottom: '7px',
                        }}
                      >
                        Priority
                      </label>
                      <FormControl>
                        <div
                          style={{
                            background: '#F7F3EA',
                            border: '1.5px solid rgba(46,41,78,0.2)',
                            borderRadius: '7px',
                            padding: '9px 11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                          }}
                        >
                          <span
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              background: field.value && field.value in priorityColors
                                ? priorityColors[field.value as Priority]
                                : '#c4c0cf',
                              flexShrink: 0,
                              display: 'inline-block',
                            }}
                          />
                          <select
                            {...field}
                            style={{
                              flex: 1,
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              fontSize: '16px',
                              color: '#2E294E',
                              cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <option value="">None</option>
                            {priorityOptions.map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due"
                  render={({ field }) => (
                    <FormItem style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '11px',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#8a8499',
                          marginBottom: '7px',
                        }}
                      >
                        Due date
                      </label>
                      <FormControl>
                        <div
                          style={{
                            background: '#F7F3EA',
                            border: '1.5px solid rgba(46,41,78,0.2)',
                            borderRadius: '7px',
                            padding: '9px 11px',
                          }}
                        >
                          <input
                            type="date"
                            {...field}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              fontSize: '16px',
                              color: field.value ? '#2E294E' : '#8a8499',
                              fontFamily: "'DM Sans', sans-serif",
                              cursor: 'pointer',
                            }}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>

        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '2px solid #2E294E',
            flexShrink: 0,
          }}
        >
          {isEditing ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy task as JSON'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: copied ? '#1B998B' : '#fff',
                  color: copied ? '#fff' : '#2E294E',
                  border: `1.5px solid ${copied ? '#1B998B' : 'rgba(46,41,78,0.28)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {copied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
              </button>

              {/* Log */}
              {totalMinutes > 0 && (
                <button
                  type="button"
                  onClick={() => setTimeDialogOpen(true)}
                  title="View time log"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '32px',
                    padding: '0 10px',
                    background: '#fff',
                    color: '#2E294E',
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 700,
                    fontSize: '12px',
                    border: '1.5px solid rgba(46,41,78,0.28)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {formatMinutes(totalMinutes)}
                </button>
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={handleDelete}
                title="Delete task"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: '#fff',
                  color: '#D7263D',
                  border: '1.5px solid rgba(215,38,61,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
              </button>

              {/* Clock in / out */}
              <button
                type="button"
                onClick={activeTimer ? handleClockOut : handleClockIn}
                disabled={clockingIn || clockingOut}
                title={activeTimer ? 'Clock out' : 'Clock in'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  height: '32px',
                  padding: '0 10px',
                  background: activeTimer ? '#1B998B' : '#fff',
                  color: activeTimer ? '#fff' : '#2E294E',
                  border: `1.5px solid ${activeTimer ? '#1B998B' : 'rgba(46,41,78,0.28)'}`,
                  borderRadius: '6px',
                  cursor: (clockingIn || clockingOut) ? 'default' : 'pointer',
                  opacity: (clockingIn || clockingOut) ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                {activeTimer ? <Square size={13} /> : <Play size={13} />}
                {activeTimer && <ElapsedTimer clockedIn={activeTimer.clockedIn} />}
              </button>
            </div>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
            <button
              type="submit"
              form="task-sidebar-form"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: '#1B998B',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                padding: '9px 16px',
                border: '2px solid #2E294E',
                borderRadius: '6px',
                boxShadow: '3px 3px 0 0 #2E294E',
                cursor: 'pointer',
              }}
            >
              <Check size={15} />
              {isEditing ? 'Save' : 'Create task'}
            </button>
          </div>
        </div>
      </div>

      {/* Time tracking dialog */}
      {timeDialogOpen && task && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(46,41,78,0.45)',
              zIndex: 60,
            }}
            onClick={() => setTimeDialogOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 61,
              background: '#fff',
              border: '2px solid #2E294E',
              borderRadius: '12px',
              boxShadow: '8px 8px 0 0 rgba(0,0,0,0.22)',
              width: 'min(420px, 92vw)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '80dvh',
            }}
          >
            {/* Dialog header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#F4EAD4',
                borderBottom: '2px solid #2E294E',
                borderRadius: '10px 10px 0 0',
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    color: '#2E294E',
                  }}
                >
                  Time Tracking
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '11px',
                    color: '#8a8499',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '280px',
                  }}
                >
                  {task.title}
                </div>
              </div>
              <button
                onClick={() => setTimeDialogOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  background: '#fff',
                  border: '1.5px solid #2E294E',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#2E294E',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Dialog body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {timeEntries.length > 0 ? (
                <>
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#1B998B',
                      marginBottom: '14px',
                    }}
                  >
                    {formatMinutes(totalMinutes)} total
                  </div>
                  {timeEntries.map((entry) => (
                    <TimeEntryRow
                      key={entry.id}
                      entry={entry}
                      onUpdate={handleUpdateEntry}
                      onDelete={handleDeleteEntry}
                    />
                  ))}
                </>
              ) : (
                <p
                  style={{
                    fontFamily: 'Gelasio, serif',
                    fontStyle: 'italic',
                    fontSize: '13px',
                    color: '#8a8499',
                    margin: 0,
                  }}
                >
                  No time logged yet.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
