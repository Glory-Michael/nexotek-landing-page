'use client';

import React, { useEffect, useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnalyticsData {
  period: string;
  summary: { pageViews: number; visitors: number };
  timeseries: Array<{ key: string; total: number; devices: number }>;
  countries: Array<{ key: string; total: number; devices: number }>;
  browsers: Array<{ key: string; total: number; devices: number }>;
  os: Array<{ key: string; total: number; devices: number }>;
  devices: Array<{ key: string; total: number; devices: number }>;
  pages: Array<{ key: string; total: number; devices: number }>;
  referrers: Array<{ key: string; total: number; devices: number }>;
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
/*  Geo map with simplified world landmass paths                       */
/* ------------------------------------------------------------------ */

// Simplified continent SVG paths (Robinson-ish projection, viewBox 0 0 1000 500)
const CONTINENTS: Array<{ name: string; d: string }> = [
  // North America
  { name: 'NA', d: 'M65,95 L120,45 L170,38 L200,55 L245,42 L275,65 L280,85 L265,95 L270,110 L260,120 L248,118 L240,130 L225,142 L210,145 L195,155 L180,165 L168,162 L160,150 L155,135 L140,128 L130,120 L115,118 L100,108 L80,105 Z M175,170 L185,168 L195,175 L188,182 L178,178 Z' },
  // South America
  { name: 'SA', d: 'M210,195 L225,188 L240,192 L255,198 L268,210 L278,225 L282,245 L280,265 L275,280 L268,295 L258,310 L248,320 L238,328 L230,322 L228,308 L222,295 L218,280 L215,265 L212,248 L208,232 L205,218 L208,205 Z' },
  // Europe
  { name: 'EU', d: 'M440,55 L455,48 L470,50 L485,52 L498,58 L505,68 L510,80 L508,92 L500,100 L492,108 L482,112 L472,115 L460,118 L450,120 L442,115 L435,108 L430,98 L428,88 L432,78 L435,68 Z M445,120 L452,125 L448,132 L440,128 Z' },
  // Africa
  { name: 'AF', d: 'M440,135 L455,130 L470,132 L485,138 L498,148 L508,160 L515,175 L518,192 L515,210 L510,228 L502,245 L492,258 L480,268 L468,275 L455,278 L445,275 L435,268 L428,258 L422,245 L418,228 L420,210 L422,192 L428,175 L432,160 L435,148 Z' },
  // Asia
  { name: 'AS', d: 'M510,45 L540,38 L575,35 L610,38 L650,42 L685,50 L715,60 L740,72 L755,85 L760,100 L755,115 L745,128 L730,138 L712,145 L695,150 L675,152 L655,150 L638,145 L620,138 L605,130 L590,120 L575,112 L560,105 L548,98 L538,88 L528,78 L520,68 L515,55 Z M660,155 L675,158 L688,165 L695,175 L690,185 L680,188 L668,185 L660,175 L658,165 Z' },
  // Oceania
  { name: 'OC', d: 'M715,245 L738,238 L762,240 L782,248 L795,260 L798,275 L790,288 L775,298 L758,302 L740,300 L725,292 L715,280 L710,265 L712,252 Z M805,290 L815,288 L822,295 L818,305 L808,305 Z' },
];

// Country → approximate [x, y] on the 1000×500 map
const COORDS: Record<string, [number, number]> = {
  US: [195, 110], CA: [175, 70], MX: [165, 155], BR: [260, 260], AR: [240, 315],
  CO: [225, 200], PE: [220, 240], CL: [235, 305], VE: [240, 195],
  GB: [440, 72], FR: [450, 100], DE: [470, 82], ES: [435, 112], IT: [468, 105],
  NL: [458, 75], SE: [472, 52], NO: [462, 48], PL: [488, 80], CH: [460, 95],
  PT: [425, 112], IE: [430, 70], AT: [475, 92], BE: [452, 82], CZ: [478, 85],
  RU: [600, 60], UA: [510, 82], TR: [520, 108], FI: [490, 48],
  NG: [455, 195], ZA: [478, 270], EG: [498, 152], KE: [510, 215],
  GH: [440, 198], ET: [515, 198], MA: [425, 138], TZ: [508, 230],
  IN: [615, 148], CN: [660, 100], JP: [735, 102], KR: [710, 108],
  TW: [710, 135], HK: [698, 135],
  AE: [555, 148], SA: [535, 152], IL: [518, 128], PK: [590, 130],
  ID: [685, 195], TH: [668, 162], VN: [680, 155], PH: [715, 158],
  SG: [678, 192], MY: [675, 182], BD: [630, 140],
  AU: [755, 272], NZ: [815, 295],
};

function GeoMap({ countries }: { countries: Array<{ key: string; visitors?: number }> }) {
  const max = Math.max(...countries.map((c) => c.visitors ?? 0), 1);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '2/1', borderRadius: '8px', overflow: 'hidden', background: 'var(--theme-elevation-50)' }}>
      <svg viewBox="0 0 1000 500" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid lines */}
        {[100, 200, 300, 400].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="var(--theme-elevation-100)" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}
        {[200, 400, 600, 800].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="var(--theme-elevation-100)" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}

        {/* Continent landmasses */}
        {CONTINENTS.map((c) => (
          <path key={c.name} d={c.d} fill="var(--theme-elevation-150, rgba(128,128,128,0.12))" stroke="var(--theme-elevation-200, rgba(128,128,128,0.15))" strokeWidth="0.8" />
        ))}

        {/* Country markers */}
        {countries.map((c) => {
          const xy = COORDS[c.key];
          if (!xy) return null;
          const v = c.visitors ?? 0;
          const intensity = v / max;
          const r = Math.max(5, Math.sqrt(intensity) * 20);
          return (
            <g key={c.key}>
              {/* Glow ring */}
              <circle cx={xy[0]} cy={xy[1]} r={r * 2} fill="url(#glow)" opacity={0.3 + intensity * 0.4} />
              {/* Outer ring */}
              <circle cx={xy[0]} cy={xy[1]} r={r} fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity={0.4 + intensity * 0.3} />
              {/* Inner dot */}
              <circle cx={xy[0]} cy={xy[1]} r={Math.max(3, r * 0.45)} fill="#3b82f6" opacity={0.7 + intensity * 0.3} />
              {/* Label for significant entries */}
              {intensity > 0.3 && (
                <text
                  x={xy[0]}
                  y={xy[1] - r - 6}
                  textAnchor="middle"
                  style={{ fontSize: '11px', fontWeight: 600, fill: 'var(--theme-text)', opacity: 0.8 }}
                >
                  {c.key}
                </text>
              )}
              <title>{c.key}: {v} visitors</title>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: '8px', right: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
        <span style={{ fontSize: '10px', color: 'var(--theme-elevation-500)' }}>Visitors by country</span>
      </div>
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

function BounceGauge({ pages }: { pages: Array<{ total: number; devices: number }> }) {
  // Estimate bounce rate: single-page visitors / total page views
  const totalViews = pages.reduce((s, p) => s + p.total, 0);
  const totalVisitors = pages.reduce((s, p) => s + p.devices, 0);
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

  const countryMax = Math.max(...data.countries.map((c) => c.devices), 1);
  const browserMax = Math.max(...data.browsers.map((b) => b.devices), 1);
  const osMax = Math.max(...data.os.map((o) => o.devices), 1);

  // Build sparkline from timeseries data (date → visitors per day)
  const timeLabels = data.timeseries.map((t) => ({
    label: t.key?.slice(5) || '',  // "03-25" from "2026-03-25"
    value: t.devices,
  }));

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
          <GeoMap countries={data.countries.map((c) => ({ key: c.key, visitors: c.devices }))} />
        </div>
        <div style={card}>
          <div style={sectionTitle}>Top Countries</div>
          {data.countries.slice(0, 8).map((c) => (
            <BarRow
              key={c.key}
              label={c.key}
              prefix={`${countryFlag(c.key)} `}
              value={c.devices}
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
              value: d.devices,
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
            <BarRow key={b.key} label={b.key || 'Unknown'} value={b.devices} max={browserMax} color="#8b5cf6" />
          ))}
          {data.browsers.length === 0 && <div style={dimText}>No data yet</div>}
        </div>
        <div style={card}>
          <div style={sectionTitle}>Operating Systems</div>
          {data.os.slice(0, 6).map((o) => (
            <BarRow key={o.key} label={o.key || 'Unknown'} value={o.devices} max={osMax} color="#22c55e" />
          ))}
          {data.os.length === 0 && <div style={dimText}>No data yet</div>}
        </div>
      </div>

      {/* Row 6: Top pages + Referrers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={card}>
          <div style={sectionTitle}>Top Pages</div>
          {data.pages.slice(0, 6).map((p) => {
            const pageMax = Math.max(...data.pages.map((pp) => pp.total), 1);
            return <BarRow key={p.key} label={p.key || '/'} value={p.total} max={pageMax} color="#f59e0b" />;
          })}
          {data.pages.length === 0 && <div style={dimText}>No data yet</div>}
        </div>
        <div style={card}>
          <div style={sectionTitle}>Referrers</div>
          {data.referrers.slice(0, 6).map((r) => {
            const refMax = Math.max(...data.referrers.map((rr) => rr.devices), 1);
            return <BarRow key={r.key} label={r.key || 'Direct'} value={r.devices} max={refMax} color="#ec4899" />;
          })}
          {data.referrers.length === 0 && <div style={dimText}>No referrer data yet</div>}
        </div>
      </div>
    </div>
  );
}
