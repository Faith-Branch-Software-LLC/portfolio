import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { unpublishBlogPost } from '@/lib/actions/admin/blog';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const post = await unpublishBlogPost(Number(id));
  return NextResponse.json(post);
});
