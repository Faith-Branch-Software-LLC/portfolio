import { listBlogPosts } from '@/lib/actions/admin/blog';
import BlogList from '@/components/admin/blog/BlogList';

export default async function AdminBlogPage() {
  const posts = await listBlogPosts('all');
  return <BlogList initialPosts={posts} />;
}
