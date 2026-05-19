'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── 3D construction-object point cloud ─────────────────────────────────────
// Procedural excavator silhouette as ~2,200 points. Coordinates: +X = boom
// direction (forward), +Y = up, +Z = toward viewer at θ=0. The whole cloud
// orbits around the Y axis via useFrame.

type RenderMode = 'splat' | 'dot';

interface P3 {
  x: number;
  y: number;
  z: number;
  r: number;
  cr: number; // red   0..1
  cg: number; // green 0..1
  cb: number; // blue  0..1
  // 'splat' (default) renders as anisotropic Gaussian ellipse — used for
  // body surfaces. 'dot' renders as a crisp small discrete point — used for
  // fine bright detail (teeth, bolts, beacon, antenna), atmospheric dust,
  // and stray photogrammetry outliers.
  mode?: RenderMode;
}

type RGB = [number, number, number];

// Construction palette — CAT-style yellow body with steel/tar accents
const COLOR = {
  bodyYellow:     [0.96, 0.74, 0.16] as RGB, // boom, stick, cab, counterweight
  bodyYellowDark: [0.78, 0.58, 0.10] as RGB, // boom/stick edge accents
  trackBlack:     [0.16, 0.16, 0.17] as RGB, // tar/rubber treads
  sprocketGray:   [0.40, 0.40, 0.43] as RGB, // wheels
  windowBlue:     [0.46, 0.68, 0.88] as RGB, // glass
  bucketSteel:    [0.32, 0.32, 0.34] as RGB, // bucket shell
  teethSteel:     [0.88, 0.88, 0.92] as RGB, // bright machined steel teeth
  chrome:         [0.68, 0.68, 0.72] as RGB, // hydraulics
  dust:           [0.62, 0.62, 0.62] as RGB, // soft noise floor
};

function makeRng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

interface BoxOpts {
  size?: number;
  tone?: number;
  color?: RGB;
  surfaceBias?: number;
  mode?: RenderMode;
}

function jitterColor(color: RGB, tone: number, rand: () => number): RGB {
  // Tone modulates brightness with per-point variation; color hue is preserved.
  const k = tone * (0.78 + rand() * 0.45);
  return [color[0] * k, color[1] * k, color[2] * k];
}

function sampleBox(
  out: P3[],
  rand: () => number,
  bounds: [number, number, number, number, number, number],
  count: number,
  opts: BoxOpts = {},
) {
  const [x1, y1, z1, x2, y2, z2] = bounds;
  const size = opts.size ?? 0.5;
  const tone = opts.tone ?? 0.9;
  const color = opts.color ?? [1, 1, 1];
  const surface = opts.surfaceBias ?? 0;
  for (let i = 0; i < count; i++) {
    let x = x1 + rand() * (x2 - x1);
    let y = y1 + rand() * (y2 - y1);
    let z = z1 + rand() * (z2 - z1);
    if (surface > 0 && rand() < surface) {
      const dx = Math.min(x - x1, x2 - x);
      const dy = Math.min(y - y1, y2 - y);
      const dz = Math.min(z - z1, z2 - z);
      const minD = Math.min(dx, dy, dz);
      if (minD === dx) x = x - x1 < x2 - x ? x1 : x2;
      else if (minD === dy) y = y - y1 < y2 - y ? y1 : y2;
      else z = z - z1 < z2 - z ? z1 : z2;
    }
    const [cr, cg, cb] = jitterColor(color, tone, rand);
    out.push({
      x, y, z,
      r: size * (0.75 + rand() * 0.5),
      cr, cg, cb,
      mode: opts.mode,
    });
  }
}

function sampleLine(
  out: P3[],
  rand: () => number,
  p1: [number, number, number],
  p2: [number, number, number],
  count: number,
  thickness: number,
  opts: { size?: number; tone?: number; color?: RGB; mode?: RenderMode } = {},
) {
  const [x1, y1, z1] = p1;
  const [x2, y2, z2] = p2;
  const size = opts.size ?? 0.5;
  const tone = opts.tone ?? 0.9;
  const color = opts.color ?? [1, 1, 1];
  for (let i = 0; i < count; i++) {
    const t = (i + rand()) / count;
    const cx = x1 + t * (x2 - x1);
    const cy = y1 + t * (y2 - y1);
    const cz = z1 + t * (z2 - z1);
    const [pr, pg, pb] = jitterColor(color, tone, rand);
    out.push({
      x: cx + (rand() - 0.5) * thickness * 0.6,
      y: cy + (rand() - 0.5) * thickness,
      z: cz + (rand() - 0.5) * thickness,
      r: size * (0.75 + rand() * 0.5),
      cr: pr,
      cg: pg,
      cb: pb,
      mode: opts.mode,
    });
  }
}

