'use client';

import React from 'react';

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span
        style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--theme-text)',
        }}
      >
        NexoTek
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 500,
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'var(--theme-elevation-100)',
          color: 'var(--theme-text)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        CMS
      </span>
    </div>
  );
}
