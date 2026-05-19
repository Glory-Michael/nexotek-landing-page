'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface CountUpProps {
  /** Target value to count toward. */
  value: number;
  /** Animation duration in ms. Default 1400. */
  durationMs?: number;
  /** Format the current value (e.g. n => `${n}%`). */
  formatter?: (n: number) => string;
  /** Number of decimals to round to. Default 0. */
  decimals?: number;
  /** Optional starting value. Default 0. */
  from?: number;
  className?: string;
}

const easeOutExpo = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export function CountUp({
  value,
  durationMs = 1400,
  formatter,
  decimals = 0,
  from = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<number>(from);
  const startedRef = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      setDisplay(value);
      startedRef.current = true;
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || startedRef.current) continue;
          startedRef.current = true;
          const start = performance.now();
          let raf = 0;
          const tick = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(1, elapsed / durationMs);
            const eased = easeOutExpo(t);
            const next = from + (value - from) * eased;
            setDisplay(next);
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          io.disconnect();
          return () => cancelAnimationFrame(raf);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, from, durationMs, reduced]);

  const rounded =
    decimals > 0
      ? Number(display.toFixed(decimals))
      : Math.round(display);
  const text = formatter ? formatter(rounded) : String(rounded);

  return (
    <span ref={ref} className={className} aria-label={String(formatter ? formatter(value) : value)}>
      <span aria-hidden>{text}</span>
    </span>
  );
}

const NUMERIC_PREFIX_REGEX =
  /^(\$|€|£|¥)?(\d+(?:[\.,]\d+)?)(%|K|M|B|k|m|b)?\b/;

/**
 * Detects a leading numeric pattern in a string (e.g. "99%", "$50M", "100K workers")
 * and returns the parsed parts. Returns null if the string doesn't start with a number.
 */
export function parseLeadingNumeric(text: string): {
  prefix: string;
  number: number;
  suffix: string;
  rest: string;
} | null {
  const match = NUMERIC_PREFIX_REGEX.exec(text);
  if (!match) return null;
  const [whole, prefix = '', numStr, suffix = ''] = match;
  const number = Number(numStr.replace(',', '.'));
  if (!Number.isFinite(number)) return null;
  const rest = text.slice(whole.length).trimStart();
  return { prefix, number, suffix, rest };
}

interface SmartHeadlineProps {
  text: string;
  className?: string;
  numericClassName?: string;
}

/**
 * Renders a tile/stat headline, auto-animating any leading numeric portion
 * (e.g. "99% false alert rejection") via CountUp. Falls back to plain text.
 */
export function SmartNumericHeadline({
  text,
  className,
  numericClassName,
}: SmartHeadlineProps) {
  const parsed = parseLeadingNumeric(text);
  if (!parsed) return <span className={className}>{text}</span>;

  const { prefix, number, suffix, rest } = parsed;
  const fmt = (n: number) => `${prefix}${n}${suffix}`;
  return (
    <span className={className}>
      <CountUp value={number} formatter={fmt} className={numericClassName} />
      {rest ? <span> {rest}</span> : null}
    </span>
  );
}
