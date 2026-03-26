'use client';

import { useEffect, useRef } from 'react';

export function InteractiveSkyline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;
    let loadProgress = 0;
    const startTime = Date.now();
    const zoomDuration = 2500; // 2.5s zoom in

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Point types: 
    // 0: Ground, 1: Structure, 2: Crane, 3: Vehicle, 4: Person, 5: Light, 6: Road, 7: OtherBuild, 8: RedLight, 9: GreenLight
    const staticPoints: { x: number, y: number, z: number, type: number }[] = [];

    const addPoint = (x: number, y: number, z: number, type: number, jitter = 0.5) => {
      staticPoints.push({
        x: x + (Math.random() - 0.5) * jitter,
        y: y + (Math.random() - 0.5) * jitter,
        z: z + (Math.random() - 0.5) * jitter,
        type
      });
    };

    // 1. Ground & Roads (Curved LiDAR scan lines)
    const sensorX = 0;
    const sensorZ = 0;
    for (let radius = 4; radius < 400; radius += 3.5) {
      const circumference = 2 * Math.PI * radius;
      const numPoints = Math.floor(circumference / 3); 
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = sensorX + Math.cos(angle) * radius;
        const z = sensorZ + Math.sin(angle) * radius;
        if (x > -350 && x < 350 && z > -350 && z < 350) {
          const isRoad = Math.abs(x) < 40 || Math.abs(z) < 40;
          addPoint(x, 0, z, isRoad ? 6 : 0, 1.0);
        }
      }
    }

    // 2. Streetlights
    const addLight = (lx: number, lz: number) => {
      for (let y = 0; y <= 35; y += 2) addPoint(lx, -y, lz, 5, 0.5); // Pole
      for (let i = 0; i < 20; i++) addPoint(lx, -36, lz, 5, 4); // Bright bulb (high jitter)
    };
    for (let z = -280; z <= 280; z += 90) {
      if (Math.abs(z) > 50) {
        addLight(-48, z);
        addLight(48, z);
      }
    }
    for (let x = -280; x <= 280; x += 90) {
      if (Math.abs(x) > 50) {
        addLight(x, -48);
        addLight(x, 48);
      }
    }

    // 3. Main Building under construction (Quadrant 2: -x, -z)
    const bX = -140, bZ = -160, bW = 80, bD = 100, bH = 180;
    const colSpacing = 20;
    const floorHeight = 20;

    for (let y = 0; y <= bH; y += floorHeight) {
      for (let x = bX; x <= bX + bW; x += 3) {
        for (let z = bZ; z <= bZ + bD; z += 3) {
          if (x === bX || x === bX + bW || z === bZ || z === bZ + bD || Math.random() < 0.05) {
            addPoint(x, -y, z, 1, 1);
          }
        }
      }
    }
    for (let x = bX; x <= bX + bW; x += colSpacing) {
      for (let z = bZ; z <= bZ + bD; z += colSpacing) {
        for (let y = 0; y <= bH; y += 3) {
          addPoint(x, -y, z, 1, 1);
        }
      }
    }

    // 4. Tower Crane Mast (Static part)
    const cX = bX + bW / 2; // Center of building X
    const cZ = bZ + bD / 2; // Center of building Z
    const craneBaseY = bH; // Base is at the top of the building
    const mastH = 100;
    const jibL = 140;
    const counterJibL = 40;

    for (let y = craneBaseY; y <= craneBaseY + mastH; y += 3) {
      addPoint(cX - 3, -y, cZ - 3, 2, 0.5);
      addPoint(cX + 3, -y, cZ - 3, 2, 0.5);
      addPoint(cX - 3, -y, cZ + 3, 2, 0.5);
      addPoint(cX + 3, -y, cZ + 3, 2, 0.5);
      if (y % 12 === 0) {
        for(let i=-3; i<=3; i+=1.5) {
          addPoint(cX + i, -y, cZ - 3, 2, 0.5);
          addPoint(cX + i, -y, cZ + 3, 2, 0.5);
          addPoint(cX - 3, -y, cZ + i, 2, 0.5);
          addPoint(cX + 3, -y, cZ + i, 2, 0.5);
        }
      }
    }

    // Dynamic Crane Parts Generator
    const getCraneDynamicPoints = (angle: number, loadYOffset: number) => {
      const dPoints: { x: number, y: number, z: number, type: number }[] = [];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const jibY = -(craneBaseY + mastH);

      // Jib
      for (let l = -counterJibL; l <= jibL; l += 2) {
        const lx = l * cos;
        const lz = l * sin;
        dPoints.push({ x: cX + lx, y: jibY, z: cZ + lz - 3, type: 2 });
        dPoints.push({ x: cX + lx, y: jibY, z: cZ + lz + 3, type: 2 });
        dPoints.push({ x: cX + lx, y: jibY - 6, z: cZ + lz, type: 2 });
      }

      // Cable
      const cableX = (jibL - 20) * cos;
      const cableZ = (jibL - 20) * sin;
      const loadTopY = -(craneBaseY + 20 + loadYOffset);
      for (let y = jibY; y <= loadTopY; y += 3) {
        dPoints.push({ x: cX + cableX, y, z: cZ + cableZ, type: 2 });
      }

      // Load
      for(let x = -10; x <= 10; x+=3) {
        for(let z = -10; z <= 10; z+=3) {
          for(let y = loadTopY; y <= loadTopY + 20; y+=3) {
            if (Math.random() < 0.6) {
              dPoints.push({ x: cX + cableX + x, y, z: cZ + cableZ + z, type: 1 });
            }
          }
        }
      }
      return dPoints;
    };

    // 5. Other Active Building (Quadrant 1: +x, -z)
    const oX = 80, oZ = -140, oW = 100, oD = 80, oH = 100;
    for (let y = 0; y <= oH; y += 25) {
      for (let x = oX; x <= oX + oW; x += 4) {
        for (let z = oZ; z <= oZ + oD; z += 4) {
          if (x === oX || x === oX + oW || z === oZ || z === oZ + oD || Math.random() < 0.08) {
            addPoint(x, -y, z, 7, 1);
          }
        }
      }
    }
    for (let x = oX; x <= oX + oW; x += 25) {
      for (let z = oZ; z <= oZ + oD; z += 25) {
        for (let y = 0; y <= oH; y += 4) {
          addPoint(x, -y, z, 7, 1);
        }
      }
    }

    // 6. Finished Context Buildings (Quadrants 3 & 4)
    const addFinishedBuilding = (fx: number, fz: number, fw: number, fd: number, fh: number) => {
      for (let y = 0; y <= fh; y += 6) {
        for (let x = fx; x <= fx + fw; x += 4) {
          if (Math.random() < 0.4) {
            addPoint(x, -y, fz, 7, 0.5);
            addPoint(x, -y, fz + fd, 7, 0.5);
          }
        }
        for (let z = fz; z <= fz + fd; z += 4) {
          if (Math.random() < 0.4) {
            addPoint(fx, -y, z, 7, 0.5);
            addPoint(fx + fw, -y, z, 7, 0.5);
          }
        }
      }
    };
    addFinishedBuilding(-220, 80, 100, 80, 140);
    addFinishedBuilding(100, 100, 120, 80, 200);
    addFinishedBuilding(-100, 140, 60, 80, 100);

    // 7. Bulldozers / Construction Vehicles (Congregated around main building)
    const addBulldozer = (bx: number, bz: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rot = (x: number, z: number) => ({
        x: bx + x * cos - z * sin,
        z: bz + x * sin + z * cos
      });

      // Body
      for(let x = -10; x <= 10; x+=2) {
        for(let z = -8; z <= 8; z+=2) {
          for(let y = 0; y <= 10; y+=2) {
            const p = rot(x, z);
            addPoint(p.x, -y, p.z, 3, 0.5);
          }
        }
      }
      // Blade
      for(let z = -12; z <= 12; z+=2) {
        for(let y = 0; y <= 8; y+=2) {
          const p = rot(12, z);
          addPoint(p.x, -y, p.z, 3, 0.5);
        }
      }
    };

    // Construction zone around main building
    addBulldozer(bX - 20, bZ + 20, Math.PI / 4);
    addBulldozer(bX + bW + 20, bZ + 30, Math.PI * 0.8);

    const addExcavator = (ex: number, ez: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rot = (x: number, z: number) => ({
        x: ex + x * cos - z * sin,
        z: ez + x * sin + z * cos
      });

      for(let x = -14; x <= 14; x+=2) {
        for(let z of [-10, -8, 8, 10]) {
          for(let y = 0; y <= 6; y+=2) {
            const p = rot(x, z);
            addPoint(p.x, -y, p.z, 3, 0.5);
          }
        }
      }
      for(let x = -12; x <= 10; x+=2) {
        for(let z = -8; z <= 8; z+=2) {
          for(let y = 6; y <= 18; y+=2) {
            if (Math.random() < 0.6) {
              const p = rot(x, z);
              addPoint(p.x, -y, p.z, 3, 0.5);
            }
          }
        }
      }
      for(let i = 0; i <= 30; i+=1.5) {
        const ax = 10 + i * 0.9;
        const ay = 12 + Math.sin(i * 0.12) * 14;
        const p = rot(ax, 0);
        addPoint(p.x, -ay, p.z, 3, 1);
        addPoint(p.x, -ay+1, p.z, 3, 1);
        addPoint(p.x, -ay-1, p.z, 3, 1);
      }
    };
    addExcavator(bX - 30, bZ + bD - 20, Math.PI / 6);
    addExcavator(bX + bW / 2, bZ - 30, Math.PI);

    // 8. Parked Cars
    const addCar = (cx: number, cz: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rot = (x: number, z: number) => ({
        x: cx + x * cos - z * sin,
        z: cz + x * sin + z * cos
      });
      
      // Car Body
      for(let x = -12; x <= 12; x+=2) {
        for(let z = -5; z <= 5; z+=2) {
          for(let y = 0; y <= 4; y+=2) {
            const p = rot(x, z);
            addPoint(p.x, -y, p.z, 3, 0.5);
          }
        }
      }
      // Car Cabin
      for(let x = -4; x <= 6; x+=2) {
        for(let z = -4; z <= 4; z+=2) {
          for(let y = 4; y <= 8; y+=2) {
            const p = rot(x, z);
            addPoint(p.x, -y, p.z, 3, 0.5);
          }
        }
      }
    };
    // Sparse parked cars along the roads
    addCar(-120, 45, 0);
    addCar(140, -45, Math.PI);
    addCar(45, 130, Math.PI/2);
    addCar(-45, -150, -Math.PI/2);
    addCar(180, 45, 0);
    addCar(-180, -45, Math.PI);

    // 9. Traffic Signal Poles (Static)
    const addTrafficSignalPole = (sx: number, sz: number, rotAngle: number) => {
      // Pole
      for(let y=0; y<=25; y+=2) addPoint(sx, -y, sz, 7, 0.5);
      // Arm
      const cos = Math.cos(rotAngle);
      const sin = Math.sin(rotAngle);
      for(let l=0; l<=25; l+=2) {
        addPoint(sx + l*cos, -25, sz + l*sin, 7, 0.5);
      }
      // Light Box
      const lx = sx + 25*cos;
      const lz = sz + 25*sin;
      const facingAngle = rotAngle + Math.PI / 2;
      const fCos = Math.cos(facingAngle);
      const fSin = Math.sin(facingAngle);
      
      for(let x=-2; x<=2; x+=2) {
        for(let y=22; y<=28; y+=2) {
          addPoint(lx + x*fSin, -y, lz - x*fCos, 7, 0.5);
        }
      }
    };
    addTrafficSignalPole(-45, -45, Math.PI/2); // for +x traffic
    addTrafficSignalPole(45, -45, Math.PI);      // for +z traffic
    addTrafficSignalPole(45, 45, -Math.PI/2);  // for -x traffic
    addTrafficSignalPole(-45, 45, 0);          // for -z traffic

    // Dynamic Traffic Signal Bulb Generator
    const getTrafficLightPoints = (sx: number, sz: number, rotAngle: number, isGreen: boolean, cameraY: number) => {
      const dPoints: { x: number, y: number, z: number, type: number }[] = [];
      
      // Directional check: only show if facing the camera
      // Light faces 90 degrees offset from the arm direction (rotAngle)
      const facingAngle = rotAngle + Math.PI / 2;
      const facingX = Math.cos(facingAngle);
      const facingZ = Math.sin(facingAngle);
      const camForwardX = Math.sin(cameraY);
      const camForwardZ = Math.cos(cameraY);
      
      const dot = facingX * camForwardX + facingZ * camForwardZ;
      if (dot > -0.2) return dPoints; // Only show if looking AT the front of the light

      const cos = Math.cos(rotAngle);
      const sin = Math.sin(rotAngle);
      const lx = sx + 25*cos;
      const lz = sz + 25*sin;
      
      const lightType = isGreen ? 9 : 8;
      // Red at top (-27), Green at bottom (-23)
      const yOffset = isGreen ? -23 : -27;

      for(let i=0; i<25; i++) {
        dPoints.push({
          x: lx + (Math.random() - 0.5) * 3 + facingX * 0.5,
          y: yOffset + (Math.random() - 0.5) * 2,
          z: lz + (Math.random() - 0.5) * 3 + facingZ * 0.5,
          type: lightType
        });
      }
      return dPoints;
    };

    // 10. Pedestrians & Workers
    const addPedestrian = (px: number, pz: number) => {
      for (let y = 0; y <= 8; y += 1.5) {
        addPoint(px, -y, pz, 4, 0.8);
      }
    };

    // Spread pedestrians along sidewalks (avoiding intersections)
    for (let i = 0; i < 40; i++) {
      const side = Math.floor(Math.random() * 4);
      let px = 0, pz = 0;
      if (side === 0) { // North sidewalk
        px = (Math.random() - 0.5) * 600;
        pz = -60;
      } else if (side === 1) { // South sidewalk
        px = (Math.random() - 0.5) * 600;
        pz = 60;
      } else if (side === 2) { // West sidewalk
        px = -60;
        pz = (Math.random() - 0.5) * 600;
      } else { // East sidewalk
        px = 60;
        pz = (Math.random() - 0.5) * 600;
      }

      // Avoid intersections (near 0,0) and buildings
      const nearIntersection = Math.abs(px) < 80 && Math.abs(pz) < 80;
      const inMainBuilding = px > bX - 10 && px < bX + bW + 10 && pz > bZ - 10 && pz < bZ + bD + 10;
      const inOtherBuilding = px > oX - 10 && px < oX + oW + 10 && pz > oZ - 10 && pz < oZ + oD + 10;

      if (!nearIntersection && !inMainBuilding && !inOtherBuilding) {
        addPedestrian(px, pz);
      }
    }

    // Workers near construction site
    for (let i = 0; i < 15; i++) {
      addPedestrian(bX + Math.random() * bW, bZ + bD + 10 + Math.random() * 10);
      addPedestrian(bX - 10 - Math.random() * 10, bZ + Math.random() * bD);
    }

    const BASE_ROT_X = Math.PI / 6; 
    const BASE_ROT_Y = -Math.PI / 4; 

    let targetRotX = BASE_ROT_X;
    let targetRotY = BASE_ROT_Y;
    let currentRotX = targetRotX;
    let currentRotY = targetRotY;
    let autoRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let isMouseActive = false;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      // Disable interaction on mobile/tablet (below lg breakpoint: 1024px)
      if (window.innerWidth < 1024) {
        handleMouseLeave();
        return;
      }

      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      mouseX = clientX - rect.left;
      mouseY = clientY - rect.top;
      isMouseActive = true;

      // Check if mouse is within the bounds of the asset
      const isInside = 
        clientX >= rect.left && 
        clientX <= rect.right && 
        clientY >= rect.top && 
        clientY <= rect.bottom;

      if (!isInside) {
        handleMouseLeave();
        return;
      }

      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      
      targetRotY = BASE_ROT_Y + x * 1.2; 
      targetRotX = BASE_ROT_X + y * 1.2;
    };

    const handleMouseLeave = () => {
      targetRotY = BASE_ROT_Y;
      targetRotX = BASE_ROT_X;
      isMouseActive = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleMouseMove, { passive: true });
    window.addEventListener('touchend', handleMouseLeave);

    // Color Palettes for Light and Dark Modes
    const paletteDark = [
      [70, 70, 90],    // 0: Ground
      [0, 200, 255],   // 1: Structure
      [255, 120, 0],   // 2: Crane
      [50, 255, 50],   // 3: Vehicle
      [255, 50, 50],   // 4: Person
      [255, 255, 200], // 5: Light
      [40, 40, 50],    // 6: Road
      [100, 150, 255], // 7: OtherBuild
      [255, 50, 50],   // 8: Red Light
      [50, 255, 50],   // 9: Green Light
    ];

    const paletteLight = [
      [200, 200, 210], // 0: Ground
      [0, 100, 200],   // 1: Structure
      [200, 80, 0],    // 2: Crane
      [20, 150, 20],   // 3: Vehicle
      [200, 0, 0],     // 4: Person
      [255, 160, 0],   // 5: Light
      [160, 160, 170], // 6: Road
      [80, 100, 180],  // 7: OtherBuild
      [220, 0, 0],     // 8: Red Light
      [0, 200, 0],     // 9: Green Light
    ];

    // Moving Vehicle Generator
    const getMovingCarPoints = (cx: number, cz: number, angle: number) => {
      const dPoints: { x: number, y: number, z: number, type: number }[] = [];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rot = (x: number, z: number) => ({
        x: cx + x * cos - z * sin,
        z: cz + x * sin + z * cos
      });
      
      // Car Body
      for(let x = -12; x <= 12; x+=3) {
        for(let z = -5; z <= 5; z+=3) {
          for(let y = 0; y <= 4; y+=2) {
            const p = rot(x, z);
            dPoints.push({ x: p.x, y: -y, z: p.z, type: 3 });
          }
        }
      }
      // Car Cabin
      for(let x = -4; x <= 6; x+=3) {
        for(let z = -4; z <= 4; z+=3) {
          for(let y = 4; y <= 8; y+=2) {
            const p = rot(x, z);
            dPoints.push({ x: p.x, y: -y, z: p.z, type: 3 });
          }
        }
      }
      return dPoints;
    };
    let car1Pos = -350;
    let car2Pos = -350;
    let lastTime = Date.now();

    const render = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const isDark = document.documentElement.classList.contains('dark');
      const currentPalette = isDark ? paletteDark : paletteLight;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      
      // Use lighter blending in dark mode for the glowing laser effect, 
      // but standard alpha blending in light mode to maintain contrast.
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;
      
      // Slow auto-rotation
      autoRotationY += 0.002;

      // Zoom-in entry effect
      const elapsed = currentTime - startTime;
      loadProgress = Math.min(1, elapsed / zoomDuration);
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const zoomFactor = 0.6 + 0.4 * easeOutCubic(loadProgress);

      let baseScale = Math.min(width, height) / 480;
      if (height > width) {
        // Zoom in more on portrait orientation so it fills more vertical space
        baseScale *= Math.min(1.8, height / width);
      }
      const globalScale = baseScale * zoomFactor; 
      const centerX = width / 2;
      const centerY = height * 0.68; // Slightly moved from original 0.75
      
      // Traffic Light Cycle (10s total: 5s X-green, 5s Z-green)
      const cycleTime = (currentTime % 10000) / 1000;
      const xGreen = cycleTime < 5;
      const zGreen = !xGreen;

      // Car Movement Logic
      const xCarShouldStop = !xGreen;
      const zCarShouldStop = !zGreen;

      const car1Speed = 120; // units per second
      const car2Speed = 80;

      // Car 1 (X-axis, moving +x)
      const car1StopLine = -55;
      const shouldStopCar1 = xCarShouldStop && car1Pos < car1StopLine && car1Pos + car1Speed * deltaTime >= car1StopLine;
      
      if (shouldStopCar1) {
        car1Pos = car1StopLine;
      } else if (xCarShouldStop && Math.abs(car1Pos - car1StopLine) < 2) {
        // Stay stopped
      } else {
        car1Pos += car1Speed * deltaTime;
        if (car1Pos > 350) car1Pos = -350;
      }

      // Car 2 (Z-axis, moving +z)
      const car2StopLine = -55;
      const shouldStopCar2 = zCarShouldStop && car2Pos < car2StopLine && car2Pos + car2Speed * deltaTime >= car2StopLine;

      if (shouldStopCar2) {
        car2Pos = car2StopLine;
      } else if (zCarShouldStop && Math.abs(car2Pos - car2StopLine) < 2) {
        // Stay stopped
      } else {
        car2Pos += car2Speed * deltaTime;
        if (car2Pos > 350) car2Pos = -350;
      }

      const craneAngle = Math.sin(currentTime * 0.0004) * Math.PI / 3;
      const loadYOffset = (Math.sin(currentTime * 0.0006) + 1) * 30;

      const dynamicPoints = [
        ...getCraneDynamicPoints(craneAngle, loadYOffset),
        ...getMovingCarPoints(car1Pos, -20, 0),
        ...getMovingCarPoints(20, car2Pos, Math.PI / 2),
        // Traffic Lights
        ...getTrafficLightPoints(-45, -45, Math.PI/2, xGreen, currentRotY + autoRotationY),
        ...getTrafficLightPoints(45, 45, -Math.PI/2, xGreen, currentRotY + autoRotationY),
        ...getTrafficLightPoints(45, -45, Math.PI, zGreen, currentRotY + autoRotationY),
        ...getTrafficLightPoints(-45, 45, 0, zGreen, currentRotY + autoRotationY),
      ];

      const allPoints = [...staticPoints, ...dynamicPoints];

      const proj = (p: {x: number, y: number, z: number, type: number}) => {
        const ry_auto = currentRotY + autoRotationY;
        const cosY = Math.cos(ry_auto);
        const sinY = Math.sin(ry_auto);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);

        // Shift center of rotation slightly towards the building with crane (cX: -100, cZ: -110)
        const offsetX = -70;
        const offsetZ = -80;
        const dx = p.x - offsetX;
        const dz = p.z - offsetZ;

        let rx = dx * cosY - dz * sinY;
        let rz = dx * sinY + dz * cosY;
        let ry = p.y * cosX - rz * sinX;
        rz = p.y * sinX + rz * cosX;
        const perspective = 800 / (800 + rz); 
        
        const color = currentPalette[p.type];
        const x = (rx * perspective) * globalScale + centerX;
        const y = (ry * perspective) * globalScale + centerY;

        return {
          x,
          y,
          scale: perspective,
          z: rz,
          r: color[0], g: color[1], b: color[2]
        };
      };

      const projected = allPoints.map(proj);
      projected.sort((a, b) => b.z - a.z);

      // Increased opacity for focused asset
      ctx.globalAlpha = isDark ? 0.9 : 0.8;

      projected.forEach(p => {
        if (p.z < -700) return; // Near clipping
        const depthNormalized = Math.max(0, Math.min(1, (p.z + 200) / 600));
        
        // Higher alpha for foreground points
        const baseAlpha = isDark ? 0.7 : 0.6;
        const alpha = 1.0 - depthNormalized * baseAlpha; 
        
        // Slightly larger points for better definition
        const sizeMultiplier = isDark ? 1.6 : 2.0;
        const size = Math.max(0.5, sizeMultiplier * p.scale); 

        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.fillRect(p.x - size/2, p.y - size/2, size, size);
      });

      ctx.globalAlpha = 1.0; // Reset for gradient

      // Overlay Gradients for smooth transition
      // Bottom Gradient
      const bottomGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
      if (isDark) {
        bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)');
        bottomGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.8)');
        bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      } else {
        bottomGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        bottomGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
        bottomGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)');
        bottomGradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height * 0.6, width, height * 0.4);

      // Top, Right, and Left Gradients (Desktop only)
      if (window.innerWidth >= 1024) {
        // Top Gradient
        const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.3);
        if (isDark) {
          topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
          topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, width, height * 0.3);

        // Right Gradient
        const rightGradient = ctx.createLinearGradient(width * 0.7, 0, width, 0);
        if (isDark) {
          rightGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          rightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        } else {
          rightGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          rightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        }
        ctx.fillStyle = rightGradient;
        ctx.fillRect(width * 0.7, 0, width * 0.3, height);

        // Left Gradient
        const leftGradient = ctx.createLinearGradient(0, 0, width * 0.3, 0);
        if (isDark) {
          leftGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
          leftGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          leftGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          leftGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = leftGradient;
        ctx.fillRect(0, 0, width * 0.3, height);
      }

      // Custom Ultra-High-Density Dot-Matrix Pointer with Extra Bold White Outline
      if (isMouseActive && window.innerWidth >= 1024) {
        const dotSize = 0.55; // Increased from 0.4 for darker dots
        const spacing = 1.3;
        
        // Higher resolution pointer shape - Classic mouse pointer geometry
        const shape = [
          [1,0,0,0,0,0,0,0,0,0,0,0],
          [1,1,0,0,0,0,0,0,0,0,0,0],
          [1,1,1,0,0,0,0,0,0,0,0,0],
          [1,1,1,1,0,0,0,0,0,0,0,0],
          [1,1,1,1,1,0,0,0,0,0,0,0],
          [1,1,1,1,1,1,0,0,0,0,0,0],
          [1,1,1,1,1,1,1,0,0,0,0,0],
          [1,1,1,1,1,1,1,1,0,0,0,0],
          [1,1,1,1,1,1,1,1,1,0,0,0],
          [1,1,1,1,1,1,1,1,1,1,0,0],
          [1,1,1,1,1,1,1,1,1,1,1,0],
          [1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,0,0,0,0,0],
          [1,1,1,1,0,1,1,1,0,0,0,0], // Stem starts, centered on base
          [1,1,1,0,0,1,1,1,0,0,0,0],
          [1,1,0,0,0,0,1,1,1,0,0,0], // Stem slanted parallel to pointer
          [1,0,0,0,0,0,1,1,1,0,0,0],
          [0,0,0,0,0,0,0,1,1,1,0,0],
          [0,0,0,0,0,0,0,1,1,1,0,0],
        ];

        // 1. Draw Extra Bold White Outline (Halo)
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        const outlineSize = 1.6; // Kept at 1.6 (original 0.4 + 1.2) to not change outline
        shape.forEach((row, r) => {
          row.forEach((dot, c) => {
            if (dot) {
              ctx.beginPath();
              ctx.arc(
                mouseX + c * spacing, 
                mouseY + r * spacing, 
                outlineSize, 
                0, 
                Math.PI * 2
              );
              ctx.fill();
            }
          });
        });

        // 2. Draw Main Pointer (Black)
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        shape.forEach((row, r) => {
          row.forEach((dot, c) => {
            if (dot) {
              ctx.beginPath();
              ctx.arc(
                mouseX + c * spacing, 
                mouseY + r * spacing, 
                dotSize, 
                0, 
                Math.PI * 2
              );
              ctx.fill();
            }
          });
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-auto overflow-hidden z-0 cursor-none"
      style={{ cursor: 'none' }}
      data-hide-cursor="true"
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full cursor-none"
        style={{ touchAction: 'none', cursor: 'none' }}
        data-hide-cursor="true"
      />
    </div>
  );
}
