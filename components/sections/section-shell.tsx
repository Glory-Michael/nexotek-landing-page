import type { ReactNode } from 'react';
import { ChapterHeader } from './chapter-header';

export type SectionSurface = 'paper' | 'ink';

interface SectionShellProps {
  anchorId?: string;
  surface?: SectionSurface;
  eyebrow?: string;
  leadSentence?: string;
  title?: string;
  className?: string;
  background?: ReactNode;
  children: ReactNode;
}

const SURFACE_CLASSES: Record<SectionSurface, string> = {
  paper: 'bg-nx-paper text-nx-ink dark:bg-nx-black dark:text-white',
  ink: 'bg-nx-black text-white',
};

export function SectionShell({
  anchorId,
  surface = 'paper',
  eyebrow,
  leadSentence,
  title,
  className = '',
  background,
  children,
}: SectionShellProps) {
  const id = anchorId ? anchorId.replace(/^#/, '') : undefined;
  return (
    <section
      id={id}
      className={`nx-section-chapter ${SURFACE_CLASSES[surface]} relative w-full ${background ? 'overflow-hidden' : ''} scroll-mt-24 md:scroll-mt-0 ${className}`}
    >
      {background}
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-28">
        {(eyebrow || title || leadSentence) && (
          <ChapterHeader
            eyebrow={eyebrow}
            title={title}
            leadSentence={leadSentence}
            onInk={surface === 'ink'}
          />
        )}
        {children}
      </div>
    </section>
  );
}
