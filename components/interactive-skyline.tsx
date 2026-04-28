'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Suppress THREE.Clock deprecation warning (comes from R3F internals, not our code)
const _origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Clock')) return;
  _origWarn.apply(console, args);
};

// --- Types & Constants ---
type PointType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
interface LidarPoint {
  position: [number, number, number];
  type: PointType;
}

const PALETTE_DARK: Record<number, string> = {
  0: '#46465a', // Ground
  1: '#00c8ff', // Structure
  2: '#ff7800', // Crane
  3: '#32ff32', // Vehicle
  4: '#ff3232', // Person
  5: '#ffffc8', // Light
  6: '#282832', // Road
  7: '#6496ff', // OtherBuild
  8: '#ff0000', // Red Light
  9: '#00ff00', // Green Light
  10: '#3264c8', // Cargo
};

const PALETTE_LIGHT: Record<number, string> = {
  0: '#c8c8d2', // Ground
  1: '#0064c8', // Structure
  2: '#c85000', // Crane
  3: '#149614', // Vehicle
  4: '#c80000', // Person
  5: '#ffa000', // Light
  6: '#a0a0aa', // Road
  7: '#5064b4', // OtherBuild
  8: '#cc0000', // Red Light
  9: '#00aa00', // Green Light
  10: '#2850a0', // Cargo
};

// --- Helper: Point Generator ---
const addPoint = (points: LidarPoint[], x: number, y: number, z: number, type: PointType, jitter = 0.5) => {
  points.push({
    position: [
      x + (Math.random() - 0.5) * jitter,
      y + (Math.random() - 0.5) * jitter,
      z + (Math.random() - 0.5) * jitter,
    ],
    type,
  });
};

