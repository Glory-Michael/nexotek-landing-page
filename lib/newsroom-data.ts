import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import type { Where } from 'payload';
import config from '@/payload.config';
import type { ArticleData, CategoryData, PaginationData } from '@/types/newsroom';

const ARTICLES_PER_PAGE = 12;

interface ArticlesResult {
  articles: ArticleData[];
  pagination: PaginationData;
}

function resolveMedia(field: unknown): ArticleData['coverImage'] {
  if (!field || typeof field !== 'object' || !('url' in field)) return null;
  const m = field as { url: string; alt?: string; sizes?: Record<string, { url?: string }> };
  return {
    url: m.url,
    alt: m.alt || '',
    sizes: m.sizes
      ? {
          thumbnail: m.sizes.thumbnail?.url ? { url: m.sizes.thumbnail.url } : undefined,
          og: m.sizes.og?.url ? { url: m.sizes.og.url } : undefined,
        }
      : undefined,
  };
}

function resolveCategory(field: unknown): CategoryData | null {
  if (!field || typeof field !== 'object' || !('id' in field)) return null;
  const c = field as { id: string | number; name?: string; slug?: string; description?: string; color?: string };
  return {
    id: String(c.id),
    name: c.name || '',
    slug: c.slug || '',
    description: c.description,
    color: c.color,
  };
}

interface RawArticle {
  id: string | number;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: unknown;
  coverImage?: unknown;
  publishedDate?: string;
  author?: string | null;
  category?: unknown;
  tags?: Array<{ tag?: string }>;
  featured?: boolean;
  contentState?: string;
  meta?: { title?: string; description?: string; image?: unknown };
}

function mapArticle(doc: RawArticle): ArticleData {
  return {
    id: String(doc.id),
    title: doc.title || '',
    slug: doc.slug || '',
    excerpt: doc.excerpt || '',
    content: doc.content,
    coverImage: resolveMedia(doc.coverImage),
    publishedDate: doc.publishedDate || new Date().toISOString(),
    author: doc.author || null,
    category: resolveCategory(doc.category),
    tags: Array.isArray(doc.tags)
      ? doc.tags.filter((t): t is { tag: string } => typeof t?.tag === 'string').map((t) => ({ tag: t.tag }))
      : [],
    featured: Boolean(doc.featured),
    contentState: doc.contentState === 'sample' ? 'sample' : 'live',
    meta: doc.meta
      ? {
          title: doc.meta.title,
          description: doc.meta.description,
          image: (() => {
            const img = resolveMedia(doc.meta.image);
            return img ? { url: img.url } : null;
          })(),
        }
      : undefined,
  };
}

export async function fetchArticlesImpl(
  page: number,
  categorySlug?: string,
  showDemoArticles = false,
): Promise<ArticlesResult> {
  try {
    const payload = await getPayload({ config });

    const where: Where = {
      _status: { equals: 'published' },
      // Exclude sample/demo articles unless the newsroom demo toggle is on
      ...(!showDemoArticles && { contentState: { not_equals: 'sample' } }),
    };

    if (categorySlug) {
      const catResult = await payload.find({
        collection: 'categories',
        where: { slug: { equals: categorySlug } },
        limit: 1,
      });
      const categoryId = catResult.docs[0]?.id;
      if (!categoryId) {
        return {
          articles: [],
          pagination: { page: 1, totalPages: 0, hasNextPage: false, hasPrevPage: false, totalDocs: 0 },
        };
      }
      where.category = { equals: categoryId };
    }

    const result = await payload.find({
      collection: 'articles',
      where,
      sort: '-publishedDate',
      limit: ARTICLES_PER_PAGE,
      page,
      depth: 1,
    });

    return {
      articles: (result.docs as RawArticle[]).map(mapArticle),
      pagination: {
        page: result.page || 1,
        totalPages: result.totalPages || 1,
        hasNextPage: Boolean(result.hasNextPage),
        hasPrevPage: Boolean(result.hasPrevPage),
        totalDocs: result.totalDocs || 0,
      },
    };
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    return {
      articles: [],
      pagination: { page: 1, totalPages: 0, hasNextPage: false, hasPrevPage: false, totalDocs: 0 },
    };
  }
}

export const getArticles = unstable_cache(
  async (page: number = 1, categorySlug?: string, showDemoArticles = false) =>
    fetchArticlesImpl(page, categorySlug, showDemoArticles),
  ['newsroom-articles'],
  { revalidate: 60, tags: ['articles', 'newsroom-config'] },
);

export const getCategories = unstable_cache(
  async (): Promise<CategoryData[]> => {
    try {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'categories',
        limit: 100,
        sort: 'name',
      });
      return result.docs.map((doc) => ({
        id: String(doc.id),
        name: (doc.name as string) || '',
        slug: (doc.slug as string) || '',
        description: doc.description as string | undefined,
        color: doc.color as string | undefined,
      }));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      return [];
    }
  },
  ['newsroom-categories'],
  { revalidate: 60, tags: ['categories'] },
);

export const getArticleBySlug = unstable_cache(
  async (slug: string): Promise<ArticleData | null> => {
    try {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'articles',
        where: {
          slug: { equals: slug },
          _status: { equals: 'published' },
        },
        limit: 1,
        depth: 1,
      });
      const doc = result.docs[0];
      if (!doc) return null;
      return mapArticle(doc as RawArticle);
    } catch (err) {
      console.error(`Failed to fetch article "${slug}":`, err);
      return null;
    }
  },
  ['newsroom-article-by-slug'],
  { revalidate: 60, tags: ['articles'] },
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string): Promise<CategoryData | null> => {
    try {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        limit: 1,
      });
      const doc = result.docs[0];
      if (!doc) return null;
      return {
        id: String(doc.id),
        name: (doc.name as string) || '',
        slug: (doc.slug as string) || '',
        description: doc.description as string | undefined,
        color: doc.color as string | undefined,
      };
    } catch (err) {
      console.error(`Failed to fetch category "${slug}":`, err);
      return null;
    }
  },
  ['newsroom-category-by-slug'],
  { revalidate: 60, tags: ['categories'] },
);
