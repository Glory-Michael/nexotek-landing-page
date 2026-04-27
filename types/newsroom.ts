import type { RichTextContent } from './landing-page';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface ArticleData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: RichTextContent;
  coverImage: {
    url: string;
    alt: string;
    sizes?: {
      thumbnail?: { url: string };
      og?: { url: string };
    };
  } | null;
  publishedDate: string;
  author: string | null;
  category: CategoryData | null;
  tags: Array<{ tag: string }>;
  featured: boolean;
  contentState: 'live' | 'sample';
  meta?: {
    title?: string;
    description?: string;
    image?: { url: string } | null;
  };
}

export interface PaginationData {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalDocs: number;
}
