import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sampleGround, getGroundHeight } from './terrain';

// ---- Deterministic scatter helper ----
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s & 0xffff) / 0xffff;
  };
}

interface Scatter {
  position: [number, number, number];
  rotation: number;
  scale: number;
  variant: number;
}

function scatterInBiome(
  biomeId: string,
  count: number,
  seed: number,
  opts: { avoidCenter?: number; minHeight?: number; maxHeight?: number } = {}
): Scatter[] {
  const rng = seeded(seed);
  const out: Scatter[] = [];
  const biome = biomeId;
  const center = BIOME_CENTERS[biome];
  if (!center) return out;
  const radius = BIOME_RADIUS[biome] ?? 26;
  let tries = 0;
  while (out.length < count && tries < count * 12) {
    tries++;
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * radius;
    const x = center[0] + Math.cos(a) * r;
    const z = center[1] + Math.sin(a) * r;
    const s = sampleGround(x, z);
    if (opts.avoidCenter && Math.hypot(x, z) < opts.avoidCenter) continue;
    if (opts.minHeight !== undefined && s.height < opts.minHeight) continue;
    if (opts.maxHeight !== undefined && s.height > opts.maxHeight) continue;
    if (s.volcanic && biomeId !== 'volcanic') continue;
    out.push({
      position: [x, s.height, z],
      rotation: rng() * Math.PI * 2,
      scale: 0.8 + rng() * 0.7,
      variant: Math.floor(rng() * 3),
    });
  }
  return out;
}

const BIOME_CENTERS: Record<string, [number, number]> = {
  village: [0, 0],
  plains: [22, -6],
  forest: [-46, -20],
  ruins: [-72, -36],
  swamp: [-62, 34],
  deep_forest: [44, -60],
  mountains: [78, 46],
  crystal_valley: [-34, 62],
  volcanic: [96, -48],
};

const BIOME_RADIUS: Record<string, number> = {
  village: 24,
  plains: 28,
  forest: 28,
  ruins: 22,
  swamp: 24,
  deep_forest: 26,
  mountains: 32,
  crystal_valley: 24,
  volcanic: 28,
};

// ---- Tree component (low-poly stylized) ----
function TreeMesh({ variant, scale }: { variant: number; scale: number }) {
  const trunkColor = '#5b3a22';
  const leafColors = ['#3f7a2e', '#4f9a3a', '#2f6a22'];
  const leafColor = leafColors[variant % leafColors.length];
  return (
    <group scale={scale}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.8, 6]} />
        <meshStandardMaterial color={trunkColor} flatShading roughness={1} />
      </mesh>
      {variant === 0 && (
        <mesh position={[0, 2.4, 0]} castShadow>
          <coneGeometry args={[1.1, 2.2, 7]} />
          <meshStandardMaterial color={leafColor} flatShading roughness={1} />
        </mesh>
      )}
      {variant === 1 && (
        <>
          <mesh position={[0, 2.2, 0]} castShadow>
            <icosahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color={leafColor} flatShading roughness={1} />
          </mesh>
          <mesh position={[0.4, 2.8, 0.2]} castShadow>
            <icosahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color={leafColor} flatShading roughness={1} />
          </mesh>
        </>
      )}
      {variant === 2 && (
        <>
          <mesh position={[0, 2.0, 0]} castShadow>
            <coneGeometry args={[1.0, 1.6, 6]} />
            <meshStandardMaterial color={leafColor} flatShading roughness={1} />
          </mesh>
          <mesh position={[0, 2.8, 0]} castShadow>
            <coneGeometry args={[0.75, 1.4, 6]} />
            <meshStandardMaterial color={leafColor} flatShading roughness={1} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function Forest() {
  const trees = useMemo(() => {
    return [
      ...scatterInBiome('forest', 60, 101, { avoidCenter: 4 }),
      ...scatterInBiome('deep_forest', 70, 202, { avoidCenter: 4 }),
      ...scatterInBiome('plains', 18, 303, { avoidCenter: 14 }),
      ...scatterInBiome('crystal_valley', 22, 404, { avoidCenter: 4 }),
      ...scatterInBiome('swamp', 16, 505, { avoidCenter: 4, maxHeight: 1 }),
    ];
  }, []);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.position} rotation={[0, t.rotation, 0]}>
          <TreeMesh variant={t.variant} scale={t.scale} />
        </group>
      ))}
    </group>
  );
}

