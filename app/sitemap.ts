import type { MetadataRoute } from 'next';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { getGatedPaths, isGated } from '@/lib/alpha-gate';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config });

  const [articlesResult, categoriesResult, pagesResult, gatedPaths] = await Promise.all([
    payload.find({
      collection: 'articles',
      limit: 1000,
      where: { contentState: { equals: 'live' } },
      select: { slug: true, publishedDate: true, updatedAt: true },
    }),
    payload.find({
      collection: 'categories',
      limit: 100,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'pages',
      limit: 100,
      where: { _status: { equals: 'published' } },
      select: { slug: true, updatedAt: true },
    }),
    getGatedPaths(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${BASE_URL}/newsroom`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/glossary`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/press`, changeFrequency: 'monthly' as const, priority: 0.7 },
  ].filter(({ url }) => !isGated(new URL(url).pathname, gatedPaths));

  const pageEntries: MetadataRoute.Sitemap = pagesResult.docs
    .filter((p) => p.slug && !isGated(`/${p.slug}`, gatedPaths))
    .map((p) => ({
      url: `${BASE_URL}/${p.slug}`,
      lastModified: p.updatedAt as string,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    }));

  const newsroomGated = isGated('/newsroom', gatedPaths);

  const articleEntries: MetadataRoute.Sitemap = newsroomGated
    ? []
    : articlesResult.docs
        .filter((a) => a.slug)
        .map((a) => ({
          url: `${BASE_URL}/newsroom/${a.slug}`,
          lastModified: (a.publishedDate as string | undefined) ?? (a.updatedAt as string),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));

  const categoryEntries: MetadataRoute.Sitemap = newsroomGated
    ? []
    : categoriesResult.docs
        .filter((c) => c.slug)
        .map((c) => ({
          url: `${BASE_URL}/newsroom/category/${c.slug}`,
          lastModified: c.updatedAt as string,
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        }));

  return [...staticRoutes, ...pageEntries, ...articleEntries, ...categoryEntries];
}
