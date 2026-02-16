import fs from 'fs';
import path from 'path';
import { getAllMarkdownPosts, markdownToHtml } from '../lib/blog';

const COMPILED_DIR = path.join(process.cwd(), 'public/blogPages/compiled');

async function compileBlogPosts() {
  // Ensure output directory exists
  if (!fs.existsSync(COMPILED_DIR)) {
    fs.mkdirSync(COMPILED_DIR, { recursive: true });
  }

  const posts = getAllMarkdownPosts();
  console.log(`Found ${posts.length} blog posts to compile.\n`);

  for (const post of posts) {
    console.log(`Compiling: ${post.slug}...`);
    const html = await markdownToHtml(post.content);
    const outputPath = path.join(COMPILED_DIR, `${post.slug}.html`);
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`  -> ${outputPath}`);
  }

  console.log(`\nDone! Compiled ${posts.length} posts.`);
}

compileBlogPosts().catch((err) => {
  console.error('Failed to compile blog posts:', err);
  process.exit(1);
});
