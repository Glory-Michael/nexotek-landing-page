'use client';

import {
  getMotionPreference,
  setMotionPreference,
  useReducedMotion,
} from '@/hooks/use-reduced-motion';
import { useEffect, useState } from 'react';

interface MotionToggleProps {
  className?: string;
  surface?: 'paper' | 'ink';
}

/**
 * Visitor-facing motion preference toggle. Three states cycle in order:
 *   AUTO → FULL → REDUCED → AUTO
 *
 * - AUTO follows the system `prefers-reduced-motion` setting.
 * - FULL overrides system pref to keep all animations on.
 * - REDUCED overrides system pref to disable optional motion.
 *
 * State is persisted in localStorage (`nx-motion-pref`) and emits a custom
 * event so every `useReducedMotion()` subscriber updates in real time.
 */
export function MotionToggle({
  className = '',
  surface = 'ink',
}: MotionToggleProps) {
  const reduced = useReducedMotion();
  const [pref, setPref] = useState<'auto' | 'full' | 'reduced'>('auto');

  useEffect(() => {
    setPref(getMotionPreference());
  }, [reduced]);

  const cycle = () => {
    const next = pref === 'auto' ? 'full' : pref === 'full' ? 'reduced' : 'auto';
    setMotionPreference(next);
    setPref(next);
  };

  const label =
    pref === 'auto'
      ? `MOTION · AUTO`
      : pref === 'full'
      ? 'MOTION · FULL'
      : 'MOTION · REDUCED';

  const surfaceClass =
    surface === 'ink'
      ? 'text-neutral-400 hover:text-white'
      : 'text-neutral-500 hover:text-black';

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Motion preference: ${pref}. Click to cycle.`}
      className={`font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${surfaceClass} ${className}`}
    >
      <span aria-hidden className="mr-2 inline-block h-1.5 w-1.5 rounded-full" style={{
        background: reduced ? '#8A8A87' : '#3DB46D',
      }} />
      {label}
    </button>
  );
}
