import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { listBlogPosts, createBlogPost } from '@/lib/actions/admin/blog';

export const GET = withMobileAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const filterParam = searchParams.get('filter');
  const filter = filterParam === 'draft' || filterParam === 'published' ? filterParam : 'all';

  const posts = await listBlogPosts(filter);
  return NextResponse.json(posts);
});

export const POST = withMobileAuth(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.description || !body?.content) {
    return NextResponse.json({ error: 'title, description, content required' }, { status: 400 });
  }

  const post = await createBlogPost({
    title: body.title,
    description: body.description,
    content: body.content,
    tags: body.tags,
    imageUrl: body.imageUrl,
    publishDate: body.publishDate,
  });
  return NextResponse.json(post, { status: 201 });
});
