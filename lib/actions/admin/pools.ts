'use server';

import { revalidatePath } from 'next/cache';
import { ChemicalType } from '@prisma/client';
import { prisma } from '../../db';
import { MIN_VISIT_MINUTES } from '@/lib/pool-constants';

const DEFAULT_CHECKLISTS: Record<ChemicalType, string[]> = {
  CHLORINE: [
    'Test chlorine level',
    'Test pH level',
    'Skim surface',
    'Empty skimmer baskets',
    'Brush walls',
    'Vacuum pool',
    'Empty pump basket',
    'Backwash filter if needed',
    'Add chlorine',
    'Add pH adjuster',
  ],
  SALT: [
    'Test salt level',
    'Test pH level',
    'Inspect salt cell',
    'Skim surface',
    'Empty skimmer baskets',
    'Brush walls',
    'Vacuum pool',
    'Empty pump basket',
    'Backwash filter if needed',
    'Add stabilizer if needed',
  ],
};

const poolDetailInclude = {
  checklistItems: { orderBy: { order: 'asc' as const } },
  visits: {
    orderBy: { date: 'desc' as const },
    include: {
      chemicals: true,
      checklistChecks: { select: { checklistItemId: true } },
    },
  },
} as const;

export async function getPools() {
  return prisma.pool.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
    include: { _count: { select: { visits: true } } },
  });
}

export async function getPool(id: string) {
  return prisma.pool.findUnique({ where: { id }, include: poolDetailInclude });
}

export async function createPool(data: {
  name: string;
  address: string;
  contactName?: string;
  chemicalType: ChemicalType;
  notes?: string;
}) {
  const pool = await prisma.pool.create({
    data: {
      ...data,
      checklistItems: {
        create: DEFAULT_CHECKLISTS[data.chemicalType].map((label, order) => ({ label, order })),
      },
    },
    include: poolDetailInclude,
  });
  revalidatePath('/admin/pools');
  return pool;
}

export async function updatePool(
  id: string,
  data: { name?: string; address?: string; contactName?: string | null; chemicalType?: ChemicalType; notes?: string | null },
) {
  const pool = await prisma.pool.update({ where: { id }, data });
  revalidatePath('/admin/pools');
  revalidatePath(`/admin/pools/${id}`);
  return pool;
}

export async function deletePool(id: string) {
  await prisma.pool.delete({ where: { id } });
  revalidatePath('/admin/pools');
}

export async function createChecklistItem(poolId: string, label: string) {
  const last = await prisma.poolChecklistItem.findFirst({ where: { poolId }, orderBy: { order: 'desc' } });
  const item = await prisma.poolChecklistItem.create({
    data: { poolId, label, order: (last?.order ?? -1) + 1 },
  });
  revalidatePath(`/admin/pools/${poolId}`);
  return item;
}

export async function updateChecklistItem(id: string, poolId: string, label: string) {
  const item = await prisma.poolChecklistItem.update({ where: { id }, data: { label } });
  revalidatePath(`/admin/pools/${poolId}`);
  return item;
}

export async function deleteChecklistItem(id: string, poolId: string) {
  await prisma.poolChecklistItem.delete({ where: { id } });
  revalidatePath(`/admin/pools/${poolId}`);
}

interface VisitInput {
  poolId: string;
  date: Date;
  minutes: number;
  notes?: string;
  chemicals: { name: string; amount?: string }[];
  checkedItemIds: string[];
}

function assertMinVisitMinutes(minutes: number) {
  if (minutes < MIN_VISIT_MINUTES) {
    throw new Error(`Visits must be logged for at least ${MIN_VISIT_MINUTES / 60} hours.`);
  }
}