// ---- Snow pine variant for mountains ----
function SnowPine({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
        <meshStandardMaterial color="#4a3320" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <coneGeometry args={[0.9, 1.6, 6]} />
        <meshStandardMaterial color="#2a5a3a" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[0.7, 1.3, 6]} />
        <meshStandardMaterial color="#dfeefc" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

export function MountainPines() {
  const pines = useMemo(() => scatterInBiome('mountains', 40, 606, { minHeight: 1, maxHeight: 7 }), []);
  return (
    <group>
      {pines.map((p, i) => (
        <group key={i} position={p.position} rotation={[0, p.rotation, 0]}>
          <SnowPine scale={p.scale} />
        </group>
      ))}
    </group>
  );
}

// ---- Rocks ----
export function Rocks() {
  const rocks = useMemo(() => {
    return [
      ...scatterInBiome('mountains', 50, 707, { minHeight: 0 }),
      ...scatterInBiome('volcanic', 40, 808),
      ...scatterInBiome('ruins', 20, 909),
      ...scatterInBiome('plains', 10, 110),
    ];
  }, []);
  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.position[0], r.position[1] + 0.3 * r.scale, r.position[2]]} rotation={[r.rotation, r.rotation * 0.7, 0]} scale={r.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color={r.position[0] > 80 ? '#5a3a2a' : '#8a8a8a'} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ---- Crystal formations ----
export function Crystals() {
  const crystals = useMemo(() => scatterInBiome('crystal_valley', 24, 121, { avoidCenter: 4 }), []);
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((c, i) => {
        c.rotation.y = state.clock.elapsedTime * (0.2 + i * 0.01);
      });
    }
  });
  return (
    <group ref={ref}>
      {crystals.map((c, i) => (
        <group key={i} position={c.position} rotation={[0, c.rotation, 0]} scale={c.scale}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <octahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#7be8c4" emissive="#3fae8a" emissiveIntensity={0.5} flatShading transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.3, 0.4, 0.2]} castShadow>
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial color="#9be8ff" emissive="#49c2ff" emissiveIntensity={0.6} flatShading transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---- Volcanic vents with glow ----
export function VolcanicVents() {
  const vents = useMemo(() => scatterInBiome('volcanic', 12, 131, { avoidCenter: 4 }), []);
  return (
    <group>
      {vents.map((v, i) => (
        <group key={i} position={v.position} scale={v.scale}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <coneGeometry args={[0.8, 0.6, 6]} />
            <meshStandardMaterial color="#3a2418" flatShading roughness={1} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <coneGeometry args={[0.35, 0.4, 6]} />
            <meshStandardMaterial color="#ff5a1a" emissive="#ff3a00" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 0.8, 0]} color="#ff6a2a" intensity={3} distance={6} />
        </group>
      ))}
    </group>
  );
}

// ---- Village structures ----
export function Village() {
  const houses = useMemo(() => {
    const rng = seeded(4242);
    const out: Scatter[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const r = 9 + rng() * 3;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = getGroundHeight(x, z);
      out.push({ position: [x, h, z], rotation: -a + Math.PI / 2 + (rng() - 0.5) * 0.4, scale: 1, variant: i % 2 });
    }
    return out;
  }, []);

  return (
    <group>
      {houses.map((h, i) => (
        <group key={i} position={h.position} rotation={[0, h.rotation, 0]}>
          <House variant={h.variant} />
        </group>
      ))}
      {/* Central well */}
      <group position={[0, getGroundHeight(0, 0), 0]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 1.0, 0.8, 10]} />
          <meshStandardMaterial color="#7a7a7a" flatShading roughness={1} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.2, 10]} />
          <meshStandardMaterial color="#2a4a6a" flatShading roughness={0.4} />
        </mesh>
        {/* Roof poles */}
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 4]} />
            <meshStandardMaterial color="#5b3a22" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 2.0, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[1.1, 0.5, 4]} />
          <meshStandardMaterial color="#7a4a2a" flatShading roughness={1} />
        </mesh>
      </group>
      {/* Campfire */}
      <group position={[4, getGroundHeight(4, 0), 4]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 0.2, 8]} />
          <meshStandardMaterial color="#3a2a1a" flatShading />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <coneGeometry args={[0.3, 0.7, 6]} />
          <meshStandardMaterial color="#ff7a1a" emissive="#ff5a00" emissiveIntensity={2.5} />
        </mesh>
        <pointLight position={[0, 1, 0]} color="#ff8a3a" intensity={4} distance={10} />
      </group>
    </group>
  );
}

