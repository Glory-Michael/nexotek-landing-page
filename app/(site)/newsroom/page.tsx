import type { Metadata } from 'next';
import { ArticleListView } from '@/components/newsroom/article-list-view';
import { getArticles, getCategories } from '@/lib/newsroom-data';
import { getNewsroomSettings } from '@/lib/newsroom-settings';

export const metadata: Metadata = {
  title: 'Newsroom',
  description: 'Latest news, press releases, and updates from NexoTek.',
};

export default async function NewsroomPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(pageParam || '1', 10) || 1);

  const { showDemoArticles } = await getNewsroomSettings();

  const [{ articles, pagination }, categories] = await Promise.all([
    getArticles(pageNum, undefined, showDemoArticles),
    getCategories(),
  ]);

  return (
    <ArticleListView
      articles={articles}
      categories={categories}
      pagination={pagination}
      heading="Newsroom"
      description="The latest news, press releases, product updates, and insights from NexoTek."
      basePath="/newsroom"
    />
  );
}