export async function createVisit(data: VisitInput) {
  assertMinVisitMinutes(data.minutes);

  const visit = await prisma.poolVisit.create({
    data: {
      poolId: data.poolId,
      date: data.date,
      minutes: data.minutes,
      notes: data.notes,
      chemicals: { create: data.chemicals.filter((c) => c.name.trim()).map((c) => ({ name: c.name, amount: c.amount })) },
      checklistChecks: { create: data.checkedItemIds.map((checklistItemId) => ({ checklistItemId })) },
    },
    include: { chemicals: true, checklistChecks: { select: { checklistItemId: true } } },
  });
  revalidatePath(`/admin/pools/${data.poolId}`);
  revalidatePath('/admin/pools/reports');
  return visit;
}

export async function updateVisit(id: string, data: VisitInput) {
  assertMinVisitMinutes(data.minutes);

  const visit = await prisma.$transaction(async (tx) => {
    await tx.poolChemicalUsed.deleteMany({ where: { visitId: id } });
    await tx.poolVisitChecklistCheck.deleteMany({ where: { visitId: id } });
    return tx.poolVisit.update({
      where: { id },
      data: {
        date: data.date,
        minutes: data.minutes,
        notes: data.notes,
        chemicals: { create: data.chemicals.filter((c) => c.name.trim()).map((c) => ({ name: c.name, amount: c.amount })) },
        checklistChecks: { create: data.checkedItemIds.map((checklistItemId) => ({ checklistItemId })) },
      },
      include: { chemicals: true, checklistChecks: { select: { checklistItemId: true } } },
    });
  });
  revalidatePath(`/admin/pools/${data.poolId}`);
  revalidatePath('/admin/pools/reports');
  return visit;
}

export async function deleteVisit(id: string, poolId: string) {
  await prisma.poolVisit.delete({ where: { id } });
  revalidatePath(`/admin/pools/${poolId}`);
  revalidatePath('/admin/pools/reports');
}

export interface PoolHoursSummaryVisit {
  id: string;
  date: Date;
  minutes: number;
}

export interface PoolHoursSummaryPool {
  id: string;
  name: string;
  address: string;
  minutes: number;
  visits: PoolHoursSummaryVisit[];
}

export interface PoolHoursSummary {
  totalMinutes: number;
  pools: PoolHoursSummaryPool[];
}

export async function getPoolHoursSummary(from: Date, to: Date): Promise<PoolHoursSummary> {
  const visits = await prisma.poolVisit.findMany({
    where: { date: { gte: from, lt: to } },
    include: { pool: { select: { id: true, name: true, address: true } } },
    orderBy: { date: 'desc' },
  });

  const totalMinutes = visits.reduce((sum, v) => sum + v.minutes, 0);

  const poolMap = new Map<string, PoolHoursSummaryPool>();
  for (const v of visits) {
    let pool = poolMap.get(v.pool.id);
    if (!pool) {
      pool = { id: v.pool.id, name: v.pool.name, address: v.pool.address, minutes: 0, visits: [] };
      poolMap.set(v.pool.id, pool);
    }
    pool.minutes += v.minutes;
    pool.visits.push({ id: v.id, date: v.date, minutes: v.minutes });
  }

  const pools = Array.from(poolMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  return { totalMinutes, pools };
}

export interface PoolMonthlyReportChemical {
  name: string;
  amount: string | null;
}

export interface PoolMonthlyReportVisit {
  id: string;
  date: Date;
  chemicals: PoolMonthlyReportChemical[];
}

export interface PoolMonthlyReportPool {
  id: string;
  name: string;
  address: string;
  contactName: string | null;
  visits: PoolMonthlyReportVisit[];
}

export async function getPoolMonthlyReport(year: number, month: number): Promise<PoolMonthlyReportPool[]> {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);

  const pools = await prisma.pool.findMany({
    where: { visits: { some: { date: { gte: from, lt: to } } } },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      address: true,
      contactName: true,
      visits: {
        where: { date: { gte: from, lt: to } },
        orderBy: { date: 'asc' },
        select: { id: true, date: true, chemicals: { select: { name: true, amount: true } } },
      },
    },
  });

  return pools;
}
