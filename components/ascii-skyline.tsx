'use client';

import { useEffect, useRef } from 'react';
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';
import landTopo from 'world-atlas/land-110m.json';
import {
  GLYPHS,
  G_STAR,
  projectConstruction,
} from './ascii-construction';

interface AsciiSkylineProps {
  showDotCursor?: boolean;
}

// Tight cell grid so adjacent dots always overlap into a solid mass —
// the halftone paint primitive stamps every 3px horizontally / 4px
// vertically, with each dot's radius driven by the cell's alpha.
const FONT_PX = 16;
const CELL_W = 3;
const CELL_H = 4;

// Halftone dot — replaces text-glyph stamping in every foreground pass
// (globe / crane / morph / formation / cursor ripple). `alpha` 0..1
// modulates radius: high alpha → fat dot that nearly touches its
// neighbours, low alpha → small dot with paper showing through,
// building a halftone gradient. The MAX is held below the cell-half-
// diagonal (2.5 for a 3×4 grid) so dots never fully merge into solid
// black, keeping the print-style stipple readable instead of muddy.
const DOT_MIN_R = 0.30;
const DOT_MAX_R = 1.65;
const halftoneDot = (
  context: CanvasRenderingContext2D,
  cellTopLeftX: number,
  cellTopLeftY: number,
  alpha: number,
) => {
  const a = Math.max(0, Math.min(1, alpha)) * context.globalAlpha;
  if (a < 0.02) return;
  const r = DOT_MIN_R + (DOT_MAX_R - DOT_MIN_R) * a;
  const saved = context.globalAlpha;
  context.globalAlpha = 1;
  context.beginPath();
  context.arc(cellTopLeftX + CELL_W / 2, cellTopLeftY + CELL_H / 2, r, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = saved;
};

// ── Surface character pools — uniform, no boundary band ─────────────────────
const LAND_CHARS  = ['*'];
const WATER_CHARS = ['/'];
const ICE_CHARS   = ['*'];

// ── Hash & noise ────────────────────────────────────────────────────────────
function hash(x: number, y: number): number {
  let h = ((x | 0) * 374761393) ^ ((y | 0) * 668265263);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return (
    a * (1 - ux) * (1 - uy) +
    b * ux * (1 - uy) +
    c * (1 - ux) * uy +
    d * ux * uy
  );
}

// ── Landmass data (real Earth coastlines from Natural Earth) ───────────────
// Replaces hand-coded continent polygons with TopoJSON's land-110m, decoded
// once and rasterised to a 1°×1° land/water grid via canvas — O(1) lookup
// per ASCII cell, no per-frame point-in-polygon tests.

const LAND_FEATURE = feature(
  landTopo as unknown,
  (landTopo as { objects: { land: unknown } }).objects.land,
);

const GRID_W = 360;
const GRID_H = 180;
let LAND_GRID: Uint8Array | null = null;

function ensureLandGrid(): Uint8Array {
  if (LAND_GRID) return LAND_GRID;
  const c = document.createElement('canvas');
  c.width = GRID_W;
  c.height = GRID_H;
  const cctx = c.getContext('2d', { willReadFrequently: true });
  if (!cctx) {
    LAND_GRID = new Uint8Array(GRID_W * GRID_H);
    return LAND_GRID;
  }
  // Equirectangular: 2π wide, π tall → scale = GRID_W / (2π).
  const projection = geoEquirectangular()
    .scale(GRID_W / (2 * Math.PI))
    .translate([GRID_W / 2, GRID_H / 2]);
  const path = geoPath(projection, cctx);
  cctx.fillStyle = '#fff';
  cctx.beginPath();
  path(LAND_FEATURE);
  cctx.fill();
  const img = cctx.getImageData(0, 0, GRID_W, GRID_H).data;
  const grid = new Uint8Array(GRID_W * GRID_H);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = img[i * 4] > 128 ? 1 : 0;
  }
  LAND_GRID = grid;
  return grid;
}

