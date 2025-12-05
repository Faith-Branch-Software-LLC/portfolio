import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { MarkdownPost, BlogPost } from '../types/blog';
import { prisma } from './db';
import { configureMarked } from './utils/markedExtensions';

/**
 * Gets all markdown files from the blogPages directory
 * @returns The list of markdown files
 */
function getMarkdownFiles(): string[] {
  const blogDirectory = path.join(process.cwd(), 'public/blogPages');
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(blogDirectory)) {
    fs.mkdirSync(blogDirectory, { recursive: true });
    return [];
  }
  
  return fs.readdirSync(blogDirectory).filter(file => file.endsWith('.md'));
}

/**
 * Parses a markdown file and returns its content and metadata
 * @param fileName The name of the markdown file
 * @returns The parsed markdown post
 */
export function parseMarkdownFile(fileName: string): MarkdownPost {
  const slug = fileName.replace(/\.md$/, '');
  const filePath = path.join(process.cwd(), 'public/blogPages', fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  const { data, content } = matter(fileContents);
  
  // Process published status (convert string "true"/"false" to boolean)
  let published = true;
  if (data.published !== undefined) {
    if (typeof data.published === 'string') {
      published = data.published.toLowerCase() === 'true';
    } else {
      published = !!data.published;
    }
  }
  
  return {
    slug,
    frontmatter: {
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      imageUrl: data.imageUrl,
      tags: data.tags, // gray-matter should already handle the YAML array format correctly
      published: published,
    },
    content,
  };
}

/**
 * Gets all markdown posts from the blogPages directory
 * @returns The list of parsed markdown posts
 */
export function getAllMarkdownPosts(): MarkdownPost[] {
  const files = getMarkdownFiles();
  return files.map(parseMarkdownFile);
}

/**
 * Gets a markdown post by its slug
 * @param slug The slug of the post to retrieve
 * @returns The parsed markdown post or null if not found
 */
export function getMarkdownPostBySlug(slug: string): MarkdownPost | null {
  const fileName = `${slug}.md`;
  const filePath = path.join(process.cwd(), 'public/blogPages', fileName);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return parseMarkdownFile(fileName);
}

/**
 * Converts markdown content to sanitized HTML
 * @param markdown The markdown content to convert
 * @returns The sanitized HTML content
 */
export function markdownToHtml(markdown: string): string {
  // Configure marked with custom extensions
  configureMarked();

  // Configure marked for better security and rendering
  marked.setOptions({
    gfm: true, // GitHub flavored markdown
    breaks: true, // Convert line breaks to <br>
    // headerIds is not in the type definition but is a valid option
    // @ts-ignore
    headerIds: true, // Add ids to headings
    mangle: false, // Don't mangle email addresses
    pedantic: false, // Don't be pedantic about markdown spec
    sanitize: false, // We'll use DOMPurify for this
    smartLists: true, // Use smart lists
    smartypants: true, // Use smart typography
  });

  // First convert markdown to HTML
  const rawHtml = marked.parse(markdown);
  const processedHtml = String(rawHtml);

  // In a server environment, we need to create a DOM window for DOMPurify
  let sanitizedHtml = '';
  if (typeof window === 'undefined') {
    try {
      // Dynamically import JSDOM for server-side rendering
      const { JSDOM } = require('jsdom');
      const jsdom = new JSDOM('');
      const domPurify = DOMPurify(jsdom.window);

      // Sanitize the HTML with DOMPurify - ensure processedHtml is a string
      sanitizedHtml = domPurify.sanitize(processedHtml, {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
          'blockquote', 'code', 'pre', 'hr', 'br', 'em', 'strong', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'src', 'alt', 'class', 'id', 'target', 'rel',
          'data-code', 'data-language', 'aria-label', 'aria-hidden'
        ],
        FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
      });
    } catch (error) {
      console.error('Error sanitizing HTML:', error);
      // Fallback to using marked without sanitization if there's an error
      sanitizedHtml = String(rawHtml);
    }
  } else {
    // In a browser environment, use the browser's window
    sanitizedHtml = DOMPurify.sanitize(processedHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
        'blockquote', 'code', 'pre', 'hr', 'br', 'em', 'strong', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'button'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'src', 'alt', 'class', 'id', 'target', 'rel',
        'data-code', 'data-language', 'aria-label', 'aria-hidden'
      ],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  }
  
  return sanitizedHtml;
}

