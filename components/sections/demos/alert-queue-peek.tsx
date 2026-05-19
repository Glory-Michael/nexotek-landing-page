'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 1:1 recreation of camect-webapp's AlertReviewQueue UI — the operator's
 * alert triage view. Designed to live in a corner as a "peek into the
 * running product." Uses authentic slate / indigo / red-amber palette from
 * the real app rather than the Nexotek brand mono — readers should perceive
 * this as the actual SaaS rendered nearby, not a stylized facsimile.
 *
 * Self-animates: status tab cycles, new alerts insert at top of list,
 * severity radio rotates, decision button flashes, toast slides in.
 */

interface AlertItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  camera: string;
  hub: string;
  ago: string;
}

const SEED_ALERTS: AlertItem[] = [
  { id: 'a1', severity: 'critical', title: 'Worker in lift zone',         camera: 'CAM 03 · LIFT',     hub: 'NORTH WING',   ago: '12s' },
  { id: 'a2', severity: 'high',     title: 'PPE missing · hardhat',       camera: 'CAM 07 · SCAFFOLD', hub: 'NORTH WING',   ago: '1m' },
  { id: 'a3', severity: 'medium',   title: 'Vehicle proximity to worker', camera: 'CAM 11 · DOCK',     hub: 'SOUTH WING',   ago: '3m' },
  { id: 'a4', severity: 'low',      title: 'After-hours motion · gate',   camera: 'CAM 14 · PERIM',    hub: 'PERIMETER',    ago: '8m' },
];

// Synthetic alerts that get auto-inserted into the queue over time.
const INCOMING: Array<Omit<AlertItem, 'ago' | 'id'>> = [
  { severity: 'high',     title: 'Unsecured load · forklift',   camera: 'CAM 04 · YARD',     hub: 'YARD' },
  { severity: 'critical', title: 'Hot work · no spotter',       camera: 'CAM 09 · TANK 02',  hub: 'OPS' },
  { severity: 'medium',   title: 'Worker near edge · L4',       camera: 'CAM 02 · L4',       hub: 'NORTH WING' },
  { severity: 'high',     title: 'Tool dropped from height',    camera: 'CAM 06 · BAY',      hub: 'DOCK' },
];

const SEV_META: Record<AlertItem['severity'], { label: string; dot: string; chip: string; ring: string }> = {
  critical: { label: 'Critical', dot: 'bg-red-500',    chip: 'border-red-500/35 bg-red-500/10 text-red-300',       ring: 'border-red-500/60 bg-red-500/10' },
  high:     { label: 'High',     dot: 'bg-orange-400', chip: 'border-orange-400/35 bg-orange-400/10 text-orange-300', ring: 'border-orange-400/60 bg-orange-400/10' },
  medium:   { label: 'Medium',   dot: 'bg-amber-300',  chip: 'border-amber-300/35 bg-amber-300/10 text-amber-200',   ring: 'border-amber-300/60 bg-amber-300/10' },
  low:      { label: 'Low',      dot: 'bg-sky-400',    chip: 'border-sky-400/35 bg-sky-400/10 text-sky-300',         ring: 'border-sky-400/60 bg-sky-400/10' },
};

type StatusTab = 'pending' | 'reviewed' | 'dismissed';

const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
  { id: 'pending',   label: 'Pending' },
  { id: 'reviewed',  label: 'Reviewed' },
  { id: 'dismissed', label: 'Dismissed' },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

interface AlertQueuePeekProps {
  className?: string;
}

