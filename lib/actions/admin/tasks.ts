'use server';

import { KanbanColumn, Priority } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '../../db';
import { logActivity } from './activity';

const taskInclude = {
  tags: { include: { tag: true } },
} as const;

export async function createTask(data: {
  title: string;
  projectId: string;
  column?: KanbanColumn;
  description?: string;
  priority?: Priority;
  due?: Date;
}) {
  const column = data.column ?? KanbanColumn.BACKLOG;

  const lastTask = await prisma.task.findFirst({
    where: { projectId: data.projectId, column },
    orderBy: { order: 'desc' },
  });
  const order = (lastTask?.order ?? -1) + 1;

  const task = await prisma.task.create({
    data: { ...data, column, order },
    include: taskInclude,
  });

  await logActivity(data.projectId, task.id, 'created', undefined, column);
  revalidatePath(`/admin/projects/${data.projectId}`);
  return task;
}

export async function updateTask(
  id: string,
  projectId: string,
  data: {
    title?: string;
    description?: string;
    priority?: Priority | null;
    due?: Date | null;
  },
) {
  const task = await prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });
  await logActivity(projectId, id, 'edited');
  revalidatePath(`/admin/projects/${projectId}`);
  return task;
}

export async function moveTask(
  taskId: string,
  projectId: string,
  newColumn: KanbanColumn,
  orderedIds: string[],
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const fromColumn = task.column;
  const now = new Date();

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: {
          column: newColumn,
          order: index,
          ...(id === taskId && {
            completedAt:
              newColumn === KanbanColumn.DONE
                ? now
                : fromColumn === KanbanColumn.DONE
                  ? null
                  : task.completedAt,
          }),
        },
      }),
    ),
  );

  if (fromColumn !== newColumn) {
    await logActivity(projectId, taskId, 'moved', fromColumn, newColumn);
  }

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteTask(id: string, projectId: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;

  await prisma.task.delete({ where: { id } });
  await logActivity(projectId, null, 'deleted', task.column, undefined, task.title);
  revalidatePath(`/admin/projects/${projectId}`);
}
