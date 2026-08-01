import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WORLD_SIZE, WORLD_SEGMENTS, HALF_WORLD, sampleGround } from '@/game/world/terrainMath';

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, WORLD_SEGMENTS, WORLD_SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const s = sampleGround(x, z);
      pos.setY(i, s.height);
      // slight color variation per vertex for stylized look
      const jitter = (Math.sin(x * 0.3) * Math.cos(z * 0.3)) * 0.05;
      c.setRGB(
        Math.max(0, s.color[0] + jitter),
        Math.max(0, s.color[1] + jitter),
        Math.max(0, s.color[2] + jitter)
      );
      if (s.snow && s.height > 3) {
        c.lerp(new THREE.Color(0.95, 0.97, 1.0), 0.7);
      }
      if (s.volcanic) {
        c.lerp(new THREE.Color(0.25, 0.1, 0.08), 0.25);
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </mesh>
  );
}

export function WaterPlane() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    }
  });
  return (
    <mesh ref={ref} position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WORLD_SIZE * 1.5, WORLD_SIZE * 1.5, 1, 1]} />
      <meshStandardMaterial
        color="#2a6fb0"
        transparent
        opacity={0.62}
        roughness={0.15}
        metalness={0.3}
        emissive="#1a3f6a"
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

export { HALF_WORLD };
