'use server';

import { IntegrationType, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { prisma } from '../../db';

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

export async function saveBasecampIntegration(token: string, accountId: string, apiBase = 'https://3.basecampapi.com') {
  const config = { token, accountId, apiBase } satisfies BasecampConfig as unknown as Prisma.InputJsonValue;
  await prisma.integration.upsert({
    where: { type: IntegrationType.BASECAMP },
    create: { type: IntegrationType.BASECAMP, config },
    update: { config, updatedAt: new Date() },
  });
  revalidatePath('/admin/connections');
}

export async function saveTestFlightIntegration(
  issuerId: string,
  keyId: string,
  privateKey: string,
  appId: string,
  targetProjectId: string,
) {
  const config = { issuerId, keyId, privateKey, appId, targetProjectId } satisfies TestFlightConfig as unknown as Prisma.InputJsonValue;
  await prisma.integration.upsert({
    where: { type: IntegrationType.TESTFLIGHT },
    create: { type: IntegrationType.TESTFLIGHT, config },
    update: { config, updatedAt: new Date() },
  });
  revalidatePath('/admin/connections');
}

export async function getIntegration(type: IntegrationType) {
  return prisma.integration.findUnique({ where: { type } });
}

export async function deleteIntegration(type: IntegrationType) {
  await prisma.integration.deleteMany({ where: { type } });
  revalidatePath('/admin/connections');
}

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