function makeExcavator(): P3[] {
  const pts: P3[] = [];
  const r = makeRng(20260513);

  // ── Track frame side plates — yellow structural plate INSIDE each track,
  // where the wheels mount. Sits between the cab and the tread chain.
  sampleBox(pts, r, [-13, -7.5, -7, 13, -4.5, -6], 700, {
    size: 0.3, tone: 0.9, color: COLOR.bodyYellow, surfaceBias: 0.35,
  });
  sampleBox(pts, r, [-13, -7.5, 6, 13, -4.5, 7], 700, {
    size: 0.3, tone: 0.9, color: COLOR.bodyYellow, surfaceBias: 0.35,
  });

  // ── Track chain — a closed band wrapping around the drive sprocket (rear),
  // idler (front), and bottom rollers. Forms the iconic excavator "track"
  // silhouette: flat on top and bottom, semicircular at front and rear.
  // For each side, sample the path with thickness in z (track width ~1 unit).
  const pushTrackDot = (
    x: number, y: number, z: number, rSize: number,
  ) => {
    const k = 0.78 + r() * 0.4;
    pts.push({
      x, y, z,
      r: rSize,
      cr: COLOR.trackBlack[0] * k,
      cg: COLOR.trackBlack[1] * k,
      cb: COLOR.trackBlack[2] * k,
    });
  };

  for (const zSide of [-7.5, 7.5]) {
    // Bottom run of the track (flat, x: -13 → 13 at y ≈ -8)
    for (let i = 0; i < 320; i++) {
      pushTrackDot(
        -13 + r() * 26,
        -8 + (r() - 0.5) * 0.7,
        zSide + (r() - 0.5) * 0.9,
        0.26 + r() * 0.16,
      );
    }
    // Top run of the track (flat, x: -13 → 13 at y ≈ -4)
    for (let i = 0; i < 260; i++) {
      pushTrackDot(
        -13 + r() * 26,
        -4 + (r() - 0.5) * 0.6,
        zSide + (r() - 0.5) * 0.9,
        0.26 + r() * 0.16,
      );
    }
    // Front arc (idler side — wraps around x=13, y=-6)
    for (let i = 0; i < 160; i++) {
      const angle = -Math.PI / 2 + r() * Math.PI;
      const rad = 2.0 + (r() - 0.5) * 0.5;
      pushTrackDot(
        13 + Math.cos(angle) * rad,
        -6 + Math.sin(angle) * rad,
        zSide + (r() - 0.5) * 0.9,
        0.26 + r() * 0.16,
      );
    }
    // Rear arc (drive sprocket side — wraps around x=-13, y=-6)
    for (let i = 0; i < 160; i++) {
      const angle = Math.PI / 2 + r() * Math.PI;
      const rad = 2.2 + (r() - 0.5) * 0.5;
      pushTrackDot(
        -13 + Math.cos(angle) * rad,
        -6 + Math.sin(angle) * rad,
        zSide + (r() - 0.5) * 0.9,
        0.26 + r() * 0.16,
      );
    }
  }

  // ── Track wheels — proper excavator undercarriage ──────────────────
  // Drive sprocket (rear), idler wheel (front), bottom rollers along the
  // base, and small return rollers on top of the tread.
  const pushSprocketDot = (x: number, y: number, z: number, k: number, color: RGB, rSize: number) => {
    pts.push({
      x, y, z,
      r: rSize,
      cr: color[0] * k,
      cg: color[1] * k,
      cb: color[2] * k,
    });
  };

  for (const zSide of [-7.5, 7.5]) {
    // ── Drive sprocket (rear, cx = -13) — larger wheel with visible spokes
    {
      const cx = -13;
      const cy = -6;
      // outer perimeter
      for (let a = 0; a < 26; a++) {
        const angle = (a / 26) * Math.PI * 2;
        pushSprocketDot(
          cx + Math.cos(angle) * 2.2 + (r() - 0.5) * 0.3,
          cy + Math.sin(angle) * 2.2 + (r() - 0.5) * 0.3,
          zSide + (r() - 0.5) * 0.5,
          0.85 + r() * 0.3,
          COLOR.sprocketGray,
          0.3 + r() * 0.2,
        );
      }
      // 8 radial spokes
      for (let s = 0; s < 8; s++) {
        const sa = (s / 8) * Math.PI * 2;
        for (let t = 0; t < 6; t++) {
          const dist = (t / 6) * 2.0;
          pushSprocketDot(
            cx + Math.cos(sa) * dist + (r() - 0.5) * 0.2,
            cy + Math.sin(sa) * dist + (r() - 0.5) * 0.2,
            zSide + (r() - 0.5) * 0.4,
            0.7 + r() * 0.3,
            COLOR.sprocketGray,
            0.24 + r() * 0.14,
          );
        }
      }
      // bright steel hub
      for (let i = 0; i < 14; i++) {
        pushSprocketDot(
          cx + (r() - 0.5) * 0.7,
          cy + (r() - 0.5) * 0.7,
          zSide + (r() - 0.5) * 0.6,
          0.95 + r() * 0.1,
          COLOR.teethSteel,
          0.26 + r() * 0.14,
        );
      }
    }

    // ── Idler wheel (front, cx = 13) — smooth wheel with inner ring
    {
      const cx = 13;
      const cy = -6;
      for (let a = 0; a < 24; a++) {
        const angle = (a / 24) * Math.PI * 2;
        pushSprocketDot(
          cx + Math.cos(angle) * 2.0 + (r() - 0.5) * 0.3,
          cy + Math.sin(angle) * 2.0 + (r() - 0.5) * 0.3,
          zSide + (r() - 0.5) * 0.5,
          0.85 + r() * 0.3,
          COLOR.sprocketGray,
          0.3 + r() * 0.18,
        );
      }
      for (let a = 0; a < 18; a++) {
        const angle = (a / 18) * Math.PI * 2;
        pushSprocketDot(
          cx + Math.cos(angle) * 1.25 + (r() - 0.5) * 0.25,
          cy + Math.sin(angle) * 1.25 + (r() - 0.5) * 0.25,
          zSide + (r() - 0.5) * 0.4,
          0.7 + r() * 0.25,
          COLOR.sprocketGray,
          0.24 + r() * 0.14,
        );
      }
      // hub
      for (let i = 0; i < 10; i++) {
        pushSprocketDot(
          cx + (r() - 0.5) * 0.5,
          cy + (r() - 0.5) * 0.5,
          zSide + (r() - 0.5) * 0.5,
          0.9 + r() * 0.1,
          COLOR.teethSteel,
          0.22 + r() * 0.12,
        );
      }
    }

    // ── Bottom rollers — 9 small wheels along the base
    for (const cx of [-10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10]) {
      for (let a = 0; a < 12; a++) {
        const angle = (a / 12) * Math.PI * 2;
        pushSprocketDot(
          cx + Math.cos(angle) * 1.1 + (r() - 0.5) * 0.2,
          -7 + Math.sin(angle) * 1.1 + (r() - 0.5) * 0.2,
          zSide + (r() - 0.5) * 0.4,
          0.85 + r() * 0.25,
          COLOR.sprocketGray,
          0.24 + r() * 0.14,
        );
      }
    }

    // ── Top return rollers — small wheels riding on top of the tread
    for (const cx of [-8, -3, 3, 8]) {
      for (let a = 0; a < 10; a++) {
        const angle = (a / 10) * Math.PI * 2;
        pushSprocketDot(
          cx + Math.cos(angle) * 0.7 + (r() - 0.5) * 0.15,
          -4 + Math.sin(angle) * 0.7 + (r() - 0.5) * 0.15,
          zSide + (r() - 0.5) * 0.3,
          0.85 + r() * 0.25,
          COLOR.sprocketGray,
          0.2 + r() * 0.12,
        );
      }
    }
  }

  // ── Tread cleats — horizontal grouser bars crossing each track
  for (const cx of [-13, -10, -7, -4, -1, 2, 5, 8, 11]) {
    sampleBox(pts, r, [cx - 0.3, -8.3, -8.2, cx + 0.3, -7.5, -4.8], 26, {
      size: 0.26, tone: 0.7, color: COLOR.trackBlack,
    });
    sampleBox(pts, r, [cx - 0.3, -8.3, 4.8, cx + 0.3, -7.5, 8.2], 26, {
      size: 0.26, tone: 0.7, color: COLOR.trackBlack,
    });
  }

  // ── Cab — main body, very dense volumetric fill ──────────────────────
  sampleBox(pts, r, [-7, -4, -5, 6, 6, 5], 7000, {
    size: 0.22, tone: 0.95, color: COLOR.bodyYellow, surfaceBias: 0.25,
  });
  // Cab roof — darker top plate for hierarchy
  sampleBox(pts, r, [-7, 5.7, -5, 6, 6.3, 5], 600, {
    size: 0.22, tone: 0.85, color: COLOR.bodyYellowDark,
  });
  // Cab front panel below windshield — slightly brighter highlight
  sampleBox(pts, r, [5.5, -3, -4, 6.2, 1, 4], 400, {
    size: 0.22, tone: 1.05, color: COLOR.bodyYellow,
  });
  // Engine cowling — hump on top-rear of cab (between counterweight & cab)
  sampleBox(pts, r, [-7, 6, -4.5, -2, 7.8, 4.5], 700, {
    size: 0.24, tone: 0.85, color: COLOR.bodyYellowDark, surfaceBias: 0.4,
  });
  // Cab side vent grilles — dark slats on each side
  for (const zSide of [-5.05, 5.05]) {
    for (const slat of [-1, -0.4, 0.2, 0.8, 1.4]) {
      sampleLine(pts, r, [-3.5, slat, zSide], [-1, slat, zSide], 24, 0.15, {
        size: 0.16, tone: 0.45, color: COLOR.bodyYellowDark,
      });
    }
  }
  // Cab access step + handle on left side
  sampleBox(pts, r, [-6.5, -3.5, -5.4, -4, -2.8, -4.9], 60, {
    size: 0.2, tone: 0.6, color: COLOR.bodyYellowDark,
  });

  // ── Counterweight at rear — denser, with bolt-head accents ────────────
  sampleBox(pts, r, [-10, -3, -3.5, -7, 3, 3.5], 1800, {
    size: 0.24, tone: 0.9, color: COLOR.bodyYellowDark, surfaceBias: 0.3,
  });
  // Bolt heads on rear face — 3×4 grid of bright crisp dots
  for (let bx = 0; bx < 4; bx++) {
    for (let bz = 0; bz < 3; bz++) {
      const cy = -2 + bx * 1.4;
      const cz = -2 + bz * 2.0;
      for (let i = 0; i < 6; i++) {
        const k = 0.9 + r() * 0.2;
        pts.push({
          x: -10.05 + (r() - 0.5) * 0.15,
          y: cy + (r() - 0.5) * 0.3,
          z: cz + (r() - 0.5) * 0.3,
          r: 0.18 + r() * 0.1,
          cr: COLOR.teethSteel[0] * k,
          cg: COLOR.teethSteel[1] * k,
          cb: COLOR.teethSteel[2] * k,
          mode: 'dot',
        });
      }
    }
  }

  // ── Windshield — light blue glass ─────────────────────────────────────
  sampleBox(pts, r, [4, 1, -4.5, 6, 6, 4.5], 380, {
    size: 0.26, tone: 1.05, color: COLOR.windowBlue,
  });
  // Window frame — dark border around windshield
  for (const [a, b, c, d, e, f] of [
    [4, 5.8, -4.5, 6, 6, 4.5] as const, // top
    [4, 1, -4.5, 6, 1.2, 4.5] as const, // bottom
    [4, 1, -4.5, 6, 6, -4.3] as const,  // side -z
    [4, 1, 4.3, 6, 6, 4.5] as const,    // side +z
  ]) {
    sampleBox(pts, r, [a, b, c, d, e, f], 80, {
      size: 0.18, tone: 0.5, color: COLOR.bodyYellowDark,
    });
  }

  // ── Boom — much denser cylinder ───────────────────────────────────────
  sampleLine(pts, r, [3, 4, 0], [18, 12, 0], 3000, 1.8, {
    size: 0.24, tone: 0.95, color: COLOR.bodyYellow,
  });
  // Boom welding seams — dark accent stripes along the length
  for (const offset of [-1.4, 1.4]) {
    sampleLine(
      pts, r,
      [3, 4 + offset * 0.15, offset],
      [18, 12 + offset * 0.15, offset],
      120, 0.18,
      { size: 0.16, tone: 0.5, color: COLOR.bodyYellowDark },
    );
  }
  // Hydraulic hoses — two dark lines running along the top of the boom
  for (const zOff of [-0.5, 0.5]) {
    sampleLine(
      pts, r,
      [3, 5.2, zOff],
      [17, 13.2, zOff],
      180, 0.32,
      { size: 0.2, tone: 0.85, color: COLOR.trackBlack },
    );
  }

  // ── Stick — denser, with seams ────────────────────────────────────────
  sampleLine(pts, r, [17.5, 12, 0], [25, 4, 0], 2000, 1.2, {
    size: 0.24, tone: 0.9, color: COLOR.bodyYellowDark,
  });
  for (const offset of [-0.9, 0.9]) {
    sampleLine(
      pts, r,
      [17.5, 12 + offset * 0.15, offset],
      [25, 4 + offset * 0.15, offset],
      80, 0.15,
      { size: 0.16, tone: 0.5, color: COLOR.bodyYellow },
    );
  }
  // Stick hydraulic hose — runs along the top
  sampleLine(
    pts, r,
    [17, 13, 0],
    [24, 5, 0],
    140, 0.28,
    { size: 0.2, tone: 0.85, color: COLOR.trackBlack },
  );

  // ── Bucket — denser shell with internal ribs ─────────────────────────
  sampleBox(pts, r, [23, 0, -1.8, 27, 5, 1.8], 1800, {
    size: 0.24, tone: 0.95, color: COLOR.bucketSteel, surfaceBias: 0.3,
  });
  // Bucket mount bracket — top-back of bucket
  sampleBox(pts, r, [23.5, 4.5, -1.2, 25, 5.5, 1.2], 180, {
    size: 0.22, tone: 0.9, color: COLOR.bucketSteel, surfaceBias: 0.4,
  });
  // Bucket cutting edge — bright steel band at the bottom-front
  sampleBox(pts, r, [26.8, 0, -1.8, 27.4, 0.8, 1.8], 280, {
    size: 0.22, tone: 1.0, color: COLOR.teethSteel,
  });
  // Internal bucket ribs — dark lines running front-to-back inside
  for (const zRib of [-1.2, 0, 1.2]) {
    sampleLine(
      pts, r,
      [23.5, 0.5, zRib],
      [26.5, 2.5, zRib],
      40, 0.18,
      { size: 0.18, tone: 0.7, color: COLOR.trackBlack },
    );
  }

  // ── Pivot pins — bright steel cylinders at each joint ────────────────
  // Joint 1: cab → boom (at ~(3, 4, 0))
  for (let i = 0; i < 110; i++) {
    const angle = r() * Math.PI * 2;
    const radius = 0.55 + r() * 0.2;
    const k = 0.92 + r() * 0.15;
    pts.push({
      x: 3 + Math.cos(angle) * radius * 0.25,
      y: 4 + Math.sin(angle) * radius,
      z: -5 + r() * 10,
      r: 0.2 + r() * 0.12,
      cr: COLOR.teethSteel[0] * k,
      cg: COLOR.teethSteel[1] * k,
      cb: COLOR.teethSteel[2] * k,
    });
  }
  // Joint 2: boom → stick (at ~(17.5, 12, 0))
  for (let i = 0; i < 110; i++) {
    const angle = r() * Math.PI * 2;
    const radius = 0.5 + r() * 0.2;
    const k = 0.92 + r() * 0.15;
    pts.push({
      x: 17.5 + Math.cos(angle) * radius * 0.25,
      y: 12 + Math.sin(angle) * radius,
      z: -1.8 + r() * 3.6,
      r: 0.2 + r() * 0.12,
      cr: COLOR.teethSteel[0] * k,
      cg: COLOR.teethSteel[1] * k,
      cb: COLOR.teethSteel[2] * k,
    });
  }
  // Joint 3: stick → bucket (at ~(25, 4, 0))
  for (let i = 0; i < 90; i++) {
    const angle = r() * Math.PI * 2;
    const radius = 0.45 + r() * 0.2;
    const k = 0.92 + r() * 0.15;
    pts.push({
      x: 25 + Math.cos(angle) * radius * 0.25,
      y: 4 + Math.sin(angle) * radius,
      z: -1.8 + r() * 3.6,
      r: 0.2 + r() * 0.12,
      cr: COLOR.teethSteel[0] * k,
      cg: COLOR.teethSteel[1] * k,
      cb: COLOR.teethSteel[2] * k,
    });
  }

  // ── Beacon light — amber dome on cab roof, crisp dots
  for (let i = 0; i < 40; i++) {
    const angle = r() * Math.PI * 2;
    const radius = 0.35 * Math.sqrt(r());
    pts.push({
      x: 0 + Math.cos(angle) * radius,
      y: 7 + r() * 0.5,
      z: -1.5 + Math.sin(angle) * radius,
      r: 0.22 + r() * 0.12,
      cr: 1.0,
      cg: 0.65 + r() * 0.2,
      cb: 0.1 + r() * 0.1,
      mode: 'dot',
    });
  }

  // Bucket teeth — bright machined steel, crisp dots
  for (let i = 0; i < 5; i++) {
    const zT = -1.5 + i * 0.75;
    for (let j = 0; j < 20; j++) {
      const k = 0.92 + r() * 0.16;
      pts.push({
        x: 27.2 + (j % 10) * 0.12 + (r() - 0.5) * 0.18,
        y: 0.4 + (j % 10) * 0.18 + (r() - 0.5) * 0.22,
        z: zT + (r() - 0.5) * 0.3,
        r: 0.26 + r() * 0.2,
        cr: COLOR.teethSteel[0] * k,
        cg: COLOR.teethSteel[1] * k,
        cb: COLOR.teethSteel[2] * k,
        mode: 'dot',
      });
    }
  }

  // Hydraulic cylinders — chrome
  sampleLine(pts, r, [-3, 6, 0], [4, 8, 0], 110, 0.45, {
    size: 0.26, tone: 0.95, color: COLOR.chrome,
  });
  sampleLine(pts, r, [10, 9, 0], [16, 12, 0], 110, 0.45, {
    size: 0.26, tone: 0.95, color: COLOR.chrome,
  });

  // ── Exhaust stack — gunmetal cylinder on top-rear of cab
  for (let i = 0; i < 90; i++) {
    const angle = r() * Math.PI * 2;
    const radius = 0.35 + r() * 0.25;
    const yPos = 6 + r() * 2.6;
    const k = 0.75 + r() * 0.35;
    pts.push({
      x: -3 + Math.cos(angle) * radius * 0.55,
      y: yPos,
      z: 2 + Math.sin(angle) * radius * 0.55,
      r: 0.22 + r() * 0.14,
      cr: COLOR.sprocketGray[0] * k,
      cg: COLOR.sprocketGray[1] * k,
      cb: COLOR.sprocketGray[2] * k,
    });
  }
  // Exhaust tip — bright steel rim, crisp dots
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    pts.push({
      x: -3 + Math.cos(angle) * 0.32,
      y: 8.6 + (r() - 0.5) * 0.1,
      z: 2 + Math.sin(angle) * 0.32,
      r: 0.22 + r() * 0.1,
      cr: COLOR.teethSteel[0] * 0.85,
      cg: COLOR.teethSteel[1] * 0.85,
      cb: COLOR.teethSteel[2] * 0.85,
      mode: 'dot',
    });
  }

  // ── Antenna — thin vertical line, crisp dots
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    pts.push({
      x: 4 + (r() - 0.5) * 0.15,
      y: 6.2 + t * 4.8,
      z: -2 + (r() - 0.5) * 0.15,
      r: 0.15 + r() * 0.08,
      cr: COLOR.chrome[0] * (0.6 + r() * 0.4),
      cg: COLOR.chrome[1] * (0.6 + r() * 0.4),
      cb: COLOR.chrome[2] * (0.6 + r() * 0.4),
      mode: 'dot',
    });
  }
  // Antenna tip — bright cap
  for (let i = 0; i < 8; i++) {
    pts.push({
      x: 4 + (r() - 0.5) * 0.18,
      y: 11 + (r() - 0.5) * 0.2,
      z: -2 + (r() - 0.5) * 0.18,
      r: 0.22 + r() * 0.12,
      cr: COLOR.teethSteel[0],
      cg: COLOR.teethSteel[1],
      cb: COLOR.teethSteel[2],
      mode: 'dot',
    });
  }

  // ── Headlights — bright crisp clusters
  for (const zPos of [-3.2, 3.2]) {
    for (let i = 0; i < 28; i++) {
      const angle = r() * Math.PI * 2;
      const radius = 0.45 * Math.sqrt(r());
      const k = 1.0 + r() * 0.25;
      pts.push({
        x: 6.2 + (r() - 0.5) * 0.12,
        y: 0.8 + Math.sin(angle) * radius,
        z: zPos + Math.cos(angle) * radius,
        r: 0.26 + r() * 0.15,
        cr: Math.min(1, 1.0 * k),
        cg: Math.min(1, 0.95 * k),
        cb: Math.min(1, 0.7 * k),
        mode: 'dot',
      });
    }
  }

  // ── Cab door / panel accent — vertical dark line on each cab side
  for (const zSide of [-5.05, 5.05]) {
    sampleLine(pts, r, [-2, -3.5, zSide], [-2, 5, zSide], 36, 0.22, {
      size: 0.2, tone: 0.5, color: COLOR.bodyYellowDark,
    });
  }

  // ── Cab roof rail / light bar — short accent across top of cab
  sampleLine(pts, r, [-2, 6.3, -2.5], [3, 6.3, -2.5], 30, 0.22, {
    size: 0.2, tone: 0.85, color: COLOR.bodyYellowDark,
  });

  // Atmospheric "splat dust" — crisp dim discrete dots (noise floor grain)
  for (let i = 0; i < 500; i++) {
    const k = 0.2 + r() * 0.35;
    pts.push({
      x: -18 + r() * 49,
      y: -9 + r() * 24,
      z: -11 + r() * 22,
      r: 0.1 + r() * 0.14,
      cr: COLOR.dust[0] * k,
      cg: COLOR.dust[1] * k,
      cb: COLOR.dust[2] * k,
      mode: 'dot',
    });
  }

  return pts;
}

