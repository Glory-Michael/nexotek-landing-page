'use client';

import { useEffect, useState } from 'react';

/**
 * 1:1 recreation of camect's Sidebar — the app shell's left navigation rail.
 * Designed as a corner peek in the hero, bleeding off the left edge so it
 * reads as "the rest of the app sits just off the page." Auto-animates:
 * active item cycles, alert badge pulses, hovered tooltip flashes.
 */

interface NavItem {
  id: string;
  label: string;
  icon: React.FC;
  badge?: { kind: 'count' | 'alert'; value?: number };
}

const NavIcon = {
  dashboard: () => (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <rect x="2" y="2" width="6" height="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="2" width="6" height="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="9" width="6" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="13" width="6" height="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  cameras: () => (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <rect x="2" y="5" width="11" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 8 L16 6 L16 12 L13 10 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  alerts: () => (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path d="M9 2 L16 14 L2 14 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="9" y1="7" x2="9" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9" cy="12.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  recordings: () => (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 6 L13 9 L7 12 Z" fill="currentColor" />
    </svg>
  ),
  floorplan: () => (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <rect x="2" y="3" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7" y1="3" x2="7" y2="9" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.4" />
      <line x1="11" y1="9" x2="11" y2="15" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  reports: () => (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <rect x="3" y="2" width="11" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  settings: () => (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <circle cx="9" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 2 L9 4 M9 14 L9 16 M2 9 L4 9 M14 9 L16 9 M4 4 L5.5 5.5 M12.5 12.5 L14 14 M4 14 L5.5 12.5 M12.5 5.5 L14 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: NavIcon.dashboard },
  { id: 'cameras',    label: 'Cameras',    icon: NavIcon.cameras },
  { id: 'alerts',     label: 'Alerts',     icon: NavIcon.alerts,     badge: { kind: 'count', value: 12 } },
  { id: 'recordings', label: 'Recordings', icon: NavIcon.recordings },
  { id: 'floorplan',  label: 'Floorplan',  icon: NavIcon.floorplan,  badge: { kind: 'alert' } },
  { id: 'reports',    label: 'Reports',    icon: NavIcon.reports },
  { id: 'settings',   label: 'Settings',   icon: NavIcon.settings },
];

interface SidebarPeekProps {
  className?: string;
}

export function SidebarPeek({ className }: SidebarPeekProps) {
  const [activeId, setActiveId] = useState<string>('alerts');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Cycle active nav item every ~3s
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = NAV.findIndex((n) => n.id === activeId);
    const id = window.setInterval(() => {
      i = (i + 1) % NAV.length;
      // Briefly hover the next item before "clicking" it
      setHoveredId(NAV[i].id);
      window.setTimeout(() => {
        setHoveredId(null);
        setActiveId(NAV[i].id);
      }, 400);
    }, 3200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="flex w-[200px] flex-col overflow-hidden rounded-r-xl border border-l-0 border-slate-700 bg-slate-800 text-slate-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* Header — NX logo + workspace name + collapse */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-700 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-500 text-[10px] font-bold text-white">
              N
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-slate-100">NX OPS</p>
              <p className="truncate text-[9px] uppercase tracking-wider text-slate-500">Workspace</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Collapse sidebar"
            className="rounded-full border border-slate-600 bg-slate-800 p-0.5 text-slate-400 hover:text-white"
          >
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
              <path d="M7 3 L4 6 L7 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 p-2" role="navigation" aria-label="Main navigation">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            const isHovered = item.id === hoveredId;
            return (
              <button
                key={item.id}
                type="button"
                className={`group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-100 ring-1 ring-indigo-500/40'
                    : isHovered
                      ? 'bg-slate-700/60 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active indicator strip on the left */}
                {isActive && (
                  <span aria-hidden className="absolute inset-y-1 left-0 w-[2px] rounded-r bg-indigo-400" />
                )}
                <span className={`shrink-0 ${isActive ? 'text-indigo-300' : ''}`}>
                  <Icon />
                </span>
                <span className="truncate">{item.label}</span>
                {/* Badge */}
                {item.badge?.kind === 'count' && (
                  <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/25 px-1 font-mono text-[9px] font-semibold text-indigo-200">
                    {item.badge.value}
                  </span>
                )}
                {item.badge?.kind === 'alert' && (
                  <span className="ml-auto relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-red-500 nx-pulse-dot" />
                    <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Onboarding pill at bottom */}
        <div className="border-t border-slate-700 p-2">
          <button
            type="button"
            className="group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700/60"
          >
            <span className="relative shrink-0">
              <svg viewBox="0 0 18 18" className="h-4 w-4 text-indigo-400" aria-hidden>
                <path d="M9 2 L11 7 L16 7 L12 10 L13.5 15 L9 12 L4.5 15 L6 10 L2 7 L7 7 Z" fill="currentColor" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 nx-pulse-dot" />
            </span>
            <span className="truncate">Getting started</span>
            <span className="ml-auto font-mono text-[9px] text-slate-500">3/8</span>
          </button>
        </div>

        {/* Footer — user/org */}
        <div className="flex items-center gap-2 border-t border-slate-700 px-3 py-2">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-200">
            M
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] text-slate-200">m. operator</p>
            <p className="truncate font-mono text-[9px] uppercase tracking-wider text-slate-500">REVIEWER</p>
          </div>
        </div>
      </div>
    </div>
  );
}
