'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';

export function LivePreviewListener() {
  const router = useRouter();

  return (
    <RefreshRouteOnSave
      serverURL={process.env.NEXT_PUBLIC_APP_URL || ''}
      refresh={() => router.refresh()}
    />
  );
}
