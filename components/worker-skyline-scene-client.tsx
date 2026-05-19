'use client';

import dynamic from 'next/dynamic';

// ssr:false — canvas references window/devicePixelRatio.
const AsciiSkyline = dynamic(
  () => import('./ascii-skyline').then(m => ({ default: m.AsciiSkyline })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white dark:bg-black" style={{ minHeight: '300px' }} />
    ),
  },
);

export function WorkerSkylineScene() {
  return <AsciiSkyline />;
}
