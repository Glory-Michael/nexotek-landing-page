'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Procedural 3D floor-plan scene — Nexotek's analogue of camect-webapp's
 * built-in default environments (Office 2nd Fl + Streetview in
 * frontend/stores/floorplanStore.ts). camect builds those environments
 * procedurally via SiteAssets3D — splatUrl is null on both — so there's
 * no stored Gaussian Splat to copy. This file rebuilds the same kind of
 * scene from scratch in Nexotek's construction-tech visual vocabulary:
 * indoor scaffold floor (`kind='office'`) and outdoor yard
 * (`kind='outdoor'`), each populated with low-poly construction
 * primitives plus a wireframe-edge overlay (drei <Edges/>) that gives
 * the scene a CAD-blueprint feel matching the rest of the site.
 *
 * Camera markers in the scene are real 3D objects: the lens defines
 * the FOV cone's apex, and the cone opens out along the camera's
 * forward axis (driven by a `lookAt` prop, not a raw rotation). Earlier
 * iterations had the cone floating away from the camera body — this
 * version anchors it at the lens.
 */

export type FloorplanSceneKind = 'office' | 'outdoor';

const C = {
  floor: '#0b1220',
  innerFloor: '#162033',
  yardGround: '#15202f',
  yardPatch: '#1f2a3a',
  wall: '#475569',
  beam: '#64748b',
  scaffold: '#cbd5e1',
  pallet: '#a16207',
  palletPlank: '#78350f',
  hivis: '#f59e0b',
  cone: '#f97316',
  barrier: '#fb923c',
  building: '#475569',
  buildingRoof: '#94a3b8',
  windowGlass: '#bfdbfe',
  windowEmissive: '#1e3a8a',
  craneBody: '#fbbf24',
  craneFrame: '#facc15',
  markerBody: '#e2e8f0',
  markerCone: '#6366f1',
  edge: '#cbd5e1',
} as const;

const EDGE_OPACITY = 0.32;

interface FloorplanScene3DProps {
  kind: FloorplanSceneKind;
}

export function FloorplanScene3D({ kind }: FloorplanScene3DProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsTouch(
      window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth < 1024,
    );

    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cap dpr at 1 on touch/narrow viewports — shadows + dpr=2 is the single
  // biggest GPU cost in this scene. Drop shadows on touch entirely.
  const dpr: [number, number] = isTouch ? [1, 1] : [1, 2];

  return (
    <div ref={wrapRef} className="h-full w-full">
    <Canvas
      shadows={isTouch ? false : 'percentage'}
      gl={{ antialias: !isTouch, toneMapping: THREE.ReinhardToneMapping }}
      dpr={dpr}
      frameloop={isInView ? 'always' : 'never'}
    >
      <PerspectiveCamera makeDefault fov={38} position={[6.2, 4.6, 6.2]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-6, 6, -4]} intensity={0.32} color="#6366f1" />
      <hemisphereLight args={['#94a3b8', '#0b1220', 0.25]} />

      <AutoOrbit />

      <Suspense fallback={null}>
        <gridHelper args={[40, 40, '#334155', '#1e293b']} position={[0, -0.005, 0]} />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color={C.floor} roughness={0.95} />
        </mesh>

        {kind === 'office' ? <ScaffoldFloor /> : <ConstructionYard />}
      </Suspense>
    </Canvas>
    </div>
  );
}

// ── Camera orbit ───────────────────────────────────────────────────────────

function AutoOrbit() {
  const t = useRef(0);
  useFrame(({ camera }, delta) => {
    t.current += delta * 0.16;
    const radius = 7.6;
    camera.position.x = Math.cos(t.current) * radius;
    camera.position.z = Math.sin(t.current) * radius;
    camera.position.y = 4.6 + Math.sin(t.current * 0.5) * 0.35;
    camera.lookAt(0, 0.6, 0);
  });
  return null;
}

// ── INDOOR · Scaffold floor (replaces "Office") ───────────────────────────