// ── Capture imperfections ──────────────────────────────────────────────────
// Real Gaussian-splat captures from on-site photogrammetry always have
// imperfections: areas the photographer didn't walk to (sparse), surfaces
// they couldn't aim at (tops, undersides), zones with occlusion (scan holes),
// small photogrammetric drift, and stray mis-registered outliers. We apply
// these post-hoc so the "model" reads as captured, not synthetic.

function applyCaptureImperfections(pts: P3[]): P3[] {
  const r = makeRng(77001);
  const out: P3[] = [];

  for (const p of pts) {
    let keep = 1.0;

    // Asymmetric density — photographer worked the near side (z>0), far side
    // is less well-scanned.
    if (p.z < -2) keep *= 0.78;
    if (p.z < -5) keep *= 0.6;

    // Top surfaces are sparse — no aerial views.
    if (p.y > 5) keep *= 0.6;
    if (p.y > 8) keep *= 0.45;

    // Underside is dark and occluded.
    if (p.y < -7) keep *= 0.65;

    // Specific scan-hole zones (areas the camera couldn't reach):
    // Hole 1 — counterweight rear-top occluded by boom
    if (p.x < -6 && p.y > 1 && p.z < 0) keep *= 0.3;
    // Hole 2 — boom top-back face, poor angle
    if (p.x > 6 && p.x < 14 && p.y > 8 && p.z < -1) keep *= 0.3;
    // Hole 3 — bucket interior, couldn't see inside the scoop
    if (p.x > 23.5 && p.x < 26.5 && p.y > 1.5 && p.y < 3.5 && Math.abs(p.z) < 1) keep *= 0.3;
    // Hole 4 — far track top, occluded by the body
    if (p.x < -3 && p.y > -5 && p.y < -3 && p.z < -4) keep *= 0.45;

    if (r() > keep) continue;

    // Photogrammetric drift — small position jitter on ~10% of points.
    let { x, y, z } = p;
    if (r() < 0.10) {
      x += (r() - 0.5) * 0.45;
      y += (r() - 0.5) * 0.45;
      z += (r() - 0.5) * 0.45;
    }

    out.push({ x, y, z, r: p.r, cr: p.cr, cg: p.cg, cb: p.cb, mode: p.mode });
  }

  // Stray outlier dots — mis-registered points floating off any real
  // surface. Rendered as crisp dots so they read as photogrammetry noise.
  for (let i = 0; i < 120; i++) {
    const sourceX = -12 + r() * 38;
    const sourceY = -6 + r() * 14;
    const sourceZ = -7 + r() * 14;
    const driftDist = 0.7 + r() * 2.6;
    const driftAngle = r() * Math.PI * 2;
    const k = 0.4 + r() * 0.4;
    out.push({
      x: sourceX + Math.cos(driftAngle) * driftDist,
      y: sourceY + (r() - 0.5) * 1.8,
      z: sourceZ + Math.sin(driftAngle) * driftDist,
      r: 0.16 + r() * 0.22,
      cr: COLOR.dust[0] * k,
      cg: COLOR.dust[1] * k,
      cb: COLOR.dust[2] * k,
      mode: 'dot',
    });
  }

  return out;
}

