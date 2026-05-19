'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { MediaRef } from '@/types/landing-page';

interface ComparisonSliderProps {
  beforeImage: MediaRef;
  afterImage: MediaRef;
  beforeLabel?: string;
  afterLabel?: string;
  /** Initial divider position 0-100. Default 50. */
  initial?: number;
  className?: string;
  aspectRatio?: string;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'RAW',
  afterLabel = 'NEXOTEK VISION',
  initial = 50,
  className = '',
  aspectRatio = '4 / 3',
}: ComparisonSliderProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(initial);
  const draggingRef = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [setFromClientX]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 4));
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 4));
    if (e.key === 'Home') setPos(0);
    if (e.key === 'End') setPos(100);
  };

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden border border-white/45 bg-neutral-950 select-none ${className}`}
      style={{ aspectRatio }}
      onPointerDown={onPointerDown}
    >
      {/* Base: after image (fills) */}
      <div className="absolute inset-0">
        <Image
          src={afterImage.url}
          alt={afterImage.alt || afterLabel}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
          unoptimized
          priority={false}
        />
      </div>

      {/* Top: before image, clipped to left portion via clipPath */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        aria-hidden
      >
        <Image
          src={beforeImage.url}
          alt={beforeImage.alt || beforeLabel}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
          unoptimized
        />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute left-3 top-3 border border-white/30 bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 border border-white/30 bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Divider handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Before/after comparison"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKeyDown}
        className="absolute top-0 bottom-0 w-[3px] bg-white cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-white/60"
        style={{ left: `${pos}%`, transform: 'translateX(-0.5px)' }}
      >
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-black/70 text-white font-mono text-xs"
          aria-hidden
        >
          ⇆
        </span>
      </div>
    </div>
  );
}
