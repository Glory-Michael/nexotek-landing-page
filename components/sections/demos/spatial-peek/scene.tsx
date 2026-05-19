'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { ensureCCW, type Vec2 } from '@/lib/spatial/polygon-clipping';

// ── Clipped FOV pyramid ───────────────────────────────────────────────────
// Ported from camect-webapp/frontend/components/floorplan/FOVCone.tsx.
// Clips a pyramidal frustum against the room polygon so coverage stops at walls.

interface ClippedFOVProps {
  camX: number;
  camY: number;
  camZ: number;
  rotationDeg: number;
  hFovDeg: number;
  vFovDeg: number;
  tiltDeg: number;
  rollDeg: number;
  reach: number;
  color: string;
  roomPolygonXZ: Vec2[];
  wallHeight: number;
  active?: boolean;
}

export const ClippedFOV: React.FC<ClippedFOVProps> = ({
  camX,
  camY,
  camZ,
  rotationDeg,
  hFovDeg,
  vFovDeg,
  tiltDeg,
  rollDeg,
  reach,
  color,
  roomPolygonXZ,
  wallHeight,
  active = false,
}) => {
  const clippingPlanes = useMemo(() => {
    const planes: THREE.Plane[] = [];
    if (roomPolygonXZ.length < 3) return planes;
    const poly = ensureCCW(roomPolygonXZ);
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const v1 = new THREE.Vector3(p1[0], 0, p1[1]);
      const v2 = new THREE.Vector3(p2[0], 0, p2[1]);
      const vUp = new THREE.Vector3(p1[0], 1, p1[1]);
      const plane = new THREE.Plane().setFromCoplanarPoints(v1, v2, vUp);
      planes.push(plane);
    }
    planes.push(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), wallHeight),
    );
    return planes;
  }, [roomPolygonXZ, wallHeight]);

  const { frustumGeo, perimeterGeo } = useMemo(() => {
    const halfH = ((hFovDeg / 2) * Math.PI) / 180;
    const halfV = ((vFovDeg / 2) * Math.PI) / 180;
    const w = reach * Math.tan(halfH);
    const h = reach * Math.tan(halfV);
    const baseCorners = [
      [-w, h, -reach],
      [w, h, -reach],
      [w, -h, -reach],
      [-w, -h, -reach],
    ];
    const pts: number[] = [];
    for (let i = 0; i < 4; i++) {
      const curr = baseCorners[i];
      const next = baseCorners[(i + 1) % 4];
      pts.push(0, 0, 0, curr[0], curr[1], curr[2], next[0], next[1], next[2]);
    }
    pts.push(
      baseCorners[0][0], baseCorners[0][1], baseCorners[0][2],
      baseCorners[1][0], baseCorners[1][1], baseCorners[1][2],
      baseCorners[2][0], baseCorners[2][1], baseCorners[2][2],
      baseCorners[0][0], baseCorners[0][1], baseCorners[0][2],
      baseCorners[2][0], baseCorners[2][1], baseCorners[2][2],
      baseCorners[3][0], baseCorners[3][1], baseCorners[3][2],
    );
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geo.computeVertexNormals();

    const wirePts: number[] = [];
    for (const c of baseCorners) wirePts.push(0, 0, 0, c[0], c[1], c[2]);
    for (let i = 0; i < 4; i++) {
      wirePts.push(
        baseCorners[i][0], baseCorners[i][1], baseCorners[i][2],
        baseCorners[(i + 1) % 4][0], baseCorners[(i + 1) % 4][1], baseCorners[(i + 1) % 4][2],
      );
    }
    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3));
    return { frustumGeo: geo, perimeterGeo: wireGeo };
  }, [hFovDeg, vFovDeg, reach]);

  if (clippingPlanes.length === 0) return null;

  const beamOpacity = active ? 0.18 : 0.08;
  const surfaceOpacity = active ? 0.32 : 0.16;
  const edgeOpacity = active ? 0.45 : 0.22;

  return (
    <group position={[camX, camY, camZ]} rotation={[0, (-rotationDeg * Math.PI) / 180, 0]}>
      <group rotation={[(tiltDeg * Math.PI) / 180, 0, (rollDeg * Math.PI) / 180]}>
        <mesh renderOrder={1}>
          <primitive object={frustumGeo} attach="geometry" />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={beamOpacity}
            side={THREE.DoubleSide}
            clippingPlanes={clippingPlanes}
            clipShadows
            depthWrite={false}
          />
        </mesh>
        <mesh renderOrder={2}>
          <primitive object={frustumGeo} attach="geometry" />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={surfaceOpacity}
            side={THREE.FrontSide}
            clippingPlanes={clippingPlanes}
            clipShadows
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
        <lineSegments geometry={perimeterGeo}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={edgeOpacity}
            clippingPlanes={clippingPlanes}
          />
        </lineSegments>
      </group>
    </group>
  );
};

