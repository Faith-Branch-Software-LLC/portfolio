export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  imageUrl: string | null;
  tags: string | null;
}

export interface MarkdownPost {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    date: string;
    imageUrl?: string;
    tags?: string[];
    published?: boolean;
  };
  content: string;
} 