import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/actions/authOptions";
import { getIntegration } from '@/lib/actions/admin/integrations';
import { IntegrationType, KanbanColumn, ExternalSource } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  listTodos,
  createTodo,
  completeTodo,
  uncompleteTodo,
} from '@/lib/utils/basecampApi';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integration = await getIntegration(IntegrationType.BASECAMP);
  if (!integration) return NextResponse.json({ error: 'Basecamp not connected' }, { status: 404 });

  const { token, accountId, apiBase = 'https://3.basecampapi.com' } = integration.config as { token: string; accountId: string; apiBase?: string };

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
            externalSource: ExternalSource.BASECAMP,
          },
        });
        created++;
      } else {
        if (todo.completed && existing.column !== KanbanColumn.DONE) {
          await prisma.task.update({
            where: { id: existing.id },
            data: { column: KanbanColumn.DONE, completedAt: new Date() },
          });
          updated++;
        } else if (!todo.completed && existing.column === KanbanColumn.DONE) {
          await prisma.task.update({
            where: { id: existing.id },
            data: { column: KanbanColumn.BACKLOG, completedAt: null },
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

  await prisma.integration.update({
    where: { type: IntegrationType.BASECAMP },
    data: { lastSyncedAt: new Date() },
  });

  return NextResponse.json({ ok: true, created, updated, pushed });
}
