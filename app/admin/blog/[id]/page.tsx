import { notFound } from 'next/navigation';
import { getBlogPost } from '@/lib/actions/admin/blog';
import BlogEditor from '@/components/admin/blog/BlogEditor';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPost(Number(id));
  if (!post) notFound();
  return <BlogEditor mode="edit" post={post} />;
}
