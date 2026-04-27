'use client';

import { useEffect, useRef, useState } from 'react';
import { Rss, Check, Copy, ExternalLink } from 'lucide-react';

interface RssSubscribeProps {
  feedUrl: string;
  absoluteFeedUrl: string;
}

export function RssSubscribe({ feedUrl, absoluteFeedUrl }: Readonly<RssSubscribeProps>) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteFeedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write can fail in insecure contexts; ignore.
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-black dark:text-white bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        <Rss className="w-4 h-4" aria-hidden="true" />
        <span>Subscribe</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Subscribe to RSS feed"
          className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg shadow-black/5 dark:shadow-black/40 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-md bg-[#f26522]/10 dark:bg-[#f26522]/20 flex items-center justify-center text-[#f26522]">
              <Rss className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-black dark:text-white">Subscribe via RSS</h3>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Get every article in your favorite reader — no email required.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate text-xs px-2.5 py-2 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-mono">
              {absoluteFeedUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy RSS feed URL"
              className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md text-black dark:text-white bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>

          <a
            href={feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            Open raw feed
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}
