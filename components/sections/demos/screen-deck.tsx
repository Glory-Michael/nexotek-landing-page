'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Film,
  History,
  Pin,
  Search,
  Shield,
  SkipForward,
  Tag,
  X,
} from 'lucide-react';
import { DetectionActivityChart } from './event-stream-peek';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// ── Screen 1: Review Decision Pane ──────────────────────────────────────────
function DecisionPanelScreen() {
  return (
    <div className="flex h-full flex-col gap-3 bg-nx-black p-4 text-white">
      <div className="flex items-center gap-2 border-b border-white/15 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-none bg-amber-500/15 text-amber-300">
          <AlertTriangle size={14} />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-white">Review · CAM 07</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
            Scaffold · PPE missing
          </div>
        </div>
        <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          Pending
        </span>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Severity
          </span>
          <span className="text-[9px] font-semibold text-red-300">Required</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Critical', tone: 'border-red-500/40 bg-red-500/10 text-red-200', dot: 'bg-red-400', active: true },
            { label: 'Standard', tone: 'border-white/15 text-neutral-300', dot: 'bg-amber-400' },
            { label: 'Minor',    tone: 'border-white/15 text-neutral-300', dot: 'bg-yellow-400' },
            { label: 'Info',     tone: 'border-white/15 text-neutral-300', dot: 'bg-neutral-500' },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-1.5 rounded-none border px-2 py-1.5 text-[11px] font-semibold ${s.tone}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Reviewer notes
          </span>
          <span className="font-mono text-[9px] text-neutral-500">42 / 500</span>
        </div>
        <div className="rounded-none border border-white/15 bg-transparent px-2.5 py-2 text-[11px] leading-snug text-white/90">
          Site lead notified — hardhat reissue at gate. Recurring on swing shift.
        </div>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 rounded-none border border-white/15 px-2.5 py-2 text-[11px] text-white/90"
        tabIndex={-1}
      >
        <History size={11} className="text-neutral-400" />
        Activity
        <span className="ml-auto inline-flex items-center gap-2">
          <span className="rounded-full border border-white/15 px-1.5 py-0.5 font-mono text-[9px] text-neutral-400">
            7
          </span>
          <ChevronDown size={11} className="text-neutral-400" />
        </span>
      </button>

      <div className="mt-auto grid grid-cols-3 gap-1.5">
        <ActionButton tone="slate" icon={<SkipForward size={11} />} label="Skip" />
        <ActionButton tone="red"   icon={<X size={11} />} label="Dismiss" />
        <ActionButton tone="green" icon={<Check size={11} />} label="Confirm" />
      </div>
    </div>
  );
}

function ActionButton({
  tone,
  icon,
  label,
}: {
  tone: 'slate' | 'red' | 'green';
  icon: React.ReactNode;
  label: string;
}) {
  const styles =
    tone === 'green'
      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
      : tone === 'red'
        ? 'border-red-500/30 bg-red-500/10 text-red-200'
        : 'border-white/15 bg-transparent text-neutral-300';
  return (
    <div
      className={`flex items-center justify-center gap-1.5 rounded-none border px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${styles}`}
    >
      {icon}
      {label}
    </div>
  );
}

// ── Screen 2: Clip Recordings ───────────────────────────────────────────────
function RecordingsScreen() {
  const clips = [
    { cam: 'CAM 04 · YARD',     ts: '14:22', type: 'Unsecured load',     tone: 'from-amber-700/60 to-amber-900' },
    { cam: 'CAM 11 · DOCK',     ts: '13:08', type: 'Vehicle proximity',  tone: 'from-red-900/40 to-nx-black' },
    { cam: 'CAM 07 · SCAFFOLD', ts: '11:47', type: 'PPE missing',        tone: 'from-amber-800/60 to-nx-black' },
    { cam: 'CAM 03 · LIFT',     tone: 'from-nx-ink-2 to-nx-black',     ts: '10:31', type: 'Worker in lift zone' },
    { cam: 'CAM 01 · LOBBY',    tone: 'from-amber-900/40 to-nx-black', ts: '09:18', type: 'Loitering' },
    { cam: 'CAM 09 · GATE',     tone: 'from-nx-ink-2 to-nx-black',     ts: '08:04', type: 'Unauthorized entry' },
  ];
  return (
    <div className="flex h-full flex-col gap-3 bg-nx-black p-4 text-white">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-none bg-amber-500/15 text-amber-300">
          <Film size={14} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-white">Clip Recordings</div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
            6 clips · today
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-none border border-white/15 bg-nx-ink-2/70 px-2 py-1.5">
        <Search size={11} className="text-neutral-500" />
        <span className="text-[10px] text-neutral-500">Natural-language search</span>
      </div>

      <div className="grid grid-cols-2 gap-2 overflow-hidden">
        {clips.slice(0, 4).map((c) => (
          <div
            key={c.cam + c.ts}
            className="overflow-hidden rounded-none border border-white/15 bg-nx-ink-2"
          >
            <div className={`relative h-14 bg-gradient-to-br ${c.tone}`}>
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.08),transparent_60%)]" />
              <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1 font-mono text-[8px] text-white/90">
                {c.ts}
              </span>
            </div>
            <div className="px-2 py-1.5">
              <div className="truncate font-mono text-[8.5px] uppercase tracking-[0.14em] text-neutral-500">
                {c.cam}
              </div>
              <div className="truncate text-[10px] font-medium text-white/90">
                {c.type}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between text-[9px] text-neutral-500">
        <span>Showing 4 of 6</span>
        <span className="rounded border border-white/15 px-1.5 py-0.5 font-mono">
          NX OPS
        </span>
      </div>
    </div>
  );
}