function ScaffoldFloor() {
  return (
    <group>
      {/* Inner slab — concrete deck under construction */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[6.6, 6.6]} />
        <meshStandardMaterial color={C.innerFloor} roughness={0.9} />
        <Edges color={C.edge} threshold={1} renderOrder={1}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>

      {/* Four steel I-beam columns at the corners */}
      {[
        [-2.6, -2.6],
        [2.6, -2.6],
        [-2.6, 2.6],
        [2.6, 2.6],
      ].map(([x, z], i) => (
        <SteelColumn key={`col-${i}`} position={[x, 0, z]} height={2.8} />
      ))}

      {/* Center scaffold tower — three levels, the focal subject */}
      <ScaffoldTower position={[0, 0, 0]} />

      {/* Stacked pallets along the back wall */}
      <PalletStack position={[-2.2, 0, -2.6]} count={3} />
      <PalletStack position={[-1.4, 0, -2.6]} count={2} />
      <PalletStack position={[2.4, 0, 2.4]} count={2} rotation={Math.PI / 2} />

      {/* Hi-vis safety barriers in a partial line — open work zone */}
      <SafetyBarrier position={[-1.3, 0, 1.6]} length={1.6} />
      <SafetyBarrier position={[0.9, 0, 1.6]} length={1.4} />

      {/* Camera bracket-mounted to the back-right column, aimed down at
          the scaffold base — the look-at point on the floor drives both
          yaw and pitch inside CameraMarker. */}
      <CameraMarker
        position={[2.4, 2.2, 2.4]}
        lookAt={[0, 0.4, 0]}
        hFovDeg={55}
      />
    </group>
  );
}

function SteelColumn({
  position,
  height,
}: {
  position: [number, number, number];
  height: number;
}) {
  return (
    <group position={position}>
      {/* I-beam flanges + web rendered as 3 thin boxes */}
      <mesh position={[0, height / 2, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.22, height, 0.04]} />
        <meshStandardMaterial color={C.beam} metalness={0.4} roughness={0.55} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      <mesh position={[0, height / 2, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.22, height, 0.04]} />
        <meshStandardMaterial color={C.beam} metalness={0.4} roughness={0.55} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, height, 0.18]} />
        <meshStandardMaterial color={C.beam} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Hi-vis caution band near base */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.24, 0.18, 0.21]} />
        <meshStandardMaterial color={C.hivis} roughness={0.85} />
      </mesh>
    </group>
  );
}

function ScaffoldTower({ position }: { position: [number, number, number] }) {
  const W = 1.4;
  const D = 1.4;
  const heights = [0, 0.95, 1.9]; // 3 deck levels
  const verticals: Array<[number, number]> = [
    [-W / 2, -D / 2],
    [W / 2, -D / 2],
    [-W / 2, D / 2],
    [W / 2, D / 2],
  ];
  return (
    <group position={position}>
      {/* Vertical pipes */}
      {verticals.map(([x, z], i) => (
        <mesh key={`v-${i}`} position={[x, 1.4, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 2.8, 10]} />
          <meshStandardMaterial color={C.scaffold} metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
      {/* Horizontal ties at each deck level */}
      {heights.map((y, hi) =>
        verticals.map(([x, z], vi) => {
          const next = verticals[(vi + 1) % 4];
          const midX = (x + next[0]) / 2;
          const midZ = (z + next[1]) / 2;
          const dx = next[0] - x;
          const dz = next[1] - z;
          const len = Math.hypot(dx, dz);
          const rotY = Math.atan2(-dz, dx);
          return (
            <mesh
              key={`h-${hi}-${vi}`}
              position={[midX, y + 0.3, midZ]}
              rotation={[0, rotY, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.028, 0.028, len, 8]} />
              <meshStandardMaterial color={C.scaffold} metalness={0.55} roughness={0.4} />
            </mesh>
          );
        }),
      )}
      {/* Working deck on the middle level */}
      <mesh position={[0, 1.0, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 0.1, 0.04, D + 0.1]} />
        <meshStandardMaterial color={C.palletPlank} roughness={0.92} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      {/* Top deck */}
      <mesh position={[0, 1.95, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 0.1, 0.04, D + 0.1]} />
        <meshStandardMaterial color={C.palletPlank} roughness={0.92} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      {/* Top-rail hi-vis tape */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[W + 0.14, 0.04, 0.04]} />
        <meshStandardMaterial color={C.hivis} />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[D + 0.14, 0.04, 0.04]} />
        <meshStandardMaterial color={C.hivis} />
      </mesh>
    </group>
  );
}

function PalletStack({
  position,
  count,
  rotation = 0,
}: {
  position: [number, number, number];
  count: number;
  rotation?: number;
}) {
  const w = 0.8;
  const d = 0.6;
  const h = 0.16;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={`p-${i}`}
          position={[0, h / 2 + i * h, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={C.pallet} roughness={0.85} />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
      ))}
    </group>
  );
}