// ── Camera marker mesh ─────────────────────────────────────────────────────
// Simplified port of CameraMarker3D from camect — keeps the detailed body
// (mount plate, arm, gimbal, housing, lens, hood, antenna) but drops the
// in-scene editing controls and the React-DOM label.

interface CameraMarkerMeshProps {
  position: [number, number, number];
  rotationDeg: number;
  tiltDeg: number;
  rollDeg: number;
  active?: boolean;
  selected?: boolean;
  bodyColor?: string;
}

const CameraMarkerMesh: React.FC<CameraMarkerMeshProps> = ({
  position,
  rotationDeg,
  tiltDeg,
  rollDeg,
  active = false,
  selected = false,
  bodyColor,
}) => {
  const color = bodyColor ?? (active ? '#171717' : '#3f3f46');
  return (
    <group position={position}>
      <group rotation={[0, ((-rotationDeg + 180) * Math.PI) / 180, 0]}>
        <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.03, 20]} />
          <meshStandardMaterial color="#d4d4d4" metalness={0.72} roughness={0.33} />
        </mesh>
        <mesh position={[0, 0.2, 0.02]} rotation={[-0.5, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.024, 0.03, 0.2, 16]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.12, 0.07]} castShadow receiveShadow>
          <sphereGeometry args={[0.042, 18, 18]} />
          <meshStandardMaterial color="#b4b4b8" metalness={0.7} roughness={0.3} />
        </mesh>
        <group
          position={[0, 0.12, 0.07]}
          rotation={[(-tiltDeg * Math.PI) / 180, 0, (rollDeg * Math.PI) / 180]}
        >
          <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.08, 0.095, 0.24, 28]} />
            <meshStandardMaterial color={color} metalness={0.35} roughness={0.42} />
          </mesh>
          <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.055, 0.062, 0.07, 24]} />
            <meshStandardMaterial color="#18181b" metalness={0.55} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0, 0.302]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.012, 20]} />
            <meshStandardMaterial
              color="#fafafa"
              emissive={active ? '#10b981' : '#52525b'}
              emissiveIntensity={active ? 0.45 : 0.12}
              metalness={0.9}
              roughness={0.06}
              transparent
              opacity={0.92}
            />
          </mesh>
          <mesh position={[0, 0.055, 0.275]} castShadow receiveShadow>
            <boxGeometry args={[0.13, 0.028, 0.1]} />
            <meshStandardMaterial color="#27272a" metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[0.078, 0.06, 0.12]} rotation={[0.5, 0, 0.3]} castShadow receiveShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.1, 8]} />
            <meshStandardMaterial color="#e4e4e7" metalness={0.78} roughness={0.28} />
          </mesh>
        </group>
        {active && (
          <mesh position={[0, 0.12, 0.38]}>
            <sphereGeometry args={[0.024]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
        )}
      </group>
      <mesh position={[0, -position[1] + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color={selected ? '#171717' : color} transparent opacity={selected ? 0.85 : 0.25} />
      </mesh>
    </group>
  );
};

// ── Room walls + floor ─────────────────────────────────────────────────────

const RoomFloor: React.FC<{ polygon: Vec2[] }> = ({ polygon }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (polygon.length === 0) return s;
    s.moveTo(polygon[0][0], polygon[0][1]);
    for (let i = 1; i < polygon.length; i++) {
      s.lineTo(polygon[i][0], polygon[i][1]);
    }
    s.closePath();
    return s;
  }, [polygon]);

  const geo = useMemo(() => new THREE.ShapeGeometry(shape), [shape]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color="#f4f4f5" roughness={0.85} metalness={0} />
    </mesh>
  );
};

