'use client';

import React, { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Stats {
  waitlistCount: number;
  pagesCount: number;
  mediaCount: number;
}

interface VisitorStats {
  summary: { pageViews: number; visitors: number };
  period: string;
}

interface StatusBreakdown {
  subscribed: number;
  contacted: number;
  unsubscribed: number;
}

interface EmailHealth {
  sent: number;
  failed: number;
}

interface WaitlistEntry {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

interface EmailEntry {
  id: string;
  to: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface DayBucket {
  label: string;
  count: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function bucketByDay(entries: WaitlistEntry[], days: number): DayBucket[] {
  const buckets: DayBucket[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    buckets.push({ label, count: 0 });
    for (const e of entries) {
      if (e.createdAt.slice(0, 10) === key) {
        buckets[buckets.length - 1].count++;
      }
    }
  }
  return buckets;
}

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const cardStyle: React.CSSProperties = {
  padding: '20px 24px',
  borderRadius: '8px',
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-100)',
  transition: 'border-color 0.15s',
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--theme-elevation-500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const bigNumberStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  color: 'var(--theme-text)',
  marginBottom: '4px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--theme-text)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '12px',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [breakdown, setBreakdown] = useState<StatusBreakdown | null>(null);
  const [emailHealth, setEmailHealth] = useState<EmailHealth | null>(null);
  const [recentSignups, setRecentSignups] = useState<WaitlistEntry[] | null>(null);
  const [recentEmails, setRecentEmails] = useState<EmailEntry[] | null>(null);
  const [sparkline, setSparkline] = useState<DayBucket[] | null>(null);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          waitlistRes,
          pagesRes,
          mediaRes,
          subscribedRes,
          contactedRes,
          unsubscribedRes,
          emailSentRes,
          emailFailedRes,
          recentSignupsRes,
          recentEmailsRes,
          sparklineRes,
        ] = await Promise.all([
          // Counts
          fetch('/api/waitlist?limit=0&depth=0'),
          fetch('/api/pages?limit=0&depth=0'),
          fetch('/api/media?limit=0&depth=0'),
          // Status breakdown
          fetch('/api/waitlist?limit=0&depth=0&where[status][equals]=subscribed'),
          fetch('/api/waitlist?limit=0&depth=0&where[status][equals]=contacted'),
          fetch('/api/waitlist?limit=0&depth=0&where[status][equals]=unsubscribed'),
          // Email health
          fetch('/api/email-log?limit=0&depth=0&where[status][equals]=sent'),
          fetch('/api/email-log?limit=0&depth=0&where[status][equals]=failed'),
          // Recent lists
          fetch('/api/waitlist?limit=5&depth=0&sort=-createdAt'),
          fetch('/api/email-log?limit=5&depth=0&sort=-createdAt'),
          // Sparkline: last 7 days of signups
          fetch(
            `/api/waitlist?limit=500&depth=0&sort=-createdAt&where[createdAt][greater_than]=${new Date(Date.now() - 7 * 86400000).toISOString()}`,
          ),
        ]);

        const [
          waitlist,
          pages,
          media,
          subscribed,
          contacted,
          unsubscribed,
          emailSent,
          emailFailed,
          signups,
          emails,
          sparklineData,
        ] = await Promise.all([
          waitlistRes.json(),
          pagesRes.json(),
          mediaRes.json(),
          subscribedRes.json(),
          contactedRes.json(),
          unsubscribedRes.json(),
          emailSentRes.json(),
          emailFailedRes.json(),
          recentSignupsRes.json(),
          recentEmailsRes.json(),
          sparklineRes.json(),
        ]);

        setStats({
          waitlistCount: waitlist.totalDocs ?? 0,
          pagesCount: pages.totalDocs ?? 0,
          mediaCount: media.totalDocs ?? 0,
        });

        setBreakdown({
          subscribed: subscribed.totalDocs ?? 0,
          contacted: contacted.totalDocs ?? 0,
          unsubscribed: unsubscribed.totalDocs ?? 0,
        });

        setEmailHealth({
          sent: emailSent.totalDocs ?? 0,
          failed: emailFailed.totalDocs ?? 0,
        });

        setRecentSignups(signups.docs ?? []);
        setRecentEmails(emails.docs ?? []);
        setSparkline(bucketByDay(sparklineData.docs ?? [], 7));

        // Fetch visitor analytics (separate try — may not be configured)
        try {
          const analyticsRes = await fetch('/api/analytics');
          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json();
            setVisitorStats(analyticsData);
          }
        } catch {
          // Analytics not configured — skip
        }
      } catch {
        // Silently fail — dashboard still usable
      }
    }

    fetchAll();
  }, []);

  if (!stats) return null;

  const totalEmails = (emailHealth?.sent ?? 0) + (emailHealth?.failed ?? 0);
  const failRate = totalEmails > 0 ? ((emailHealth?.failed ?? 0) / totalEmails) * 100 : 0;
  const maxSparkline = sparkline ? Math.max(...sparkline.map((b) => b.count), 1) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
      {/* ── Row 1: Overview cards ──────────────────────────────── */}
      <div>
        <div style={sectionTitleStyle}>Overview</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {[
            { label: 'Waitlist Signups', value: stats.waitlistCount, href: '/admin/collections/waitlist' },
            { label: 'Pages', value: stats.pagesCount, href: '/admin/collections/pages' },
            { label: 'Media Files', value: stats.mediaCount, href: '/admin/collections/media' },
            ...(visitorStats
              ? [
                  { label: 'Visitors (7d)', value: visitorStats.summary.visitors, href: '' },
                  { label: 'Page Views (7d)', value: visitorStats.summary.pageViews, href: '' },
                ]
              : []),
          ].map((card) => {
            const Tag = card.href ? 'a' : 'div';
            return (
              <Tag
                key={card.label}
                {...(card.href ? { href: card.href } : {})}
                style={{ ...cardStyle, display: 'block', textDecoration: 'none' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--theme-elevation-300)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--theme-elevation-100)';
                }}
              >
                <div style={bigNumberStyle}>{card.value}</div>
                <div style={cardLabelStyle}>{card.label}</div>
              </Tag>
            );
          })}
        </div>
      </div>

      {/* ── Row 2: Waitlist breakdown + Email health ──────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Waitlist Status Breakdown */}
        {breakdown && (
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Waitlist Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {([
                { label: 'Subscribed', value: breakdown.subscribed, color: '#22c55e' },
                { label: 'Contacted', value: breakdown.contacted, color: '#3b82f6' },
                { label: 'Unsubscribed', value: breakdown.unsubscribed, color: '#a1a1aa' },
              ] as const).map((row) => {
                const total = breakdown.subscribed + breakdown.contacted + breakdown.unsubscribed;
                const pct = total > 0 ? (row.value / total) * 100 : 0;
                return (
                  <div key={row.label}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: 'var(--theme-text)' }}>{row.label}</span>
                      <span style={{ color: 'var(--theme-elevation-500)', fontVariantNumeric: 'tabular-nums' }}>
                        {row.value}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: 'var(--theme-elevation-100)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: '3px',
                          background: row.color,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Email Health */}
        {emailHealth && (
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Email Health</div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              <div>
                <div style={{ ...bigNumberStyle, fontSize: '28px' }}>{emailHealth.sent}</div>
                <div style={cardLabelStyle}>Sent</div>
              </div>
              <div>
                <div
                  style={{
                    ...bigNumberStyle,
                    fontSize: '28px',
                    color: emailHealth.failed > 0 ? '#ef4444' : 'var(--theme-text)',
                  }}
                >
                  {emailHealth.failed}
                </div>
                <div style={cardLabelStyle}>Failed</div>
              </div>
            </div>
            {totalEmails > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: 'var(--theme-elevation-500)',
                    marginBottom: '4px',
                  }}
                >
                  <span>Delivery rate</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {(100 - failRate).toFixed(1)}%
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: 'var(--theme-elevation-100)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${100 - failRate}%`,
                      borderRadius: '3px',
                      background: failRate > 10 ? '#f59e0b' : '#22c55e',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Row 3: Signups sparkline ─────────────────────────── */}
      {sparkline && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Signups — Last 7 Days</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              height: '100px',
            }}
          >
            {sparkline.map((bucket, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {bucket.count > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--theme-elevation-500)',
                    }}
                  >
                    {bucket.count}
                  </span>
                )}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '48px',
                    minHeight: bucket.count > 0 ? '8px' : '2px',
                    height: `${(bucket.count / maxSparkline) * 72}px`,
                    borderRadius: '4px 4px 2px 2px',
                    background: bucket.count > 0 ? '#3b82f6' : 'var(--theme-elevation-100)',
                    transition: 'height 0.3s ease',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--theme-elevation-500)',
                  }}
                >
                  {bucket.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 4: Recent signups + Recent emails ────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Recent Signups */}
        {recentSignups && recentSignups.length > 0 && (
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={sectionTitleStyle}>Recent Signups</div>
              <a
                href="/admin/collections/waitlist"
                style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textDecoration: 'none' }}
              >
                View all →
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {recentSignups.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderTop: i > 0 ? '1px solid var(--theme-elevation-100)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--theme-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.email}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background:
                          entry.status === 'subscribed'
                            ? 'rgba(34,197,94,0.15)'
                            : entry.status === 'contacted'
                              ? 'rgba(59,130,246,0.15)'
                              : 'rgba(161,161,170,0.15)',
                        color:
                          entry.status === 'subscribed'
                            ? '#22c55e'
                            : entry.status === 'contacted'
                              ? '#3b82f6'
                              : '#a1a1aa',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--theme-elevation-500)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  >
                    {timeAgo(entry.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Emails */}
        {recentEmails && recentEmails.length > 0 && (
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={sectionTitleStyle}>Recent Emails</div>
              <a
                href="/admin/collections/email-log"
                style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', textDecoration: 'none' }}
              >
                View all →
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {recentEmails.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderTop: i > 0 ? '1px solid var(--theme-elevation-100)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'var(--theme-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.to}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--theme-elevation-500)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.subject}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: entry.status === 'sent' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: entry.status === 'sent' ? '#22c55e' : '#ef4444',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.status}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--theme-elevation-500)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
