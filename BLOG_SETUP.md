# Blog Setup Guide

This document provides instructions on how to set up and use the blog feature in this project.

## Overview

The blog system uses:

- Markdown files for content (stored in `public/blogPages/`)
- SQLite database (via Prisma) to track posts
- Next.js for rendering
- DOMPurify for HTML sanitization

## Getting Started

1. Install the required dependencies:

   ```bash
   pnpm add @prisma/client marked gray-matter dompurify jsdom @tailwindcss/typography
   pnpm add -D prisma @types/dompurify @types/jsdom
   ```

2. Initialize the database:

   ```bash
   pnpm generate
   pnpm migrate
   ```

3. Create your first blog post:
   Create a new markdown file in `public/blogPages/` with the following format:

   ```markdown
   ---
   title: Your Blog Title
   description: A short description of your blog post
   date: 2023-04-18
   imageUrl: /path/to/image.jpg
   tags: [tag1, tag2]
   published: true
   ---

   Your content here...
   ```

## Working with the Blog

### Adding a New Post

1. Create a new markdown file in `public/blogPages/` with a unique name (this will be the slug)
2. Add the frontmatter (the section between `---`) with the following fields:
   - `title`: The title of your post
   - `description`: A short description
   - `date`: The publication date (YYYY-MM-DD)
   - `imageUrl`: (Optional) URL to the cover image
   - `tags`: (Optional) Array of tags
   - `published`: (Optional) Boolean to control visibility
3. Write your content in Markdown format below the frontmatter

### Markdown Features

The blog supports GitHub-flavored Markdown with the following features:

- Headings (# for h1, ## for h2, etc.)
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links and images
- Code blocks with syntax highlighting
- Blockquote
- Tables

### Security

All HTML generated from markdown is sanitized using DOMPurify to prevent XSS attacks. This means:

- Script tags are automatically removed
- Dangerous attributes like onerror, onclick, etc. are stripped
- iframe and other potentially harmful elements are removed
- Only safe HTML elements and attributes are allowed

### Viewing the Database

To inspect or manage the database directly:

```bash
pnpm studio
```

This will open Prisma Studio in your browser, allowing you to view and edit database records.

### Database Structure

The blog posts are stored in the `BlogPost` table with the following fields:

- `id`: Unique identifier
- `slug`: URL-friendly identifier derived from the filename
- `title`: Post title
- `description`: Post description
- `published`: Whether the post is visible
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `imageUrl`: Cover image URL
- `tags`: Comma-separated tags

## Technical Details

- The database file is stored in `prisma/db.db` and is included in version control
- Posts are automatically synced from Markdown files to the database when the blog page is accessed
- Blog content is read directly from markdown files and not stored in the database
- The blog index page is available at `/blog`
- Individual posts are available at `/blog/[slug]`
- Markdown is rendered to HTML using the marked library
- HTML is sanitized using DOMPurify with JSDOM for server-side rendering
- Tailwind Typography plugin is used for styling the rendered markdown
