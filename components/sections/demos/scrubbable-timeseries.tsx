'use client';

import { useMemo, useRef, useState } from 'react';

interface ScrubbableTimeseriesProps {
  /** Number of buckets (≈24 for hours, 60 for minutes). */
  points?: number;
  /** Optional pre-baked series; if absent, a deterministic synthetic series is generated. */
  series?: number[];
  /** Label suffix (e.g. "events / hr"). */
  unit?: string;
  className?: string;
  /** X-axis title rendered below the chart. */
  xTitle?: string;
  /** Y-axis title rendered rotated on the left. */
  yTitle?: string;
}

const WIDTH = 520;
const HEIGHT = 200;
const PAD_LEFT = 56;
const PAD_RIGHT = 18;
const PAD_TOP = 18;
const PAD_BOTTOM = 44;

function pseudoSeries(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const base = 60 + 50 * Math.sin((i / n) * Math.PI * 2);
    const noise = ((i * 137) % 17) - 8;
    out.push(Math.max(0, Math.round(base + noise)));
  }
  return out;
}

export function ScrubbableTimeseries({
  points = 24,
  series,
  unit = 'events / hr',
  className = '',
  xTitle = 'HOUR (UTC)',
  yTitle = 'EVENTS / HR',
}: ScrubbableTimeseriesProps) {
  const data = useMemo(() => series ?? pseudoSeries(points), [series, points]);
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);

  const max = Math.max(...data, 1);
  // Round max up to a clean 20-multiple so Y-axis labels are tidy whole numbers.
  const yMax = Math.max(20, Math.ceil(max / 20) * 20);
  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const pts = data.map((v, i) => {
    const x = PAD_LEFT + (i / Math.max(1, data.length - 1)) * innerW;
    const y = PAD_TOP + (1 - v / yMax) * innerH;
    return { x, y, v, i };
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    p,
    value: Math.round(yMax * p),
    y: PAD_TOP + (1 - p) * innerH,
  }));

  const hourTickIndices = [0, 6, 12, 18, data.length - 1];
  const xTicks = hourTickIndices
    .filter((i, idx, arr) => i >= 0 && i < data.length && arr.indexOf(i) === idx)
    .map((i) => ({
      i,
      x: PAD_LEFT + (i / Math.max(1, data.length - 1)) * innerW,
      label: `${String(i).padStart(2, '0')}:00`,
    }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const baseY = HEIGHT - PAD_BOTTOM;
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY} L ${pts[0].x.toFixed(1)} ${baseY} Z`;

  const peakIdx = pts.reduce((best, p, i) => (p.v > pts[best].v ? i : best), 0);
  const peak = pts[peakIdx];

  const total = data.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / data.length);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relX - PAD_LEFT) / innerW;
    const idx = Math.round(ratio * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setHover(clamped);
  };
  const onLeave = () => setHover(null);

  const active = hover !== null ? pts[hover] : null;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400">
        <span>EVENTS · LAST 24 H</span>
        <span className="flex items-baseline gap-3">
          <span>
            TOTAL <span className="tabular-nums text-white">{total.toLocaleString()}</span>
          </span>
          <span className="opacity-40">·</span>
          <span>
            AVG <span className="tabular-nums text-white">{avg}</span>/HR
          </span>
          <span className="opacity-40">·</span>
          <span>
            PEAK <span className="tabular-nums text-white">{peak.v}</span>
          </span>
        </span>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-48 w-full cursor-crosshair"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        role="img"
        aria-label={`Events over the last ${data.length} hours, peak ${peak.v} ${unit}`}
      >
        {yTicks.map((t) => (
          <g key={`y-${t.p}`}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={t.y}
              y2={t.y}
              stroke="currentColor"
              strokeOpacity={t.p === 0 ? 0.35 : 0.1}
              strokeWidth="1"
            />
            <text
              x={PAD_LEFT - 8}
              y={t.y + 3}
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="end"
              fill="currentColor"
              opacity="0.55"
            >
              {t.value}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x-${t.i}`}>
            <line
              x1={t.x}
              x2={t.x}
              y1={baseY}
              y2={baseY + 4}
              stroke="currentColor"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <text
              x={t.x}
              y={baseY + 15}
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
              fill="currentColor"
              opacity="0.55"
            >
              {t.label}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="currentColor" fillOpacity="0.08" />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.25" />
        <g>
          <line
            x1={peak.x}
            x2={peak.x}
            y1={peak.y - 6}
            y2={peak.y - 14}
            stroke="currentColor"
            strokeOpacity="0.5"
          />
          <text
            x={peak.x}
            y={peak.y - 17}
            fontSize="8.5"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
            fill="currentColor"
            opacity="0.85"
          >
            PEAK · {peak.v}
          </text>
          <circle cx={peak.x} cy={peak.y} r="2.6" fill="currentColor" />
        </g>
        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD_TOP}
              y2={baseY}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <circle cx={active.x} cy={active.y} r="3" fill="currentColor" />
          </>
        )}
        <text
          transform={`translate(14, ${PAD_TOP + innerH / 2}) rotate(-90)`}
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
          letterSpacing="0.2em"
          fill="currentColor"
          opacity="0.6"
        >
          {yTitle}
        </text>
        <text
          x={PAD_LEFT + innerW / 2}
          y={HEIGHT - 6}
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
          letterSpacing="0.2em"
          fill="currentColor"
          opacity="0.6"
        >
          {xTitle}
        </text>
      </svg>
      {active && (
        <div className="pointer-events-none absolute right-2 top-7 border border-white/40 bg-black/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm">
          {String(active.i).padStart(2, '0')}:00 · <span className="text-white">{active.v}</span> {unit}
        </div>
      )}
    </div>
  );
}