/**
 * Gets all blog posts from the database
 * @returns The list of blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' }, // Sort newest to oldest
  });
}

/**
 * Gets a blog post by its ID
 * @param id The ID of the post to retrieve
 * @returns The blog post or null if not found
 */
export async function getBlogPostById(id: number): Promise<BlogPost | null> {
  return await prisma.blogPost.findUnique({
    where: { id },
  });
}

/**
 * Gets a blog post by its slug
 * @param slug The slug of the post to retrieve
 * @returns The blog post with content from markdown file, or null if not found
 */
export async function getBlogPostBySlug(slug: string): Promise<(BlogPost & { content?: string }) | null> {
  // First, check if the post exists in the database
  const dbPost = await prisma.blogPost.findUnique({
    where: { slug },
  });
  
  if (!dbPost) {
    return null;
  }
  
  // Get the markdown content directly from the file
  const markdownPost = getMarkdownPostBySlug(slug);
  
  // If the markdown post exists, return a merged object with content
  if (markdownPost) {
    return {
      ...dbPost,
      content: markdownPost.content, // Add content from markdown file
    };
  }
  
  // If no markdown file exists, return the database post without content
  return dbPost;
}

/**
 * Syncs markdown posts with the database
 * @returns The list of synced blog posts
 */
export async function syncMarkdownPostsWithDb(): Promise<BlogPost[]> {
  const markdownPosts = getAllMarkdownPosts();
  
  for (const post of markdownPosts) {
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
    });
    
    // Handle Obsidian-style tags which can come in different formats
    let tagString = '';
    if (post.frontmatter.tags) {
      // If tags is already an array, join with commas
      if (Array.isArray(post.frontmatter.tags)) {
        tagString = post.frontmatter.tags.join(',');
      } 
      // If tags is a string, use it directly
      else if (typeof post.frontmatter.tags === 'string') {
        tagString = post.frontmatter.tags;
      }
      // Handle any other format
      else {
        try {
          // Attempt to convert to string if it's another type
          tagString = String(post.frontmatter.tags);
        } catch (e) {
          console.error(`Could not process tags for post ${post.slug}:`, e);
        }
      }
    }
    
    if (existingPost) {
      await prisma.blogPost.update({
        where: { slug: post.slug },
        data: {
          title: post.frontmatter.title,
          description: post.frontmatter.description,
          createdAt: new Date(post.frontmatter.date),
          // Don't save content to the database
          published: post.frontmatter.published ?? true,
          imageUrl: post.frontmatter.imageUrl,
          tags: tagString,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.blogPost.create({
        data: {
          slug: post.slug,
          title: post.frontmatter.title,
          description: post.frontmatter.description,
          createdAt: new Date(post.frontmatter.date),
          // Don't save content to the database
          published: post.frontmatter.published ?? true,
          imageUrl: post.frontmatter.imageUrl,
          tags: tagString,
        },
      });
    }
  }
  
  return await getAllBlogPosts();
}

/**
 * Gets paginated blog posts from the database
 * @param page The page number (1-based)
 * @param pageSize The number of posts per page
 * @returns Object containing the paginated blog posts and metadata
 */
export async function getPaginatedBlogPosts(page: number = 1, pageSize: number = 9) {
  const skip = (page - 1) * pageSize;
  
  // Get total count for pagination
  const totalCount = await prisma.blogPost.count({
    where: { published: true }
  });
  
  // Get paginated posts
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' }, // Sort newest to oldest
    skip,
    take: pageSize,
  });
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  
  return {
    posts,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage,
      hasPreviousPage,
    }
  };
} 