function landElevation(lat: number, lon: number): number {
  // Wobble the test point with two octaves of noise — the rasterised coastline
  // then appears wavy rather than crisp. Amplitudes are radians: 0.04 ≈ 2.3°.
  const dLat = (noise2D(lon * 4.0 + 1.7,  lat * 4.0 + 2.3) - 0.5) * 0.08
             + (noise2D(lon * 10.0 + 5.5, lat * 10.0 + 7.1) - 0.5) * 0.04;
  const dLon = (noise2D(lon * 4.0 + 11.3, lat * 4.0 + 13.7) - 0.5) * 0.08
             + (noise2D(lon * 10.0 + 17.9, lat * 10.0 + 19.3) - 0.5) * 0.04;
  const tLat = lat + dLat;
  let tLon = lon + dLon;
  tLon = ((tLon + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

  // Arctic Ocean carves the pole regardless of dataset.
  if (tLat > 1.40) return 0;

  const grid = LAND_GRID ?? ensureLandGrid();
  let x = Math.floor(((tLon + Math.PI) / (2 * Math.PI)) * GRID_W);
  let y = Math.floor(((Math.PI / 2 - tLat) / Math.PI) * GRID_H);
  if (x < 0) x = 0; else if (x >= GRID_W) x = GRID_W - 1;
  if (y < 0) y = 0; else if (y >= GRID_H) y = GRID_H - 1;
  return grid[y * GRID_W + x];
}


interface City {
  lat: number;
  lonBase: number;
  // 3-letter IATA-style code displayed as a label next to the city marker.
  code: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export function AsciiSkyline({ showDotCursor = true }: AsciiSkylineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsLayerRef = useRef<HTMLCanvasElement | null>(null);
  const siteLayerRef = useRef<HTMLCanvasElement | null>(null);
  const citiesRef = useRef<City[]>([]);
  const sphereRef = useRef({ cxPx: 0, cyPx: 0, R: 0, minLat: 0, peakPx: 0 });
  const colorRef = useRef('');
  const rafRef = useRef(0);
  // Formation animation: particles fly inward from off-disc and settle into
  // their land cells over ~2.6s on first paint, then static rendering takes
  // over. Stride 6 floats per particle: [spawnX, spawnY, targetX, targetY,
  // t0, finalAlpha].
  const formationRef = useRef<{
    active: boolean;
    startT: number;
    duration: number;
    travelTime: number;
    particles: Float32Array;
    count: number;
  } | null>(null);
  // True once the intro has played (or was skipped under reduced-motion or
  // aborted by resize). Prevents the formation from replaying on resize or
  // theme change.
  const formationPlayedRef = useRef(false);
  // Display mode — drives the loop:
  //   forming → globe → globe-to-construction → construction → construction-to-globe → globe → ...
  // Reduced-motion stays in 'globe' forever.
  type Mode =
    | 'forming'
    | 'globe'
    | 'globe-to-construction'
    | 'construction'
    | 'construction-to-globe';
  const modeRef = useRef<{ mode: Mode; startT: number }>({
    mode: 'forming',
    startT: 0,
  });
  // Construction-yard rotation state — analogous to spinState but
  // independent so we can leave the globe spin alone when entering and
  // leaving the construction phase.
  const constStateRef = useRef({
    baseT: 0,
    manualOffset: 0,
    lastT: 0,
    dragging: false,
    dragLastX: 0,
    dragPointerId: -1,
  });
  // Per-particle morph buffer used during the globe↔construction
  // transitions. Each particle pairs a *source* cell (px, py, alpha,
  // glyph) with a *destination* cell of the same shape, plus a per-
  // particle delay (`t0`) that staggers the swarm. Stride 9 floats:
  // [srcX, srcY, srcAlpha, srcGlyph, dstX, dstY, dstAlpha, dstGlyph, t0].
  const morphRef = useRef<{
    active: boolean;
    startT: number;
    duration: number;
    travelTime: number;
    particles: Float32Array;
    count: number;
  } | null>(null);
  // City-anchored morph state. The "selected" city is the one we zoom into
  // each cycle: its position on the globe becomes the construction
  // anchor's X, and during the construction hold an uplink line falls
  // from the top of the canvas onto that crane. `idx` rotates through the
  // four cities so each cycle features a different one. `anchorX` is the
  // already-clamped horizontal pixel where the crane is centred (kept in
  // canvas so the crane never overflows).
  const selectedCityRef = useRef<{
    // Index of the city chosen for this cycle. Locked in once at the
    // start of pre-launch so the boost halo, the morph anchor, and the
    // construction uplink all agree on which city tells the story.
    idx: number;
    // Crane horizontal anchor in canvas pixels — meaningful while
    // anchorActive is true (morph + construction phases).
    anchorX: number;
    // True once the morph has fired and captured an anchor.
    anchorActive: boolean;
    // True once we've pre-picked the city for the upcoming cycle.
    // Cleared after construction-to-globe ends so the next cycle picks
    // the *next* city in rotation.
    prePickActive: boolean;
  }>({ idx: -1, anchorX: 0, anchorActive: false, prePickActive: false });
  // Pre-launch hand-off pulse — ramps up over the last second before the
  // morph fires so the selected city visibly "lights up" before zoom-in.
  const prelaunchRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Refs persist across the StrictMode cleanup→remount cycle. Reset the
    // formation guards on each fresh mount so the intro plays in dev too.
    formationPlayedRef.current = false;
    formationRef.current = null;
    morphRef.current = null;
    modeRef.current = { mode: 'forming', startT: 0 };
    constStateRef.current = {
      baseT: 0,
      manualOffset: 0,
      lastT: 0,
      dragging: false,
      dragLastX: 0,
      dragPointerId: -1,
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Honour OS-level prefers-reduced-motion: pause auto-spin, drone bob,
    // prop wobble, and packet motion when the user has set this preference.
    const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = reducedMotionMQ.matches;
    const onReducedMotionChange = () => { reducedMotion = reducedMotionMQ.matches; };
    reducedMotionMQ.addEventListener('change', onReducedMotionChange);
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    // Drag-to-spin state. baseT accumulates only while not dragging — that
    // way the auto-spin pauses while the user drags, then resumes from the
    // new orientation when they release.
    const spinState = {
      baseT: 0,
      manualOffset: 0,
      lastT: 0,
      dragging: false,
      dragLastX: 0,
      dragPointerId: -1,
    };

    const isDark = () => document.documentElement.classList.contains('dark');
    const getFg = () => (isDark() ? '#ececec' : '#0f0f0f');
    const getMid = () => (isDark() ? '#a0a0a0' : '#5a5a5a');
    const getDim = () => (isDark() ? '#6a6a6a' : '#9a9a9a');
    // Network accent — deep navy/blue, not neon cyan.
    const getArcColor = () => (isDark() ? '#3680c4' : '#0d4080');
    const getArcAccent = () => (isDark() ? '#6db0e8' : '#1856a8');

    const computeSphere = () => {
      // Perfect hemisphere fitted to canvas width:
      //   - sphere centre on the canvas bottom edge (horizon = bottom)
      //   - R = halfW so the disk diameter exactly equals canvas width
      // Visible cap spans latitudes 0° (canvas bottom) → 90°N (top centre),
      // exposing every Northern Hemisphere continent (Mexico, Caribbean
      // S. America, all of N. Africa, etc.). Aspect-independent: sky band
      // above the disk grows on tall containers but the disk never
      // overshoots width or zooms in too far.
      const halfW = width / 2;
      const cxPx = halfW;
      const cyPx = height;
      const R = halfW;
      const peakPx = Math.max(0, cyPx - R); // y-coord of disk top, ≥ 0
      sphereRef.current = { cxPx, cyPx, R, minLat: 0, peakPx };
    };

    const renderStarsLayer = () => {
      const off = document.createElement('canvas');
      off.width = width * dpr;
      off.height = height * dpr;
      const o = off.getContext('2d');
      if (!o) return;
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.font = `${FONT_PX}px var(--nx-font-mono, ui-monospace, "JetBrains Mono", Menlo, monospace)`;
      o.textBaseline = 'top';

      const dim = getDim();
      const mid = getMid();
      const { cxPx, cyPx, R } = sphereRef.current;
      const Rsq = R * R;

      o.fillStyle = dim;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const px = cx * CELL_W + CELL_W / 2;
          const py = cy * CELL_H + CELL_H / 2;
          const dx = px - cxPx;
          const dy = py - cyPx;
          if (dx * dx + dy * dy <= Rsq) continue;
          const r = hash(cx, cy);
          let ch = '';
          let alpha = 0;
          if (r > 0.992) { ch = '+'; alpha = 0.65; }
          else if (r > 0.978) { ch = '.'; alpha = 0.50; }
          else if (r > 0.96) { ch = '·'; alpha = 0.32; }
          else continue;
          o.globalAlpha = alpha;
          o.fillText(ch, cx * CELL_W, cy * CELL_H);
        }
      }

      o.fillStyle = mid;
      const ringDefs = [
        { Rad: R * 1.06, alpha: 0.24, density: 0.35 },
        { Rad: R * 1.13, alpha: 0.16, density: 0.28 },
        { Rad: R * 1.22, alpha: 0.10, density: 0.22 },
      ];
      for (let i = 0; i < ringDefs.length; i++) {
        const ring = ringDefs[i];
        const stepTheta = (CELL_W * 0.5) / ring.Rad;
        for (let theta = -Math.PI; theta < 0; theta += stepTheta) {
          const x = cxPx + Math.cos(theta) * ring.Rad;
          const y = cyPx + Math.sin(theta) * ring.Rad;
          const cx = Math.round(x / CELL_W);
          const cy = Math.round(y / CELL_H);
          if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) continue;
          if (hash(cx + i * 137, cy + Math.floor(theta * 30)) > ring.density) continue;
          o.globalAlpha = ring.alpha;
          o.fillText('.', cx * CELL_W, cy * CELL_H);
        }
      }
      o.globalAlpha = 1;
      starsLayerRef.current = off;
    };

    /** Construction-mode backdrop. A blueprint-style grid plus a horizon
     *  line and ground hatch — replaces the starfield while the crane is
     *  on stage so the scene reads as a job site rather than deep space. */
    const renderSiteLayer = () => {
      const off = document.createElement('canvas');
      off.width = width * dpr;
      off.height = height * dpr;
      const o = off.getContext('2d');
      if (!o) return;
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.font = `${FONT_PX}px var(--nx-font-mono, ui-monospace, "JetBrains Mono", Menlo, monospace)`;
      o.textBaseline = 'top';

      const dim = getDim();
      const mid = getMid();

      // Sky band: blueprint graph paper. Major intersections every 8×6
      // cells get a `+`; minor gridlines in between get a faint `·`.
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const majorCol = cx % 8 === 0;
          const majorRow = cy % 6 === 0;
          if (majorCol && majorRow) {
            o.fillStyle = mid;
            o.globalAlpha = 0.32;
            o.fillText('+', cx * CELL_W, cy * CELL_H);
          } else if (majorCol || majorRow) {
            o.fillStyle = dim;
            o.globalAlpha = 0.16;
            o.fillText('·', cx * CELL_W, cy * CELL_H);
          }
        }
      }

      // Horizon line — solid `-` row matching the crane's ground line
      // (groundY = height - 6 in projectConstruction).
      const horizonRow = Math.max(0, Math.floor((height - 6) / CELL_H));
      o.fillStyle = mid;
      o.globalAlpha = 0.55;
      for (let cx = 0; cx < cols; cx++) {
        o.fillText('-', cx * CELL_W, horizonRow * CELL_H);
      }

      // Ground hatch below horizon — random scatter of `#`/`:`/`.` for
      // a textured site floor.
      for (let cy = horizonRow + 1; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const r = hash(cx + 911, cy + 113);
          let ch = '';
          let alpha = 0;
          if (r > 0.93)      { ch = '#'; alpha = 0.45; }
          else if (r > 0.78) { ch = ':'; alpha = 0.35; }
          else if (r > 0.55) { ch = '.'; alpha = 0.22; }
          else continue;
          o.fillStyle = dim;
          o.globalAlpha = alpha;
          o.fillText(ch, cx * CELL_W, cy * CELL_H);
        }
      }

      o.globalAlpha = 1;
      siteLayerRef.current = off;
    };

    const initCities = () => {
      const D2R = Math.PI / 180;
      // Four anchor cities — IATA-style 3-letter codes for HUD labels.
      const defs: Array<{ lat: number; lon: number; code: string }> = [
        { lat: 40.71, lon: -74.00, code: 'NYC' },
        { lat: 35.68, lon: 139.65, code: 'TYO' },
        { lat: 51.51, lon:  -0.13, code: 'LDN' },
        { lat: 34.05, lon:-118.24, code: 'LAX' },
      ];
      citiesRef.current = defs.map((d) => ({
        lat: d.lat * D2R,
        lonBase: d.lon * D2R,
        code: d.code,
      }));
    };



    /** Walks the visible cell grid, collects every land/ice cell as a
     *  particle target, and pairs each with a spawn point off the disc.
     *  Spawn points sit on a ring of radius ~1.6–3.0× R around the sphere
     *  centre so particles look like they fall in from space. */
    const buildFormation = () => {
      if (formationPlayedRef.current || reducedMotion) {
        formationPlayedRef.current = true;
        formationRef.current = null;
        return;
      }
      const { cxPx, cyPx, R } = sphereRef.current;
      const Rsq = R * R;
      const targets: number[] = [];
      const minRow = Math.max(0, Math.floor((cyPx - R) / CELL_H) - 1);
      for (let cy = minRow; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const px = cx * CELL_W + CELL_W / 2;
          const py = cy * CELL_H + CELL_H / 2;
          const dx = px - cxPx;
          const dy = py - cyPx;
          if (dy >= 0) continue;
          const distSq = dx * dx + dy * dy;
          if (distSq > Rsq) continue;
          const z = Math.sqrt(Rsq - distSq);
          const lat = Math.asin(Math.max(-1, Math.min(1, -dy / R)));
          const lon = Math.atan2(dx, z); // spinAngle held at 0 during formation
          if (landElevation(lat, lon) < 0.5) continue; // skip water
          const isPolar = lat > 1.30;
          const baseAlpha = isPolar ? 0.85 : 0.92;
          const shading = Math.pow(z / R, 0.45);
          const lonInt = Math.floor(lon * 28);
          const latInt = Math.floor(lat * 28);
          let alpha = baseAlpha * (0.45 + shading * 0.6);
          alpha *= 0.92 + hash(lonInt, latInt) * 0.10;
          alpha = Math.max(0.10, Math.min(1, alpha));
          targets.push(cx * CELL_W, cy * CELL_H, alpha);
        }
      }
      const count = targets.length / 3;
      if (count === 0) {
        formationPlayedRef.current = true;
        formationRef.current = null;
        return;
      }
      // Single emission source above the globe — same rest-position the
      // drone will occupy after formation finishes. Gives the intro a
      // clear narrative origin: the drone is delivering the planet.
      const sourceX = cxPx;
      const sourceY = Math.max(60, cyPx - R - 95);
      const particles = new Float32Array(count * 6);
      for (let i = 0; i < count; i++) {
        const tx = targets[i * 3];
        const ty = targets[i * 3 + 1];
        const a  = targets[i * 3 + 2];
        // Tight scatter around the source so the swarm looks emitted
        // from one place rather than from a uniform ring.
        const sx = sourceX + (Math.random() - 0.5) * 70;
        const sy = sourceY + (Math.random() - 0.5) * 50;
        // Stagger by horizontal distance to target — particles bound for
        // the limbs leave first, centre-of-disc particles last. Reads as
        // the swarm fanning outward then settling inward.
        const dxToTarget = Math.abs(tx - sourceX);
        const t0 = (dxToTarget / R) * 0.55 + Math.random() * 0.35;
        particles[i * 6 + 0] = sx;
        particles[i * 6 + 1] = sy;
        particles[i * 6 + 2] = tx;
        particles[i * 6 + 3] = ty;
        particles[i * 6 + 4] = t0;
        particles[i * 6 + 5] = a;
      }
      formationRef.current = {
        active: true,
        startT: performance.now() / 1000,
        duration: 2.6,
        travelTime: 1.5,
        particles,
        count,
      };
    };

    const ensureBuilt = () => {
      const fg = getFg();
      if (starsLayerRef.current && siteLayerRef.current && colorRef.current === fg) return;
      computeSphere();
      renderStarsLayer();
      renderSiteLayer();
      initCities();
      // Only build the formation once on first paint. Theme changes clear
      // starsLayerRef but should not replay the intro.
      if (!formationPlayedRef.current && !formationRef.current) {
        buildFormation();
      }
      colorRef.current = fg;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const newW = Math.max(1, Math.floor(rect.width));
      const newH = Math.max(1, Math.floor(rect.height));
      // ResizeObserver fires once on observe() right after the manual
      // resize() call — without this guard it would invalidate state and
      // abort the freshly-built formation before frame 1.
      if (newW === width && newH === height) return;
      width = newW;
      height = newH;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL_W);
      rows = Math.ceil(height / CELL_H);
      starsLayerRef.current = null;
      siteLayerRef.current = null;
      colorRef.current = '';
      // Abort any in-flight formation: target cell coords are now stale.
      if (formationRef.current?.active) {
        formationPlayedRef.current = true;
        formationRef.current = null;
      }
      ensureBuilt();
    };

    /** Planet surface — uniform `#` continents and very sparse water dots.
     *  No coast band (continents transition naturally based on land density). */
    const drawPlanet = (t: number, spinAngle: number, waterOnly = false) => {
      const { cxPx, cyPx, R } = sphereRef.current;
      const Rsq = R * R;
      const fg = getFg();
      const mid = getMid();
      ctx.font = `${FONT_PX}px var(--nx-font-mono, ui-monospace, "JetBrains Mono", Menlo, monospace)`;
      ctx.textBaseline = 'top';

      const minRow = Math.max(0, Math.floor((cyPx - R) / CELL_H) - 1);
      for (let cy = minRow; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const px = cx * CELL_W + CELL_W / 2;
          const py = cy * CELL_H + CELL_H / 2;
          const dx = px - cxPx;
          const dy = py - cyPx;
          if (dy >= 0) continue; // half-globe: skip below horizon
          const distSq = dx * dx + dy * dy;
          if (distSq > Rsq) continue;

          const z = Math.sqrt(Rsq - distSq);
          const lat = Math.asin(Math.max(-1, Math.min(1, -dy / R)));
          const lon = Math.atan2(dx, z) + spinAngle;

          const isLand = landElevation(lat, lon) > 0.5;
          // During formation we draw only the ocean: the sphere's
          // silhouette stays visible while particles assemble the land.
          if (waterOnly && isLand) continue;
          const isPolar = lat > 1.30;

          let chSet: readonly string[];
          let baseAlpha: number;
          let useFg = true;

          if (isLand && isPolar) {
            chSet = ICE_CHARS;
            baseAlpha = 0.85;
          } else if (isLand) {
            chSet = LAND_CHARS;
            baseAlpha = 0.92;
          } else {
            // Water renders every cell — uniform diagonal hatch. With the
            // tight cell grid, overlapping glyphs saturate quickly, so this
            // alpha is intentionally tiny.
            chSet = WATER_CHARS;
            baseAlpha = 0.10;
            useFg = false;
          }

          const lonInt = Math.floor(lon * 28);
          const latInt = Math.floor(lat * 28);
          const ch = chSet[Math.abs(lonInt * 7 + latInt * 13) % chSet.length];

          const shading = Math.pow(z / R, 0.45);
          let alpha = baseAlpha * (0.45 + shading * 0.6);
          alpha *= 0.92 + hash(lonInt, latInt) * 0.10;
          // ── B. Coordinated longitude sweep — continuous horizontal scan.
          // Wavefront moves in world longitude every 6 s. Two antipodal
          // wavefronts (180° apart in lon) ensure the flash is *always*
          // visible somewhere on the front face: as one fades out at
          // the right limb, the other is fading in at the left limb.
          // Uses signed distance to the nearest wavefront so a cell is
          // pulled toward whichever scan is closer.
          if (isLand) {
            const cycleT = (t / 6) % 1;
            const scanLonA = cycleT * 2 * Math.PI - Math.PI;
            // Normalise (lon - scanLonA) to (-π, π].
            let dLon = lon - scanLonA;
            dLon = ((dLon + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
            // Fold to (-π/2, π/2] so we always reference the nearest of
            // the two antipodal wavefronts.
            if (dLon >  Math.PI / 2) dLon -= Math.PI;
            else if (dLon < -Math.PI / 2) dLon += Math.PI;
            const distAbs = Math.abs(dLon);
            // Wide linear gradient — reaches baseline at ~57°.
            const flash = Math.max(0, 1 - distAbs * 1.0);
            // Narrow bright leading edge — the visible scan line.
            const edge  = Math.max(0, 1 - dLon * dLon * 30);
            alpha *= 0.42 + 0.55 * flash + 0.40 * edge;
          }
          alpha = Math.max(0.10, Math.min(1, alpha));

          ctx.fillStyle = useFg ? fg : mid;
          halftoneDot(ctx, cx * CELL_W, cy * CELL_H, alpha);
        }
      }
      ctx.globalAlpha = 1;
    };

    const cityPosition = (city: City, spinAngle: number) => {
      const { R } = sphereRef.current;
      // Planet's drawPlanet looks up surface lon as atan2(dx,z)+spinAngle,
      // so a fixed lonBase appears at smaller screen-x as spinAngle grows.
      // Cities must subtract spinAngle to ride with the land, not against it.
      const lon = city.lonBase - spinAngle;
      const cosLat = Math.cos(city.lat);
      const sinLat = Math.sin(city.lat);
      const dx = R * cosLat * Math.sin(lon);
      const dy = -R * sinLat;
      const dz = R * cosLat * Math.cos(lon);
      return { dx, dy, dz };
    };

    /** Hero observation drone + comm beams. Designed for a calm,
     *  professional reading: only one moving particle per beam, solid
     *  beam lines (no dashed flow), the city marker is a single ring +
     *  dot (no brackets/halo), and the accent colour is reserved for
     *  active elements (the moving packet and the brief uplink pulse).
     *  Honours prefers-reduced-motion: drone bob, prop wobble, packet
     *  motion, and uplink pulses all freeze when the OS asks. Beams are
     *  perspective-clipped at the globe silhouette for back-side cities
     *  so the link reads as wrapping over the top of the planet. */
    const drawCities = (t: number, _spinAngle: number) => {
      const { cxPx, cyPx, R } = sphereRef.current;
      const arcColor = getArcColor();
      const accent = getArcAccent();
      const fg = getFg();

      const rgba = (hex: string, alpha: number) => {
        const m = hex.match(/^#([0-9a-f]{6})$/i);
        if (!m) return hex;
        const n = parseInt(m[1], 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
      };

      // motionT freezes time-driven animation under reduced-motion. The
      // structure (positions, sizes) still renders; only the *animation*
      // of those properties is paused.
      const motionT = reducedMotion ? 0 : t;

      // City positions — used by §3 below (city markers) and by the
      // disabled drone/uplink block when re-enabled.
      const cities = citiesRef.current;
      const cityScreens = cities.map((city) => {
        const { dx, dy, dz } = cityPosition(city, _spinAngle);
        return {
          x: cxPx + dx,
          y: cyPx + dy,
          front: dz >= 0,
          pulse: 0,
        };
      });

      // Drone + uplink beams intentionally disabled. The full
      // implementation is preserved inside the gate so it can be turned
      // back on by flipping RENDER_DRONE without rewriting the visual.
      const RENDER_DRONE = false;
      if (RENDER_DRONE) {
        // ── Drone position ────────────────────────────────────────────────
        const droneRestY = Math.max(72, cyPx - R - 95);
        const droneX = cxPx;
        const bobAmp = reducedMotion ? 0 : 2.5;
        const droneY = droneRestY + Math.sin(motionT * 0.5) * bobAmp;

        // Line-circle intersection helper (drone → target vs globe disc).
        const lineEnterDisc = (tx: number, ty: number): number | null => {
          const ddx = tx - droneX;
          const ddy = ty - droneY;
          const fx = droneX - cxPx;
          const fy = droneY - cyPx;
          const A = ddx * ddx + ddy * ddy;
          const B = 2 * (fx * ddx + fy * ddy);
          const C = fx * fx + fy * fy - R * R;
          const disc = B * B - 4 * A * C;
          if (disc < 0 || A === 0) return null;
          const sd = Math.sqrt(disc);
          const s1 = (-B - sd) / (2 * A);
          return s1 > 0 && s1 < 1 ? s1 : null;
        };

        // ── 1. Beams — solid, muted (arcColor); single packet per beam ────

      for (let i = 0; i < cities.length; i++) {
        const cs = cityScreens[i];

        // Perspective clip at globe silhouette for back-facing cities.
        let endS = 1;
        if (!cs.front) {
          const hit = lineEnterDisc(cs.x, cs.y);
          if (hit !== null) endS = hit;
        }
        const endX = droneX + (cs.x - droneX) * endS;
        const endY = droneY + (cs.y - droneY) * endS;

        // Slim pipe stroke — soft halo + solid core + thin lit ridge, all
        // narrow enough that the link reads as a fine conduit rather than
        // a hose, but the cross-section feel is preserved.
        ctx.lineCap = 'round';
        ctx.strokeStyle = rgba(arcColor, 0.14);
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(droneX, droneY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.strokeStyle = rgba(arcColor, 0.60);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(droneX, droneY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.strokeStyle = rgba(arcColor, 0.95);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(droneX, droneY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Single uplink packet; departureTimer 0 → 1 over each period,
        // 0 marking the moment the packet leaves the city. The packet
        // visualises "data sent up", the accent colour signalling
        // active transmission against the muted ambient beam.
        const period = 3.8;
        const departureTimer = reducedMotion
          ? 0.5
          : ((((t / period) + i * 0.27) % 1) + 1) % 1;
        const phaseUp = 1 - departureTimer;
        if (phaseUp <= endS) {
          const px = droneX + (cs.x - droneX) * phaseUp;
          const py = droneY + (cs.y - droneY) * phaseUp;
          ctx.fillStyle = rgba(accent, 0.30);
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (cs.front && !reducedMotion) {
          cs.pulse = Math.max(0, 1 - departureTimer * 14);
        }
      }

      // ── 2. Hero drone — high-detail illustration in 3/4 perspective ────
      // Refinements layered onto the F1-style line-art base:
      //  • body / motor / gimbal use vertical gradients (top-lit) so flat
      //    silhouettes read as curved surfaces
      //  • back motors and back arms drop one tier of detail (single fin
      //    line, no hub ring, no diameter blade hint, no arm highlight)
      //    so the perspective reads correctly
      //  • brand monogram + accent livery stripe baked into the body
      //  • gimbal upgraded from sphere to yoke + camera cylinder + lens
      //  • soft contact shadow under the drone anchors it in space
      {
        const dark = isDark();
        const bg = dark ? '#0a0a0a' : '#ffffff';

        // Mix two #rrggbb hex colours by `mix` ∈ [0, 1] (0 = a, 1 = b).
        const mixHex = (a: string, b: string, mix: number) => {
          const ma = a.match(/^#([0-9a-f]{6})$/i);
          const mb = b.match(/^#([0-9a-f]{6})$/i);
          if (!ma || !mb) return a;
          const na = parseInt(ma[1], 16);
          const nb = parseInt(mb[1], 16);
          const r = Math.round(((na >> 16) & 255) + (((nb >> 16) & 255) - ((na >> 16) & 255)) * mix);
          const g = Math.round(((na >>  8) & 255) + (((nb >>  8) & 255) - ((na >>  8) & 255)) * mix);
          const b2 = Math.round((na & 255) + ((nb & 255) - (na & 255)) * mix);
          return `rgb(${r},${g},${b2})`;
        };
        // Lighter tint of fg used for top stops in body / motor gradients
        // (sells "lit from above" without changing the silhouette).
        const fgLight = mixHex(fg, bg, 0.18);

        const armX = 28;
        const armY = 16;
        const bodyRx = 17;
        const bodyRy = 7;

        const motorScale = { back: 0.78, front: 1.00 };
        const motorBaseRx = 4.4;
        const motorBaseRy = 1.5;
        const motorHeight = 3.6;
        const propRx = 7.2;
        const propRy = 2.4;

        const motors: ReadonlyArray<{ dx: number; dy: number; side: 'back' | 'front' }> = [
          { dx: -armX, dy: -armY, side: 'back'  },
          { dx:  armX, dy: -armY, side: 'back'  },
          { dx: -armX, dy:  armY, side: 'front' },
          { dx:  armX, dy:  armY, side: 'front' },
        ];

        // Tapered arm — back arms drop the centre highlight stripe.
        const drawArm = (toX: number, toY: number, side: 'back' | 'front') => {
          const dx = toX - droneX;
          const dy = toY - droneY;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const nx = -uy;
          const ny =  ux;
          const w0 = 3.0;
          const w1 = side === 'front' ? 1.6 : 1.3;
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.moveTo(droneX + nx * w0, droneY + ny * w0);
          ctx.lineTo(droneX - nx * w0, droneY - ny * w0);
          ctx.lineTo(toX     - nx * w1, toY     - ny * w1);
          ctx.lineTo(toX     + nx * w1, toY     + ny * w1);
          ctx.closePath();
          ctx.fill();
          if (side === 'front') {
            ctx.strokeStyle = bg;
            ctx.lineWidth = 0.45;
            ctx.beginPath();
            ctx.moveTo(droneX, droneY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
          }
        };

        // Cylinder motor housing — gradient side wall + lit top cap.
        // Back motors keep only one fin line, no hub ring, no blade hint.
        const drawMotor = (cx: number, cy: number, side: 'back' | 'front') => {
          const sc = motorScale[side];
          const rx = motorBaseRx * sc;
          const ry = motorBaseRy * sc;
          const h  = motorHeight * sc;
          const pRx = propRx * sc;
          const pRy = propRy * sc;

          // Side wall — vertical gradient (top lit, base dark).
          const sideGrad = ctx.createLinearGradient(cx, cy - h, cx, cy);
          sideGrad.addColorStop(0, fgLight);
          sideGrad.addColorStop(1, fg);
          ctx.fillStyle = sideGrad;
          ctx.beginPath();
          ctx.moveTo(cx - rx, cy);
          ctx.lineTo(cx + rx, cy);
          ctx.lineTo(cx + rx, cy - h);
          ctx.lineTo(cx - rx, cy - h);
          ctx.closePath();
          ctx.fill();
          // Lower rim (front of cylinder).
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
          ctx.fill();
          // Top cap — full ellipse, lit.
          ctx.fillStyle = fgLight;
          ctx.beginPath();
          ctx.ellipse(cx, cy - h, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();

          if (side === 'front') {
            // 3 cooling fins.
            ctx.strokeStyle = bg;
            ctx.lineWidth = 0.5;
            for (let fi = 1; fi <= 3; fi++) {
              const fy = cy - (h * fi) / 4;
              ctx.beginPath();
              ctx.moveTo(cx - rx + 0.6, fy);
              ctx.lineTo(cx + rx - 0.6, fy);
              ctx.stroke();
            }
            // Hub ring.
            ctx.strokeStyle = bg;
            ctx.lineWidth = 0.55;
            ctx.beginPath();
            ctx.ellipse(cx, cy - h, rx * 0.50, ry * 0.50, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // Back: single fin line, simplified.
            ctx.strokeStyle = bg;
            ctx.lineWidth = 0.45;
            ctx.beginPath();
            const fy = cy - h * 0.5;
            ctx.moveTo(cx - rx + 0.6, fy);
            ctx.lineTo(cx + rx - 0.6, fy);
            ctx.stroke();
          }
          // Centre bolt (both sides).
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(cx, cy - h, 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Propeller disc.
          ctx.fillStyle = rgba(fg, 0.22);
          ctx.beginPath();
          ctx.ellipse(cx, cy - h - 0.4, pRx, pRy, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = fg;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.ellipse(cx, cy - h - 0.4, pRx, pRy, 0, 0, Math.PI * 2);
          ctx.stroke();
          if (side === 'front') {
            // Diameter blade hint — front only.
            ctx.strokeStyle = rgba(fg, 0.45);
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(cx - pRx + 0.6, cy - h - 0.4);
            ctx.lineTo(cx + pRx - 0.6, cy - h - 0.4);
            ctx.stroke();
          }
        };

        // 1 + 2. Back arms + back motors (drawn first — far layer).
        for (const m of motors) {
          if (m.side !== 'back') continue;
          drawArm(droneX + m.dx, droneY + m.dy, 'back');
        }
        for (const m of motors) {
          if (m.side !== 'back') continue;
          drawMotor(droneX + m.dx, droneY + m.dy, 'back');
        }

        // 3. Front arms (drawn BEFORE body) — the body sits on top of
        //    the X-frame, so the diagonals pass under it. This keeps the
        //    body interior clean and the brand monogram readable.
        for (const m of motors) {
          if (m.side !== 'front') continue;
          drawArm(droneX + m.dx, droneY + m.dy, 'front');
        }

        // 3. Body — vertical gradient for curvature.
        const bodyGrad = ctx.createLinearGradient(
          droneX, droneY - bodyRy, droneX, droneY + bodyRy,
        );
        bodyGrad.addColorStop(0, fgLight);
        bodyGrad.addColorStop(1, fg);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(droneX, droneY, bodyRx, bodyRy, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3a. Centre seam.
        ctx.strokeStyle = bg;
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(droneX - bodyRx + 2, droneY);
        ctx.lineTo(droneX + bodyRx - 2, droneY);
        ctx.stroke();
        // 3b. Battery / heatsink rail.
        ctx.beginPath();
        ctx.moveTo(droneX - 6, droneY - bodyRy + 1.5);
        ctx.lineTo(droneX + 6, droneY - bodyRy + 1.5);
        ctx.moveTo(droneX - 6, droneY - bodyRy + 2.6);
        ctx.lineTo(droneX + 6, droneY - bodyRy + 2.6);
        ctx.stroke();

        // 3c. Sensor dome — lit gradient bump.
        const domeGrad = ctx.createLinearGradient(
          droneX, droneY - 2.1, droneX, droneY + 1.7,
        );
        domeGrad.addColorStop(0, fgLight);
        domeGrad.addColorStop(1, fg);
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.ellipse(droneX, droneY - 0.2, 4.2, 1.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bg;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(droneX, droneY - 0.2, 4.2, 1.9, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3e. Front nav LED.
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(droneX, droneY + bodyRy - 1.6, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 3f. Accent livery stripe along the front-facing arc of the body.
        ctx.strokeStyle = rgba(accent, 0.75);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(
          droneX, droneY + 0.4,
          bodyRx - 1.8, bodyRy - 0.6,
          0,
          Math.PI * 0.10, Math.PI * 0.90,
          false,
        );
        ctx.stroke();

        // 3g. Refined gimbal — yoke + camera cylinder + lens cap.
        // Yoke: short trapezoid attaching the camera to the body.
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(droneX - 2.6, droneY + bodyRy - 0.5);
        ctx.lineTo(droneX + 2.6, droneY + bodyRy - 0.5);
        ctx.lineTo(droneX + 1.9, droneY + bodyRy + 1.6);
        ctx.lineTo(droneX - 1.9, droneY + bodyRy + 1.6);
        ctx.closePath();
        ctx.fill();
        // Camera body — short horizontal cylinder.
        const camCx = droneX;
        const camCy = droneY + bodyRy + 3.2;
        const camRx = 3.2;
        const camRy = 0.75;
        const camH  = 2.4;
        const camGrad = ctx.createLinearGradient(camCx, camCy - camH/2, camCx, camCy + camH/2);
        camGrad.addColorStop(0, fgLight);
        camGrad.addColorStop(1, fg);
        ctx.fillStyle = camGrad;
        ctx.beginPath();
        ctx.moveTo(camCx - camRx, camCy - camH/2);
        ctx.lineTo(camCx + camRx, camCy - camH/2);
        ctx.lineTo(camCx + camRx, camCy + camH/2);
        ctx.lineTo(camCx - camRx, camCy + camH/2);
        ctx.closePath();
        ctx.fill();
        // Bottom rim.
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.ellipse(camCx, camCy + camH/2, camRx, camRy, 0, 0, Math.PI);
        ctx.fill();
        // Top cap (lit).
        ctx.fillStyle = fgLight;
        ctx.beginPath();
        ctx.ellipse(camCx, camCy - camH/2, camRx, camRy, 0, 0, Math.PI * 2);
        ctx.fill();
        // Lens hood — small fg circle on the bottom.
        const lensCy = camCy + camH/2 + 0.6;
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(camCx, lensCy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Lens (the eye) — accent.
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(camCx, lensCy, 0.85, 0, Math.PI * 2);
        ctx.fill();

        // 5. Front motors (drawn last — closest to the camera, overlay
        //    everything else).
        for (const m of motors) {
          if (m.side !== 'front') continue;
          drawMotor(droneX + m.dx, droneY + m.dy, 'front');
        }

        ctx.lineWidth = 1;
      }
      } // end if (RENDER_DRONE)

      // ── 3. City markers — ring + dot, plus concentric sonar pings ─────
      const PING_PERIOD = 4.0;
      const PING_COUNT = 3;
      const PING_MAX_R = 22;
      // Pre-launch hand-off — the city we're about to zoom into gets a
      // brighter halo, larger dot, and a wider ping radius so the eye
      // tracks it before the swarm fires. `prelaunchT` is 0 in normal
      // hold time and ramps to 1 over the last second.
      const selIdx = selectedCityRef.current.prePickActive
        ? selectedCityRef.current.idx
        : -1;
      const prelaunchT = prelaunchRef.current;
      for (let i = 0; i < cities.length; i++) {
        const cs = cityScreens[i];
        if (!cs.front) continue;
        const isSelected = i === selIdx;
        const boost = isSelected ? prelaunchT : 0;
        const pulse = Math.max(cs.pulse, boost);

        // ── D. Sonar pings — overlapping rings expand outward from the
        // city marker on a continuous cycle. Three rings staggered by
        // 1/3 period give a smooth always-active radar feel. The
        // selected city gets a wider radius and a stronger alpha so its
        // pings out-loud the others as the morph approaches. ─────────
        const ringMaxR = PING_MAX_R * (1 + boost * 0.6);
        const alphaScale = 1 + boost * 1.4;
        for (let pi = 0; pi < PING_COUNT; pi++) {
          const phase = (((t / PING_PERIOD) + i * 0.31 + pi / PING_COUNT) % 1 + 1) % 1;
          const ringR = phase * ringMaxR;
          const ringA = (1 - phase) * 0.42 * alphaScale;
          if (ringA <= 0.01 || ringR < 0.5) continue;
          ctx.strokeStyle = rgba(accent, ringA);
          ctx.lineWidth = 0.85 + boost * 0.6;
          ctx.beginPath();
          ctx.arc(cs.x, cs.y, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Outline ring — muted, always visible.
        ctx.strokeStyle = rgba(arcColor, 0.65);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cs.x, cs.y, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Centre dot — muted by default, full accent + larger during pulse.
        if (pulse > 0.001) {
          // Brief halo at the moment of transmission.
          const haloR = 5 + pulse * 4;
          const halo = ctx.createRadialGradient(cs.x, cs.y, 0, cs.x, cs.y, haloR);
          halo.addColorStop(0, rgba(accent, 0.55 * pulse));
          halo.addColorStop(1, rgba(accent, 0));
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(cs.x, cs.y, haloR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(cs.x, cs.y, 1.6 + pulse * 1.0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = arcColor;
          ctx.beginPath();
          ctx.arc(cs.x, cs.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    };

    const drawCursorRipple = (spinAngle: number) => {
      const { cxPx, cyPx, R } = sphereRef.current;
      const Rsq = R * R;
      const radius = 4;
      const cxBase = Math.floor(mouse.x / CELL_W);
      const cyBase = Math.floor(mouse.y / CELL_H);
      ctx.font = `${FONT_PX}px var(--nx-font-mono, ui-monospace, "JetBrains Mono", Menlo, monospace)`;
      ctx.textBaseline = 'top';
      const fg = getFg();
      const mid = getMid();
      for (let dyc = -radius; dyc <= radius; dyc++) {
        for (let dxc = -radius; dxc <= radius; dxc++) {
          const d = Math.hypot(dxc, dyc);
          if (d > radius) continue;
          const cx = cxBase + dxc;
          const cy = cyBase + dyc;
          if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) continue;
          const px = cx * CELL_W + CELL_W / 2;
          const py = cy * CELL_H + CELL_H / 2;
          const dx = px - cxPx;
          const dy = py - cyPx;
          if (dy >= 0) continue; // half-globe: no ripple below horizon
          const distSq = dx * dx + dy * dy;
          if (distSq > Rsq) continue;

          const z = Math.sqrt(Rsq - distSq);
          const lat = Math.asin(Math.max(-1, Math.min(1, -dy / R)));
          const lon = Math.atan2(dx, z) + spinAngle;
          const isLand = landElevation(lat, lon) > 0.5;
          ctx.fillStyle = isLand ? fg : mid;
          const cellAlpha = (1 - d / radius) * (isLand ? 0.85 : 0.55);
          halftoneDot(ctx, cx * CELL_W, cy * CELL_H, cellAlpha);
        }
      }
      ctx.globalAlpha = 1;
    };

    /** Renders the swarm-to-globe intro: each particle eases from its
     *  off-disc spawn point to its final land cell with a per-particle
     *  delay (`t0`) so the disc fills outside-in. Returns `true` when
     *  every particle has arrived — at that point the static `drawPlanet`
     *  takes over and this never runs again. */
    const drawFormation = (t: number): boolean => {
      const f = formationRef.current;
      if (!f) return true;
      const elapsed = t - f.startT;
      ctx.font = `${FONT_PX}px var(--nx-font-mono, ui-monospace, "JetBrains Mono", Menlo, monospace)`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = getFg();
      const travel = f.travelTime;
      const p = f.particles;
      let allDone = true;
      for (let i = 0; i < f.count; i++) {
        const o = i * 6;
        const sx = p[o + 0];
        const sy = p[o + 1];
        const tx = p[o + 2];
        const ty = p[o + 3];
        const t0 = p[o + 4];
        const finalA = p[o + 5];
        const localT = (elapsed - t0) / travel;
        if (localT >= 1) {
          halftoneDot(ctx, tx, ty, finalA);
          continue;
        }
        if (localT <= 0) {
          allDone = false;
          continue;
        }
        allDone = false;
        // ease-out cubic
        const inv = 1 - localT;
        const u = 1 - inv * inv * inv;
        const px = sx + (tx - sx) * u;
        const py = sy + (ty - sy) * u;
        // Trail-in fade: dim while travelling, full alpha on arrival.
        const flightA = 0.12 + (finalA - 0.12) * u;
        halftoneDot(ctx, px, py, flightA);
      }
      ctx.globalAlpha = 1;
      if (allDone) {
        f.active = false;
        formationPlayedRef.current = true;
        formationRef.current = null;
      }
      return allDone;
    };

    /** Walk the visible cell grid and collect every land/ice cell at the
     *  given spin angle as a [px, py, alpha, glyphIdx=G_STAR] tuple.
     *  Mirrors drawPlanet's iteration but accumulates instead of drawing
     *  — used as the source/destination set for globe↔construction
     *  morphs. */
    const collectGlobeLandCells = (spinAngle: number): { data: Float32Array; count: number } => {
      const { cxPx, cyPx, R } = sphereRef.current;
      const Rsq = R * R;
      const acc: number[] = [];
      const minRow = Math.max(0, Math.floor((cyPx - R) / CELL_H) - 1);
      for (let cy = minRow; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const px = cx * CELL_W + CELL_W / 2;
          const py = cy * CELL_H + CELL_H / 2;
          const dx = px - cxPx;
          const dy = py - cyPx;
          if (dy >= 0) continue;
          const distSq = dx * dx + dy * dy;
          if (distSq > Rsq) continue;
          const z = Math.sqrt(Rsq - distSq);
          const lat = Math.asin(Math.max(-1, Math.min(1, -dy / R)));
          const lon = Math.atan2(dx, z) + spinAngle;
          if (landElevation(lat, lon) < 0.5) continue;
          const isPolar = lat > 1.30;
          const baseAlpha = isPolar ? 0.85 : 0.92;
          const shading = Math.pow(z / R, 0.45);
          const lonInt = Math.floor(lon * 28);
          const latInt = Math.floor(lat * 28);
          let alpha = baseAlpha * (0.45 + shading * 0.6);
          alpha *= 0.92 + hash(lonInt, latInt) * 0.10;
          alpha = Math.max(0.10, Math.min(1, alpha));
          acc.push(cx * CELL_W, cy * CELL_H, alpha, G_STAR);
        }
      }
      return { data: Float32Array.from(acc), count: acc.length / 4 };
    };

    /** Fisher-Yates shuffle over an Int32Array index range — used to
     *  randomise the src↔dst pairing in `buildMorph` so trajectories
     *  cross naturally rather than each particle going in a parallel
     *  straight line. */
    const shuffledIndices = (n: number): Int32Array => {
      const a = new Int32Array(n);
      for (let i = 0; i < n; i++) a[i] = i;
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    };

    /** Build a per-particle morph buffer between two cell sets. Each
     *  particle gets a randomised pairing src→dst plus a stagger delay,
     *  and the count is `max(srcCount, dstCount)` so the larger set
     *  doesn't lose detail. */
    const buildMorph = (
      direction: 'globe-to-construction' | 'construction-to-globe',
      spinAngle: number,
      rotY: number,
      anchorX: number,
    ) => {
      const { cyPx, R } = sphereRef.current;
      const globeCells = collectGlobeLandCells(spinAngle);
      const constData = projectConstruction(rotY, anchorX, cyPx, R, width, height);
      const constCells = { data: constData.data, count: constData.count };
      // ProjectConstruction reuses a module-scoped Map — copy out before
      // the next call clobbers it.
      const constCopy = constCells.data.slice(0, constCells.count * 4);

      const src = direction === 'globe-to-construction' ? globeCells : { data: constCopy, count: constCells.count };
      const dst = direction === 'globe-to-construction' ? { data: constCopy, count: constCells.count } : globeCells;
      const M = Math.max(src.count, dst.count);
      if (M === 0) {
        morphRef.current = null;
        return;
      }
      const srcOrder = shuffledIndices(src.count);
      const dstOrder = shuffledIndices(dst.count);
      const particles = new Float32Array(M * 9);
      for (let i = 0; i < M; i++) {
        const sIdx = srcOrder[i % src.count];
        const dIdx = dstOrder[i % dst.count];
        const sOff = sIdx * 4;
        const dOff = dIdx * 4;
        const o = i * 9;
        particles[o + 0] = src.data[sOff + 0];
        particles[o + 1] = src.data[sOff + 1];
        particles[o + 2] = src.data[sOff + 2];
        particles[o + 3] = src.data[sOff + 3];
        particles[o + 4] = dst.data[dOff + 0];
        particles[o + 5] = dst.data[dOff + 1];
        particles[o + 6] = dst.data[dOff + 2];
        particles[o + 7] = dst.data[dOff + 3];
        particles[o + 8] = Math.random() * 0.45;
      }
      morphRef.current = {
        active: true,
        startT: performance.now() / 1000,
        duration: 1.8,
        travelTime: 1.25,
        particles,
        count: M,
      };
    };

    /** Render the per-particle morph: each particle eases from src to dst
     *  along a straight screen-space line. Glyph and alpha cross-fade —
     *  src glyph fades out as dst glyph fades in, with a slight dim in
     *  the middle to mask the transition. */
    const drawMorph = (t: number): boolean => {
      const m = morphRef.current;
      if (!m) return true;
      const elapsed = t - m.startT;
      ctx.font = `${FONT_PX}px var(--nx-font-mono, ui-monospace, "JetBrains Mono", Menlo, monospace)`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = getFg();
      const travel = m.travelTime;
      const p = m.particles;
      let allDone = true;
      for (let i = 0; i < m.count; i++) {
        const o = i * 9;
        const sx = p[o + 0];
        const sy = p[o + 1];
        const sa = p[o + 2];
        const sg = p[o + 3] | 0;
        const tx = p[o + 4];
        const ty = p[o + 5];
        const ta = p[o + 6];
        const tg = p[o + 7] | 0;
        const t0 = p[o + 8];
        const localT = (elapsed - t0) / travel;
        if (localT >= 1) {
          halftoneDot(ctx, tx, ty, ta);
          continue;
        }
        if (localT <= 0) {
          allDone = false;
          halftoneDot(ctx, sx, sy, sa);
          continue;
        }
        allDone = false;
        // ease in-out cubic for a settled landing.
        const u = localT < 0.5
          ? 4 * localT * localT * localT
          : 1 - Math.pow(-2 * localT + 2, 3) / 2;
        const px = sx + (tx - sx) * u;
        const py = sy + (ty - sy) * u;
        // Cross-fade through the flight: src dominant first half, dst
        // dominant second half. Slight mid-flight dim hides the swap.
        const dim = 1 - 0.3 * Math.sin(localT * Math.PI);
        const srcA = sa * Math.max(0, 1 - localT * 1.6) * dim;
        const dstA = ta * Math.max(0, localT * 1.6 - 0.6) * dim;
        if (srcA > 0.02) halftoneDot(ctx, px, py, srcA);
        if (dstA > 0.02) halftoneDot(ctx, px, py, dstA);
      }
      ctx.globalAlpha = 1;
      if (allDone) {
        m.active = false;
        morphRef.current = null;
      }
      return allDone;
    };

    /** Stamp the construction site at the given y-rotation. Glyph picked
     *  per-cell via projectConstruction's deduped output, alpha is the
     *  caller's responsibility (set globalAlpha before calling). */
    const drawConstruction = (rotY: number) => {
      const { cxPx, cyPx, R } = sphereRef.current;
      const sel = selectedCityRef.current;
      const anchorX = sel.anchorActive ? sel.anchorX : cxPx;
      const cells = projectConstruction(rotY, anchorX, cyPx, R, width, height);
      ctx.font = `${FONT_PX}px var(--nx-font-mono, ui-monospace, "JetBrains Mono", Menlo, monospace)`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = getFg();
      const data = cells.data;
      const baseAlpha = ctx.globalAlpha;
      for (let i = 0; i < cells.count; i++) {
        const o = i * 4;
        const px = data[o + 0];
        const py = data[o + 1];
        const a  = data[o + 2];
        if (px < -8 || px > width + 8 || py < -8 || py > height + 8) continue;
        halftoneDot(ctx, px, py, baseAlpha * a);
      }
      ctx.globalAlpha = baseAlpha;
    };

    // ── Loop timing ────────────────────────────────────────────────────
    // Globe and construction "hold" durations are how long each phase is
    // visible before auto-morphing to the other. Morph is the cross-fade
    // window. All in seconds.
    const HOLD_GLOBE = 14.0;
    const HOLD_CONSTRUCTION = 12.0;
    const MORPH_DURATION = 1.6;

    const draw = () => {
      ensureBuilt();
      const stars = starsLayerRef.current;
      const site = siteLayerRef.current;
      if (!stars || !site) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const t = performance.now() / 1000;
      const formActive = !!formationRef.current?.active;

      // ── Mode transitions (state machine) ────────────────────────────
      const m = modeRef.current;
      // Initialise startT lazily so it's anchored to first real frame.
      if (m.startT === 0) m.startT = t;
      const elapsed = t - m.startT;

      if (m.mode === 'forming' && !formActive) {
        m.mode = 'globe';
        m.startT = t;
      } else if (m.mode === 'globe' && !reducedMotion && elapsed > HOLD_GLOBE) {
        m.mode = 'globe-to-construction';
        m.startT = t;
        // Reset rotation state at the *start* of the morph so both the
        // morph-in and the subsequent construction phase begin at rotY=0.
        // (Advancing during the morph would otherwise drift the start angle
        // by ~1.7 rad on every loop.)
        constStateRef.current.baseT = 0;
        constStateRef.current.manualOffset = 0;
        constStateRef.current.lastT = t;
        const spinNow = spinState.baseT * 0.30 + spinState.manualOffset;

        // The pre-launch step (in the 'globe' branch below) has already
        // chosen the city for this cycle and locked it into
        // selectedCityRef.current.idx. Capture the anchor and fire the
        // morph. Fall back to canvas centre only when no pre-pick ran
        // (e.g. very first cycle if HOLD_GLOBE < PRELAUNCH_LEAD).
        const cities = citiesRef.current;
        const pickIdx = selectedCityRef.current.idx;
        if (cities.length > 0 && pickIdx >= 0 && pickIdx < cities.length) {
          const sphere = sphereRef.current;
          const { dx } = cityPosition(cities[pickIdx], spinNow);
          // Clamp anchor so the 50-wide crane scene stays on canvas.
          const sceneScale = Math.min(width / 50, (height - 12) / 53);
          const halfPx = 25 * sceneScale;
          const rawX = sphere.cxPx + dx;
          const anchorX = Math.max(halfPx + 8, Math.min(width - halfPx - 8, rawX));
          selectedCityRef.current = {
            ...selectedCityRef.current,
            anchorX,
            anchorActive: true,
          };
          buildMorph('globe-to-construction', spinNow, 0, anchorX);
        } else {
          buildMorph('globe-to-construction', spinNow, 0, sphereRef.current.cxPx);
        }
      } else if (m.mode === 'globe-to-construction' && elapsed > MORPH_DURATION) {
        m.mode = 'construction';
        m.startT = t;
      } else if (m.mode === 'construction' && !reducedMotion && elapsed > HOLD_CONSTRUCTION) {
        m.mode = 'construction-to-globe';
        m.startT = t;
        // Source = construction at the *current* (frozen) rotation, dst =
        // globe at its current spin angle. After morph completes the globe
        // resumes from this same spinAngle. Re-use the captured city
        // anchor so the crane's X stays consistent through the unwind.
        const cs2 = constStateRef.current;
        const rotNow = cs2.baseT * 0.18 + cs2.manualOffset;
        const spinNow = spinState.baseT * 0.30 + spinState.manualOffset;
        const anchorX = selectedCityRef.current.anchorActive
          ? selectedCityRef.current.anchorX
          : sphereRef.current.cxPx;
        buildMorph('construction-to-globe', spinNow, rotNow, anchorX);
      } else if (m.mode === 'construction-to-globe' && elapsed > MORPH_DURATION) {
        m.mode = 'globe';
        m.startT = t;
        // Story handed back to the network — clear both flags so the
        // next cycle's pre-launch picks a fresh city. `idx` is preserved
        // so the increment in the pre-launch step rotates forward.
        selectedCityRef.current = {
          ...selectedCityRef.current,
          anchorActive: false,
          prePickActive: false,
        };
      }
      const mode = m.mode;
      const phaseElapsed = t - m.startT;

      // ── Spin/rotation accumulators ──────────────────────────────────
      const spinDt = spinState.lastT === 0 ? 0 : t - spinState.lastT;
      spinState.lastT = t;
      // Spin only advances during 'globe' itself — freezing during morph
      // phases keeps morph particles aimed at fixed targets.
      const advanceGlobeSpin =
        !spinState.dragging && !reducedMotion && !formActive && mode === 'globe';
      if (advanceGlobeSpin) spinState.baseT += spinDt;
      const spinAngle = spinState.baseT * 0.30 + spinState.manualOffset;

      const cs = constStateRef.current;
      const constDt = cs.lastT === 0 ? 0 : t - cs.lastT;
      cs.lastT = t;
      // Rotation only advances during the `construction` hold phase. If we
      // also advanced during morph phases, the start angle of every later
      // cycle would drift by `0.18 * MORPH_DURATION ≈ 0.29 rad` per pass.
      const advanceConstRot = !cs.dragging && !reducedMotion && mode === 'construction';
      if (advanceConstRot) cs.baseT += constDt;
      const constRot = cs.baseT * 0.18 + cs.manualOffset;

      // Pre-launch hand-off — ramp 0 → 1 across the last second of the
      // globe hold so the about-to-be-selected city visibly lights up
      // before the morph fires. Held at 1 through the morph for the
      // halo continuity, then released after construction-to-globe ends.
      const PRELAUNCH_LEAD = 1.0;
      if (mode === 'globe') {
        prelaunchRef.current = Math.max(0, Math.min(1,
          (phaseElapsed - (HOLD_GLOBE - PRELAUNCH_LEAD)) / PRELAUNCH_LEAD,
        ));
      } else if (mode === 'globe-to-construction') {
        prelaunchRef.current = 1;
      } else {
        prelaunchRef.current = 0;
      }

      // Pre-pick the city for the upcoming cycle the moment the
      // pre-launch ramp begins. We commit to the choice early so the
      // halo/boost on the city marker matches the eventual zoom-in
      // anchor exactly. If the natural next city (idx+1 mod len) is on
      // the back side of the globe right now, we scan forward for a
      // visible one — we want the audience to see the marker pulse
      // before the morph fires.
      if (
        mode === 'globe'
        && prelaunchRef.current > 0.001
        && !selectedCityRef.current.prePickActive
      ) {
        const cities = citiesRef.current;
        if (cities.length > 0) {
          const start = (selectedCityRef.current.idx + 1 + cities.length) % cities.length;
          let pickIdx = start;
          for (let attempt = 0; attempt < cities.length; attempt++) {
            const idx = (start + attempt) % cities.length;
            const { dz } = cityPosition(cities[idx], spinAngle);
            if (dz >= 0) { pickIdx = idx; break; }
          }
          selectedCityRef.current = {
            ...selectedCityRef.current,
            idx: pickIdx,
            prePickActive: true,
          };
        }
      }

      // ── Background passes (always drawn) ────────────────────────────
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      // Pick the backdrop based on mode and crossfade through morph
      // phases — the starfield owns globe time, the blueprint/site grid
      // owns construction time, and the two ease into each other while
      // the swarm of particles is in flight.
      let starsAlpha = 1;
      let siteAlpha = 0;
      if (mode === 'construction') {
        starsAlpha = 0;
        siteAlpha = 1;
      } else if (mode === 'globe-to-construction') {
        const k = Math.max(0, Math.min(1, phaseElapsed / MORPH_DURATION));
        starsAlpha = 1 - k;
        siteAlpha = k;
      } else if (mode === 'construction-to-globe') {
        const k = Math.max(0, Math.min(1, phaseElapsed / MORPH_DURATION));
        starsAlpha = k;
        siteAlpha = 1 - k;
      }
      if (starsAlpha > 0.001) {
        ctx.globalAlpha = starsAlpha;
        ctx.drawImage(stars, 0, 0, stars.width, stars.height, 0, 0, width, height);
      }
      if (siteAlpha > 0.001) {
        ctx.globalAlpha = siteAlpha;
        ctx.drawImage(site, 0, 0, site.width, site.height, 0, 0, width, height);
      }
      ctx.globalAlpha = 1;

      // Soft contact shadow under the globe (only while the globe is on
      // stage — fades with the same alpha as the planet).
      const drawShadow = (alpha: number) => {
        if (alpha <= 0.001) return;
        const dark = isDark();
        const sphere = sphereRef.current;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(sphere.cxPx, height);
        ctx.scale(1, 0.10);
        const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sphere.R * 1.05);
        shadowGrad.addColorStop(0,   dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.22)');
        shadowGrad.addColorStop(0.4, dark ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.09)');
        shadowGrad.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, sphere.R * 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      // ── Mode dispatch ───────────────────────────────────────────────
      if (mode === 'forming') {
        drawShadow(1);
        // Ocean first — defines the sphere's silhouette so the disc never
        // reads as blank space during the intro.
        drawPlanet(t, 0, true);
        drawFormation(t);
        const f = formationRef.current;
        if (f) {
          const fadeStart = f.duration - 0.6;
          const cityAlpha = Math.max(0, Math.min(1, (t - f.startT - fadeStart) / 0.6));
          if (cityAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = cityAlpha;
            drawCities(t, 0);
            ctx.restore();
          }
        }
      } else if (mode === 'globe') {
        drawShadow(1);
        drawPlanet(t, spinAngle);
        drawCities(t, spinAngle);
        if (showDotCursor && mouse.active) drawCursorRipple(spinAngle);
      } else if (mode === 'construction') {
        drawConstruction(constRot);
      } else if (mode === 'globe-to-construction' || mode === 'construction-to-globe') {
        // Cities/drone fade out fast at the start of the morph so they
        // don't fight the swarm visually.
        const fadeCity = Math.max(0, 1 - phaseElapsed / 0.4);
        if (mode === 'globe-to-construction' && fadeCity > 0.01) {
          drawShadow(fadeCity);
          ctx.save();
          ctx.globalAlpha = fadeCity;
          drawCities(t, spinAngle);
          ctx.restore();
        }
        drawMorph(t);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    /** Drag is routed by current mode: globe-mode drives planet spin,
     *  construction-mode drives the y-rotation of the construction yard.
     *  During morph phases drag is locked. */
    const dragTarget = (): 'globe' | 'construction' | null => {
      const mode = modeRef.current.mode;
      if (mode === 'globe') return 'globe';
      if (mode === 'construction') return 'construction';
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;

      if (spinState.dragging) {
        const dx = e.clientX - spinState.dragLastX;
        spinState.dragLastX = e.clientX;
        // Drag right → planet appears to spin right → spinAngle decreases.
        // 0.005 rad/px ≈ 1 full revolution per ~1250px of drag.
        spinState.manualOffset -= dx * 0.005;
      } else if (constStateRef.current.dragging) {
        const cs = constStateRef.current;
        const dx = e.clientX - cs.dragLastX;
        cs.dragLastX = e.clientX;
        // Drag right → construction yard appears to rotate right.
        cs.manualOffset += dx * 0.006;
      }
    };
    const onPointerLeave = () => {
      mouse.active = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      const tgt = dragTarget();
      if (tgt === 'globe') {
        spinState.dragging = true;
        spinState.dragLastX = e.clientX;
        spinState.dragPointerId = e.pointerId;
      } else if (tgt === 'construction') {
        const cs = constStateRef.current;
        cs.dragging = true;
        cs.dragLastX = e.clientX;
        cs.dragPointerId = e.pointerId;
      } else {
        return; // morph phases — ignore drag
      }
      try { container.setPointerCapture(e.pointerId); } catch {}
      container.style.cursor = 'grabbing';
    };
    const endDrag = (e?: PointerEvent) => {
      const cs = constStateRef.current;
      const wasDragging = spinState.dragging || cs.dragging;
      if (!wasDragging) return;
      const releaseId =
        spinState.dragPointerId >= 0 ? spinState.dragPointerId :
        cs.dragPointerId >= 0 ? cs.dragPointerId : -1;
      spinState.dragging = false;
      cs.dragging = false;
      spinState.dragPointerId = -1;
      cs.dragPointerId = -1;
      if (e && releaseId >= 0) {
        try { container.releasePointerCapture(releaseId); } catch {}
      }
      container.style.cursor = 'grab';
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    resize();

    const themeObs = new MutationObserver(() => {
      starsLayerRef.current = null;
      siteLayerRef.current = null;
      colorRef.current = '';
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    container.style.cursor = 'grab';
    container.style.touchAction = 'none'; // prevent browser pan gestures from eating the drag
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      themeObs.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', endDrag);
      container.removeEventListener('pointercancel', endDrag);
      reducedMotionMQ.removeEventListener('change', onReducedMotionChange);
    };
  }, [showDotCursor]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white dark:bg-black select-none overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
