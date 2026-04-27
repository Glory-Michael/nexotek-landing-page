import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PaginationData } from '@/types/newsroom';

interface PaginationProps {
  pagination: PaginationData;
  basePath: string;
}

function buildHref(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}page=${page}`;
}

export function Pagination({ pagination, basePath }: Readonly<PaginationProps>) {
  if (pagination.totalPages <= 1) return null;

  const linkClass =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black dark:text-white bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 transition-colors';

  const disabledClass =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 dark:text-neutral-600 bg-transparent border border-black/5 dark:border-white/5 cursor-not-allowed';

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 pt-12 border-t border-neutral-200 dark:border-neutral-800"
    >
      {pagination.hasPrevPage ? (
        <Link href={buildHref(basePath, pagination.page - 1)} className={linkClass}>
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden="true">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </span>
      )}

      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        Page {pagination.page} of {pagination.totalPages}
      </span>

      {pagination.hasNextPage ? (
        <Link href={buildHref(basePath, pagination.page + 1)} className={linkClass}>
          Next
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden="true">
          Next
          <ArrowRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
