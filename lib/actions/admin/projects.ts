'use server';

import { Priority, ProjectStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '../../db';

export async function listProjects(filter?: { clientId?: string; archived?: boolean }) {
  return prisma.project.findMany({
    where: {
      ...(filter?.clientId ? { clientId: filter.clientId } : {}),
      ...(filter?.archived !== undefined ? { archived: filter.archived } : {}),
    },
    orderBy: [{ archived: 'asc' }, { createdAt: 'desc' }],
    include: { client: true },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      tasks: {
        orderBy: { order: 'asc' },
        include: { tags: { include: { tag: true } } },
      },
    },
  });
}

export async function createProject(data: {
  name: string;
  clientId: string;
  status?: ProjectStatus;
  priority?: Priority;
  due?: Date;
  description?: string;
}) {
  const project = await prisma.project.create({ data });
  revalidatePath('/admin/projects');
  revalidatePath('/admin');
  return project;
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    clientId?: string;
    status?: ProjectStatus;
    priority?: Priority;
    due?: Date | null;
    description?: string;
  },
) {
  const project = await prisma.project.update({ where: { id }, data });
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath('/admin');
  return project;
}

export async function archiveProject(id: string) {
  await prisma.project.update({ where: { id }, data: { archived: true } });
  revalidatePath('/admin/projects');
  revalidatePath('/admin');
}

export async function unarchiveProject(id: string) {
  await prisma.project.update({ where: { id }, data: { archived: false } });
  revalidatePath('/admin/projects');
  revalidatePath('/admin');
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath('/admin/projects');
  revalidatePath('/admin');
}
