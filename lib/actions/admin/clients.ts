'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../db';

export async function createClient(data: { name: string; color?: string }) {
  const client = await prisma.client.create({ data });
  revalidatePath('/admin/clients');
  revalidatePath('/admin');
  return client;
}

export async function updateClient(id: string, data: { name: string; color?: string }) {
  const client = await prisma.client.update({ where: { id }, data });
  revalidatePath('/admin/clients');
  revalidatePath('/admin');
  return client;
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
  revalidatePath('/admin/clients');
  revalidatePath('/admin');
}
