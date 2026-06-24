'use server';

import { IntegrationType, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { prisma } from '../../db';
import { encryptConfig } from '@/lib/utils/encryption';

export interface BasecampConfig {
  token: string;
  accountId: string;
  apiBase: string;
}

export interface TestFlightConfig {
  issuerId: string;
  keyId: string;
  privateKey: string;
  appId: string;
  targetProjectId: string;
}

export interface GoogleCalendarConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email?: string;
}

export interface AppleCalendarConfig {
  calDavUrl: string;
  username: string;
  password: string;
}

// ─── Basecamp (single instance — replace on save) ─────────────────────────────

export async function saveBasecampIntegration(token: string, accountId: string, apiBase = 'https://3.basecampapi.com') {
  const config = encryptConfig({ token, accountId, apiBase } satisfies BasecampConfig) as unknown as Prisma.InputJsonValue;
  await prisma.$transaction([
    prisma.integration.deleteMany({ where: { type: IntegrationType.BASECAMP } }),
    prisma.integration.create({ data: { type: IntegrationType.BASECAMP, name: 'Basecamp', config } }),
  ]);
  revalidatePath('/admin/connections');
}

// ─── TestFlight (multi-instance) ─────────────────────────────────────────────

export async function createTestFlightIntegration(
  name: string,
  issuerId: string,
  keyId: string,
  privateKey: string,
  appId: string,
  targetProjectId: string,
) {
  const config = encryptConfig({ issuerId, keyId, privateKey, appId, targetProjectId } satisfies TestFlightConfig) as unknown as Prisma.InputJsonValue;
  await prisma.integration.create({ data: { type: IntegrationType.TESTFLIGHT, name, config } });
  revalidatePath('/admin/connections');
}

// ─── Generic helpers ─────────────────────────────────────────────────────────

export async function getIntegration(type: IntegrationType) {
  return prisma.integration.findFirst({ where: { type } });
}

export async function getIntegrations(type: IntegrationType) {
  return prisma.integration.findMany({ where: { type }, orderBy: { createdAt: 'asc' } });
}

export async function deleteIntegration(type: IntegrationType) {
  await prisma.integration.deleteMany({ where: { type } });
  revalidatePath('/admin/connections');
}

export async function deleteIntegrationById(id: string) {
  await prisma.integration.delete({ where: { id } });
  revalidatePath('/admin/connections');
}

export async function updateIntegrationLastSync(id: string) {
  await prisma.integration.update({ where: { id }, data: { lastSyncedAt: new Date() } });
}

// ─── Project / client helpers (unchanged) ────────────────────────────────────

export async function generateProjectApiToken(projectId: string): Promise<string> {
  const token = 'fbk_live_' + randomBytes(18).toString('base64url');
  await prisma.project.update({ where: { id: projectId }, data: { apiToken: token } });
  revalidatePath(`/admin/projects/${projectId}`);
  return token;
}

export async function linkProjectToBasecamp(
  projectId: string,
  basecampProjectId: string,
  basecampTodolistId: string,
) {
  await prisma.project.update({
    where: { id: projectId },
    data: { basecampProjectId, basecampTodolistId },
  });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath('/admin/connections');
}

export async function importBasecampTodolistsAsProjects(
  clientId: string,
  bcProjectId: string,
  todolists: { id: string; title: string }[],
) {
  const existing = await prisma.project.findMany({
    where: { clientId, basecampTodolistId: { in: todolists.map((t) => t.id) } },
    select: { basecampTodolistId: true },
  });
  const existingIds = new Set(existing.map((p) => p.basecampTodolistId));

  for (const tl of todolists) {
    if (existingIds.has(tl.id)) continue;
    await prisma.project.create({
      data: {
        name: tl.title,
        clientId,
        basecampProjectId: bcProjectId,
        basecampTodolistId: tl.id,
      },
    });
  }
  revalidatePath('/admin/connections');
  revalidatePath('/admin/projects');
}

export async function unlinkProjectFromBasecamp(projectId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: { basecampProjectId: null, basecampTodolistId: null },
  });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath('/admin/connections');
}
