'use server';

import crypto from 'crypto';
import { prisma } from '../../db';

export interface SyncStatus {
  hash: string;
}

export async function getSyncHash(): Promise<SyncStatus> {
  const [client, project, task, timeEntry, pool, poolVisit] = await Promise.all([
    prisma.client.aggregate({ _max: { updatedAt: true }, _count: true }),
    prisma.project.aggregate({ _max: { updatedAt: true }, _count: true }),
    prisma.task.aggregate({ _max: { updatedAt: true }, _count: true }),
    prisma.timeEntry.aggregate({ _max: { updatedAt: true }, _count: true }),
    prisma.pool.aggregate({ _max: { updatedAt: true }, _count: true }),
    prisma.poolVisit.aggregate({ _max: { updatedAt: true }, _count: true }),
  ]);

  const fingerprint = JSON.stringify([client, project, task, timeEntry, pool, poolVisit]);
  const hash = crypto.createHash('md5').update(fingerprint).digest('hex');

  return { hash };
}
