// 3D ASCII tower-crane scene rasterised to the same 4×5 cell grid as the
// globe. Returns a flat Float32Array per frame: stride 4 floats per visible
// cell — [px, py, alpha, glyphIdx]. Ascii-skyline pulls the array and
// stamps each cell with the corresponding glyph from GLYPHS.
//
// NOTE: the per-call cellMap is module-scoped to avoid per-frame allocation.
// Two AsciiSkyline instances on the same page would race on it — at present
// only one ever mounts in this app.

const CELL_W = 3;
const CELL_H = 4;

// Unified glyph palette shared with ascii-skyline so morph particles can
// switch glyph as they fly between forms. Index 0 is the globe's only glyph
// (`*`); the rest are crane / construction glyphs.
export const GLYPHS = [
  '*', '|', '-', '/', '\\', '+', '#', '.', ':', '=', '·', 'o', 'T', 'X',
] as const;

export const G_STAR = 0;
// The crane is rendered exclusively in `*`. Every other named glyph
// alias collapses to G_STAR so existing scene definitions keep reading
// naturally — vertical, horizontal, diagonal, and fill glyphs all stamp
// the same `*` character.
const G_VERT = G_STAR;
const G_HORIZ = G_STAR;
const G_DIAG_UP = G_STAR;
const G_DIAG_DN = G_STAR;
const G_PLUS = G_STAR;
const G_HASH = G_STAR;
const G_DOT = G_STAR;
const G_EQ = G_STAR;
const G_DOT_SMALL = G_STAR;
const G_O = G_STAR;

type P3 = readonly [number, number, number];
type Edge = readonly [P3, P3, number?]; // optional glyph hint

