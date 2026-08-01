import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { Terrain, WaterPlane } from '@/game/world/Terrain';
import { Forest, MountainPines, Rocks, Crystals, VolcanicVents, Village, Ruins } from '@/game/world/Props';
import { Sky, Stars, Clouds, Weather } from '@/game/world/Sky';
import { PlayerController } from '@/game/entities/PlayerController';
import { MonsterManager } from '@/game/entities/MonsterManager';
import { bindProjector } from '@/game/ui/Floating';

// Exposes the active camera to the DOM overlay layer so floating damage numbers
// can be projected from world space to screen space.
function CameraBridge() {
  const { camera, size } = useThree();
  useEffect(() => {
    const project = (x: number, y: number, z: number): { x: number; y: number } | null => {
      const v = new THREE.Vector3(x, y, z);
      v.project(camera);
      if (v.z > 1) return null;
      return {
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
      };
    };
    bindProjector(project);
  }, [camera, size]);
  return null;
}

export function GameScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.1, far: 400, position: [0, 8, 12] }}
    >
      <fog attach="fog" args={['#a8c8e0', 60, 180]} />
      <CameraBridge />
      <Sky />
      <Stars />
      <Clouds />
      <Weather />
      <Terrain />
      <WaterPlane />
      <Forest />
      <MountainPines />
      <Rocks />
      <Crystals />
      <VolcanicVents />
      <Village />
      <Ruins />
      <PlayerController />
      <MonsterManager />
    </Canvas>
  );
}
