import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { updatePortfolioItem, deletePortfolioItem } from '@/lib/actions/admin/portfolio';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const item = await updatePortfolioItem(id, {
    title: body.title,
    description: body.description,
    url: body.url,
    images: body.images,
    order: body.order,
    noteRot: body.noteRot,
    tapeColor: body.tapeColor,
  });
  return NextResponse.json(item);
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await deletePortfolioItem(id);
  return new NextResponse(null, { status: 204 });
});
