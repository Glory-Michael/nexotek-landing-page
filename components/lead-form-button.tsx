'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { EventRegistrationForm } from './event-registration-form';

interface LeadFormButtonProps {
  label: string;
  variant?: 'primary-ink' | 'primary-paper' | 'ghost-ink' | 'ghost-paper';
  eventSlug?: string;
  className?: string;
}

const VARIANT_CLASS: Record<NonNullable<LeadFormButtonProps['variant']>, string> = {
  'primary-ink':
    'inline-flex items-center justify-center rounded-nx-button bg-white px-7 py-3 font-mono text-xs uppercase tracking-[0.18em] text-black hover:bg-neutral-200',
  'primary-paper':
    'inline-flex items-center justify-center rounded-nx-button bg-black px-7 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200',
  'ghost-ink':
    'inline-flex items-center justify-center rounded-nx-button border border-white/40 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-white hover:text-black',
  'ghost-paper':
    'inline-flex items-center justify-center rounded-nx-button border border-black/40 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-black hover:text-white dark:border-white/40 dark:hover:bg-white dark:hover:text-black',
};

const TRANSITION_MS = 220;

export function LeadFormButton({
  label,
  variant = 'primary-ink',
  eventSlug = 'homepage-cta',
  className = '',
}: LeadFormButtonProps) {
  const [open, setOpen] = useState(false);
  // `mounted` keeps the modal in the DOM while the close transition plays.
  // `visible` flips the transition target classes after the next frame so the
  // initial render is at opacity-0 / scale-95 → animates to opacity-100 / scale-100.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  // Track when document.body becomes available so the portal can mount on the
  // client without breaking SSR.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Open/close orchestration.
  useEffect(() => {
    if (open) {
      setMounted(true);
      // Defer the visible flip to the next frame so the browser sees the
      // initial (opacity-0 / scale-95) state, then transitions to visible.
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    if (!mounted) return;
    setVisible(false);
    const t = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  // Lock body scroll + close on Escape while mounted.
  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, close]);

  const modal = mounted && portalTarget
    ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Talk to our team"
          // Portal-rendered to document.body so the modal escapes any
          // transformed/perspective ancestor (the hero section uses
          // translate3d on a sibling div, which would otherwise make
          // position:fixed positioned relative to the hero rather than the
          // viewport — leaving the popup off-center on the page).
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${
            visible ? 'bg-black/70 opacity-100 backdrop-blur-sm' : 'bg-black/0 opacity-0'
          }`}
          onClick={close}
        >
          <div
            className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto border bg-white p-8 text-black shadow-[0_20px_60px_-12px_rgba(0,0,0,0.45)] transition-all ease-out md:p-10 dark:border-white/10 dark:bg-nx-black dark:text-white motion-reduce:transition-none ${
              visible
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-2 scale-95 opacity-0'
            } border-black/10`}
            style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center font-mono text-xs text-neutral-500 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
            >
              ✕
            </button>
            <header className="mb-6">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                Talk to our team
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Tell us about your site.
              </h2>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                We&apos;ll be in touch within one business day.
              </p>
            </header>
            <EventRegistrationForm
              bare
              dark={isDark}
              eventSlug={eventSlug}
              isOpen
              ctaLabel="Submit"
              requiredFields={{
                name: true,
                email: true,
                organization: true,
                phone: false,
              }}
            />
          </div>
        </div>,
        portalTarget,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${VARIANT_CLASS[variant]} ${className}`}
        aria-haspopup="dialog"
      >
        {label}
        <span aria-hidden className="ml-2">→</span>
      </button>
      {modal}
    </>
  );
}