/** All 12 edges of an axis-aligned wireframe box. */
function boxEdges(
  x: number, y: number, z: number,
  w: number, h: number, d: number,
  hint?: number,
): Edge[] {
  const x0 = x, x1 = x + w;
  const y0 = y, y1 = y + h;
  const z0 = z, z1 = z + d;
  const v: P3[] = [
    [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
    [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
  ];
  return [
    [v[0], v[1], hint], [v[1], v[2], hint], [v[2], v[3], hint], [v[3], v[0], hint],
    [v[4], v[5], hint], [v[5], v[6], hint], [v[6], v[7], hint], [v[7], v[4], hint],
    [v[0], v[4], hint], [v[1], v[5], hint], [v[2], v[6], hint], [v[3], v[7], hint],
  ];
}

/** Truss-style mast: square cross-section with horizontal cross-bars every
 *  `step` units of height and X-bracing on all four faces. */
function trussMast(
  x: number, y0: number, z: number,
  w: number, h: number, d: number,
  step: number,
): Edge[] {
  const out: Edge[] = [...boxEdges(x, y0, z, w, h, d)];
  // Horizontal cross-bars wrapping all four faces at every step.
  for (let yy = y0 + step; yy < y0 + h; yy += step) {
    out.push(
      [[x,     yy, z    ], [x + w, yy, z    ], G_HORIZ],
      [[x + w, yy, z    ], [x + w, yy, z + d], G_HORIZ],
      [[x + w, yy, z + d], [x,     yy, z + d], G_HORIZ],
      [[x,     yy, z + d], [x,     yy, z    ], G_HORIZ],
    );
  }
  // X-bracing on every face — gives the truss its characteristic lattice.
  for (let yy = y0; yy < y0 + h; yy += step * 2) {
    const yt = Math.min(y0 + h, yy + step * 2);
    out.push(
      // Front face (z = z).
      [[x,     yy, z], [x + w, yt, z], G_DIAG_UP],
      [[x + w, yy, z], [x,     yt, z], G_DIAG_DN],
      // Back face (z = z + d).
      [[x,     yy, z + d], [x + w, yt, z + d], G_DIAG_UP],
      [[x + w, yy, z + d], [x,     yt, z + d], G_DIAG_DN],
      // Right face.
      [[x + w, yy, z    ], [x + w, yt, z + d], G_DIAG_UP],
      [[x + w, yy, z + d], [x + w, yt, z    ], G_DIAG_DN],
      // Left face.
      [[x,     yy, z    ], [x,     yt, z + d], G_DIAG_UP],
      [[x,     yy, z + d], [x,     yt, z    ], G_DIAG_DN],
    );
  }
  return out;
}

/** Box-truss arm (jib / counter-jib): 12 edges of the box plus internal
 *  vertical struts and X-bracing on the front/back/top faces. */
function boxTrussArm(
  x: number, y0: number, z: number,
  w: number, h: number, d: number,
  step: number,
): Edge[] {
  const out: Edge[] = [...boxEdges(x, y0, z, w, h, d)];
  const nSteps = Math.max(1, Math.round(w / step));
  // Vertical struts every `step` along x on both front and back faces.
  for (let i = 1; i < nSteps; i++) {
    const xi = x + (i * w) / nSteps;
    out.push(
      [[xi, y0,     z    ], [xi, y0 + h, z    ], G_VERT],
      [[xi, y0,     z + d], [xi, y0 + h, z + d], G_VERT],
    );
  }
  // X-bracing along the length on front and back faces.
  for (let i = 0; i < nSteps; i++) {
    const xa = x + (i * w) / nSteps;
    const xb = x + ((i + 1) * w) / nSteps;
    out.push(
      // Front face.
      [[xa, y0,     z], [xb, y0 + h, z], G_DIAG_UP],
      [[xb, y0,     z], [xa, y0 + h, z], G_DIAG_DN],
      // Back face.
      [[xa, y0,     z + d], [xb, y0 + h, z + d], G_DIAG_UP],
      [[xb, y0,     z + d], [xa, y0 + h, z + d], G_DIAG_DN],
      // Top face — zigzag bracing.
      [[xa, y0 + h, z], [xb, y0 + h, z + d], G_DIAG_UP],
      [[xb, y0 + h, z], [xa, y0 + h, z + d], G_DIAG_DN],
    );
  }
  return out;
}

/** Surface hatch on the three visible faces of an axis-aligned box.
 *  Each face gets its own line spacing so the eye reads the box as a
 *  three-dimensional volume rather than a flat fill: the front face is
 *  the densest (camera-facing, brightest), the top face slightly
 *  sparser, and the side face the most open. Pass a single `baseStep`
 *  to scale all three together. */
function fillBox(
  x: number, y: number, z: number,
  w: number, h: number, d: number,
  baseStep = 0.28,
): Edge[] {
  const out: Edge[] = [];
  const frontStep = baseStep;          // brightest — densest hatch
  const topStep   = baseStep * 1.30;   // mid — top-lit but smaller area
  const sideStep  = baseStep * 1.75;   // most open — falls into shadow

  // Front face (z = z): horizontal lines stacked vertically.
  for (let yy = y; yy <= y + h + 1e-6; yy += frontStep) {
    out.push([[x, yy, z], [x + w, yy, z], G_STAR]);
  }
  // Right face (x = x + w): horizontal lines along z.
  for (let yy = y; yy <= y + h + 1e-6; yy += sideStep) {
    out.push([[x + w, yy, z], [x + w, yy, z + d], G_STAR]);
  }
  // Top face (y = y + h): lines along x at each z step.
  for (let zz = z; zz <= z + d + 1e-6; zz += topStep) {
    out.push([[x, y + h, zz], [x + w, y + h, zz], G_STAR]);
  }
  return out;
}

/** Octagonal slewing-ring footprint: short cylinder approximated as an
 *  8-sided prism. Used for the turntable between mast top and cab. */
function slewingRing(cx: number, cy: number, cz: number, r: number, h: number): Edge[] {
  const out: Edge[] = [];
  const sides = 8;
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * r;
    const z0 = cz + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const z1 = cz + Math.sin(a1) * r;
    out.push(
      [[x0, cy,     z0], [x1, cy,     z1], G_HORIZ],
      [[x0, cy + h, z0], [x1, cy + h, z1], G_HORIZ],
      [[x0, cy,     z0], [x0, cy + h, z0], G_VERT],
    );
  }
  return out;
}

/** World coordinates: origin at scene centre on the ground, +y up,
 *  +x east, +z south. Scene fits in roughly 44×52×8.
 *
 *  ── Tower crane anatomy ────────────────────────────────────────────
 *    Foundation pad → tower mast (truss) → slewing ring → operator cab
 *    → A-frame apex (cathead) → forward jib (long, with trolley + hook
 *    + hanging load) → counter-jib (short) with stacked counter-weights
 *    → diagonal pendant tie-bars from the apex to both jib ends. */
const SCENE_EDGES: Edge[] = (() => {
  const E: Edge[] = [];

  // ── Foundation pad ────────────────────────────────────────────────
  E.push(...boxEdges(-4, 0, -4, 8, 1.5, 8, G_HASH));
  E.push(...fillBox(-4, 0, -4, 8, 1.5, 8, 0.28));
  // Subtle pad outline on the ground (helps anchor the structure).
  E.push(
    [[-5, 0, -5], [ 5, 0, -5], G_DOT_SMALL],
    [[ 5, 0, -5], [ 5, 0,  5], G_DOT_SMALL],
    [[ 5, 0,  5], [-5, 0,  5], G_DOT_SMALL],
    [[-5, 0,  5], [-5, 0, -5], G_DOT_SMALL],
  );

  // ── Tower mast (truss style, 4×4, 36 tall) ────────────────────────
  E.push(...trussMast(-2, 1.5, -2, 4, 36, 4, 1.5)); // dense bracing
  // Climbing ladder up the front face — short rungs at every truss bay.
  for (let yy = 3; yy < 36; yy += 1.5) {
    E.push([[-0.6, yy, -2.05], [0.6, yy, -2.05], G_EQ]);
  }
  E.push(
    [[-0.6, 1.5, -2.05], [-0.6, 37.5, -2.05], G_VERT],
    [[ 0.6, 1.5, -2.05], [ 0.6, 37.5, -2.05], G_VERT],
  );

  // ── Slewing ring / turntable ──────────────────────────────────────
  E.push(...slewingRing(0, 37.5, 0, 3, 1.2));

  // ── Operator cab ──────────────────────────────────────────────────
  E.push(...boxEdges(-3, 38.7, -3, 6, 4, 6));
  E.push(...fillBox(-3, 38.7, -3, 6, 4, 6, 0.28));
  // Front-window mullions (split into a 2×2 grid of glass panels).
  E.push(
    [[-3, 40.7, -3], [ 3, 40.7, -3], G_HORIZ],
    [[ 0, 38.7, -3], [ 0, 42.7, -3], G_VERT],
  );
  // Side-window mullion on the right cheek.
  E.push([[3, 40.7, -3], [3, 40.7, 3], G_HORIZ]);
  // Roof access hatch.
  E.push(...boxEdges(-1, 42.7, -1, 2, 0.6, 2, G_PLUS));
  E.push(...fillBox(-1, 42.7, -1, 2, 0.6, 2, 0.20));

  // ── A-frame apex / cathead (peak at y=50) ─────────────────────────
  // Four legs from the cab roof corners up to a single apex point.
  E.push(
    [[-3, 42.7, -3], [0, 50, 0], G_DIAG_UP],
    [[ 3, 42.7, -3], [0, 50, 0], G_DIAG_DN],
    [[-3, 42.7,  3], [0, 50, 0], G_DIAG_UP],
    [[ 3, 42.7,  3], [0, 50, 0], G_DIAG_DN],
  );
  // Cross-tie at mid-height for rigidity.
  E.push(
    [[-1.5, 46.4, -1.5], [ 1.5, 46.4,  1.5], G_HORIZ],
    [[ 1.5, 46.4, -1.5], [-1.5, 46.4,  1.5], G_HORIZ],
  );
  // Apex aircraft-warning beacon — small box at the very top.
  E.push(...boxEdges(-0.5, 50, -0.5, 1, 1.2, 1, G_PLUS));
  E.push(...fillBox(-0.5, 50, -0.5, 1, 1.2, 1, 0.18));

  // ── Forward jib (long working arm, x: 3 → 30) ─────────────────────
  E.push(...boxTrussArm(3, 43, -1, 27, 2, 2, 1.5)); // tighter struts
  // Bottom chord triangulation — gives the underside the classic jib look.
  for (let i = 0; i < 18; i++) {
    const xa = 3 + (i * 27) / 18;
    const xb = 3 + ((i + 1) * 27) / 18;
    E.push([[xa, 43, 0], [xb, 41.5, 0], G_DIAG_DN]);
    E.push([[xb, 41.5, 0], [xa + 1.5, 43, 0], G_DIAG_UP]);
  }

  // ── Counter-jib (short rear arm, x: -13 → -3) ─────────────────────
  E.push(...boxTrussArm(-13, 43, -1, 10, 2, 2, 1.5));
  // Stacked counter-weights at the far end — solid, hatched.
  E.push(
    ...boxEdges(-13, 39, -1.5, 4, 4, 3, G_HASH),
    ...fillBox(-13, 39, -1.5, 4, 4, 3, 0.18),
    ...boxEdges(-13, 35, -1.5, 4, 4, 3, G_HASH),
    ...fillBox(-13, 35, -1.5, 4, 4, 3, 0.18),
  );
  // Machinery deck on top (winch housing).
  E.push(
    ...boxEdges(-9, 45, -1.2, 5, 2, 2.4, G_HASH),
    ...fillBox(-9, 45, -1.2, 5, 2, 2.4, 0.18),
  );

  // ── Pendant tie-bars (diagonal cables from apex to both arms) ─────
  // To forward jib — three suspension lines fan out to brace the long arm.
  E.push(
    [[0, 50.6, 0], [10, 45, 0], G_DIAG_DN],
    [[0, 50.6, 0], [20, 45, 0], G_DIAG_DN],
    [[0, 50.6, 0], [30, 45, 0], G_DIAG_DN],
  );
  // To counter-jib — two short pendants to the weight stack.
  E.push(
    [[0, 50.6, 0], [-8,  45, 0], G_DIAG_UP],
    [[0, 50.6, 0], [-13, 45, 0], G_DIAG_UP],
  );

  // ── Trolley + hoist cable + hook block + hanging load ─────────────
  // Trolley straddling the bottom chord of the jib at x = 20.
  E.push(
    ...boxEdges(19, 41.4, -1, 2, 1.2, 2, G_HASH),
    ...fillBox(19, 41.4, -1, 2, 1.2, 2, 0.20),
  );
  // Twin hoist cables from trolley down to hook block.
  E.push(
    [[19.5, 41.4, 0], [19.5, 6.5, 0], G_VERT],
    [[20.5, 41.4, 0], [20.5, 6.5, 0], G_VERT],
  );
  // Hook block (housing for the sheaves).
  E.push(
    ...boxEdges(19, 4.5, -1, 2, 2, 2, G_HASH),
    ...fillBox(19, 4.5, -1, 2, 2, 2, 0.20),
  );
  // Hook hint — small V below the block.
  E.push(
    [[20, 4.5, 0], [19.4, 3.5, 0], G_DIAG_DN],
    [[20, 4.5, 0], [20.6, 3.5, 0], G_DIAG_UP],
    [[19.4, 3.5, 0], [20.6, 3.5, 0], G_HORIZ],
  );
  // Hanging load — pallet of materials sitting just under the hook.
  E.push(
    ...boxEdges(18, 0, -2, 4, 3, 4, G_EQ),
    ...fillBox(18, 0, -2, 4, 3, 4, 0.18),
  );
  // Strapping diagonals on the load.
  E.push(
    [[18, 3, -2], [22, 0, -2], G_DIAG_DN],
    [[22, 3, -2], [18, 0, -2], G_DIAG_UP],
  );

  // ── Sub-assembly detail layer ─────────────────────────────────────
  // Small mechanical pieces that lift the crane silhouette from a
  // generic outline into a recognisable, lived-in machine.

  // Mast climbing cage — thin hoops guarding the ladder every ~5m.
  for (let yy = 5; yy <= 35; yy += 5) {
    E.push(...boxEdges(-1.4, yy, -2.7, 2.8, 0.5, 0.7, G_HASH));
  }

  // Slewing motor housing — clipped to the underside of the turntable,
  // offset off-axis so it reads as a piece of machinery.
  E.push(
    ...boxEdges(0.6, 36.3, 0.2, 1.5, 1.2, 1.5, G_HASH),
    ...fillBox(0.6, 36.3, 0.2, 1.5, 1.2, 1.5, 0.20),
  );

  // Cab-roof A/C unit — offset from the central hatch.
  E.push(
    ...boxEdges(-2.2, 43.3, 0.4, 1.6, 0.7, 1.6, G_HASH),
    ...fillBox(-2.2, 43.3, 0.4, 1.6, 0.7, 1.6, 0.20),
  );

  // Cab antenna — slim mast + tip on the right rear of the roof.
  E.push(
    [[1.6, 43.3, 0.6], [1.6, 46.2, 0.6], G_VERT],
    ...boxEdges(1.5, 46.2, 0.5, 0.2, 0.3, 0.2, G_PLUS),
  );

  // Trolley wheels — two 4-spoke discs on the visible side of the trolley.
  for (const wx of [19.4, 20.6]) {
    const wy = 41.55;
    const wz = -1.05;
    const r = 0.5;
    E.push(
      [[wx - r, wy,     wz], [wx + r, wy,     wz], G_HORIZ],
      [[wx,     wy - r, wz], [wx,     wy + r, wz], G_VERT],
      [[wx - r, wy - r, wz], [wx + r, wy + r, wz], G_DIAG_UP],
      [[wx - r, wy + r, wz], [wx + r, wy - r, wz], G_DIAG_DN],
    );
  }

  // Hoist cable drum on the machinery deck — boxy cylinder + cable wrap.
  E.push(
    ...boxEdges(-9, 47.0, -0.9, 5, 1.2, 1.8, G_HASH),
    ...fillBox(-9, 47.0, -0.9, 5, 1.2, 1.8, 0.20),
  );
  for (let zz = -0.9; zz <= 0.9 + 1e-6; zz += 0.4) {
    E.push([[-9, 47.6, zz], [-4, 47.6, zz], G_HORIZ]);
  }
  // End-cap spokes at each end of the drum (reads as a wheel face).
  for (const dx of [-9, -4]) {
    const dy = 47.6;
    const dz = 0;
    const r = 0.55;
    E.push(
      [[dx, dy - r, dz - r], [dx, dy + r, dz + r], G_DIAG_UP],
      [[dx, dy - r, dz + r], [dx, dy + r, dz - r], G_DIAG_DN],
      [[dx, dy,     dz - r], [dx, dy,     dz + r], G_HORIZ],
      [[dx, dy - r, dz    ], [dx, dy + r, dz    ], G_VERT],
    );
  }

  // Rebar bundles — vertical sticks rising from the load with a strap band.
  for (const rx of [18.5, 19.3, 20.1, 20.9, 21.5]) {
    E.push(
      [[rx, 3.0, -1.5], [rx, 4.5, -1.5], G_VERT],
      [[rx, 3.0,  0.0], [rx, 4.5,  0.0], G_VERT],
      [[rx, 3.0,  1.5], [rx, 4.5,  1.5], G_VERT],
    );
  }
  E.push(
    [[18.4, 3.7, -1.5], [21.6, 3.7, -1.5], G_HORIZ],
    [[18.4, 3.7,  0.0], [21.6, 3.7,  0.0], G_HORIZ],
    [[18.4, 3.7,  1.5], [21.6, 3.7,  1.5], G_HORIZ],
  );

  // Counter-jib catwalk — handrail + stanchions on the top of the rear arm.
  for (let xx = -13; xx <= -3; xx += 1.5) {
    E.push([[xx, 45, 0.85], [xx, 45.9, 0.85], G_VERT]);
  }
  E.push(
    [[-13, 45.9, 0.85], [-3, 45.9, 0.85], G_HORIZ],
    [[-13, 45.5, 0.85], [-3, 45.5, 0.85], G_HORIZ],
  );

  // Forward-jib maintenance walkway — same idea on the long arm so the
  // eye tracks a gangway out to the trolley and back.
  for (let xx = 3; xx <= 30; xx += 2) {
    E.push([[xx, 45, 0.85], [xx, 45.7, 0.85], G_VERT]);
  }
  E.push(
    [[3, 45.7, 0.85], [30, 45.7, 0.85], G_HORIZ],
    [[3, 45.3, 0.85], [30, 45.3, 0.85], G_HORIZ],
  );

  // Apex obstruction-light antenna — slim spike above the warning beacon.
  E.push(
    [[0, 51.2, 0], [0, 52.6, 0], G_VERT],
    ...boxEdges(-0.15, 52.6, -0.15, 0.3, 0.4, 0.3, G_PLUS),
  );

  return E;
})();

const TILT = 0.34;
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);

