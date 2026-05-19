'use client';

import { useEffect, useState } from 'react';

interface ResolveProps {
  children: string;
  delayMs?: number;
  durationMs?: number;
}

/**
 * Resolve — types out the text on arrival, then settles.
 * Brand-safe motion primitive: opacity unchanged, only character reveal so
 * Lighthouse FCP detection is preserved.
 */
export function Resolve({ children, delayMs = 0, durationMs = 800 }: ResolveProps) {
  const total = children.length;
  const [revealed, setRevealed] = useState(total);

  useEffect(() => {
    if (total === 0) return;
    setRevealed(0);
    const start = performance.now() + delayMs;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const next = Math.min(total, Math.floor((elapsed / durationMs) * total));
      setRevealed(next);
      if (next < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [children, delayMs, durationMs, total]);

  return (
    <span aria-label={children}>
      <span aria-hidden>{children.slice(0, revealed)}</span>
      <span aria-hidden className="opacity-0">
        {children.slice(revealed)}
      </span>
    </span>
  );
}
