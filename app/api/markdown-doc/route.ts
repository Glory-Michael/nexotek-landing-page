import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import type { BasePayload } from 'payload';
import config from '@/payload.config';
import { lexicalToMarkdown } from '@/lib/lexical-to-markdown';
import { getGatedPaths, isGated } from '@/lib/alpha-gate';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

function mdResponse(body: string, status = 200) {
  const tokens = Math.ceil(body.length / 4);
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
      'x-markdown-tokens': String(tokens),
    },
  });
}

const NOT_FOUND = () => mdResponse('# Not Found\n', 404);

async function homepageMd(payload: BasePayload): Promise<string> {
  const identity = await payload.findGlobal({ slug: 'site-identity' });
  const id = identity as Record<string, unknown>;
  const siteName = (id.siteName as string) || 'NexoTek';
  const tagline = (id.tagline as string) || '';
  const description = (id.metaDescription as string) || '';

  let md = `# ${siteName}\n\n`;
  if (tagline) md += `**${tagline}**\n\n`;
  if (description) md += `${description}\n\n`;
  md += `## Links\n\n`;
  md += `- [Newsroom](${BASE_URL}/newsroom)\n`;
  md += `- [RSS Feed](${BASE_URL}/api/rss)\n`;
  md += `- [Privacy Policy](${BASE_URL}/privacy)\n`;
  md += `- [Terms of Service](${BASE_URL}/terms)\n`;
  return md;
}

async function newsroomMd(payload: BasePayload): Promise<string> {
  const result = await payload.find({
    collection: 'articles',
    limit: 20,
    where: { contentState: { equals: 'live' } },
    sort: '-publishedDate',
    select: { title: true, slug: true, excerpt: true, publishedDate: true },
  });

  let md = `# Newsroom\n\nLatest news and updates from NexoTek.\n\n`;
  for (const article of result.docs) {
    const a = article as { title: string; slug: string; excerpt?: string };
    md += `## [${a.title}](${BASE_URL}/newsroom/${a.slug})\n\n`;
    if (a.excerpt) md += `${a.excerpt}\n\n`;
  }
  return md;
}

async function articleMd(payload: BasePayload, slug: string): Promise<NextResponse | null> {
  const result = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug }, contentState: { equals: 'live' } },
    limit: 1,
  });

  type ArticleDoc = { title: string; slug: string; excerpt?: string; publishedDate?: string; content?: unknown };
  const article = result.docs[0] as unknown as ArticleDoc | undefined;
  if (!article) return NOT_FOUND();

  let md = `# ${article.title}\n\n`;
  if (article.publishedDate) {
    const date = new Date(article.publishedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    md += `*Published: ${date}*\n\n`;
  }
  if (article.excerpt) md += `${article.excerpt}\n\n---\n\n`;
  if (article.content) md += lexicalToMarkdown(article.content) + '\n';
  return mdResponse(md);
}

async function categoryMd(payload: BasePayload, slug: string): Promise<NextResponse | null> {
  const catResult = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  type CategoryDoc = { id: string; name: string; description?: string };
  const category = catResult.docs[0] as unknown as CategoryDoc | undefined;
  if (!category) return NOT_FOUND();

  const articlesResult = await payload.find({
    collection: 'articles',
    where: { category: { equals: category.id }, contentState: { equals: 'live' } },
    limit: 20,
    sort: '-publishedDate',
    select: { title: true, slug: true, excerpt: true },
  });

  let md = `# ${category.name}\n\n`;
  if (category.description) md += `${category.description}\n\n`;
  for (const article of articlesResult.docs) {
    const a = article as unknown as { title: string; slug: string; excerpt?: string };
    md += `## [${a.title}](${BASE_URL}/newsroom/${a.slug})\n\n`;
    if (a.excerpt) md += `${a.excerpt}\n\n`;
  }
  return mdResponse(md);
}

async function pageMd(payload: BasePayload, slug: string): Promise<NextResponse | null> {
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
  });

  type PageDoc = { title: string; content?: unknown };
  const page = result.docs[0] as unknown as PageDoc | undefined;
  if (!page) return null;

  let md = `# ${page.title}\n\n`;
  if (page.content) md += lexicalToMarkdown(page.content) + '\n';
  return mdResponse(md);
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '/';

  if (path !== '/') {
    const gatedPaths = await getGatedPaths();
    if (isGated(path, gatedPaths)) return NOT_FOUND();
  }

  const payload = await getPayload({ config });

  if (path === '/') return mdResponse(await homepageMd(payload));
  if (path === '/newsroom') return mdResponse(await newsroomMd(payload));

  const articleMatch = /^\/newsroom\/(?!category\/)([^/]+)$/.exec(path);
  if (articleMatch) return (await articleMd(payload, articleMatch[1])) ?? NOT_FOUND();

  const categoryMatch = /^\/newsroom\/category\/([^/]+)$/.exec(path);
  if (categoryMatch) return (await categoryMd(payload, categoryMatch[1])) ?? NOT_FOUND();

  return (await pageMd(payload, path.replace(/^\//, ''))) ?? NOT_FOUND();
}