function SafetyBarrier({
  position,
  length,
}: {
  position: [number, number, number];
  length: number;
}) {
  // Plastic jersey-style barrier — angled sides + flat top
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.36, 0.32]} />
        <meshStandardMaterial color={C.barrier} roughness={0.8} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[length, 0.04, 0.16]} />
        <meshStandardMaterial color={C.hivis} />
      </mesh>
    </group>
  );
}

// ── OUTDOOR · Construction yard (replaces "Streetview") ───────────────────

function ConstructionYard() {
  return (
    <group>
      {/* Asphalt + dirt patches */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={C.yardGround} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.2, 0.003, 1.4]} receiveShadow>
        <planeGeometry args={[3.6, 4.4]} />
        <meshStandardMaterial color={C.yardPatch} roughness={0.92} />
      </mesh>

      {/* Tower crane — the focal subject */}
      <TowerCrane position={[-2.8, 0, -2.6]} jibRotation={0.6} />

      {/* Finished building on the right */}
      <Building position={[3.5, 0, -1.4]} rotation={Math.PI} variant="finished" />

      {/* Under-construction building wrapped in scaffolding */}
      <Building position={[2.6, 0, 2.6]} rotation={-Math.PI / 2} variant="wip" />

      {/* Material pallets near the crane */}
      <PalletStack position={[-1.4, 0, -1.4]} count={3} />
      <PalletStack position={[-1.4, 0, -0.6]} count={2} />

      {/* Row of traffic cones marking a vehicle lane */}
      {[-3, -2, -1, 0, 1, 2, 3].map((x, i) => (
        <TrafficCone key={`c-${i}`} position={[x * 0.65, 0, 0.4]} />
      ))}

      {/* Forklift */}
      <Forklift position={[1.6, 0, -0.6]} rotation={-Math.PI / 2} />

      {/* Camera pole — relocated to the -X / +Z corner of the yard.
          Earlier the pole sat against the WIP building's +X face, which
          put the camera mounted on the wrong side of a wall — the lens
          was aimed into the building, not into the open yard. The
          -X/+Z corner has unobstructed line of sight across the yard
          (crane is well below the sight line, buildings are on the
          opposite side). */}
      <LightPole position={[-3.5, 0, 2.8]} />

      {/* Camera bracket-mounted to the pole, aimed down at the middle
          of the working yard (forklift / cones / crane base). */}
      <CameraMarker
        position={[-3.3, 2.5, 2.7]}
        lookAt={[-0.5, 0.3, -0.3]}
        hFovDeg={55}
      />
    </group>
  );
}

