import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/actions/authOptions";
import { getIntegration } from '@/lib/actions/admin/integrations';
import { IntegrationType } from '@prisma/client';
import { listProjects, listTodolists } from '@/lib/utils/basecampApi';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integration = await getIntegration(IntegrationType.BASECAMP);
  if (!integration) return NextResponse.json({ error: 'Basecamp not connected' }, { status: 404 });

  const { token, accountId, apiBase = 'https://3.basecampapi.com' } = integration.config as { token: string; accountId: string; apiBase?: string };

  try {
    const projects = await listProjects(token, accountId, apiBase);
    const activeProjects = projects.filter((p) => p.status === 'active');

    const result = await Promise.all(
      activeProjects.map(async (p) => {
        try {
          const todolists = await listTodolists(token, accountId, String(p.id), apiBase);
          return { id: String(p.id), name: p.name, todolists };
        } catch {
          return { id: String(p.id), name: p.name, todolists: [] };
        }
      }),
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
