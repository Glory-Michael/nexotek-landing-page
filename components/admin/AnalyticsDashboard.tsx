'use client';

import React, { useEffect, useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnalyticsData {
  period: string;
  summary: { pageViews: number; visitors: number };
  timeseries: Array<{ key: string; pageViews?: number; visitors?: number }>;
  countries: Array<{ key: string; pageViews?: number; visitors?: number }>;
  browsers: Array<{ key: string; pageViews?: number; visitors?: number }>;
  os: Array<{ key: string; pageViews?: number; visitors?: number }>;
  devices: Array<{ key: string; pageViews?: number; visitors?: number }>;
  pages: Array<{ key: string; pageViews?: number; visitors?: number }>;
  referrers: Array<{ key: string; pageViews?: number; visitors?: number }>;
}

type Period = '24h' | '7d' | '30d';

/* ------------------------------------------------------------------ */
/*  Country flag helper                                                */
/* ------------------------------------------------------------------ */

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + code.charCodeAt(0) - 65,
    base + code.charCodeAt(1) - 65,
  );
}

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const card: React.CSSProperties = {
  padding: '20px 24px',
  borderRadius: '8px',
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-100)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--theme-text)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '16px',
};

const bigNum: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  color: 'var(--theme-text)',
  fontVariantNumeric: 'tabular-nums',
};

const dimText: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--theme-elevation-500)',
};

const pillActive: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  background: 'var(--theme-text)',
  color: 'var(--theme-bg)',
};

const pillInactive: React.CSSProperties = {
  ...pillActive,
  background: 'var(--theme-elevation-100)',
  color: 'var(--theme-elevation-500)',
  fontWeight: 500,
};

/* ------------------------------------------------------------------ */
/*  Bar chart row                                                      */
/* ------------------------------------------------------------------ */

function BarRow({
  label,
  value,
  max,
  color = '#3b82f6',
  prefix,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  prefix?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--theme-text)' }}>
          {prefix}{label}
        </span>
        <span style={{ color: 'var(--theme-elevation-500)', fontVariantNumeric: 'tabular-nums' }}>
          {value.toLocaleString()}
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--theme-elevation-100)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '3px', background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkline chart (visitors over time)                               */
/* ------------------------------------------------------------------ */

