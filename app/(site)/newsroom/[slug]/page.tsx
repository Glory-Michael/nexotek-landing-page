import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { getArticleBySlug } from '@/lib/newsroom-data';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { StructuredData } from '@/components/seo/structured-data';
import { getSiteContext } from '@/lib/site-context';
import type { Article } from '@/payload-types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'articles',
      where: { _status: { equals: 'published' } },
      limit: 100,
      pagination: false,
      select: { slug: true },
    });
    return result.docs
      .map((doc) => (doc.slug ? { slug: String(doc.slug) } : null))
      .filter((p): p is { slug: string } => p !== null);
  } catch (err) {
    console.error('generateStaticParams failed for articles:', err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };

  const title = article.meta?.title || article.title;
  const description = article.meta?.description || article.excerpt;
  const imageUrl = article.meta?.image?.url || article.coverImage?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedDate,
      ...(article.author ? { authors: [article.author] } : {}),
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const site = await getSiteContext();

  return (
    <article className="max-w-3xl mx-auto px-6 py-16 md:py-20">
      <StructuredData
        data={{ kind: 'article', article: article as unknown as Article }}
        site={site}
      />
      <Link
        href="/newsroom"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black dark:hover:text-white transition-colors mb-12"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Newsroom
      </Link>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {article.contentState === 'sample' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
            Sample
          </span>
        )}
        {article.category && (
          <Link
            href={`/newsroom/category/${article.category.slug}`}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide hover:opacity-80 transition-opacity"
            style={
              article.category.color
                ? { backgroundColor: `${article.category.color}1A`, color: article.category.color }
                : undefined
            }
          >
            <span
              className={
                article.category.color
                  ? ''
                  : 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 -mx-2.5 -my-1 rounded-full'
              }
            >
              {article.category.name}
            </span>
          </Link>
        )}
        <time dateTime={article.publishedDate}>{formatDate(article.publishedDate)}</time>
        {article.author && <span aria-hidden="true">·</span>}
        {article.author && <span>By {article.author}</span>}
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-black dark:text-white">
        {article.title}
      </h1>

      {/* Excerpt */}
      <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed mb-10">
        {article.excerpt}
      </p>

      {/* Cover image */}
      {article.coverImage && (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 mb-12">
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt || article.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      {article.content && (
        <div className="space-y-6 text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <RichTextRenderer content={article.content} variant="default" />
        </div>
      )}

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-3">
            Tags
          </h2>
          <ul className="flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <li
                key={t.tag}
                className="text-sm px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
              >
                #{t.tag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
