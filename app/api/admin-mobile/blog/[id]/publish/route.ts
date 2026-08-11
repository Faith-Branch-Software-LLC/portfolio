import { NextResponse } from 'next/server';
import { withMobileAuth } from '@/lib/api/withMobileAuth';
import { publishBlogPost } from '@/lib/actions/admin/blog';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withMobileAuth<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const post = await publishBlogPost(Number(id));
  return NextResponse.json(post);
});
