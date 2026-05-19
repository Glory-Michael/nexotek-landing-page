'use client';

import dynamic from 'next/dynamic';

const SplatViewerImpl = dynamic(
  () => import('./splat-viewer').then((m) => m.SplatViewer),
  {
    ssr: false,
    loading: () => <div className="aspect-[4/3] w-full bg-neutral-100" />,
  },
);

interface SplatViewerLoaderProps {
  splatUrl?: string;
  aspectRatio?: string;
  pointCount?: number;
  className?: string;
}

export function SplatViewerLoader(props: SplatViewerLoaderProps) {
  return <SplatViewerImpl {...props} />;
}
