'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

// ── Dot-matrix morph ────────────────────────────────────────────────────────
// Fixed N×N square grid of dots. Dots don't *move* — they brighten/scale based
// on whether the current shape *fills* their grid cell. Morphing between
// shapes feels like a real LED dot-matrix display flipping pixels.

const GRID = 22; // 22 × 22 = 484 dots

type ShapeKind = 'heart' | 'skyline' | 'crane' | 'hardhat' | 'cone';
const SHAPES: ShapeKind[] = ['heart', 'skyline', 'crane', 'hardhat', 'cone'];
const MORPH_INTERVAL_MS = 3400;

function isFilled(shape: ShapeKind, x: number, y: number): boolean {
  switch (shape) {
    case 'heart': {
      // Implicit heart: ((x² + y² − 1)³ − x²·y³) < 0 in centered math coords.
      // SVG Y is flipped vs math Y; pick scale/center so the lobes sit at the
      // top and the cusp at the bottom of the unit square.
      const SCALE = 1 / 0.32;
      const CY = 0.55;
      const mx = (x - 0.5) * SCALE;
      const my = (CY - y) * SCALE;
      const v = Math.pow(mx * mx + my * my - 1, 3) - mx * mx * my * my * my;
      return v < 0;
    }
    case 'skyline': {
      // NYC-leaning skyline: six buildings of varying heights on a ground line.
      // Building 4 has a stepped crown (Empire-State-ish); building 2 carries a
      // narrow spire (Chrysler-ish). Ground bar sits at the bottom of the grid.
      if (y >= 0.86) return true;
      // Bldg 1 (mid-rise)
      if (x >= 0.10 && x <= 0.22 && y >= 0.55) return true;
      // Bldg 2 — Chrysler-ish: shaft + spire
      if (x >= 0.24 && x <= 0.34 && y >= 0.38) return true;
      if (x >= 0.28 && x <= 0.30 && y >= 0.22 && y < 0.38) return true;
      // Bldg 3 (squat tower)
      if (x >= 0.36 && x <= 0.46 && y >= 0.60) return true;
      // Bldg 4 — Empire-State-ish: wide base + narrower mast + antenna
      if (x >= 0.48 && x <= 0.62 && y >= 0.42) return true;
      if (x >= 0.52 && x <= 0.58 && y >= 0.28 && y < 0.42) return true;
      if (x >= 0.54 && x <= 0.56 && y >= 0.18 && y < 0.28) return true;
      // Bldg 5
      if (x >= 0.64 && x <= 0.76 && y >= 0.50) return true;
      // Bldg 6
      if (x >= 0.78 && x <= 0.90 && y >= 0.46) return true;
      return false;
    }
    case 'crane': {
      // Tower crane silhouette on a 22×22 grid (cell ≈ 0.045 wide). Every
      // strip is widened to ≥ 0.09 so at least two cell centers land inside,
      // otherwise the feature falls between dots and disappears.
      const inMast = x >= 0.27 && x <= 0.37 && y >= 0.30 && y <= 0.86;
      const inJib = y >= 0.20 && y <= 0.28 && x >= 0.10 && x <= 0.90;
      const inCab = x >= 0.24 && x <= 0.40 && y >= 0.28 && y <= 0.36;
      const inHookLine = x >= 0.72 && x <= 0.80 && y >= 0.28 && y <= 0.54;
      const inHook = x >= 0.68 && x <= 0.84 && y >= 0.54 && y <= 0.60;
      const inBase = y >= 0.84 && y <= 0.92 && x >= 0.18 && x <= 0.46;
      return inMast || inJib || inCab || inHookLine || inHook || inBase;
    }
    case 'hardhat': {
      // Construction helmet: domed cap + brim. The dome is the top half of a
      // circle; the brim is a thin slab below it.
      const dx = x - 0.5;
      const dy = y - 0.58;
      const inDome = dx * dx + dy * dy < 0.30 * 0.30 && y < 0.58;
      const inBrim = y >= 0.58 && y <= 0.64 && x >= 0.16 && x <= 0.84;
      // Tiny center ridge (the cap seam) for skeuomorphic detail
      const inRidge = x >= 0.48 && x <= 0.52 && y >= 0.32 && y <= 0.42;
      return inDome || inBrim || inRidge;
    }
    case 'cone': {
      // Traffic cone: triangular body tapering up + flared base.
      if (y >= 0.20 && y <= 0.78) {
        const t = (y - 0.20) / (0.78 - 0.20); // 0 at apex, 1 at base
        const halfWidth = 0.08 + 0.22 * t;
        if (x >= 0.5 - halfWidth && x <= 0.5 + halfWidth) return true;
      }
      // Flared base
      if (y >= 0.78 && y <= 0.88 && x >= 0.18 && x <= 0.82) return true;
      return false;
    }
  }
}

interface DotMatrixMorphProps {
  className?: string;
  /** Tailwind text-color class — drives the dot fill via `currentColor`. */
  tone?: string;
}

export function DotMatrixMorph({ className = '', tone = 'text-white/30' }: DotMatrixMorphProps) {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  // Pre-compute grid positions and per-shape masks. Cells are constant; we
  // only animate scale + opacity per cell when the active shape changes.
  const { positions, masks } = useMemo(() => {
    const positions: Array<[number, number]> = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        positions.push([(gx + 0.5) / GRID, (gy + 0.5) / GRID]);
      }
    }
    const masks = SHAPES.map((s) =>
      positions.map(([x, y]) => isFilled(s, x, y)),
    );
    return { positions, masks };
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % SHAPES.length);
    }, MORPH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const mask = masks[idx];

  return (
    <svg
      aria-hidden="true"
      className={`${tone} ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      {positions.map((p, i) => {
        const filled = mask[i];
        // Slight wave-stagger: cells further from center animate last so the
        // morph reads as a radial pulse rather than every pixel flipping at
        // once. Cheap to compute; keeps the transition feeling organic.
        const cx = p[0];
        const cy = p[1];
        const dx = cx - 0.5;
        const dy = cy - 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delay = Math.round(dist * 320);
        return (
          <circle
            key={i}
            cx={cx * 100}
            cy={cy * 100}
            r={filled ? 1.55 : 0.55}
            fill="currentColor"
            opacity={filled ? 1 : 0.22}
            style={{
              transition: reduced
                ? 'none'
                : `r 520ms cubic-bezier(0.22, 0.9, 0.36, 1) ${delay}ms, opacity 520ms ease-out ${delay}ms`,
            }}
          />
        );
      })}
    </svg>
  );
}