/** Pre-tilted projection. Scene is centred horizontally on `cxPx`.
 *  `groundY` is the screen-y where the ground centre (world (0,0,0))
 *  lands; caller computes it so the crane sits vertically balanced. */
function project(
  px: number, py: number, pz: number,
  rotY: number,
  scale: number,
  cxPx: number, groundY: number,
): { sx: number; sy: number; depth: number } {
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  const x2 = px * cosR + pz * sinR;
  const z2 = -px * sinR + pz * cosR;
  const y2 = py * COS_T - z2 * SIN_T;
  const z3 = py * SIN_T + z2 * COS_T;
  return {
    sx: cxPx + x2 * scale,
    sy: groundY - y2 * scale,
    depth: z3,
  };
}

export type ConstructionCells = {
  data: Float32Array; // stride 4: [px, py, alpha, glyphIdx]
  count: number;
};

type CellEntry = { alpha: number; glyphIdx: number; depth: number; px: number; py: number };
const cellMap = new Map<number, CellEntry>();

function pickGlyph(_dx: number, _dy: number): number {
  // Crane rasterises exclusively with `*`.
  return G_STAR;
}

function rasterizeEdge(
  edge: Edge,
  rotY: number,
  scale: number,
  cxPx: number,
  groundY: number,
): void {
  const a = project(edge[0][0], edge[0][1], edge[0][2], rotY, scale, cxPx, groundY);
  const b = project(edge[1][0], edge[1][1], edge[1][2], rotY, scale, cxPx, groundY);
  const dx = b.sx - a.sx;
  const dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  // Sub-cell stepping (~0.65 px) so every cell along an edge gets at
  // least one stamp, even on short / oblique segments. Combined with
  // the smaller fillBox baseStep, this packs many more dots into the
  // crane's surfaces while individual halftone dots stay small.
  const steps = Math.max(2, Math.ceil(len / 0.65));
  const glyph = edge[2] ?? pickGlyph(dx, dy);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sx = a.sx + dx * t;
    const sy = a.sy + dy * t;
    const depth = a.depth + (b.depth - a.depth) * t;
    const cx = Math.round(sx / CELL_W);
    const cy = Math.round(sy / CELL_H);
    const key = cx * 8192 + cy;
    const alpha = Math.max(0.18, Math.min(0.95, 0.62 - depth * 0.012));
    const existing = cellMap.get(key);
    if (!existing || existing.depth > depth) {
      cellMap.set(key, { alpha, glyphIdx: glyph, depth, px: cx * CELL_W, py: cy * CELL_H });
    }
  }
}

