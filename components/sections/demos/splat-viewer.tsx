'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const read = () => setIsDark(html.classList.contains('dark'));
    read();
    const obs = new MutationObserver(read);
    obs.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

const OrbitControls = dynamic(
  () => import('@react-three/drei').then((m) => m.OrbitControls),
  { ssr: false },
);

interface SplatViewerProps {
  /** Optional URL to a future real .splat/.ply file. Currently used only as a stable seed. */
  splatUrl?: string;
  className?: string;
  aspectRatio?: string;
  pointCount?: number;
}

/**
 * Synthetic Gaussian-splat-style point cloud. Orbit-able, brand-correct.
 * Real splat decoding will swap in here when partner-site capture data lands.
 */
export function SplatViewer({
  splatUrl,
  className = '',
  aspectRatio = '4 / 3',
  pointCount = 4500,
}: SplatViewerProps) {
  const isDark = useIsDark();
  const canvasBg = isDark ? '#000000' : '#FFFFFF';
  return (
    <div
      className={`relative w-full overflow-hidden border border-black/45 bg-white dark:border-white/30 dark:bg-black ${className}`}
      style={{ aspectRatio }}
    >
      <Canvas
        camera={{ position: [4, 3, 6], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: canvasBg }}
      >
        <color attach="background" args={[canvasBg]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <SitePointCloud
            pointCount={pointCount}
            seed={hashString(splatUrl ?? 'placeholder')}
            isDark={isDark}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={3}
          maxDistance={14}
          autoRotate
          autoRotateSpeed={0.6}
          dampingFactor={0.08}
        />
      </Canvas>
      <span className="pointer-events-none absolute left-3 top-3 border border-black/65 bg-white/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-black backdrop-blur-sm dark:border-white/40 dark:bg-black/65 dark:text-white">
        INTERACTIVE PREVIEW
      </span>
      <span className="pointer-events-none absolute right-3 bottom-3 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
        <span className="hidden md:inline">DRAG TO ORBIT · SCROLL TO ZOOM</span>
        <span className="md:hidden">DRAG TO ORBIT · PINCH TO ZOOM</span>
      </span>
    </div>
  );
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

interface CloudProps {
  pointCount: number;
  seed: number;
  isDark: boolean;
}

function SitePointCloud({ pointCount, seed, isDark }: CloudProps) {
  const ref = useRef<THREE.Points | null>(null);

  const { positions, colors } = useMemo(() => {
    const rand = seededRandom(seed);
    const pos = new Float32Array(pointCount * 3);
    const col = new Float32Array(pointCount * 3);

    // Light mode dots run deep black with only a hint of depth (0.0–0.18 range);
    // dark mode dots run near-white (0.65–1.0). Bias is asymmetric on purpose:
    // black-on-white loses contrast at any gray, but white-on-black tolerates a
    // wider luminance band before reading as gray.
    const band = (rangeLight: [number, number], rangeDark: [number, number]) => {
      const [lo, hi] = isDark ? rangeDark : rangeLight;
      return lo + rand() * (hi - lo);
    };

    // Mostly ground + a scaffolded structure rising in the middle.
    for (let i = 0; i < pointCount; i++) {
      const r = rand();
      const x = (rand() - 0.5) * 8;
      const z = (rand() - 0.5) * 8;
      let y: number;
      let shade: number;
      if (r < 0.35) {
        // ground plane — mid-density band
        y = (rand() - 0.5) * 0.06;
        shade = band([0.02, 0.12], [0.72, 0.88]);
      } else if (r < 0.75) {
        // scaffold lattice — vertical bands, deepest contrast
        const lane = Math.floor(rand() * 3);
        const cx = (lane - 1) * 1.8;
        const cz = ((Math.floor(rand() * 3)) - 1) * 1.8;
        const jitter = (rand() - 0.5) * 0.18;
        pos[i * 3] = cx + jitter;
        y = rand() * 3.4;
        pos[i * 3 + 2] = cz + (rand() - 0.5) * 0.18;
        shade = band([0.0, 0.05], [0.88, 1.0]);
        col[i * 3] = shade;
        col[i * 3 + 1] = shade;
        col[i * 3 + 2] = shade;
        pos[i * 3 + 1] = y;
        continue;
      } else {
        // sparse ambient cloud — lightest density band
        y = rand() * 4;
        shade = band([0.06, 0.18], [0.65, 0.82]);
      }
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      col[i * 3] = shade;
      col[i * 3 + 1] = shade;
      col[i * 3 + 2] = shade;
    }

    return { positions: pos, colors: col };
  }, [pointCount, seed, isDark]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <points ref={ref} key={isDark ? 'dark' : 'light'}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          itemSize={3}
          count={positions.length / 3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          itemSize={3}
          count={colors.length / 3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial vertexColors size={0.075} sizeAttenuation transparent={false} opacity={1} />
    </points>
  );
}
