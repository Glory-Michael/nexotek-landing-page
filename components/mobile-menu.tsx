'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { CtaConfig } from '@/types/landing-page';
import { DotMatrixMenuIcon } from './dot-matrix-menu-icon';

interface MobileLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
}

interface SecondaryLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  links: MobileLink[];
  secondaryLinks?: SecondaryLink[];
  primaryCta?: CtaConfig;
  tagline?: string;
}

// Canonical homepage chapter list, in page order. Source of truth is
// scripts/seed-homepage-sections.ts — keep in sync if a new chapter is
// added or an anchor renamed.
const FALLBACK_LINKS: MobileLink[] = [
  { label: 'Loop', href: '#loop' },
  { label: 'Vision', href: '#vision' },
  { label: 'Spatial', href: '#spatial' },
  { label: 'Train', href: '#train' },
  { label: 'Why', href: '#why' },
  { label: 'Industries', href: '#who-we-serve' },
  { label: 'Proof', href: '#proof' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

const STICKY_OFFSET = 88;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function MobileMenu({ links, secondaryLinks, primaryCta, tagline }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  // `mounted` keeps the panel in the DOM during the closing animation; we
  // unmount only after the transition resolves so the slide-out is visible.
  const [mounted, setMounted] = useState(false);
  // Gate portal usage until after hydration so SSR markup matches.
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => setCanPortal(true), []);
  const resolvedLinks = links.length > 0 ? links : FALLBACK_LINKS;

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
    // Broadcast state so siblings (e.g. AdaptiveLogo) can step out of the
    // way while the portaled panel is on screen.
    window.dispatchEvent(
      new CustomEvent('nx-menu-toggle', { detail: { open } }),
    );
    if (open) return;
    // Closing — wait for the transition to finish before unmounting.
    const t = window.setTimeout(() => setMounted(false), 360);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const scrollToAnchor = useCallback((href: string) => {
    if (!href.startsWith('#')) return;
    const id = href.slice(1);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }, []);

  const handleLinkClick = useCallback(
    (href: string) => {
      setOpen(false);
      scrollToAnchor(href);
    },
    [scrollToAnchor],
  );

  const ctaHref =
    primaryCta?.mode === 'href' && primaryCta.href ? primaryCta.href : '#contact';

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className={`md:hidden relative z-[60] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
          open
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
            : 'border-black/15 bg-white/75 text-black hover:bg-white dark:border-white/20 dark:bg-black/55 dark:text-white dark:hover:bg-black/70'
        }`}
      >
        <DotMatrixMenuIcon open={open} className="h-5 w-5" />
      </button>

      {mounted && canPortal && createPortal(
        <div
          id="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`md:hidden fixed inset-0 z-[55] flex flex-col bg-nx-black text-white nx-mobile-menu-panel ${
            open ? 'nx-mobile-menu-open' : 'nx-mobile-menu-closing'
          }`}
        >
          {/* Top strip: section eyebrow on the left, close affordance on
              the right. Sits inside the panel so it composites above the
              portaled AdaptiveLogo (which is hidden while open anyway). */}
          <div className="flex items-center justify-between px-6 py-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/50">
              NEXOTEK · MENU
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="group/close inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/80 backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              <span>Close</span>
              <DotMatrixMenuIcon open className="h-4 w-4" />
            </button>
          </div>

          {/* Decorative ghost numeral — mirrors the homepage chapter style. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 top-24 select-none font-serif italic font-light leading-none text-[14rem] text-white/[0.04]"
          >
            {ROMAN[resolvedLinks.length] ?? 'XII'}
          </span>

          <nav
            aria-label="Mobile primary"
            className="relative flex-1 overflow-y-auto px-6 pb-8"
          >
            <ul className="space-y-0">
              {resolvedLinks.map((l, i) => {
                const isAnchor = l.href.startsWith('#');
                const roman = ROMAN[i] ?? String(i + 1);
                const inner = (
                  <span className="group/item flex items-baseline gap-4 py-4 border-b border-white/8 transition-colors">
                    <span
                      className="font-serif italic font-light text-sm text-white/40 tabular-nums w-8 shrink-0 transition-colors group-hover/item:text-white/80"
                      aria-hidden="true"
                    >
                      {roman}
                    </span>
                    <span className="font-display text-3xl font-medium tracking-tight text-white/85 transition-colors group-hover/item:text-white">
                      {l.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="ml-auto font-mono text-[10px] uppercase tracking-[0.28em] text-white/25 transition-all group-hover/item:translate-x-1 group-hover/item:text-white/60"
                    >
                      →
                    </span>
                  </span>
                );
                return (
                  <li
                    key={l.href + l.label}
                    className="nx-mobile-menu-item"
                    style={{ animationDelay: open ? `${80 + i * 50}ms` : '0ms' }}
                  >
                    {isAnchor ? (
                      <button
                        type="button"
                        onClick={() => handleLinkClick(l.href)}
                        className="w-full text-left"
                      >
                        {inner}
                      </button>
                    ) : (
                      <Link
                        href={l.href}
                        target={l.openInNewTab ? '_blank' : undefined}
                        rel={l.openInNewTab ? 'noopener noreferrer' : undefined}
                        onClick={() => setOpen(false)}
                        className="block"
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Secondary tier: legal / supporting links. Smaller scale so they
              read as supporting content under the primary chapter list. */}
          {secondaryLinks && secondaryLinks.length > 0 && (
            <ul
              className="nx-mobile-menu-footer relative flex flex-wrap gap-x-5 gap-y-2 border-t border-white/8 px-6 py-5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45"
              style={{
                animationDelay: open
                  ? `${80 + resolvedLinks.length * 50 + 20}ms`
                  : '0ms',
              }}
            >
              {secondaryLinks.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Footer block: tagline + primary CTA. */}
          <div
            className="nx-mobile-menu-footer relative border-t border-white/10 px-6 py-6"
            style={{
              animationDelay: open
                ? `${80 + resolvedLinks.length * 50 + 40}ms`
                : '0ms',
            }}
          >
            {tagline && (
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                {tagline}
              </p>
            )}
            {primaryCta?.label && (
              <Link
                href={ctaHref}
                onClick={() => {
                  setOpen(false);
                  scrollToAnchor(ctaHref);
                }}
                className="inline-flex w-full items-center justify-center rounded-nx-button bg-white px-5 py-4 font-mono text-xs uppercase tracking-[0.28em] text-black transition-colors hover:bg-neutral-200"
              >
                {primaryCta.label} →
              </Link>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