/** Trolley centre in world coordinates — exported so overlay drawings
 *  can land on the same point we rasterise the trolley assembly at. */
export const TROLLEY_WORLD: readonly [number, number, number] = [20, 42, 0];

/** Project a single world-space point with the exact scale, anchor, and
 *  tilt rules used by projectConstruction. Used by overlay drawings in
 *  ascii-skyline.tsx (e.g. the construction-phase uplink line that has
 *  to land on the moving trolley as the crane rotates). */
export function projectCranePoint(
  px: number, py: number, pz: number,
  rotY: number,
  cxPx: number,
  width: number,
  height: number,
): { sx: number; sy: number } {
  const scale = Math.min(width / 50, (height - 12) / 53);
  const groundY = height - 6;
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  const x2 = px * cosR + pz * sinR;
  const z2 = -px * sinR + pz * cosR;
  const y2 = py * COS_T - z2 * SIN_T;
  return { sx: cxPx + x2 * scale, sy: groundY - y2 * scale };
}

/** Project the crane at `rotY` and rasterise every edge to the cell grid.
 *  Cells are deduplicated per (cx, cy) — nearest-depth glyph wins, so
 *  front geometry overpaints back geometry. */
export function projectConstruction(
  rotY: number,
  cxPx: number,
  cyPx: number,
  _R: number,
  width: number,
  height: number,
): ConstructionCells {
  // Crane bounding box in world units: 44 wide × 53 tall × 10 deep
  // (apex antenna pushes the top to y ≈ 53). After tilt the projected
  // vertical extent is ≈ 53 * COS_T + 5 * SIN_T ≈ 51.7 world units, so we
  // size scale to fit that (plus a margin) into the shorter of the
  // available width / height. The ground line is pinned near the bottom
  // of the canvas so the foundation pad stays visible even on
  // wide-but-short layouts.
  const scale = Math.min(width / 50, (height - 12) / 53);
  const groundY = height - 6;

  cellMap.clear();
  for (const edge of SCENE_EDGES) {
    rasterizeEdge(edge, rotY, scale, cxPx, groundY);
  }

  const count = cellMap.size;
  const data = new Float32Array(count * 4);
  let i = 0;
  for (const cell of cellMap.values()) {
    data[i * 4 + 0] = cell.px;
    data[i * 4 + 1] = cell.py;
    data[i * 4 + 2] = cell.alpha;
    data[i * 4 + 3] = cell.glyphIdx;
    i++;
  }
  return { data, count };
}
