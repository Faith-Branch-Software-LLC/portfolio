'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { prisma } from '../../db';
import { markdownToHtml } from '../../blog';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

function compiledPath(slug: string): string {
  return path.join(process.cwd(), 'public', 'blogPages', 'compiled', `${slug}.html`);
}

async function writeCompiled(slug: string, content: string) {
  const html = await markdownToHtml(content);
  const dir = path.join(process.cwd(), 'public', 'blogPages', 'compiled');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(compiledPath(slug), html, 'utf8');
}

function deleteCompiled(slug: string) {
  const p = compiledPath(slug);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export async function listBlogPosts(filter: 'all' | 'draft' | 'published' = 'all') {
  const where =
    filter === 'draft' ? { published: false } : filter === 'published' ? { published: true } : {};
  return prisma.blogPost.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, slug: true, title: true, description: true, published: true, tags: true, imageUrl: true, createdAt: true, updatedAt: true },
  });
}

export async function getBlogPost(id: number) {
  return prisma.blogPost.findUnique({ where: { id } });
}

export async function createBlogPost(data: {
  title: string;
  description: string;
  content: string;
  tags?: string;
  imageUrl?: string;
  publishDate?: string;
}) {
  const base = generateSlug(data.title);
  const slug = await uniqueSlug(base);
  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      content: data.content,
      tags: data.tags,
      imageUrl: data.imageUrl,
      published: false,
      ...(data.publishDate ? { createdAt: new Date(data.publishDate) } : {}),
    },
  });
  revalidatePath('/admin/blog');
  return post;
}

export async function updateBlogPost(id: number, data: {
  title?: string;
  description?: string;
  content?: string;
  tags?: string;
  imageUrl?: string;
  slug?: string;
  publishDate?: string;
}) {
  const current = await prisma.blogPost.findUnique({ where: { id } });
  if (!current) throw new Error('Post not found');

  let slug = current.slug;
  if (data.slug && data.slug !== current.slug) {
    slug = await uniqueSlug(data.slug, id);
    if (current.published) {
      deleteCompiled(current.slug);
    }
  }

  const { publishDate, ...rest } = data;
  const post = await prisma.blogPost.update({
    where: { id },
    data: { ...rest, slug, ...(publishDate ? { createdAt: new Date(publishDate) } : {}) },
  });

  if (current.published && data.content !== undefined) {
    await writeCompiled(slug, data.content ?? current.content ?? '');
  }

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  return post;
}

export async function publishBlogPost(id: number) {
  const post = await prisma.blogPost.update({ where: { id }, data: { published: true } });
  if (post.content) {
    await writeCompiled(post.slug, post.content);
  }
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  return post;
}

export async function unpublishBlogPost(id: number) {
  const post = await prisma.blogPost.update({ where: { id }, data: { published: false } });
  deleteCompiled(post.slug);
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  return post;
}

export async function deleteBlogPost(id: number) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (post) deleteCompiled(post.slug);
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
}
