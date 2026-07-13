import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/actions/authOptions";
import { getIntegration } from '@/lib/actions/admin/integrations';
import { IntegrationType, KanbanColumn, ExternalSource } from '@prisma/client';
import { decryptConfig } from '@/lib/utils/encryption';
import { prisma } from '@/lib/db';
import {
  listTodos,
  createTodo,
  completeTodo,
  uncompleteTodo,
} from '@/lib/utils/basecampApi';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cronSecret = req.headers.get('x-cron-secret');
  const validCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  if (!session && !validCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integration = await getIntegration(IntegrationType.BASECAMP);
  if (!integration) return NextResponse.json({ error: 'Basecamp not connected' }, { status: 404 });

  const { token, accountId, apiBase = 'https://3.basecampapi.com' } = decryptConfig<{ token: string; accountId: string; apiBase?: string }>(integration.config);

  const linkedProjects = await prisma.project.findMany({
    where: { basecampTodolistId: { not: null }, archived: false },
    include: { tasks: true },
  });

  let created = 0;
  let updated = 0;
  let pushed = 0;

  for (const project of linkedProjects) {
    const bcProjectId = project.basecampProjectId!;
    const bcTodolistId = project.basecampTodolistId!;

    const todos = await listTodos(token, accountId, bcProjectId, bcTodolistId, apiBase);
    const todoMap = new Map(todos.map((t) => [String(t.id), t]));

    const localTaskMap = new Map(
      project.tasks
        .filter((t) => t.basecampTodoId)
        .map((t) => [t.basecampTodoId!, t]),
    );

    for (const todo of todos) {
      const todoId = String(todo.id);
      const existing = localTaskMap.get(todoId);

      if (!existing) {
        const lastTask = await prisma.task.findFirst({
          where: { projectId: project.id, column: KanbanColumn.BACKLOG },
          orderBy: { order: 'desc' },
        });
        await prisma.task.create({
          data: {
            title: todo.title,
            description: todo.description || undefined,
            projectId: project.id,
            column: todo.completed ? KanbanColumn.DONE : KanbanColumn.BACKLOG,
            order: (lastTask?.order ?? -1) + 1,
            completedAt: todo.completed ? new Date() : undefined,
            basecampTodoId: todoId,
            basecampUrl: todo.app_url,
            basecampCommentsCount: todo.comments_count,
            externalSource: ExternalSource.BASECAMP,
          },
        });
        created++;
      } else {
        const columnChange: { column?: KanbanColumn; completedAt?: Date | null } = {};
        if (todo.completed && existing.column !== KanbanColumn.DONE) {
          columnChange.column = KanbanColumn.DONE;
          columnChange.completedAt = new Date();
        } else if (!todo.completed && existing.column === KanbanColumn.DONE) {
          columnChange.column = KanbanColumn.BACKLOG;
          columnChange.completedAt = null;
        }
        if (
          Object.keys(columnChange).length > 0 ||
          existing.basecampUrl !== todo.app_url ||
          existing.basecampCommentsCount !== todo.comments_count
        ) {
          await prisma.task.update({
            where: { id: existing.id },
            data: {
              ...columnChange,
              basecampUrl: todo.app_url,
              basecampCommentsCount: todo.comments_count,
            },
          });
          updated++;
        }
      }
    }

    for (const task of project.tasks) {
      if (!task.basecampTodoId) {
        const todo = await createTodo(token, accountId, bcProjectId, bcTodolistId, task.title, task.description ?? undefined, apiBase);
        await prisma.task.update({
          where: { id: task.id },
          data: { basecampTodoId: String(todo.id) },
        });
        if (task.column === KanbanColumn.DONE) {
          await completeTodo(token, accountId, bcProjectId, String(todo.id), apiBase);
        }
        pushed++;
      } else {
        const todo = todoMap.get(task.basecampTodoId);
        if (todo) {
          if (task.column === KanbanColumn.DONE && !todo.completed) {
            await completeTodo(token, accountId, bcProjectId, task.basecampTodoId, apiBase);
            updated++;
          } else if (task.column !== KanbanColumn.DONE && todo.completed) {
            await uncompleteTodo(token, accountId, bcProjectId, task.basecampTodoId, apiBase);
            updated++;
          }
        }
      }
    }
  }

  const bcInt = await prisma.integration.findFirst({ where: { type: IntegrationType.BASECAMP } });
  if (bcInt) {
    await prisma.integration.update({ where: { id: bcInt.id }, data: { lastSyncedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, created, updated, pushed });
}
