'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface LiveEvent {
  status: 'ok' | 'warn' | 'info';
  label: string;
}

// Curated, brand-correct telemetry strings. Anything that names a customer or
// real site is stripped — these are illustrative of *what the platform is
// doing*, not a live data feed. Reduced-motion users see a static stack.
const DEFAULT_EVENTS: LiveEvent[] = [
  { status: 'info', label: 'CYCLE 042 · RUNNING · 9 STREAMS' },
  { status: 'ok', label: 'PPE OK · SCAFFOLD L3 · 14:32' },
  { status: 'warn', label: 'LOITERING · DOCK · CONFIDENCE 0.84' },
  { status: 'info', label: 'CAPTURE 002 · 384K PTS · ARCHIVED' },
  { status: 'ok', label: 'EDGE INFERENCE · ON-PREM · NOMINAL' },
  { status: 'info', label: 'CCEUs ISSUED · 27 / DAY · IACET' },
  { status: 'warn', label: 'VEHICLE-PROXIMITY · ZONE B · 0.91' },
  { status: 'ok', label: 'FACE-BLUR · ENABLED · ALL STREAMS' },
];

const STATUS_COLOR: Record<LiveEvent['status'], string> = {
  ok: '#3DB46D',
  warn: '#F4D544',
  info: '#8A8A87',
};

const STEP_MS = 2800;

interface LiveEventTickerProps {
  events?: LiveEvent[];
  className?: string;
}

export function LiveEventTicker({
  events = DEFAULT_EVENTS,
  className = '',
}: LiveEventTickerProps) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || events.length === 0) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % events.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [events.length, reduced]);

  if (events.length === 0) return null;

  if (reduced) {
    return (
      <ul
        className={`flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.18em] ${className}`}
        aria-label="Recent platform events"
      >
        {events.slice(0, 4).map((e, i) => (
          <li key={`re-${i}`} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: STATUS_COLOR[e.status] }}
            />
            <span>{e.label}</span>
          </li>
        ))}
      </ul>
    );
  }

  const active = events[index];

  return (
    <div
      className={`relative flex min-h-[20px] items-center overflow-hidden font-mono text-[10px] uppercase tracking-[0.18em] text-current/80 ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div key={index} className="nx-ticker-row flex min-w-0 flex-1 items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: STATUS_COLOR[active.status] }}
        />
        <span className="truncate whitespace-nowrap">{active.label}</span>
      </div>
      <style jsx>{`
        @keyframes nx-ticker-in {
          from {
            transform: translateY(6px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .nx-ticker-row {
          animation: nx-ticker-in 420ms var(--nx-ease-emphasis, ease-out) both;
        }
      `}</style>
    </div>
  );
}
