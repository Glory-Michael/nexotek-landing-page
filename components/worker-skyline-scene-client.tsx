'use client';

import dynamic from 'next/dynamic';

// Loaded with ssr:false so the Canvas never renders on the server —
// prevents hydration mismatches from WebGL and non-deterministic code.
export const WorkerSkylineScene = dynamic(
  () => import('./worker-skyline-scene').then(m => ({ default: m.WorkerSkylineScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full" style={{ minHeight: '300px', background: '#ffffff' }} />
    ),
  },
);
