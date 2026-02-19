'use server';

import { KanbanColumn } from '@prisma/client';
import { prisma } from '../../db';

export async function logActivity(
  projectId: string,
  taskId: string | null,
  action: 'created' | 'moved' | 'edited' | 'deleted',
  fromColumn?: KanbanColumn,
  toColumn?: KanbanColumn,
  details?: string,
) {
  await prisma.activityLog.create({
    data: {
      projectId,
      taskId,
      action,
      fromColumn,
      toColumn,
      details,
    },
  });
}
