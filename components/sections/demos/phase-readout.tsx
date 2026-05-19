'use client';

interface PhaseReadoutProps {
  index: string;
  label: string;
  active: number;
  total: number;
  className?: string;
}

/**
 * Tiny mono telemetry strip — shows "PHASE 02 · RECONSTRUCT  · 02 / 04"
 * Used alongside the LoopSequence to show which phase is currently active.
 */
export function PhaseReadout({
  index,
  label,
  active,
  total,
  className = '',
}: PhaseReadoutProps) {
  return (
    <p
      className={`font-mono text-xs uppercase tracking-[0.24em] ${className}`}
      aria-live="polite"
    >
      <span>PHASE {index} · {label}</span>
      <span className="ml-3 opacity-60">
        {String(active).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </p>
  );
}
