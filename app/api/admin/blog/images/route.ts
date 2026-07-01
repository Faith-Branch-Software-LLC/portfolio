import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']);

async function collectImages(dir: string, publicBase: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      const sub = await collectImages(fullPath, `${publicBase}/${entry}`);
      results.push(...sub);
    } else {
      const ext = entry.split('.').pop()?.toLowerCase() ?? '';
      if (IMAGE_EXTS.has(ext)) {
        results.push(`${publicBase}/${entry}`);
      }
    }
  }
  return results;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const publicImages = join(process.cwd(), 'public', 'images');
  const images = await collectImages(publicImages, '/images');
  return NextResponse.json({ images });
}