// --- Sub-Component: Static Scene ---
const StaticScene = ({ isDark }: { isDark: boolean }) => {
  const points = useMemo(() => {
    const p: LidarPoint[] = [];

    // 1. Ground & Roads (Curved LiDAR scan lines)
    for (let radius = 4; radius < 400; radius += 3.5) {
      const numPoints = Math.floor((2 * Math.PI * radius) / 3);
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        if (Math.abs(x) < 350 && Math.abs(z) < 350) {
          const isRoad = Math.abs(x) < 40 || Math.abs(z) < 40;
          addPoint(p, x, 0, z, isRoad ? 6 : 0, 1);
        }
      }
    }

    // 2. Streetlights
    const addLight = (lx: number, lz: number) => {
      for (let y = 0; y <= 35; y += 2) addPoint(p, lx, y, lz, 5, 0.5); // Pole
      for (let i = 0; i < 20; i++) addPoint(p, lx, 36, lz, 5, 4); // Bright bulb
    };
    for (let z = -280; z <= 280; z += 90) if (Math.abs(z) > 50) { addLight(-48, z); addLight(48, z); }
    for (let x = -280; x <= 280; x += 90) if (Math.abs(x) > 50) { addLight(x, -48); addLight(x, 48); }

    // 3. Main Building under construction
    const bX = -140, bZ = -160, bW = 80, bD = 100, bH = 180;
    const colSpacing = 20, floorHeight = 20;
    // Floor slabs
    for (let y = 0; y <= bH; y += floorHeight) {
      for (let x = bX; x <= bX + bW; x += 3) {
        for (let z = bZ; z <= bZ + bD; z += 3) {
          if (x === bX || x === bX + bW || z === bZ || z === bZ + bD || Math.random() < 0.05) {
            addPoint(p, x, y, z, 1, 1);
          }
        }
      }
    }
    // Structural columns
    for (let x = bX; x <= bX + bW; x += colSpacing) {
      for (let z = bZ; z <= bZ + bD; z += colSpacing) {
        for (let y = 0; y <= bH; y += 3) {
          addPoint(p, x, y, z, 1, 1);
        }
      }
    }

    // 4. Other Active Building (with columns)
    const oX = 80, oZ = -140, oW = 100, oD = 80, oH = 100;
    // Floor slabs
    for (let y = 0; y <= oH; y += 25) {
      for (let x = oX; x <= oX + oW; x += 4) {
        for (let z = oZ; z <= oZ + oD; z += 4) {
          if (x === oX || x === oX + oW || z === oZ || z === oZ + oD || Math.random() < 0.08) {
            addPoint(p, x, y, z, 7, 1);
          }
        }
      }
    }
    // Structural columns
    for (let x = oX; x <= oX + oW; x += 25) {
      for (let z = oZ; z <= oZ + oD; z += 25) {
        for (let y = 0; y <= oH; y += 4) {
          addPoint(p, x, y, z, 7, 1);
        }
      }
    }

    // 5. Finished Context Buildings
    const addFinishedBuilding = (fx: number, fz: number, fw: number, fd: number, fh: number) => {
      for (let y = 0; y <= fh; y += 6) {
        for (let x = fx; x <= fx + fw; x += 4) {
          if (Math.random() < 0.4) {
            addPoint(p, x, y, fz, 7, 0.5);
            addPoint(p, x, y, fz + fd, 7, 0.5);
          }
        }
        for (let z = fz; z <= fz + fd; z += 4) {
          if (Math.random() < 0.4) {
            addPoint(p, fx, y, z, 7, 0.5);
            addPoint(p, fx + fw, y, z, 7, 0.5);
          }
        }
      }
    };
    addFinishedBuilding(-220, 80, 100, 80, 140);
    addFinishedBuilding(100, 100, 120, 80, 200);
    addFinishedBuilding(-100, 140, 60, 80, 100);

    // 6. Crane Mast
    const cX = bX + bW / 2, cZ = bZ + bD / 2, craneBaseY = bH, mastH = 100;
    for (let y = craneBaseY; y <= craneBaseY + mastH; y += 3) {
      [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([ox, oz]) => addPoint(p, cX + ox, y, cZ + oz, 2, 0.5));
      if (y % 12 === 0) {
        for (let i = -3; i <= 3; i += 1.5) {
          addPoint(p, cX + i, y, cZ - 3, 2, 0.5); addPoint(p, cX + i, y, cZ + 3, 2, 0.5);
          addPoint(p, cX - 3, y, cZ + i, 2, 0.5); addPoint(p, cX + 3, y, cZ + i, 2, 0.5);
        }
      }
    }

    // 7. Construction Vehicles
    const addBulldozer = (bx: number, bz: number, angle: number) => {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const rot = (x: number, z: number) => ({ x: bx + x * cos - z * sin, z: bz + x * sin + z * cos });
      for (let x = -10; x <= 10; x += 2) for (let z = -8; z <= 8; z += 2) for (let y = 0; y <= 10; y += 2) {
        const pt = rot(x, z); addPoint(p, pt.x, y, pt.z, 3, 0.5);
      }
      for (let z = -12; z <= 12; z += 2) for (let y = 0; y <= 8; y += 2) {
        const pt = rot(12, z); addPoint(p, pt.x, y, pt.z, 3, 0.5);
      }
    };
    addBulldozer(bX - 20, bZ + 20, Math.PI / 4);

    const addExcavator = (ex: number, ez: number, angle: number) => {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const rot = (x: number, z: number) => ({ x: ex + x * cos - z * sin, z: ez + x * sin + z * cos });
      for (let x = -14; x <= 14; x += 2) for (let z of [-10, -8, 8, 10]) for (let y = 0; y <= 6; y += 2) {
        const pt = rot(x, z); addPoint(p, pt.x, y, pt.z, 3, 0.5);
      }
      for (let x = -12; x <= 10; x += 2) for (let z = -8; z <= 8; z += 2) for (let y = 6; y <= 18; y += 2) {
        if (Math.random() < 0.6) { const pt = rot(x, z); addPoint(p, pt.x, y, pt.z, 3, 0.5); }
      }
      for (let i = 0; i <= 30; i += 1.5) {
        const ax = 10 + i * 0.9, ay = 12 + Math.sin(i * 0.12) * 14;
        const pt = rot(ax, 0);
        addPoint(p, pt.x, ay, pt.z, 3, 1);
        addPoint(p, pt.x, ay + 1, pt.z, 3, 1);
        addPoint(p, pt.x, ay - 1, pt.z, 3, 1);
      }
    };
    addExcavator(bX - 30, bZ + bD - 20, Math.PI / 6);

    // 8. Parked Cars & Infrastructure
    const addCar = (cx: number, cz: number, angle: number) => {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const rot = (x: number, z: number) => ({ x: cx + x * cos - z * sin, z: cz + x * sin + z * cos });
      // Car Body
      for (let x = -12; x <= 12; x += 2) for (let z = -5; z <= 5; z += 2) for (let y = 0; y <= 4; y += 2) {
        const pt = rot(x, z); addPoint(p, pt.x, y, pt.z, 3, 0.5);
      }
      // Car Cabin
      for (let x = -4; x <= 6; x += 2) for (let z = -4; z <= 4; z += 2) for (let y = 4; y <= 8; y += 2) {
        const pt = rot(x, z); addPoint(p, pt.x, y, pt.z, 3, 0.5);
      }
    };
    addCar(-120, 45, 0); addCar(140, -45, Math.PI); addCar(45, 130, Math.PI / 2);
    addCar(215, 45, 0); addCar(-215, -45, Math.PI);

    const addTrafficSignalPole = (sx: number, sz: number, rotAngle: number) => {
      for (let y = 0; y <= 25; y += 2) addPoint(p, sx, y, sz, 7, 0.5);
      const cos = Math.cos(rotAngle), sin = Math.sin(rotAngle);
      for (let l = 0; l <= 25; l += 2) addPoint(p, sx + l * cos, 25, sz + l * sin, 7, 0.5);
      // Box for lights
      const lx = sx + 25 * cos, lz = sz + 25 * sin;
      const fAng = rotAngle + Math.PI / 2, fs = Math.sin(fAng), fc = Math.cos(fAng);
      for (let ix = -2; ix <= 2; ix += 2) for (let iy = 22; iy <= 28; iy += 2) addPoint(p, lx + ix * fs, iy, lz - ix * fc, 7, 0.5);
    };
    addTrafficSignalPole(45, 45, -Math.PI / 2); addTrafficSignalPole(-45, -45, Math.PI / 2);
    addTrafficSignalPole(-45, 45, 0); addTrafficSignalPole(45, -45, Math.PI);

    // 9. Pedestrians & Workers
    const addPedestrian = (px: number, pz: number) => {
      for (let y = 0; y <= 8; y += 1.5) addPoint(p, px, y, pz, 4, 0.8);
    };
    for (let i = 0; i < 40; i++) {
      const side = Math.floor(Math.random() * 4);
      let px = 0, pz = 0;
      if (side === 0) { px = (Math.random() - 0.5) * 600; pz = -60; }
      else if (side === 1) { px = (Math.random() - 0.5) * 600; pz = 60; }
      else if (side === 2) { px = -60; pz = (Math.random() - 0.5) * 600; }
      else { px = 60; pz = (Math.random() - 0.5) * 600; }
      const nearIntersection = Math.abs(px) < 80 && Math.abs(pz) < 80;
      const inMainBuilding = px > bX - 10 && px < bX + bW + 10 && pz > bZ - 10 && pz < bZ + bD + 10;
      const inOtherBuilding = px > oX - 10 && px < oX + oW + 10 && pz > oZ - 10 && pz < oZ + oD + 10;
      if (!nearIntersection && !inMainBuilding && !inOtherBuilding) addPedestrian(px, pz);
    }
    for (let i = 0; i < 15; i++) {
      addPedestrian(bX + Math.random() * bW, bZ + bD + 10 + Math.random() * 10);
      addPedestrian(bX - 10 - Math.random() * 10, bZ + Math.random() * bD);
    }

    return p;
  }, []);

  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;

  const typeData = useMemo(() => {
    return Object.entries(palette).map(([type, color]) => {
      const typeNum = parseInt(type) as PointType;
      const typePoints = points.filter(p => p.type === typeNum);
      if (typePoints.length === 0) return null;

      const positions = new Float32Array(typePoints.length * 3);
      typePoints.forEach((p, i) => {
        positions[i * 3] = p.position[0];
        positions[i * 3 + 1] = p.position[1];
        positions[i * 3 + 2] = p.position[2];
      });

      return { type, color, positions };
    }).filter(Boolean) as { type: string, color: string, positions: Float32Array }[];
  }, [isDark, points]);

  return (
    <group>
      {typeData.map(({ type, color, positions }) => (
        <points key={`${type}-${positions.length}`} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            transparent={false}
            color={color}
            size={isDark ? 3.5 : 4}
            sizeAttenuation={true}
            depthWrite={true}
            blending={THREE.NormalBlending}
          />
        </points>
      ))}
    </group>
  );
};