function TowerCrane({
  position,
  jibRotation,
}: {
  position: [number, number, number];
  jibRotation: number;
}) {
  const baseY = 0;
  const mastH = 4.2;
  return (
    <group position={position}>
      {/* Base pad */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.16, 0.9]} />
        <meshStandardMaterial color={C.beam} roughness={0.85} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      {/* Mast — lattice approximated by 4 corner pipes + cross braces */}
      <CraneMast height={mastH} baseY={0.16} />
      {/* Jib + counter-jib rotating around mast top */}
      <group position={[0, baseY + mastH, 0]} rotation={[0, jibRotation, 0]}>
        {/* Slewing platform */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.5, 0.12, 0.5]} />
          <meshStandardMaterial color={C.craneFrame} />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
        {/* Operator cab */}
        <mesh position={[0.18, 0.22, 0]} castShadow>
          <boxGeometry args={[0.28, 0.22, 0.26]} />
          <meshStandardMaterial color="#0f172a" />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
        {/* Main jib (long) */}
        <mesh position={[1.7, 0.18, 0]} castShadow>
          <boxGeometry args={[3.2, 0.1, 0.12]} />
          <meshStandardMaterial color={C.craneBody} />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
        {/* Counter-jib (short) */}
        <mesh position={[-0.9, 0.18, 0]} castShadow>
          <boxGeometry args={[1.4, 0.1, 0.12]} />
          <meshStandardMaterial color={C.craneBody} />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
        {/* A-frame above slewing */}
        <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 8]} castShadow>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color={C.craneFrame} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color={C.craneFrame} />
        </mesh>
        {/* Hook cable + load */}
        <mesh position={[2.2, -1.2, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 2.6, 6]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        <mesh position={[2.2, -2.5, 0]} castShadow>
          <boxGeometry args={[0.32, 0.2, 0.32]} />
          <meshStandardMaterial color={C.pallet} roughness={0.85} />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
      </group>
    </group>
  );
}