function House({ variant }: { variant: number }) {
  const wallColor = variant === 0 ? '#d9c19a' : '#c9b08a';
  const roofColor = variant === 0 ? '#7a3a2a' : '#5a4a2a';
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.6, 2.0]} />
        <meshStandardMaterial color={wallColor} flatShading roughness={1} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.9, 1.0, 4]} />
        <meshStandardMaterial color={roofColor} flatShading roughness={1} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.55, 1.01]}>
        <boxGeometry args={[0.6, 1.1, 0.05]} />
        <meshStandardMaterial color="#3a2418" flatShading />
      </mesh>
      {/* Window glow */}
      <mesh position={[0.7, 1.0, 1.01]}>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#ffd87a" emissive="#ffaa3a" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// ---- Ancient ruins (broken pillars) ----
export function Ruins() {
  const pillars = useMemo(() => {
    const rng = seeded(5151);
    const out: { position: [number, number, number]; rotation: number; height: number; broken: boolean }[] = [];
    const cx = -72;
    const cz = -36;
    for (let ring = 0; ring < 2; ring++) {
      const count = 8 + ring * 4;
      const radius = 6 + ring * 5;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const x = cx + Math.cos(a) * radius + (rng() - 0.5) * 1.5;
        const z = cz + Math.sin(a) * radius + (rng() - 0.5) * 1.5;
        const h = getGroundHeight(x, z);
        out.push({ position: [x, h, z], rotation: rng() * 0.2, height: 1.5 + rng() * 2, broken: rng() < 0.4 });
      }
    }
    return out;
  }, []);

  return (
    <group>
      {pillars.map((p, i) => (
        <group key={i} position={p.position} rotation={[0, p.rotation, 0]}>
          <mesh position={[0, p.broken ? p.height * 0.3 : p.height / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.4, p.broken ? p.height * 0.6 : p.height, 8]} />
            <meshStandardMaterial color="#b8a878" flatShading roughness={1} />
          </mesh>
          {!p.broken && (
            <mesh position={[0, p.height + 0.15, 0]} castShadow>
              <boxGeometry args={[0.9, 0.3, 0.9]} />
              <meshStandardMaterial color="#a89868" flatShading roughness={1} />
            </mesh>
          )}
        </group>
      ))}
      {/* Central altar */}
      <group position={[-72, getGroundHeight(-72, -36), -36]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.8, 2.4]} />
          <meshStandardMaterial color="#9a8a5a" flatShading roughness={1} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[1.4, 0.8, 1.4]} />
          <meshStandardMaterial color="#8a7a4a" flatShading roughness={1} />
        </mesh>
        <pointLight position={[0, 1.8, 0]} color="#9be8c4" intensity={2} distance={8} />
      </group>
    </group>
  );
}
