import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { listPortfolioItems, createPortfolioItem } from '@/lib/actions/admin/portfolio';

export const GET = withMobileAuth(async () => {
  const items = await listPortfolioItems();
  return NextResponse.json(items);
});

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.description || !body?.url) {
    return NextResponse.json({ error: 'title, description, url required' }, { status: 400 });
  }

  const item = await createPortfolioItem({
    title: body.title,
    description: body.description,
    url: body.url,
    images: body.images,
    order: body.order,
    noteRot: body.noteRot,
    tapeColor: body.tapeColor,
  });
  return NextResponse.json(item, { status: 201 });
});
