import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { getBlogPost, updateBlogPost, deleteBlogPost } from '@/lib/actions/admin/blog';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const post = await getBlogPost(Number(id));
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
});

export const PATCH = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  try {
    const post = await updateBlogPost(Number(id), {
      title: body.title,
      description: body.description,
      content: body.content,
      tags: body.tags,
      imageUrl: body.imageUrl,
      slug: body.slug,
      publishDate: body.publishDate,
    });
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 404 });
  }
});

export const DELETE = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await deleteBlogPost(Number(id));
  return new NextResponse(null, { status: 204 });
});
