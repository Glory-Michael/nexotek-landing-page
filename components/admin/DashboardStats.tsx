'use client';

import React, { useEffect, useState } from 'react';

interface Stats {
  waitlistCount: number;
  pagesCount: number;
  mediaCount: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [waitlistRes, pagesRes, mediaRes] = await Promise.all([
          fetch('/api/waitlist?limit=0&depth=0'),
          fetch('/api/pages?limit=0&depth=0'),
          fetch('/api/media?limit=0&depth=0'),
        ]);

        const [waitlist, pages, media] = await Promise.all([
          waitlistRes.json(),
          pagesRes.json(),
          mediaRes.json(),
        ]);

        setStats({
          waitlistCount: waitlist.totalDocs ?? 0,
          pagesCount: pages.totalDocs ?? 0,
          mediaCount: media.totalDocs ?? 0,
        });
      } catch {
        // Silently fail — dashboard still usable
      }
    }

    fetchStats();
  }, []);

  if (!stats) return null;

  const cards = [
    { label: 'Waitlist Signups', value: stats.waitlistCount, href: '/admin/collections/waitlist' },
    { label: 'Pages', value: stats.pagesCount, href: '/admin/collections/pages' },
    { label: 'Media Files', value: stats.mediaCount, href: '/admin/collections/media' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '24px',
      }}
    >
      {cards.map((card) => (
        <a
          key={card.label}
          href={card.href}
          style={{
            display: 'block',
            padding: '20px 24px',
            borderRadius: '8px',
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-100)',
            textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--theme-elevation-300)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--theme-elevation-100)';
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--theme-text)',
              marginBottom: '4px',
            }}
          >
            {card.value}
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--theme-elevation-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {card.label}
          </div>
        </a>
      ))}
    </div>
  );
}
