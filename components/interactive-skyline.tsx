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
          addPoint(p, x, 0, z, isRoad ? 6 : 0, 1.0);
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
    addCar(180, 45, 0); addCar(-180, -45, Math.PI);

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
            size={isDark ? 3.5 : 4.0}
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

    // 1. Car Movement Logic
    const car1Speed = 120, car2Speed = 80, stopLine = -55;
    const xCarShouldStop = !xGreen;
    const zCarShouldStop = xGreen;

    const shouldStopCar1 = xCarShouldStop && carPos.current.x < stopLine && carPos.current.x + car1Speed * deltaTime >= stopLine;
    if (shouldStopCar1) {
      carPos.current.x = stopLine;
    } else if (xCarShouldStop && Math.abs(carPos.current.x - stopLine) < 2) {
      // Stay stopped
    } else {
      carPos.current.x += car1Speed * deltaTime;
      if (carPos.current.x > 350) carPos.current.x = -350;
    }

    const shouldStopCar2 = zCarShouldStop && carPos.current.z < stopLine && carPos.current.z + car2Speed * deltaTime >= stopLine;
    if (shouldStopCar2) {
      carPos.current.z = stopLine;
    } else if (zCarShouldStop && Math.abs(carPos.current.z - stopLine) < 2) {
      // Stay stopped
    } else {
      carPos.current.z += car2Speed * deltaTime;
      if (carPos.current.z > 350) carPos.current.z = -350;
    }

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
            size={isDark ? 3.5 : 4.0}
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
function CameraController({ targetRot }: { targetRot: number[] }) {
  const { camera } = useThree();
  const currentRot = useRef(new THREE.Euler(targetRot[0], targetRot[1], 0));
  const autoRotY = useRef(0);

  useFrame(() => {
    autoRotY.current -= 0.0003;
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-white dark:bg-black cursor-none">
      <Canvas
        camera={{ position: [0, -100, 600], fov: 45, far: 2000 }}
        onPointerMove={(e) => {
          if (window.innerWidth < 1024) return;
          const xNorm = (e.clientX / window.innerWidth) - 0.5;
          const yNorm = (e.clientY / window.innerHeight) - 0.5;
          setTargetRot([Math.PI / 6 + yNorm * 1.2, -Math.PI * 0.62 + xNorm * 1.2]);
        }}
        onPointerLeave={() => {
          setTargetRot([Math.PI / 6, -Math.PI * 0.62]);
        }}
      >
        <CameraController targetRot={targetRot} />
        <StaticScene isDark={isDark} />
        <DynamicScene isDark={isDark} />
      </Canvas>

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-white dark:from-black to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/80 dark:from-black/80 to-transparent hidden lg:block" />
        <div className="absolute inset-y-0 right-0 w-[30%] bg-gradient-to-l from-white/80 dark:from-black/80 to-transparent hidden lg:block" />
        <div className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-white dark:from-black to-transparent hidden lg:block" />
      </div>

      {showDotCursor && <DotCursor containerRef={containerRef} />}
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