function CraneMast({ height, baseY }: { height: number; baseY: number }) {
  const w = 0.28;
  // 4 corner pipes
  const corners: Array<[number, number]> = [
    [-w / 2, -w / 2],
    [w / 2, -w / 2],
    [-w / 2, w / 2],
    [w / 2, w / 2],
  ];
  // Stack of horizontal braces every 0.6m
  const braces = useMemo(() => {
    const levels: number[] = [];
    for (let y = baseY + 0.3; y <= baseY + height; y += 0.55) levels.push(y);
    return levels;
  }, [baseY, height]);
  return (
    <group>
      {corners.map(([x, z], i) => (
        <mesh key={`v-${i}`} position={[x, baseY + height / 2, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, height, 8]} />
          <meshStandardMaterial color={C.craneFrame} metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
      {braces.map((y, bi) =>
        corners.map(([x, z], ci) => {
          const next = corners[(ci + 1) % 4];
          const midX = (x + next[0]) / 2;
          const midZ = (z + next[1]) / 2;
          const dx = next[0] - x;
          const dz = next[1] - z;
          const len = Math.hypot(dx, dz);
          const rotY = Math.atan2(-dz, dx);
          return (
            <mesh
              key={`b-${bi}-${ci}`}
              position={[midX, y, midZ]}
              rotation={[0, rotY, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.018, 0.018, len, 6]} />
              <meshStandardMaterial color={C.craneFrame} metalness={0.5} roughness={0.45} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

function Building({
  position,
  rotation,
  variant,
}: {
  position: [number, number, number];
  rotation: number;
  variant: 'finished' | 'wip';
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 3, 1.2]} />
        <meshStandardMaterial color={C.building} roughness={0.78} metalness={0.06} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      <mesh position={[0, 3.05, 0]} castShadow>
        <boxGeometry args={[2.5, 0.1, 1.28]} />
        <meshStandardMaterial color={C.buildingRoof} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      {variant === 'finished' &&
        [-0.85, -0.3, 0.3, 0.85].map((x, xi) =>
          [0.7, 1.55, 2.4].map((y, yi) => (
            <mesh key={`w-${xi}-${yi}`} position={[x, y, 0.62]} castShadow>
              <boxGeometry args={[0.28, 0.32, 0.04]} />
              <meshStandardMaterial
                color={C.windowGlass}
                emissive={C.windowEmissive}
                emissiveIntensity={0.18}
              />
            </mesh>
          )),
        )}
      {/* WIP variant: skip windows, wrap front face in scaffolding pipes */}
      {variant === 'wip' && <FaceScaffold />}
    </group>
  );
}

function FaceScaffold() {
  return (
    <group position={[0, 0, 0.7]}>
      {/* Verticals */}
      {[-1.0, -0.3, 0.3, 1.0].map((x, i) => (
        <mesh key={`fv-${i}`} position={[x, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 3, 8]} />
          <meshStandardMaterial color={C.scaffold} metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
      {/* Horizontal decks */}
      {[0.8, 1.7, 2.6].map((y, i) => (
        <mesh key={`fh-${i}`} position={[0, y, 0]} castShadow>
          <boxGeometry args={[2.2, 0.04, 0.16]} />
          <meshStandardMaterial color={C.palletPlank} roughness={0.9} />
        </mesh>
      ))}
      {/* Hi-vis netting hint — thin amber strip top + bottom */}
      <mesh position={[0, 0.3, 0.02]}>
        <boxGeometry args={[2.4, 0.04, 0.02]} />
        <meshStandardMaterial color={C.hivis} />
      </mesh>
    </group>
  );
}

function TrafficCone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Cone body */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <coneGeometry args={[0.08, 0.36, 12]} />
        <meshStandardMaterial color={C.cone} roughness={0.85} />
      </mesh>
      {/* White retroreflective stripe */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.04, 12, 1, true]} />
        <meshBasicMaterial color="#f8fafc" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Forklift({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Chassis */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.32, 0.5]} />
        <meshStandardMaterial color={C.hivis} roughness={0.7} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      {/* Mast */}
      <mesh position={[0.42, 0.55, 0]} castShadow>
        <boxGeometry args={[0.06, 0.9, 0.32]} />
        <meshStandardMaterial color={C.beam} />
      </mesh>
      {/* Forks */}
      <mesh position={[0.62, 0.16, 0.12]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.06]} />
        <meshStandardMaterial color={C.beam} metalness={0.4} />
      </mesh>
      <mesh position={[0.62, 0.16, -0.12]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.06]} />
        <meshStandardMaterial color={C.beam} metalness={0.4} />
      </mesh>
      {/* Roll cage */}
      <mesh position={[-0.05, 0.62, 0.22]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.05, 0.62, -0.22]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.05, 0.85, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.5]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Wheels */}
      {[
        [-0.25, -0.22],
        [0.25, -0.22],
        [-0.25, 0.22],
        [0.25, 0.22],
      ].map(([x, z], i) => (
        <mesh
          key={`fw-${i}`}
          position={[x, 0.1, z]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.1, 0.1, 0.08, 14]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
    </group>
  );
}

function LightPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.6, 10]} />
        <meshStandardMaterial color={C.beam} metalness={0.4} roughness={0.55} />
        <Edges color={C.edge}>
          <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
        </Edges>
      </mesh>
      <mesh position={[0, 2.65, 0]} castShadow>
        <boxGeometry args={[0.18, 0.1, 0.18]} />
        <meshStandardMaterial color={C.beam} />
      </mesh>
    </group>
  );
}

// ── Camera marker ──────────────────────────────────────────────────────────

/**
 * Bracket-mounted surveillance camera with a downward-tilted FOV cone.
 *
 * Anatomy (modelled like a real bullet cam + ball-joint mount):
 *   • Outer group rotates around Y (yaw) so the assembly faces `lookAt`.
 *   • Mount bracket (arm + back plate) lives in the OUTER group so it
 *     stays horizontal even as the camera tilts. The arm extends in
 *     local -X, so after yaw it always points back toward the mounting
 *     surface (the column / pole the camera is bracketed to).
 *   • Inner group rotates around Z (pitch / tilt) so only the camera
 *     body + lens + cone tilt downward.
 *   • Cone length = distance from lens to `lookAt`, so the cone's far
 *     plane (base) lands exactly on the look-at target — typically a
 *     point on the floor / ground.
 *
 * `hFovDeg` is the camera's horizontal field of view — same definition
 * as a real surveillance spec. Cone radius is derived: r = L · tan(hfov/2).
 */
function CameraMarker({
  position,
  lookAt,
  hFovDeg = 78,
  bracketLength = 0.32,
}: {
  position: [number, number, number];
  lookAt: [number, number, number];
  hFovDeg?: number;
  bracketLength?: number;
}) {
  const { rotY, tilt, coneLength, coneRadius } = useMemo(() => {
    const dx = lookAt[0] - position[0];
    const dy = lookAt[1] - position[1];
    const dz = lookAt[2] - position[2];
    const horiz = Math.hypot(dx, dz);
    // Yaw: rotates local +X to point toward look-at in the XZ plane.
    const rotY = Math.atan2(-dz, dx);
    // Pitch: angle below the horizon (negative for "look down").
    const tilt = Math.atan2(dy, horiz);
    const coneLength = Math.hypot(dx, dy, dz);
    const half = (hFovDeg / 2) * (Math.PI / 180);
    const coneRadius = coneLength * Math.tan(half);
    return { rotY, tilt, coneLength, coneRadius };
  }, [position, lookAt, hFovDeg]);

  const lensX = 0.18;
  const coneCenterX = lensX + coneLength / 2;

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Mount bracket — arm + back plate, stays horizontal */}
        <mesh position={[-bracketLength / 2, 0, 0]} castShadow>
          <boxGeometry args={[bracketLength, 0.06, 0.06]} />
          <meshStandardMaterial color={C.beam} metalness={0.55} roughness={0.45} />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
        <mesh position={[-bracketLength - 0.025, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.22, 0.22]} />
          <meshStandardMaterial color={C.beam} metalness={0.55} roughness={0.45} />
          <Edges color={C.edge}>
            <lineBasicMaterial color={C.edge} transparent opacity={EDGE_OPACITY} />
          </Edges>
        </mesh>
        {/* Pivot ball — between bracket arm and camera body, sits at origin
            of the tilt rotation. */}
        <mesh castShadow>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Inner group: tilt only the camera body + lens + cone */}
        <group rotation={[0, 0, tilt]}>
          {/* Camera body */}
          <mesh position={[0.04, 0, 0]} castShadow>
            <boxGeometry args={[0.36, 0.22, 0.24]} />
            <meshStandardMaterial color={C.markerBody} metalness={0.4} roughness={0.4} />
            <Edges color={C.edge}>
              <lineBasicMaterial color={C.edge} transparent opacity={0.55} />
            </Edges>
          </mesh>
          {/* Lens barrel — sits at +X face of body */}
          <mesh position={[lensX, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.08, 16]} />
            <meshStandardMaterial color="#0a0f1c" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Lens glass */}
          <mesh position={[lensX + 0.041, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.005, 16]} />
            <meshStandardMaterial
              color="#1e3a8a"
              emissive="#3b82f6"
              emissiveIntensity={0.45}
              metalness={0.8}
              roughness={0.15}
            />
          </mesh>
          {/* FOV cone — translucent fill, apex at lens, base at look-at */}
          <mesh
            position={[coneCenterX, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <coneGeometry args={[coneRadius, coneLength, 28, 1, true]} />
            <meshBasicMaterial
              color={C.markerCone}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* FOV cone wireframe — schematic CAD overlay */}
          <mesh
            position={[coneCenterX, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <coneGeometry args={[coneRadius, coneLength, 14, 1, true]} />
            <meshBasicMaterial
              color={C.markerCone}
              wireframe
              transparent
              opacity={0.32}
              depthWrite={false}
            />
          </mesh>
          {/* Status LED on the camera body (top edge) */}
          <mesh position={[0.04, 0.13, -0.09]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
    </group>
  );
}
