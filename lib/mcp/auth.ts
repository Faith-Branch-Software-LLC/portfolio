import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';

export async function verifyMcpApiKey(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  const provided = auth.slice(7).trim();
  if (!provided) return false;

  const setting = await prisma.adminSetting.findUnique({ where: { key: 'mcp_api_key' } });
  if (!setting?.value) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(setting.value);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
