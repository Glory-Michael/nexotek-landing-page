import Image from 'next/image';
import Link from 'next/link';
import type { ArticleData } from '@/types/newsroom';

interface ArticleCardProps {
  article: ArticleData;
  variant?: 'default' | 'featured';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ArticleCard({ article, variant = 'default' }: Readonly<ArticleCardProps>) {
  const isFeatured = variant === 'featured';
  const coverUrl = article.coverImage?.url;
  const coverAlt = article.coverImage?.alt || article.title;

  return (
    <Link
      href={`/newsroom/${article.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white rounded-lg"
    >
      <article className="flex flex-col gap-4">
        {coverUrl && (
          <div
            className={`relative w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 ${
              isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'
            }`}
          >
            <Image
              src={coverUrl}
              alt={coverAlt}
              fill
              sizes={isFeatured ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}
        <div className="flex flex-col gap-3">
          {article.contentState === 'sample' && (
            <span className="self-start inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
              Sample
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            {article.category && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide"
                style={
                  article.category.color
                    ? { backgroundColor: `${article.category.color}1A`, color: article.category.color }
                    : undefined
                }
              >
                <span className={article.category.color ? '' : 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 -mx-2 -my-0.5 rounded-full'}>
                  {article.category.name}
                </span>
              </span>
            )}
            <time dateTime={article.publishedDate}>{formatDate(article.publishedDate)}</time>
            {article.author && <span aria-hidden="true">·</span>}
            {article.author && <span>{article.author}</span>}
          </div>
          <h3
            className={`font-semibold tracking-tight text-black dark:text-white group-hover:opacity-80 transition-opacity ${
              isFeatured ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
            }`}
          >
            {article.title}
          </h3>
          <p className={`text-neutral-600 dark:text-neutral-400 leading-relaxed ${isFeatured ? 'text-base' : 'text-sm'}`}>
            {article.excerpt}
          </p>
          {article.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 mt-1">
              {article.tags.map((t) => (
                <li
                  key={t.tag}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
                >
                  #{t.tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </Link>
  );
}
