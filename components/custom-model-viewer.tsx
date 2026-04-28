'use client';

import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

interface ModelProps {
  url: string;
  scale: number;
  autoRotate: boolean;
  rotationSpeed: number;
}

function Model({ url, scale, autoRotate, rotationSpeed }: ModelProps) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <Center>
      <group ref={ref} scale={scale}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

interface CustomModelViewerProps {
  modelUrl: string;
  scale?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  backgroundColor?: string | null;
}

export function CustomModelViewer({
  modelUrl,
  scale = 1,
  autoRotate = true,
  rotationSpeed = 0.5,
  backgroundColor,
}: CustomModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // CSS touch-action alone isn't reliable on iOS Safari — the scrollable
    // parent can still capture the gesture. A non-passive listener is required.
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  // Reset orbit controls after orientation change — device rotation can fire
  // spurious touch sequences that OrbitControls misreads as a pinch zoom.
  useEffect(() => {
    let rafId: number | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const syncAfterResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setCanvasKey((current) => current + 1);
      }, 180);
    };

    const onOrientationChange = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);

      let frames = 0;
      const settle = () => {
        frames += 1;
        if (frames >= 24) {
          controlsRef.current?.reset();
          syncAfterResize();
          rafId = null;
          return;
        }
        rafId = requestAnimationFrame(settle);
      };

      rafId = requestAnimationFrame(settle);
    };

    const onResize = () => {
      controlsRef.current?.update();
      syncAfterResize();
    };

    globalThis.addEventListener('resize', onResize);
    globalThis.addEventListener('orientationchange', onOrientationChange);

    return () => {
      globalThis.removeEventListener('resize', onResize);
      globalThis.removeEventListener('orientationchange', onOrientationChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-model-viewer="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: backgroundColor || 'transparent',
        touchAction: 'none',
      }}
    >
      <Canvas
        key={canvasKey}
        camera={{ position: [0, 1, 4], fov: 45 }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        gl={{ antialias: true, alpha: !backgroundColor }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} />
        <Suspense fallback={null}>
          <Model
            url={modelUrl}
            scale={scale}
            autoRotate={autoRotate}
            rotationSpeed={rotationSpeed}
          />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
