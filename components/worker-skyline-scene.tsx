'use client';

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Grid parameters ─────────────────────────────────────────────────────────
const COLS = 76;
const ROWS = 30;
const X_MIN = -5.4, X_MAX = 5.4;
const Y_MIN = 0.0,  Y_MAX = 3.5;
const DX = (X_MAX - X_MIN) / (COLS - 1);
const DY = (Y_MAX - Y_MIN) / (ROWS - 1);
const DOT_R = 0.044;

// ─── Building silhouettes ─────────────────────────────────────────────────────
type Building = { cx: number; hw: number; h: number; construction?: true };
const BUILDINGS: Building[] = [
  { cx: -4.8, hw: 0.44, h: 2.3 },
  { cx: -3.7, hw: 0.32, h: 1.6 },
  { cx: -2.8, hw: 0.46, h: 3.0 },
  { cx: -1.9, hw: 0.27, h: 1.8 },
  { cx: -1.0, hw: 0.54, h: 4.1, construction: true },
  { cx:  0.15, hw: 0.25, h: 1.2 },
  { cx:  0.9,  hw: 0.43, h: 2.7 },
  { cx:  1.9,  hw: 0.31, h: 2.0 },
  { cx:  3.0,  hw: 0.55, h: 3.2 },
  { cx:  4.2,  hw: 0.39, h: 1.8 },
];

const CONSTR_BUILDING = BUILDINGS.find(b => b.construction)!;

// Light-theme palette
const C_STRUCT       = new THREE.Color(0x1e40af); // blue-800 — building dots
const C_CONSTR_BRIGHT = new THREE.Color(0xea580c); // orange-600 — construction vivid
const C_CONSTR_DIM   = new THREE.Color(0xe2e8f0); // slate-200 — construction faded
const C_SKY          = new THREE.Color(0xe2e8f0); // slate-200 — sparse sky texture
const C_GROUND       = new THREE.Color(0x94a3b8); // slate-400 — ground row

// ─── Seeded PRNG — identical on server and client ────────────────────────────
// Mulberry32 — fast, deterministic, no side-effects
function makePrng(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── Dot instance data ────────────────────────────────────────────────────────
interface DotData {
  positions: THREE.Vector3[];
  colors: THREE.Color[];
  constructionIndices: number[];
}

function buildDotData(): DotData {
  const rand = makePrng(0xdeadbee7); // fixed seed → same on server & client
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[]      = [];
  const constructionIndices: number[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = X_MIN + c * DX;
      const y = Y_MIN + r * DY;

      let hit: Building | undefined;
      for (const b of BUILDINGS) {
        if (x >= b.cx - b.hw && x <= b.cx + b.hw && y >= 0.04 && y <= b.h) {
          hit = b;
          break;
        }
      }

      let color: THREE.Color;
      if (hit) {
        // construction dots start at dim color; animated to bright in useFrame
        color = hit.construction ? C_CONSTR_DIM.clone() : C_STRUCT.clone();
      } else if (y < 0.07) {
        color = C_GROUND.clone();
      } else if (rand() < 0.038) {
        color = C_SKY.clone();
      } else {
        continue;
      }

      if (hit?.construction) constructionIndices.push(positions.length);
      positions.push(new THREE.Vector3(x, y, 0));
      colors.push(color);
    }
  }

  return { positions, colors, constructionIndices };
}