// ── Screen 3: Alert History ─────────────────────────────────────────────────
function AlertHistoryScreen() {
  const rows = [
    { time: '14:22', cam: 'CAM 04', type: 'Unsecured load',    sev: 'CRIT',  tone: 'bg-red-500/15 text-red-200 border-red-500/30' },
    { time: '13:08', cam: 'CAM 11', type: 'Vehicle proximity', sev: 'STD',   tone: 'bg-amber-500/15 text-amber-200 border-amber-500/30' },
    { time: '11:47', cam: 'CAM 07', type: 'PPE missing',       sev: 'STD',   tone: 'bg-amber-500/15 text-amber-200 border-amber-500/30' },
    { time: '10:31', cam: 'CAM 03', type: 'Lift zone breach',  sev: 'CRIT',  tone: 'bg-red-500/15 text-red-200 border-red-500/30' },
    { time: '09:18', cam: 'CAM 01', type: 'Loitering',         sev: 'MINOR', tone: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30' },
    { time: '08:04', cam: 'CAM 09', type: 'Unauthorized entry',sev: 'CRIT',  tone: 'bg-red-500/15 text-red-200 border-red-500/30' },
  ];
  return (
    <div className="flex h-full flex-col gap-3 bg-nx-black p-4 text-white">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-none bg-emerald-500/15 text-emerald-300">
          <Shield size={14} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-white">Alert History</div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
            Past 24h · 12 events
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
          <Pin size={9} className="fill-emerald-300" />
          Pinned
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['All', 'PPE', 'Vehicle', 'Worker', 'Entry'].map((f, i) => (
          <span
            key={f}
            className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
              i === 0
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                : 'border-white/15 text-neutral-400'
            }`}
          >
            {f}
          </span>
        ))}
      </div>

      <div className="flex-1 divide-y divide-white/10 overflow-hidden rounded-none border border-white/15">
        {rows.map((r) => (
          <div
            key={r.time + r.cam}
            className="flex items-center gap-2 px-2.5 py-1.5"
          >
            <span className="font-mono text-[9px] text-neutral-500">{r.time}</span>
            <span className="font-mono text-[9px] text-neutral-400">{r.cam}</span>
            <span className="truncate text-[10px] text-white/90">{r.type}</span>
            <span
              className={`ml-auto rounded border px-1.5 py-0.5 font-mono text-[8.5px] font-semibold ${r.tone}`}
            >
              {r.sev}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[9px] text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <Calendar size={9} />
          May 13 · 24h window
        </span>
        <span className="inline-flex items-center gap-1">
          <Tag size={9} />4 types
        </span>
      </div>
    </div>
  );
}

// ── Deck Container with shuffle loop ────────────────────────────────────────
const SCREENS = [
  { key: 'review',     render: () => <DecisionPanelScreen /> },
  { key: 'recordings', render: () => <RecordingsScreen /> },
  { key: 'detection',  render: () => <DetectionActivityChart /> },
  { key: 'history',    render: () => <AlertHistoryScreen /> },
];

const SHUFFLE_INTERVAL_MS = 4200;

interface ScreenDeckProps {
  className?: string;
}

export function ScreenDeck({ className = '' }: ScreenDeckProps) {
  const reduced = usePrefersReducedMotion();
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setOrder((prev) => [prev[1], prev[2], prev[3], prev[0]]);
    }, SHUFFLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div
      className={`relative h-[360px] w-[340px] ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
      aria-hidden="true"
    >
      {SCREENS.map((screen, cardIdx) => {
        const position = order.indexOf(cardIdx); // 0 = front, then 1, 2, 3 back
        const transform =
          position === 0
            ? 'translate3d(0, 0, 48px)'
            : position === 1
              ? 'translate3d(-10px, 12px, 24px)'
              : position === 2
                ? 'translate3d(-20px, 24px, 8px)'
                : 'translate3d(-30px, 36px, -8px)';
        const opacity =
          position === 0
            ? 1
            : position === 1
              ? 0.6
              : position === 2
                ? 0.32
                : 0.18;
        const zIndex = 4 - position;
        return (
          <div
            key={screen.key}
            className="absolute inset-0 overflow-hidden rounded-none border border-white/15 bg-nx-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] motion-reduce:transition-none"
            style={{
              transform,
              opacity,
              zIndex,
              transition:
                'transform 700ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 700ms ease-out',
              willChange: 'transform, opacity',
            }}
          >
            {position === 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-none ring-1 ring-amber-400/30"
              />
            )}
            {screen.render()}
          </div>
        );
      })}
    </div>
  );
}
