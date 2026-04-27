'use client';

import { useState } from 'react';

export function SampleContentBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
            Sample
          </span>
          <p className="text-xs text-amber-800 dark:text-amber-300 truncate">
            This newsroom contains placeholder content for demo purposes. Real articles will appear here at launch.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
