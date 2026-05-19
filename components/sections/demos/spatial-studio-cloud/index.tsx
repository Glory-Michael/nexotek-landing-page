'use client';

import dynamic from 'next/dynamic';

// Lazy-load the R3F scene so SSR doesn't try to evaluate three.js. Same
// pattern as spatial-peek/index.tsx and splat-viewer-loader.tsx.
export const SpatialStudioCloud = dynamic(
  () => import('./scene').then((m) => m.SpatialStudioCloudScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center">
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/35">
          LOADING SCENE…
        </span>
      </div>
    ),
  },
);