function SparklineChart({ data, color = '#3b82f6' }: { data: Array<{ label: string; value: number }>; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const h = 120;
  const w = data.length > 1 ? 100 : 0;

  if (data.length === 0) return <div style={dimText}>No data</div>;

  // Build SVG polyline
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (d.value / max) * (h - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px` }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#sparkFill)" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={dimText}>{data[0]?.label}</span>
        <span style={dimText}>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Donut chart                                                        */
/* ------------------------------------------------------------------ */

function DonutChart({ segments, size = 120 }: { segments: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={dimText}>No data</div>;

  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  let startAngle = -90;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg) => {
          const angle = (seg.value / total) * 360;
          const endAngle = startAngle + angle;
          const largeArc = angle > 180 ? 1 : 0;
          const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
          const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
          const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
          const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          startAngle = endAngle;
          return <path key={seg.label} d={d} fill={seg.color} />;
        })}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--theme-elevation-50)" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '16px', fontWeight: 700, fill: 'var(--theme-text)' }}>
          {total.toLocaleString()}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: seg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--theme-text)' }}>{seg.label}</span>
            <span style={{ color: 'var(--theme-elevation-500)', fontVariantNumeric: 'tabular-nums' }}>
              {((seg.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Geo map (simple proportional dots on world regions)                */
/* ------------------------------------------------------------------ */

const REGION_COORDS: Record<string, [number, number]> = {
  US: [200, 140], CA: [180, 100], MX: [170, 170], BR: [280, 240], AR: [260, 290],
  GB: [410, 100], FR: [420, 120], DE: [440, 105], ES: [400, 135], IT: [445, 130],
  NL: [425, 95], SE: [445, 70], NO: [435, 60], PL: [460, 100], RU: [530, 80],
  IN: [570, 170], CN: [620, 130], JP: [670, 130], KR: [650, 130], AU: [660, 280],
  NG: [430, 195], ZA: [460, 275], EG: [470, 160], KE: [480, 210],
  AE: [510, 165], SA: [490, 165], TR: [475, 125], IL: [475, 145],
  ID: [640, 210], TH: [620, 180], VN: [625, 175], PH: [655, 185],
  SG: [630, 205], NZ: [700, 290], CL: [240, 290], CO: [230, 195],
  PE: [230, 225],
};

function GeoMap({ countries }: { countries: Array<{ key: string; visitors?: number }> }) {
  const max = Math.max(...countries.map((c) => c.visitors ?? 0), 1);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '2.2/1', background: 'var(--theme-elevation-100)', borderRadius: '8px', overflow: 'hidden' }}>
      <svg viewBox="0 0 800 350" style={{ width: '100%', height: '100%' }}>
        {/* Simplified continent outlines */}
        <ellipse cx="210" cy="160" rx="120" ry="90" fill="var(--theme-elevation-150, rgba(128,128,128,0.08))" />
        <ellipse cx="440" cy="140" rx="80" ry="80" fill="var(--theme-elevation-150, rgba(128,128,128,0.08))" />
        <ellipse cx="540" cy="80" rx="100" ry="50" fill="var(--theme-elevation-150, rgba(128,128,128,0.08))" />
        <ellipse cx="580" cy="180" rx="70" ry="50" fill="var(--theme-elevation-150, rgba(128,128,128,0.08))" />
        <ellipse cx="460" cy="220" rx="50" ry="60" fill="var(--theme-elevation-150, rgba(128,128,128,0.08))" />
        <ellipse cx="660" cy="270" rx="40" ry="30" fill="var(--theme-elevation-150, rgba(128,128,128,0.08))" />
        <ellipse cx="650" cy="190" rx="50" ry="30" fill="var(--theme-elevation-150, rgba(128,128,128,0.08))" />

        {countries.map((c) => {
          const coords = REGION_COORDS[c.key];
          if (!coords) return null;
          const visitors = c.visitors ?? 0;
          const r = Math.max(4, Math.sqrt(visitors / max) * 18);
          return (
            <g key={c.key}>
              <circle cx={coords[0]} cy={coords[1]} r={r + 4} fill="#3b82f6" opacity="0.12" />
              <circle cx={coords[0]} cy={coords[1]} r={r} fill="#3b82f6" opacity="0.7" />
              <title>{c.key}: {visitors} visitors</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live pulse indicator                                               */
/* ------------------------------------------------------------------ */

function LivePulse({ recentVisitors }: { recentVisitors: number }) {
  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: recentVisitors > 0 ? '#22c55e' : '#a1a1aa',
            opacity: 0.2,
            animation: recentVisitors > 0 ? 'livePulse 2s ease-in-out infinite' : 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '12px',
            borderRadius: '50%',
            background: recentVisitors > 0 ? '#22c55e' : '#a1a1aa',
          }}
        />
      </div>
      <div>
        <div style={{ ...bigNum, fontSize: '28px' }}>{recentVisitors}</div>
        <div style={dimText}>{recentVisitors > 0 ? 'Recent visitors (24h)' : 'No recent visitors'}</div>
      </div>
      <style>{`
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.4); opacity: 0.05; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bounce rate gauge                                                  */
/* ------------------------------------------------------------------ */

function BounceGauge({ pages }: { pages: Array<{ pageViews?: number; visitors?: number }> }) {
  // Estimate bounce rate: single-page visitors / total visitors
  const totalViews = pages.reduce((s, p) => s + (p.pageViews ?? 0), 0);
  const totalVisitors = pages.reduce((s, p) => s + (p.visitors ?? 0), 0);
  const bounceRate = totalVisitors > 0 ? Math.max(0, Math.min(100, ((totalVisitors / Math.max(totalViews, 1)) * 100))) : 0;
  const angle = (bounceRate / 100) * 180;

  return (
    <div style={{ ...card }}>
      <div style={sectionTitle}>Bounce Rate (est.)</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg viewBox="0 0 120 70" style={{ width: '160px', height: '90px' }}>
          <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="var(--theme-elevation-100)" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            fill="none"
            stroke={bounceRate < 40 ? '#22c55e' : bounceRate < 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 157} 157`}
          />
          <text x="60" y="58" textAnchor="middle" style={{ fontSize: '18px', fontWeight: 700, fill: 'var(--theme-text)' }}>
            {bounceRate.toFixed(0)}%
          </text>
        </svg>
        <div style={{ ...dimText, marginTop: '4px' }}>
          {bounceRate < 40 ? 'Excellent' : bounceRate < 60 ? 'Average' : 'High'}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const DEVICE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [liveData, setLiveData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const [mainRes, liveRes] = await Promise.all([
        fetch(`/api/analytics?period=${p}`),
        fetch('/api/analytics?period=24h'),
      ]);
      if (mainRes.ok) setData(await mainRes.json());
      if (liveRes.ok) setLiveData(await liveRes.json());
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  if (loading && !data) {
    return (
      <div style={{ ...card, marginTop: '32px', textAlign: 'center', padding: '40px' }}>
        <div style={dimText}>Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ ...card, marginTop: '32px', textAlign: 'center', padding: '40px' }}>
        <div style={{ ...sectionTitle, marginBottom: '8px' }}>Analytics</div>
        <div style={dimText}>
          Configure VERCEL_API_TOKEN in your environment to enable visitor analytics.
        </div>
      </div>
    );
  }

  const countryMax = Math.max(...data.countries.map((c) => c.visitors ?? c.pageViews ?? 0), 1);
  const browserMax = Math.max(...data.browsers.map((b) => b.visitors ?? b.pageViews ?? 0), 1);
  const osMax = Math.max(...data.os.map((o) => o.visitors ?? o.pageViews ?? 0), 1);

  // Build time-series from page data for sparkline
  const timeLabels = data.timeseries.length > 0
    ? data.timeseries.map((t) => ({ label: t.key?.slice(5, 10) || '', value: t.visitors ?? t.pageViews ?? 0 }))
    : data.pages.map((p) => ({ label: p.key || '/', value: p.visitors ?? 0 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
      {/* Header with period selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...sectionTitle, marginBottom: 0, fontSize: '16px' }}>Site Analytics</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['24h', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={period === p ? pillActive : pillInactive}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Summary + Live pulse */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={card}>
          <div style={bigNum}>{data.summary.visitors.toLocaleString()}</div>
          <div style={dimText}>Unique Visitors</div>
        </div>
        <div style={card}>
          <div style={bigNum}>{data.summary.pageViews.toLocaleString()}</div>
          <div style={dimText}>Page Views</div>
        </div>
        <LivePulse recentVisitors={liveData?.summary.visitors ?? 0} />
      </div>

      {/* Row 2: Visitors over time */}
      <div style={card}>
        <div style={sectionTitle}>Visitors Over Time</div>
        <SparklineChart data={timeLabels} />
      </div>

      {/* Row 3: Geo heatmap + Top countries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={card}>
          <div style={sectionTitle}>Visitor Map</div>
          <GeoMap countries={data.countries} />
        </div>
        <div style={card}>
          <div style={sectionTitle}>Top Countries</div>
          {data.countries.slice(0, 8).map((c) => (
            <BarRow
              key={c.key}
              label={c.key}
              prefix={`${countryFlag(c.key)} `}
              value={c.visitors ?? c.pageViews ?? 0}
              max={countryMax}
              color="#3b82f6"
            />
          ))}
          {data.countries.length === 0 && <div style={dimText}>No data yet</div>}
        </div>
      </div>

      {/* Row 4: Devices donut + Bounce rate gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div style={card}>
          <div style={sectionTitle}>Devices</div>
          <DonutChart
            segments={data.devices.map((d, i) => ({
              label: d.key || 'Unknown',
              value: d.visitors ?? d.pageViews ?? 0,
              color: DEVICE_COLORS[i % DEVICE_COLORS.length],
            }))}
          />
        </div>
        <BounceGauge pages={data.pages} />
      </div>

      {/* Row 5: Browsers + OS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={card}>
          <div style={sectionTitle}>Browsers</div>
          {data.browsers.slice(0, 6).map((b) => (
            <BarRow key={b.key} label={b.key || 'Unknown'} value={b.visitors ?? b.pageViews ?? 0} max={browserMax} color="#8b5cf6" />
          ))}
          {data.browsers.length === 0 && <div style={dimText}>No data yet</div>}
        </div>
        <div style={card}>
          <div style={sectionTitle}>Operating Systems</div>
          {data.os.slice(0, 6).map((o) => (
            <BarRow key={o.key} label={o.key || 'Unknown'} value={o.visitors ?? o.pageViews ?? 0} max={osMax} color="#22c55e" />
          ))}
          {data.os.length === 0 && <div style={dimText}>No data yet</div>}
        </div>
      </div>

      {/* Row 6: Top pages + Referrers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={card}>
          <div style={sectionTitle}>Top Pages</div>
          {data.pages.slice(0, 6).map((p) => {
            const pageMax = Math.max(...data.pages.map((pp) => pp.pageViews ?? 0), 1);
            return <BarRow key={p.key} label={p.key || '/'} value={p.pageViews ?? 0} max={pageMax} color="#f59e0b" />;
          })}
          {data.pages.length === 0 && <div style={dimText}>No data yet</div>}
        </div>
        <div style={card}>
          <div style={sectionTitle}>Referrers</div>
          {data.referrers.slice(0, 6).map((r) => {
            const refMax = Math.max(...data.referrers.map((rr) => rr.visitors ?? rr.pageViews ?? 0), 1);
            return <BarRow key={r.key} label={r.key || 'Direct'} value={r.visitors ?? r.pageViews ?? 0} max={refMax} color="#ec4899" />;
          })}
          {data.referrers.length === 0 && <div style={dimText}>No referrer data yet</div>}
        </div>
      </div>
    </div>
  );
}