// ─── Dot skyline ──────────────────────────────────────────────────────────────
function DotSkyline() {
  const meshRef   = useRef<THREE.InstancedMesh>(null!);
  const pulseColor = useRef(new THREE.Color());
  const data      = useMemo(() => buildDotData(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    data.positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, data.colors[i]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || data.constructionIndices.length === 0) return;
    const t     = state.clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.9));
    pulseColor.current.lerpColors(C_CONSTR_DIM, C_CONSTR_BRIGHT, 0.2 + pulse * 0.8);
    for (const i of data.constructionIndices) {
      mesh.setColorAt(i, pulseColor.current);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, data.positions.length]}>
      <sphereGeometry args={[DOT_R, 5, 4]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

// ─── Window accent dots on completed buildings ────────────────────────────────
function BuildingAccents() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const { positions, offsets } = useMemo(() => {
    const rand = makePrng(0xc0ffee42);
    const positions: THREE.Vector3[] = [];
    const offsets: number[]          = [];
    for (const b of BUILDINGS) {
      if (b.construction) continue;
      for (let y = 0.48; y < b.h - 0.18; y += 0.44) {
        for (let x = b.cx - b.hw + 0.18; x < b.cx + b.hw - 0.1; x += 0.28) {
          if (rand() < 0.55) {
            positions.push(new THREE.Vector3(x, y, 0.06));
            offsets.push(rand() * Math.PI * 2);
          }
        }
      }
    }
    return { positions, offsets };
  }, []);

  const winColor = useRef(new THREE.Color());

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const base = new THREE.Color(0x3b82f6); // blue-500 starting color
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, base);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const dim  = new THREE.Color(0xbfdbfe); // blue-200
    const vivid = new THREE.Color(0x1d4ed8); // blue-700
    for (let i = 0; i < positions.length; i++) {
      const v = 0.55 + 0.45 * Math.sin(t * 0.22 + offsets[i]);
      winColor.current.lerpColors(dim, vivid, v);
      mesh.setColorAt(i, winColor.current);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (positions.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[0.026, 4, 3]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

// ─── Construction crane ───────────────────────────────────────────────────────
function ConstructionCrane() {
  const { cx, h } = CONSTR_BUILDING;
  return (
    <group>
      <mesh position={[cx + 0.33, h + 0.74, 0]}>
        <boxGeometry args={[0.056, 1.48, 0.056]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>
      <mesh position={[cx - 0.10, h + 1.46, 0]}>
        <boxGeometry args={[1.06, 0.046, 0.046]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>
      <mesh position={[cx + 0.65, h + 1.46, 0]}>
        <boxGeometry args={[0.60, 0.046, 0.046]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>
      <mesh position={[cx + 0.33, h + 1.50, 0]}>
        <boxGeometry args={[0.09, 0.09, 0.09]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>
      <mesh position={[cx - 0.24, h + 1.06, 0]}>
        <boxGeometry args={[0.015, 0.78, 0.015]} />
        <meshBasicMaterial color="#92400e" />
      </mesh>
      <mesh position={[cx - 0.24, h + 0.64, 0]}>
        <boxGeometry args={[0.056, 0.056, 0.056]} />
        <meshBasicMaterial color="#92400e" />
      </mesh>
    </group>
  );
}

// ─── Scan line ────────────────────────────────────────────────────────────────
function ScanLine() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const yCenter = (Y_MIN + Y_MAX) / 2;
  const height  = Y_MAX - Y_MIN + 0.6;

  useFrame((state) => {
    const sweep = (state.clock.elapsedTime * 0.52) % (X_MAX - X_MIN + 1.2);
    meshRef.current.position.set(X_MIN - 0.3 + sweep, yCenter, 0.45);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[0.028, height]} />
      <meshBasicMaterial
        color={0x3b82f6}
        transparent
        opacity={0.22}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Worker figure ────────────────────────────────────────────────────────────
function WorkerFigure() {
  const bodyGroupRef = useRef<THREE.Group>(null!);
  const armGroupRef  = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    bodyGroupRef.current.position.y = Math.sin(t * 1.15) * 0.013;
    armGroupRef.current.rotation.z  = Math.sin(t * 0.58) * 0.20;
  });

  return (
    <group position={[-0.45, 0, 1.85]}>
      {/* Boots */}
      <mesh position={[-0.068, 0.052, 0.022]}>
        <boxGeometry args={[0.064, 0.10, 0.11]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.068, 0.052, 0.022]}>
        <boxGeometry args={[0.064, 0.10, 0.11]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.068, 0.30, 0]}>
        <cylinderGeometry args={[0.042, 0.038, 0.42, 6]} />
        <meshBasicMaterial color="#334155" />
      </mesh>
      <mesh position={[0.068, 0.30, 0]}>
        <cylinderGeometry args={[0.042, 0.038, 0.42, 6]} />
        <meshBasicMaterial color="#334155" />
      </mesh>

      {/* Animated body */}
      <group ref={bodyGroupRef}>
        {/* Hi-vis torso */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.092, 0.078, 0.34, 7]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.082, 8, 6]} />
          <meshBasicMaterial color="#cbd5e1" />
        </mesh>

        {/* Hardhat brim */}
        <mesh position={[0, 0.912, 0]}>
          <cylinderGeometry args={[0.122, 0.096, 0.022, 10]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        {/* Hardhat crown */}
        <mesh position={[0, 0.944, 0]}>
          <cylinderGeometry args={[0.080, 0.080, 0.062, 8]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>

        {/* Left arm — relaxed */}
        <mesh position={[-0.146, 0.60, 0]} rotation={[0, 0, -0.36]}>
          <cylinderGeometry args={[0.032, 0.026, 0.30, 5]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>

        {/* Right arm + scanner pivot */}
        <group ref={armGroupRef} position={[0.146, 0.72, 0]}>
          <mesh position={[0.042, -0.078, 0]} rotation={[0, 0, 0.56]}>
            <cylinderGeometry args={[0.032, 0.028, 0.29, 5]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          {/* Scanner body */}
          <mesh position={[0.152, 0.042, 0]}>
            <boxGeometry args={[0.108, 0.040, 0.040]} />
            <meshBasicMaterial color="#2563eb" />
          </mesh>
          {/* Scanner lens */}
          <mesh position={[0.212, 0.042, 0]}>
            <sphereGeometry args={[0.024, 6, 5]} />
            <meshBasicMaterial color="#93c5fd" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─── Ground grid ──────────────────────────────────────────────────────────────
function GroundGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const positions = useMemo(() => {
    const rand = makePrng(0xfeedface);
    const pts: THREE.Vector3[] = [];
    for (let x = X_MIN; x <= X_MAX; x += 0.32) {
      for (let z = -1.5; z <= 2.5; z += 0.32) {
        if (rand() < 0.52) pts.push(new THREE.Vector3(x, -0.01, z));
      }
    }
    return pts;
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col   = new THREE.Color(0xcbd5e1); // slate-300
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[0.020, 4, 3]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <color attach="background" args={['#ffffff']} />
      <fog attach="fog" args={['#ffffff', 12, 20]} />
      <GroundGrid />
      <DotSkyline />
      <BuildingAccents />
      <ConstructionCrane />
      <ScanLine />
      <WorkerFigure />
    </>
  );
}

// ─── Public component — imported with ssr:false from the page ────────────────
export function WorkerSkylineScene() {
  return (
    <div className="w-full h-full" style={{ minHeight: '300px' }}>
      <Canvas
        camera={{ position: [0.2, 1.85, 8.6], fov: 50 }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1.9, 0);
        }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
