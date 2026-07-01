import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { markdownToHtml } from '@/lib/blog';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { markdown } = await req.json();
  if (typeof markdown !== 'string') return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const html = await markdownToHtml(markdown);
  return NextResponse.json({ html });
}
