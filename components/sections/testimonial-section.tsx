'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface TestimonialSectionProps {
  eyebrow: string;
  quote: string;
  attribution: {
    name: string;
    role: string;
    initials: string;
  };
}

export function TestimonialSection({
  eyebrow,
  quote,
  attribution,
}: TestimonialSectionProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;
        const scrolled = Math.max(0, -rect.top);
        setProgress(total > 0 ? Math.min(1, scrolled / total) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced]);

  const words = quote.split(' ');
  const total = words.length;

  // Expand the highlight range so words fully ignite by ~80% of scroll, then
  // leave 20% of runway for the attribution to settle in view.
  // Cap at 1.2 (not 1) so the LAST word (t=1) can reach lit=1 — without the
  // overshoot, `(highlightProgress - t) * 6` asymptotes to 0 at the right
  // edge of the quote and the closing words never fully light.
  const highlightProgress = Math.min(1.2, progress * 1.5);

  return (
    <section
      ref={ref}
      className="relative bg-nx-paper text-nx-ink dark:bg-nx-black dark:text-white scroll-mt-24 md:scroll-mt-0 [--nx-quote-rgb:10,10,10] dark:[--nx-quote-rgb:255,255,255]"
      style={{ height: 'calc(var(--nx-svh, 100vh) * 1.6)' }}
      aria-label="Founder testimonial"
    >
      <div className="sticky top-[var(--nx-navbar-h)] flex h-[calc(var(--nx-svh,100svh)-var(--nx-navbar-h))] items-center overflow-hidden">
        <div className="mx-auto w-full max-w-5xl px-6 md:px-12">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
            ─ {eyebrow}
          </p>

          <blockquote className="font-serif text-[28px] leading-[1.28] md:text-5xl md:leading-[1.2]">
            <span
              aria-hidden="true"
              className="mr-1 align-top font-serif text-5xl text-neutral-300 dark:text-neutral-600 md:text-7xl"
            >
              “
            </span>
            {words.map((word, i) => {
              const t = i / Math.max(1, total - 1);
              // Each word has a small overlap window so the highlight feels
              // continuous rather than discrete word-by-word stepping.
              const lit = Math.min(1, Math.max(0, (highlightProgress - t) * 6));
              return (
                <span
                  key={i}
                  className="transition-colors duration-200 motion-reduce:transition-none"
                  style={{
                    color: `rgba(var(--nx-quote-rgb), ${0.18 + 0.82 * lit})`,
                  }}
                >
                  {i === 0 ? '' : ' '}
                  {word}
                </span>
              );
            })}
            <span
              aria-hidden="true"
              className="ml-1 align-top font-serif text-5xl text-neutral-300 md:text-7xl"
            >
              ”
            </span>
          </blockquote>

          <figcaption className="mt-12 flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-black"
            >
              {attribution.initials}
            </span>
            <div className="flex flex-col">
              <span className="font-sans text-base font-medium text-black dark:text-white md:text-lg">
                {attribution.name}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
                {attribution.role}
              </span>
            </div>
          </figcaption>
        </div>
      </div>
    </section>
  );
}
