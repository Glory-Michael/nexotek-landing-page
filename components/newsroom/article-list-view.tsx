import Link from 'next/link';
import { ArticleCard } from './article-card';
import { Pagination } from './pagination';
import { RssSubscribe } from './rss-subscribe';
import type { ArticleData, CategoryData, PaginationData } from '@/types/newsroom';

interface ArticleListViewProps {
  articles: ArticleData[];
  categories: CategoryData[];
  pagination: PaginationData;
  activeCategorySlug?: string;
  heading: string;
  description?: string;
  basePath: string;
}

export function ArticleListView({
  articles,
  categories,
  pagination,
  activeCategorySlug,
  heading,
  description,
  basePath,
}: Readonly<ArticleListViewProps>) {
  const isFirstPage = pagination.page === 1;
  const featuredOnFirstPage = isFirstPage && !activeCategorySlug
    ? articles.filter((a) => a.featured)
    : [];
  const featuredIds = new Set(featuredOnFirstPage.map((a) => a.id));
  const regularArticles = articles.filter((a) => !featuredIds.has(a.id));

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      {/* Heading */}
      <header className="mb-12 md:mb-16 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white">
            {heading}
          </h1>
          {description && (
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <RssSubscribe
            feedUrl="/api/rss"
            absoluteFeedUrl={`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/rss`}
          />
        </div>
      </header>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <nav aria-label="Filter by category" className="mb-12 flex flex-wrap gap-2">
          <Link
            href="/newsroom"
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !activeCategorySlug
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/newsroom/category/${cat.slug}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isActive
                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                    : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Featured section (page 1 only, no active category) */}
      {featuredOnFirstPage.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
            Featured
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredOnFirstPage.map((article) => (
              <ArticleCard key={article.id} article={article} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-lg text-neutral-500 dark:text-neutral-400">No articles yet.</p>
        </div>
      )}

      {/* Regular grid */}
      {regularArticles.length > 0 && (
        <section>
          {featuredOnFirstPage.length > 0 && (
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
              Latest
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {regularArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Pagination */}
      <Pagination pagination={pagination} basePath={basePath} />
    </div>
  );
}