// Generate once at module load — runs only client-side since this file is
// dynamically imported with ssr: false from the peek wrapper. Split by render
// mode so splats and dots can be drawn with different shaders.
const ALL_POINTS = applyCaptureImperfections(makeExcavator());
const SPLAT_POINTS: P3[] = [];
const DOT_POINTS: P3[] = [];
for (const p of ALL_POINTS) {
  if (p.mode === 'dot') DOT_POINTS.push(p);
  else SPLAT_POINTS.push(p);
}

// Mean position of every point. We use this to translate the geometry so
// the rotation pivot lands on the visual center of the model, otherwise
// asymmetry between counterweight (left) and boom/stick/bucket (far right)
// makes the excavator orbit *across* the frame instead of in place.
const CENTROID = (() => {
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (const p of ALL_POINTS) {
    sx += p.x;
    sy += p.y;
    sz += p.z;
  }
  const n = ALL_POINTS.length || 1;
  return { x: sx / n, y: sy / n, z: sz / n };
})();

// ── Gaussian-splat shader (instanced billboard quads) ──────────────────────
// Each splat is a 4-vertex quad, instanced once per cloud point. The vertex
// shader projects the instance's 3D world position into view space and offsets
// the quad's corners by a per-instance 2D scale and rotation — yielding an
// anisotropic, screen-aligned ellipse. The fragment shader applies a Gaussian
// alpha falloff so overlapping splats blend into continuous surfaces.