const RoomWalls: React.FC<{ polygon: Vec2[]; height: number }> = ({ polygon, height }) => {
  const segments = useMemo(() => {
    const out: Array<{ mid: [number, number, number]; len: number; angle: number }> = [];
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      const mid: [number, number, number] = [(p1[0] + p2[0]) / 2, height / 2, (p1[1] + p2[1]) / 2];
      out.push({ mid, len, angle });
    }
    return out;
  }, [polygon]);

  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={s.mid} rotation={[0, -s.angle, 0]} receiveShadow castShadow>
          <boxGeometry args={[s.len, height, 0.08]} />
          <meshStandardMaterial color="#e4e4e7" roughness={0.7} metalness={0.02} />
        </mesh>
      ))}
      {segments.map((s, i) => (
        <mesh key={`top-${i}`} position={[s.mid[0], height + 0.01, s.mid[2]]} rotation={[0, -s.angle, 0]}>
          <boxGeometry args={[s.len, 0.015, 0.1]} />
          <meshBasicMaterial color="#171717" />
        </mesh>
      ))}
    </group>
  );
};

// ── Auto-rotate orbit controls ─────────────────────────────────────────────

const AutoOrbit: React.FC<{ targetRef: React.RefObject<THREE.Group | null> }> = ({ targetRef }) => {
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta * 0.12;
    if (targetRef.current) {
      targetRef.current.rotation.y = Math.sin(t.current) * 0.08;
    }
  });
  return null;
};

// ── Camera spec (scene data) ──────────────────────────────────────────────

export interface CameraSpec {
  id: string;
  label: string;
  x: number;
  z: number;
  height: number;
  rotationDeg: number;
  tiltDeg: number;
  hFovDeg: number;
  vFovDeg: number;
  reach: number;
  active?: boolean;
}

interface SceneProps {
  roomPolygon: Vec2[];
  wallHeight: number;
  cameras: CameraSpec[];
  selectedId?: string;
}

const SceneContent: React.FC<SceneProps> = ({ roomPolygon, wallHeight, cameras, selectedId }) => {
  const stageRef = useRef<THREE.Group>(null);

  // Center polygon for nicer camera framing
  const bbox = useMemo(() => {
    const xs = roomPolygon.map((p) => p[0]);
    const zs = roomPolygon.map((p) => p[1]);
    return {
      cx: (Math.min(...xs) + Math.max(...xs)) / 2,
      cz: (Math.min(...zs) + Math.max(...zs)) / 2,
      span: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)),
    };
  }, [roomPolygon]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 8, -4]} intensity={0.25} />

      <PerspectiveCamera
        makeDefault
        position={[bbox.cx + bbox.span * 0.8, bbox.span * 0.8, bbox.cz + bbox.span * 0.9]}
        fov={36}
        near={0.1}
        far={200}
      />
      <OrbitControls
        target={[bbox.cx, wallHeight * 0.4, bbox.cz]}
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.55}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.4}
      />

      <Grid
        position={[bbox.cx, 0, bbox.cz]}
        args={[bbox.span * 3, bbox.span * 3]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#d4d4d8"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#a1a1aa"
        fadeDistance={bbox.span * 2.5}
        fadeStrength={1.2}
        infiniteGrid={false}
      />

      <group ref={stageRef}>
        <RoomFloor polygon={roomPolygon} />
        <RoomWalls polygon={roomPolygon} height={wallHeight} />

        {cameras.map((c) => (
          <ClippedFOV
            key={`fov-${c.id}`}
            camX={c.x}
            camY={c.height + 0.12}
            camZ={c.z}
            rotationDeg={c.rotationDeg}
            hFovDeg={c.hFovDeg}
            vFovDeg={c.vFovDeg}
            tiltDeg={c.tiltDeg}
            rollDeg={0}
            reach={c.reach}
            color={c.active ? '#10b981' : '#52525b'}
            roomPolygonXZ={roomPolygon}
            wallHeight={wallHeight}
            active={c.active}
          />
        ))}

        {cameras.map((c) => (
          <CameraMarkerMesh
            key={`mk-${c.id}`}
            position={[c.x, c.height, c.z]}
            rotationDeg={c.rotationDeg}
            tiltDeg={c.tiltDeg}
            rollDeg={0}
            active={c.active}
            selected={selectedId === c.id}
          />
        ))}
      </group>

      <AutoOrbit targetRef={stageRef} />
    </>
  );
};

export const SpatialPeekScene: React.FC<SceneProps> = (props) => {
  return (
    <Canvas
      shadows="percentage"
      gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
};