// --- Sub-Component: Dynamic Scene (Crane, Cars, Lights) ---
// Pre-allocated buffer sizes (max points * 3 coords)
const MAX_DYNAMIC_POINTS = 2000;

const DynamicScene = ({ isDark }: { isDark: boolean }) => {
  const carPos = useRef({ x: -350, z: -350 });
  const carVel = useRef({ x: 0, z: 0 });
  const lastTime = useRef(0);
  const geoRefs = useRef<Record<number, THREE.BufferGeometry>>({});
  const attrRefs = useRef<Record<number, THREE.BufferAttribute>>({});

  const bX = -140, bW = 80, bH = 180, bD = 100, bZ = -160;
  const cX = bX + bW / 2, cZ = bZ + bD / 2;
  const mastH = 100, craneY = bH + mastH;
  const jibL = 140, counterJibL = 40;

  // Pre-allocate stable Float32Arrays
  const buffers = useMemo(() => {
    const b: Record<number, Float32Array> = {};
    for (const t of [1, 2, 3, 4, 8, 9, 10]) {
      b[t] = new Float32Array(MAX_DYNAMIC_POINTS * 3);
    }
    return b;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const deltaTime = lastTime.current === 0 ? 0 : time - lastTime.current;
    lastTime.current = time;

    // Swing toward intersection (~45°) with ±60° arc
    const angle = Math.PI / 4 + Math.sin(time * 0.4) * Math.PI / 3;
    const loadOffset = (Math.sin(time * 0.6) + 1) * 30;
    const cycle = (time % 10);
    const xGreen = cycle < 5;

    // 1. Car Movement Logic (smooth acceleration/deceleration)
    const car1MaxSpeed = 120, car2MaxSpeed = 80, stopLine = -55;
    const accel = 160, decel = 200, brakeZone = 80;
    const xCarShouldStop = !xGreen;
    const zCarShouldStop = xGreen;

    const updateCar = (pos: number, vel: number, maxSpeed: number, shouldStop: boolean): [number, number] => {
      const distToStop = stopLine - pos;
      const approaching = pos < stopLine && distToStop < brakeZone && distToStop > 0;

      if (shouldStop && approaching) {
        // Decelerate smoothly to stop at the line
        const targetVel = maxSpeed * (distToStop / brakeZone);
        vel = Math.max(vel - decel * deltaTime, Math.max(targetVel, 0));
      } else if (shouldStop && Math.abs(pos - stopLine) < 2 && vel < 5) {
        // Stopped at line
        vel = 0;
        pos = stopLine;
      } else {
        // Accelerate toward max speed
        vel = Math.min(vel + accel * deltaTime, maxSpeed);
      }

      pos += vel * deltaTime;
      if (pos > 350) { pos = -350; vel = maxSpeed * 0.5; }
      return [pos, vel];
    };

    [carPos.current.x, carVel.current.x] = updateCar(carPos.current.x, carVel.current.x, car1MaxSpeed, xCarShouldStop);
    [carPos.current.z, carVel.current.z] = updateCar(carPos.current.z, carVel.current.z, car2MaxSpeed, zCarShouldStop);

    // 2. Point Cloud - write directly into pre-allocated buffers
    const offsets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 8: 0, 9: 0, 10: 0 };
    const addDPoint = (type: number, x: number, y: number, z: number) => {
      const buf = buffers[type];
      const o = offsets[type];
      if (o + 3 > buf.length) return;
      buf[o] = x;
      buf[o + 1] = y;
      buf[o + 2] = z;
      offsets[type] = o + 3;
    };
    const cos = Math.cos(angle), sin = Math.sin(angle);

    // Crane jib
    for (let l = -counterJibL; l <= jibL; l += 2) {
      const lx = l * cos, lz = l * sin;
      addDPoint(2, cX + lx, craneY, cZ + lz - 3);
      addDPoint(2, cX + lx, craneY, cZ + lz + 3);
      addDPoint(2, cX + lx, craneY + 6, cZ + lz);
    }
    const cableX = (jibL - 20) * cos, cableZ = (jibL - 20) * sin;
    const loadTopY = craneY - 20 - loadOffset;

    // Cable
    for (let i = 0; i < 30; i++) {
      const y = loadTopY + (i / 29) * (craneY - loadTopY);
      addDPoint(2, cX + cableX, y, cZ + cableZ);
    }

    // Cargo (original: dense grid, 60% visibility, structure color)
    for (let x = -10; x <= 10; x += 3) {
      for (let z = -10; z <= 10; z += 3) {
        for (let y = loadTopY - 20; y <= loadTopY; y += 3) {
          if (Math.random() < 0.7) {
            addDPoint(1, cX + cableX + x, y, cZ + cableZ + z);
          }
        }
      }
    }

    // Moving Cars
    const addCarPoints = (cx: number, cz: number, rot: number) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      const r = (x: number, z: number) => ({ x: cx + x * c - z * s, z: cz + x * s + z * c });
      for (let x = -12; x <= 12; x += 3) for (let z = -5; z <= 5; z += 3) for (let y = 0; y <= 4; y += 2) {
        const pt = r(x, z); addDPoint(3, pt.x, y, pt.z);
      }
      for (let x = -4; x <= 6; x += 3) for (let z = -4; z <= 4; z += 3) for (let y = 4; y <= 8; y += 2) {
        const pt = r(x, z); addDPoint(3, pt.x, y, pt.z);
      }
    };
    // Right-hand traffic: +x car on z=20, +z car on x=-20
    addCarPoints(carPos.current.x, 20, 0);
    addCarPoints(-20, carPos.current.z, Math.PI / 2);

    // Traffic Bulbs — only visible from the front (facing oncoming traffic)
    const camX = state.camera.position.x, camZ = state.camera.position.z;
    const addBulbs = (sx: number, sz: number, rot: number, green: boolean, faceX: number, faceZ: number) => {
      const lx = sx + 25 * Math.cos(rot), lz = sz + 25 * Math.sin(rot);
      // Dot product: camera-to-light direction vs light facing direction
      const toCamX = camX - lx, toCamZ = camZ - lz;
      if (toCamX * faceX + toCamZ * faceZ < 0) return; // camera behind light, skip
      const yOff = green ? 23 : 27;
      const type = green ? 9 : 8;
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dz = -1; dz <= 1; dz += 1) {
            addDPoint(type, lx + dx, yOff + dy, lz + dz);
          }
        }
      }
    };
    // x-road: NE faces -x (toward +x traffic), SW faces +x (toward -x traffic)
    addBulbs(45, 45, -Math.PI / 2, xGreen, -1, 0);
    addBulbs(-45, -45, Math.PI / 2, xGreen, 1, 0);
    // z-road: NW faces -z (toward +z traffic), SE faces +z (toward -z traffic)
    addBulbs(-45, 45, 0, !xGreen, 0, -1);
    addBulbs(45, -45, Math.PI, !xGreen, 0, 1);

    // Update buffer attributes directly (no React state)
    for (const t of [1, 2, 3, 4, 8, 9, 10]) {
      const attr = attrRefs.current[t];
      if (attr) {
        (attr as any).count = offsets[t] / 3;
        attr.needsUpdate = true;
      }
      const geo = geoRefs.current[t];
      if (geo) {
        geo.setDrawRange(0, offsets[t] / 3);
      }
    }
  });

  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;
  const dynamicTypes = [1, 2, 3, 4, 8, 9, 10];

  return (
    <group>
      {dynamicTypes.map((t) => (
        <points key={t} frustumCulled={false}>
          <bufferGeometry ref={(geo: THREE.BufferGeometry) => { if (geo) geoRefs.current[t] = geo; }}>
            <bufferAttribute
              ref={(attr: THREE.BufferAttribute) => { if (attr) attrRefs.current[t] = attr; }}
              attach="attributes-position"
              args={[buffers[t], 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            transparent={true}
            opacity={0.9}
            color={palette[t] || '#ffffff'}
            size={isDark ? 3.5 : 4}
            sizeAttenuation
            depthWrite={false}
            depthTest={true}
            blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
          />
        </points>
      ))}
    </group>
  );
};

// --- Camera Controller ---
function CameraController({ targetRot, isDragging }: { targetRot: number[], isDragging: React.RefObject<boolean> }) {
  const { camera } = useThree();
  const currentRot = useRef(new THREE.Euler(targetRot[0], targetRot[1], 0));
  const autoRotY = useRef(0);

  useFrame(() => {
    if (!isDragging.current) autoRotY.current -= 0.0003;
    currentRot.current.x += (targetRot[0] - currentRot.current.x) * 0.05;
    currentRot.current.y += (targetRot[1] - currentRot.current.y) * 0.05;

    const ry = currentRot.current.y + autoRotY.current;
    const distance = 675;
    camera.position.x = Math.sin(ry) * distance * Math.cos(currentRot.current.x);
    camera.position.z = Math.cos(ry) * distance * Math.cos(currentRot.current.x);
    camera.position.y = Math.sin(currentRot.current.x) * distance;
    camera.lookAt(0, 50, 0);
  });

  return null;
}

// --- Main Component ---
export function InteractiveSkyline({ showDotCursor = true }: { showDotCursor?: boolean }) {
  const [isDark, setIsDark] = useState(false);
  // Initial Y rotation faces the crane building at (-140, -160)
  const [targetRot, setTargetRot] = useState([Math.PI / 6, -Math.PI * 0.62]);
  const [canvasMounted, setCanvasMounted] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [canvasDpr, setCanvasDpr] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });
  const hasBootedRef = useRef(false);
  const hasRenderableSizeRef = useRef(false);

  // --- TEMP DEBUG state (remove after investigating iPad mini landscape issue) ---
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  // -------------------------------------------------------------------------

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventScroll = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', preventScroll, { passive: false });

    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let mountTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingResizeCleanup: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // Debug helpers (active only when URL contains ?dbg=1)
    const debugEnabled = window.location.search.includes('dbg=1');
    const pushDebug = (line: string) => {
      if (!debugEnabled) return;
      const ts = (performance.now() / 1000).toFixed(2);
      setDebugInfo(prev => [`[${ts}] ${line}`, ...prev].slice(0, 20));
    };

    const updateCanvasDpr = () => {
      const dpr = window.devicePixelRatio || 1;
      const isTouchViewport = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1200;
      setCanvasDpr(Math.min(dpr, isTouchViewport ? 1.5 : 2));
    };

    const hasRenderableSize = () => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const logDimensions = (label: string) => {
      const rect = el.getBoundingClientRect();
      const vvh = window.visualViewport?.height ?? -1;
      const inh = window.innerHeight;
      pushDebug(`${label} | el:${Math.round(rect.width)}x${Math.round(rect.height)} | vvp:${Math.round(vvh)} | inh:${inh} | booted:${hasBootedRef.current}`);
    };

    const scheduleCanvasMount = (delay: number, markBooted = false) => {
      if (mountTimer) clearTimeout(mountTimer);
      setCanvasMounted(false);
      mountTimer = setTimeout(() => {
        if (!hasRenderableSize()) {
          hasRenderableSizeRef.current = false;
          logDimensions(`RETRY(${delay}ms) FAIL`);
          scheduleCanvasMount(120, markBooted);
          return;
        }
        hasRenderableSizeRef.current = true;
        if (markBooted) {
          hasBootedRef.current = true;
        }
        logDimensions(`MOUNT OK(${delay}ms)`);
        setCanvasMounted(true);
      }, delay);
    };

    const doRotationReset = () => {
      pendingResizeCleanup = null;
      if (settleTimer) clearTimeout(settleTimer);
      updateCanvasDpr();
      // Give layout one more tick to fully settle after the resize event, then swap canvas key.
      // Changing the key remounts the Canvas with fresh WebGL context and correct dimensions.
      // canvasMounted stays true — no calibration spinner appears.
      settleTimer = setTimeout(() => {
        if (!hasRenderableSize()) {
          logDimensions('doRotationReset FAIL→retry');
          scheduleCanvasMount(120);
          return;
        }
        hasRenderableSizeRef.current = true;
        setTargetRot([Math.PI / 6, -Math.PI * 0.62]);
        setCanvasKey(k => k + 1);
      }, 150);
    };

    const queueViewportReset = () => {
      // Cancel any pending reset from a previous rotation
      if (pendingResizeCleanup) { pendingResizeCleanup(); pendingResizeCleanup = null; }
      if (settleTimer) clearTimeout(settleTimer);

      settleTimer = setTimeout(() => {
        doRotationReset();
      }, 180);
    };

    const onViewportChange = () => {
      updateCanvasDpr();
      if (!hasBootedRef.current) {
        // Viewport changed before initial boot — reschedule the mount attempt so
        // it fires after the layout has had time to settle with the new dimensions.
        // This covers iPad Safari landscape where dvh resolution or the address bar
        // can leave the container at 0 height until the first viewport resize fires.
        logDimensions('vpChange→pre-boot retry');
        scheduleCanvasMount(150, true);
        return;
      }
      queueViewportReset();
    };

    resizeObserver = new ResizeObserver(() => {
      const nextHasSize = hasRenderableSize();
      logDimensions(`ResizeObs hasSize:${nextHasSize} refWas:${hasRenderableSizeRef.current}`);
      if (nextHasSize && !hasRenderableSizeRef.current) {
        hasRenderableSizeRef.current = true;
        updateCanvasDpr();
        scheduleCanvasMount(0, !hasBootedRef.current);
        return;
      }
      if (!nextHasSize) {
        hasRenderableSizeRef.current = false;
      }
    });

    resizeObserver.observe(el);
    updateCanvasDpr();
    globalThis.addEventListener('resize', onViewportChange);
    globalThis.visualViewport?.addEventListener('resize', onViewportChange);
    logDimensions('INIT');
    scheduleCanvasMount(320, true);

    return () => {
      el.removeEventListener('touchmove', preventScroll);
      resizeObserver?.disconnect();
      globalThis.removeEventListener('resize', onViewportChange);
      globalThis.visualViewport?.removeEventListener('resize', onViewportChange);
      if (pendingResizeCleanup) { pendingResizeCleanup(); pendingResizeCleanup = null; }
      if (settleTimer) clearTimeout(settleTimer);
      if (mountTimer) clearTimeout(mountTimer);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    isDragging.current = true;
    lastTouch.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging.current) return;
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.current.x;
    const dy = t.clientY - lastTouch.current.y;
    lastTouch.current = { x: t.clientX, y: t.clientY };
    setTargetRot(prev => [
      Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev[0] + dy * 0.006)),
      prev[1] - dx * 0.006,
    ]);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    setTargetRot([Math.PI / 6, -Math.PI * 0.62]);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white dark:bg-black cursor-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-200"
        style={{ opacity: canvasMounted ? 0 : 1 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border border-neutral-300/70 dark:border-neutral-700/70" />
            <div className="absolute inset-2 rounded-full border border-transparent border-t-neutral-900 dark:border-t-white animate-spin" />
            <div className="absolute inset-[18px] rounded-full bg-neutral-900 dark:bg-white shadow-[0_0_24px_rgba(255,255,255,0.08)] dark:shadow-[0_0_24px_rgba(255,255,255,0.18)]" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
            Calibrating scene
          </div>
        </div>
      </div>

      {canvasMounted ? (
        <div className="absolute inset-0 transition-opacity duration-200 opacity-100">
          <Canvas
            key={canvasKey}
            dpr={canvasDpr}
            camera={{ position: [0, -100, 600], fov: 45, far: 2000 }}
            style={{ width: '100%', height: '100%', touchAction: 'none' }}
            resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
            onPointerMove={(e) => {
              if (e.pointerType !== 'mouse') return;
              if (window.innerWidth < 1024) return;
              const xNorm = (e.clientX / window.innerWidth) - 0.5;
              const yNorm = (e.clientY / window.innerHeight) - 0.5;
              setTargetRot([Math.PI / 6 + yNorm * 1.2, -Math.PI * 0.62 + xNorm * 1.2]);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== 'mouse') return;
              setTargetRot([Math.PI / 6, -Math.PI * 0.62]);
            }}
          >
            <CameraController targetRot={targetRot} isDragging={isDragging} />
            <StaticScene isDark={isDark} />
            <DynamicScene isDark={isDark} />
          </Canvas>
        </div>
      ) : null}

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-white dark:from-black to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/80 dark:from-black/80 to-transparent hidden lg:block" />
        <div className="absolute inset-y-0 right-0 w-[30%] bg-gradient-to-l from-white/80 dark:from-black/80 to-transparent hidden lg:block" />
        <div className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-white dark:from-black to-transparent hidden lg:block" />
      </div>

      {showDotCursor && <DotCursor containerRef={containerRef} />}

      {/* TEMP DEBUG overlay — visible at ?dbg=1 (remove after investigation) */}
      {debugInfo.length > 0 && (
        <div className="absolute top-0 left-0 z-50 pointer-events-none p-2 max-w-full overflow-hidden">
          {debugInfo.map((line, i) => (
            <div key={i} style={{ fontSize: 10, lineHeight: '14px', fontFamily: 'monospace', color: i === 0 ? '#0f0' : '#aaa', background: 'rgba(0,0,0,0.75)', padding: '1px 4px', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DotCursor({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shape = [
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], [1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0], [1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = 30, ch = 40;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.scale(dpr, dpr);

    const dotSize = 0.55;
    const spacing = 1.3;
    const outlineSize = 1.6;

    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    shape.forEach((row, r) => {
      row.forEach((dot, c) => {
        if (dot) {
          ctx.beginPath();
          ctx.arc(c * spacing, r * spacing, outlineSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    shape.forEach((row, r) => {
      row.forEach((dot, c) => {
        if (dot) {
          ctx.beginPath();
          ctx.arc(c * spacing, r * spacing, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    const handleMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      canvas.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      canvas.style.opacity = '1';
    };
    const handleLeave = () => {
      canvas.style.opacity = '0';
    };

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none z-50 hidden lg:block"
      style={{ opacity: 0 }}
    />
  );
}