const SPLAT_VERTEX_SHADER = /* glsl */ `
  // Base quad vertex in local (-1..1, -1..1) range — comes from the
  // built-in 'position' attribute on the InstancedBufferGeometry.
  attribute vec3 iPosition;
  attribute vec3 iColor;
  attribute vec2 iScale;
  attribute float iRotation;

  varying vec3 vColor;
  varying vec2 vUV;

  void main() {
    vColor = iColor;
    vUV = position.xy; // (-1..1) for Gaussian falloff in fragment

    // Project the instance's 3D position into view space first.
    vec4 mvPosition = modelViewMatrix * vec4(iPosition, 1.0);

    // Then offset the quad corner — rotated, scaled — in view space.
    float c = cos(iRotation);
    float s = sin(iRotation);
    vec2 rotated = vec2(
      position.x * c - position.y * s,
      position.x * s + position.y * c
    );
    mvPosition.xy += rotated * iScale;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SPLAT_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying vec2 vUV;

  void main() {
    // Squared distance from quad center in normalized coords.
    float d2 = dot(vUV, vUV);
    if (d2 > 1.0) discard;
    // Gaussian falloff — sigma tuned so edges fade smoothly without
    // becoming sub-pixel hard. exp(-d² * k) approximates a 3D Gaussian
    // projected to 2D.
    float alpha = exp(-d2 * 3.2);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ── Discrete-dot shader (crisp small points for fine detail / outliers) ───

const DOT_VERTEX_SHADER = /* glsl */ `
  attribute float dSize;
  attribute vec3 dColor;
  varying vec3 vColor;
  uniform float uPixelRatio;
  uniform float uSizeScale;

  void main() {
    vColor = dColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = dSize * uSizeScale * uPixelRatio * (1.0 / -mvPosition.z);
  }
