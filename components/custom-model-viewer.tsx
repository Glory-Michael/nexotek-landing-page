'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Center } from '@react-three/drei';
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
  return (
    <div style={{ width: '100%', height: '100%', background: backgroundColor || 'transparent' }}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: !backgroundColor }}
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
