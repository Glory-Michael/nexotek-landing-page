import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { ArticleListView } from '@/components/newsroom/article-list-view';
import { getArticles, getCategories, getCategoryBySlug } from '@/lib/newsroom-data';

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'categories',
      limit: 100,
      pagination: false,
      select: { slug: true },
    });
    return result.docs
      .map((doc) => (doc.slug ? { slug: String(doc.slug) } : null))
      .filter((p): p is { slug: string } => p !== null);
  } catch (err) {
    console.error('generateStaticParams failed for categories:', err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} — Newsroom`,
    description: category.description || `Articles in ${category.name}.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const pageNum = Math.max(1, Number.parseInt(pageParam || '1', 10) || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [{ articles, pagination }, categories] = await Promise.all([
    getArticles(pageNum, slug),
    getCategories(),
  ]);

  return (
    <ArticleListView
      articles={articles}
      categories={categories}
      pagination={pagination}
      activeCategorySlug={slug}
      heading={category.name}
      description={category.description}
      basePath={`/newsroom/category/${slug}`}
    />
  );
}