`;

const DOT_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;

  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float d2 = dot(cxy, cxy);
    if (d2 > 1.0) discard;
    // Crisp anti-aliased edge — sharp small dots contrasting with the
    // surrounding Gaussian splat surfaces.
    float alpha = 1.0 - smoothstep(0.75, 1.0, d2);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Seed for per-instance anisotropy / rotation (independent of the cloud RNG).
const SPLAT_RANDOM_SEED = 991337;

function ExcavatorSplats() {
  const { geometry, material } = useMemo(() => {
    const n = SPLAT_POINTS.length;

    // Base quad — 4 corners, two triangles. Shared across all instances.
    const baseQuad = new Float32Array([
      -1, -1, 0,
       1, -1, 0,
       1,  1, 0,
      -1,  1, 0,
    ]);
    const baseIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    // Per-instance attributes.
    const iPos = new Float32Array(n * 3);
    const iColor = new Float32Array(n * 3);
    const iScale = new Float32Array(n * 2);
    const iRot = new Float32Array(n);

    let seed = SPLAT_RANDOM_SEED;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    for (let i = 0; i < n; i++) {
      const p = SPLAT_POINTS[i];
      iPos[i * 3] = p.x;
      iPos[i * 3 + 1] = p.y;
      iPos[i * 3 + 2] = p.z;

      iColor[i * 3] = p.cr;
      iColor[i * 3 + 1] = p.cg;
      iColor[i * 3 + 2] = p.cb;

      // Anisotropic scale: each splat is an ellipse with a random aspect
      // ratio (0.45..1.8). Base size is ~2× the original point radius so
      // splats overlap into continuous surfaces.
      const baseSize = p.r * 2.0;
      const aspect = 0.45 + rng() * 1.35;
      iScale[i * 2] = baseSize * aspect;
      iScale[i * 2 + 1] = baseSize / aspect;

      // Random 2D rotation in screen space.
      iRot[i] = rng() * Math.PI * 2;
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(baseQuad, 3));
    geo.setIndex(new THREE.BufferAttribute(baseIndices, 1));
    geo.setAttribute('iPosition', new THREE.InstancedBufferAttribute(iPos, 3));
    geo.setAttribute('iColor', new THREE.InstancedBufferAttribute(iColor, 3));
    geo.setAttribute('iScale', new THREE.InstancedBufferAttribute(iScale, 2));
    geo.setAttribute('iRotation', new THREE.InstancedBufferAttribute(iRot, 1));
    geo.instanceCount = n;

    const mat = new THREE.ShaderMaterial({
      vertexShader: SPLAT_VERTEX_SHADER,
      fragmentShader: SPLAT_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  return <mesh geometry={geometry} material={material} />;
}

// ── Discrete dots — fine details, dust, outliers ──────────────────────────

function ExcavatorDots() {
  const { geometry, material } = useMemo(() => {
    const n = DOT_POINTS.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const sizes = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const p = DOT_POINTS[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      colors[i * 3] = p.cr;
      colors[i * 3 + 1] = p.cg;
      colors[i * 3 + 2] = p.cb;
      sizes[i] = p.r;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('dColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('dSize', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: {
          value: Math.min(
            typeof window !== 'undefined' ? window.devicePixelRatio : 1,
            2,
          ),
        },
        uSizeScale: { value: 180 },
      },
      vertexShader: DOT_VERTEX_SHADER,
      fragmentShader: DOT_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  return <points geometry={geometry} material={material} />;
}

// ── Scene wrapper — shared rotation + ground translation ──────────────────
// Both render layers (splats + dots) live inside one rotating group so they
// orbit in lockstep around the cab. The group's position drops the model
// onto the floor plane.

function ExcavatorScene() {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      // 12 deg/sec ≈ 0.2094 rad/sec
      ref.current.rotation.y += 0.2094 * delta;
    }
  });

  // The geometry isn't symmetric around its local origin: counterweight on
  // the left, boom/stick/bucket extending far to the right, tracks pulling
  // the mean down. The inner group offsets every point by −CENTROID so the
  // model's actual point-cloud center lands on the outer group's rotation
  // pivot — that way the excavator orbits in place rather than swinging
  // across the frame.
  return (
    <group ref={ref} position={[0, 0, 0]}>
      <group position={[-CENTROID.x, -CENTROID.y, -CENTROID.z]}>
        <ExcavatorSplats />
        <ExcavatorDots />
      </group>
    </group>
  );
}

// ── Scene wrapper ──────────────────────────────────────────────────────────

interface SpatialStudioCloudSceneProps {
  active: boolean;
}

export function SpatialStudioCloudScene({ active }: SpatialStudioCloudSceneProps) {
  return (
    <Canvas
      camera={{ fov: 32, position: [0, 4, 88], near: 0.1, far: 260 }}
      frameloop={active ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <ExcavatorScene />
    </Canvas>
  );
}
