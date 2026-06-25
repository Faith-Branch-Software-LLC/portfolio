'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../db';

export async function createPortfolioItem(data: {
  title: string;
  description: string;
  url: string;
  images?: string[];
  order?: number;
  noteRot?: number;
  tapeColor?: string;
}) {
  const maxOrder = await prisma.portfolioItem.aggregate({ _max: { order: true } });
  const item = await prisma.portfolioItem.create({
    data: {
      ...data,
      images: data.images ?? [],
      order: data.order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
  return item;
}

export async function updatePortfolioItem(
  id: string,
  data: {
    title?: string;
    description?: string;
    url?: string;
    images?: string[];
    order?: number;
    noteRot?: number;
    tapeColor?: string;
  },
) {
  const item = await prisma.portfolioItem.update({ where: { id }, data });
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
  return item;
}

export async function deletePortfolioItem(id: string) {
  await prisma.portfolioItem.delete({ where: { id } });
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}

export async function reorderPortfolioItems(ids: string[]) {
  await Promise.all(ids.map((id, i) => prisma.portfolioItem.update({ where: { id }, data: { order: i } })));
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}