export function AlertQueuePeek({ className }: AlertQueuePeekProps) {
  const reduced = usePrefersReducedMotion();

  // ── State ─────────────────────────────────────────────────────────
  const [statusTab, setStatusTab] = useState<StatusTab>('pending');
  const [alerts, setAlerts] = useState<AlertItem[]>(SEED_ALERTS);
  const [activeId, setActiveId] = useState<string>(SEED_ALERTS[0].id);
  const [selectedSeverity, setSelectedSeverity] = useState<AlertItem['severity']>('critical');
  const [stats, setStats] = useState({ pending: 12, reviewed: 84, dismissed: 6 });
  const [pressedAction, setPressedAction] = useState<'confirm' | 'dismiss' | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  // Sliding tab indicator measurement
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<StatusTab, HTMLButtonElement | null>>({ pending: null, reviewed: null, dismissed: null });
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const measure = () => {
      const parent = tablistRef.current;
      const el = tabRefs.current[statusTab];
      if (!parent || !el) return;
      // Use offsetLeft/offsetWidth (layout px, transform-free) instead of
      // getBoundingClientRect (visual px, transform-scaled). The pill lives
      // inside the showcase-flip 3D stack where the back card renders at
      // scale(0.88); rect-based measurement returned scaled px while the
      // indicator's `left/width` styles are interpreted as layout px, so the
      // indicator drifted ~12% on the back layer. offsetLeft is measured
      // from the offsetParent (this tablist via `relative`) and matches the
      // coordinate system of `position: absolute` children exactly.
      void parent;
      setIndicator({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    };
    measure();
    if (typeof window === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (tablistRef.current) ro.observe(tablistRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [statusTab]);

  // ── Auto-animations ────────────────────────────────────────────────

  // Cycle status tab every ~6s
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setStatusTab((s) =>
        s === 'pending' ? 'reviewed' : s === 'reviewed' ? 'dismissed' : 'pending',
      );
    }, 6200);
    return () => window.clearInterval(id);
  }, [reduced]);

  // Insert new alert at top every ~4.5s (only when on pending tab)
  useEffect(() => {
    if (reduced) return;
    let incoming = 0;
    const id = window.setInterval(() => {
      const next = INCOMING[incoming % INCOMING.length];
      incoming++;
      const newAlert: AlertItem = {
        id: `live-${Date.now()}`,
        ...next,
        ago: 'now',
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 4));
      setStats((s) => ({ ...s, pending: s.pending + 1 }));
    }, 4500);
    return () => window.clearInterval(id);
  }, [reduced]);

  // Rotate selected severity every ~3s
  useEffect(() => {
    if (reduced) return;
    const seqs: AlertItem['severity'][] = ['critical', 'high', 'medium', 'high'];
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % seqs.length;
      setSelectedSeverity(seqs[i]);
    }, 3000);
    return () => window.clearInterval(id);
  }, [reduced]);

  // Flash action button + show toast every ~5.5s
  useEffect(() => {
    if (reduced) return;
    let confirmTurn = true;
    const id = window.setInterval(() => {
      const action = confirmTurn ? 'confirm' : 'dismiss';
      confirmTurn = !confirmTurn;
      setPressedAction(action);
      window.setTimeout(() => setPressedAction(null), 280);
      window.setTimeout(() => {
        setToast({
          visible: true,
          text: action === 'confirm' ? 'Confirmed · routed to supervisor' : 'Dismissed · false positive',
        });
        setStats((s) => ({
          ...s,
          [action === 'confirm' ? 'reviewed' : 'dismissed']: s[action === 'confirm' ? 'reviewed' : 'dismissed'] + 1,
          pending: Math.max(0, s.pending - 1),
        }));
      }, 380);
      window.setTimeout(() => setToast({ visible: false, text: '' }), 3000);
    }, 5500);
    return () => window.clearInterval(id);
  }, [reduced]);

  // Cycle active alert (highlighted row) every ~2.4s
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActiveId((curr) => {
        const idx = alerts.findIndex((a) => a.id === curr);
        const next = alerts[(idx + 1) % alerts.length];
        return next?.id ?? alerts[0]?.id ?? '';
      });
    }, 2400);
    return () => window.clearInterval(id);
  }, [alerts, reduced]);

  const activeAlert = alerts.find((a) => a.id === activeId) ?? alerts[0];

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="overflow-hidden rounded-none border border-white/15 bg-nx-black text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* ── Top toolbar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-white/15 px-3 py-2">
          {/* Segmented status pill */}
          <div
            ref={tablistRef}
            role="tablist"
            aria-label="Review status"
            className="relative inline-flex items-center rounded-full border border-white/15 bg-nx-ink-3/40 p-0.5"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-white/30 shadow-[inset_0_0_0_1px_rgb(51_65_85)]"
              style={{
                left: indicator.left,
                width: indicator.width,
                opacity: indicator.ready ? 1 : 0,
                transition: 'left 240ms cubic-bezier(0.4,0,0.2,1), width 240ms cubic-bezier(0.4,0,0.2,1), opacity 120ms ease-out',
              }}
            />
            {STATUS_TABS.map((t) => {
              const active = statusTab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el; }}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`relative z-10 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${active ? 'text-white' : 'text-neutral-400'}`}
                >
                  {t.label}
                  <span className="font-mono text-[9px] opacity-70 tabular-nums">{stats[t.id]}</span>
                </button>
              );
            })}
          </div>

          {/* Divider — desktop only, since the chips below it are hidden on mobile */}
          <div className="hidden h-4 w-px shrink-0 bg-nx-ink-3 md:block" aria-hidden />

          {/* Filter chips — secondary controls hidden on mobile to keep the
              top rail on one line at narrow widths. */}
          <div className="hidden items-center gap-2 md:flex">
            <FilterChip label="Severity" />
            <FilterChip label="Hub" />
            <FilterChip label="Camera" active />
          </div>

          {/* Reviewer/Operator toggle — desktop only for the same reason. */}
          <div className="ml-auto hidden items-center rounded-full border border-white/20 p-0.5 text-[10px] opacity-60 md:inline-flex">
            <span className="rounded-full bg-nx-ink-3 px-2 py-0.5 text-white/90">Reviewer</span>
            <span className="px-2 py-0.5 text-neutral-500">Operator</span>
          </div>
        </div>

        {/* ── Main 3-column body ────────────────────────────────────── */}
        {/* Below `md` the center video-preview column and right decision pane
            overflow the viewport, so we drop to a single-column alert list. */}
        <div className="grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)_180px]">
          {/* Alert list */}
          <ol className="border-b border-white/15 md:border-b-0 md:border-r">
            {alerts.map((a) => {
              const meta = SEV_META[a.severity];
              const isActive = a.id === activeId;
              const isFresh = a.ago === 'now';
              return (
                <li
                  key={a.id}
                  className={`relative border-b border-white/15 px-3 py-2 transition-colors ${isActive ? 'bg-nx-ink-3/50' : 'bg-transparent hover:bg-nx-ink-3/30'} ${isFresh ? 'animate-nx-alert-in' : ''}`}
                >
                  {isActive && <span className="absolute inset-y-0 left-0 w-[2px] bg-white" aria-hidden />}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${meta.chip}`}>
                      <span className={`inline-block h-1 w-1 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-500">{a.ago}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-medium text-white/90">{a.title}</p>
                  <p className="mt-0.5 truncate font-mono text-[9px] text-neutral-500">{a.camera}</p>
                </li>
              );
            })}
          </ol>

          {/* Center: video clip preview placeholder + detail header */}
          <div className="hidden min-w-0 flex-col md:flex">
            {/* Detail header */}
            <div className="border-b border-white/15 bg-nx-black/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${SEV_META[activeAlert.severity].chip}`}>
                  <span className={`inline-block h-1 w-1 rounded-full ${SEV_META[activeAlert.severity].dot}`} />
                  {SEV_META[activeAlert.severity].label}
                </span>
                <span className="truncate font-mono text-[10px] uppercase tracking-wide text-neutral-300">{activeAlert.camera}</span>
                <span className="ml-auto font-mono text-[9px] text-neutral-500">{activeAlert.ago} AGO</span>
              </div>
              <p className="mt-1 truncate text-[11.5px] text-white">{activeAlert.title}</p>
            </div>
            {/* Clip viewport */}
            <div className="relative flex-1 bg-nx-ink-2">
              {/* Faux video grid backdrop — fills the wide rectangle */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              />
              {/* Floor perspective — separate SVG that DOES stretch */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
                aria-hidden
              >
                <path d="M0 70 L100 70 L100 100 L0 100Z" fill="#0f172a" opacity="0.85" />
                <line x1="0" y1="70" x2="100" y2="70" stroke="#1e293b" strokeWidth="0.6" />
              </svg>
              {/* Subject silhouette + bbox — uses xMidYMid meet so the worker
                  shape stays proportional regardless of how wide/short the
                  viewport's aspect ratio is. */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 h-full w-full"
                aria-hidden
              >
                <ellipse cx="50" cy="44" rx="6" ry="7" fill="#475569" />
                <path d="M 38 56 L 62 56 L 58 76 L 42 76 Z" fill="#475569" />
                <rect x="42" y="76" width="6" height="20" fill="#475569" />
                <rect x="52" y="76" width="6" height="20" fill="#475569" />
                <rect x="32" y="34" width="36" height="62" fill="none" stroke="#f87171" strokeWidth="0.8" />
              </svg>
              <span className="absolute left-2 top-2 font-mono text-[9px] uppercase tracking-wider text-red-300">
                ▸ WORKER · 0.96
              </span>
              {/* REC pulse */}
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase text-neutral-300">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-red-500 nx-pulse-dot" />
                  <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                REC
              </span>
              {/* Scrubber */}
              <div className="absolute inset-x-2 bottom-2">
                <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/15">
                  <span className="absolute inset-y-0 left-0 w-1/2 bg-white nx-scrub-bar" />
                </div>
              </div>
            </div>
          </div>

          {/* Decision pane */}
          <aside className="hidden flex-col border-l border-white/15 px-3 py-2 md:flex">
            <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">SEVERITY</p>
            <div className="mt-1.5 space-y-1">
              {(['critical', 'high', 'medium', 'low'] as const).map((s) => {
                const sel = s === selectedSeverity;
                const meta = SEV_META[s];
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={sel}
                    className={`flex w-full items-center gap-2 rounded border px-2 py-1 text-[10.5px] transition-colors ${sel ? meta.ring : 'border-white/15 bg-transparent text-neutral-300 hover:bg-nx-ink-3/40'}`}
                  >
                    <span className={`relative inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${sel ? 'border-white' : 'border-white/25'}`}>
                      {sel && <span className={`block h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
                    </span>
                    <span className="text-white/90">{meta.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Decision buttons */}
            <div className="mt-3 space-y-1.5">
              <button
                type="button"
                aria-pressed={pressedAction === 'confirm'}
                className={`flex w-full items-center justify-center gap-1.5 rounded border border-emerald-500/50 bg-emerald-500/15 px-2 py-1.5 text-[10.5px] font-medium text-emerald-200 transition-all ${pressedAction === 'confirm' ? 'scale-95 bg-emerald-500/40' : ''}`}
              >
                ✓ Confirm hazard
              </button>
              <button
                type="button"
                aria-pressed={pressedAction === 'dismiss'}
                className={`flex w-full items-center justify-center gap-1.5 rounded border border-white/20 bg-nx-ink-3/40 px-2 py-1.5 text-[10.5px] font-medium text-neutral-300 transition-all ${pressedAction === 'dismiss' ? 'scale-95 bg-white/15' : ''}`}
              >
                ✕ Dismiss
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded px-2 py-1 text-[10px] text-neutral-500"
              >
                ⤴ Skip · J
              </button>
            </div>
          </aside>
        </div>

        {/* ── Footer status ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-white/15 bg-nx-black px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-400">CONNECTED</span>
            <span className="text-neutral-600">·</span>
            <span>{alerts.length} ACTIVE</span>
          </span>
          <span className="hidden text-neutral-500 md:inline">⌘K · NAV · ⇧/ HELP</span>
        </div>
      </div>

      {/* ── Toast notification ──────────────────────────────────────── */}
      <div
        className={`pointer-events-none absolute -top-2 right-4 transform transition-all duration-300 ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
      >
        <div className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-[10.5px] font-medium text-emerald-200 shadow-lg backdrop-blur-sm">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {toast.text || 'Updated'}
        </div>
      </div>
    </div>
  );
}

// ── Filter chip atom (replicates camect's FilterChip styling) ──────────
function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] leading-none transition-colors ${active ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-white/20 bg-transparent text-neutral-300 hover:bg-nx-ink-3/50'}`}
    >
      <span>{label}</span>
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 opacity-60" aria-hidden>
        <path d="M3 4.5 L6 7.5 L9 4.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
