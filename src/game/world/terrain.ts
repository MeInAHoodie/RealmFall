// Deterministic procedural terrain heightmap for the Realmfall world.
// A single seamless world with distinct biome regions whose elevation
// and color blend smoothly. Used by terrain, props, and AI for ground height.

export const WORLD_SIZE = 220;
export const WORLD_SEGMENTS = 96;
export const HALF_WORLD = WORLD_SIZE / 2;

// Simple value-noise based on a hash. Deterministic across reloads.
function hash(x: number, z: number): number {
  let h = x * 374761393 + z * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0xffff) / 0xffff;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, z: number): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const v00 = hash(xi, zi);
  const v10 = hash(xi + 1, zi);
  const v01 = hash(xi, zi + 1);
  const v11 = hash(xi + 1, zi + 1);
  const sx = smooth(xf);
  const sz = smooth(zf);
  const a = v00 + (v10 - v00) * sx;
  const b = v01 + (v11 - v01) * sx;
  return a + (b - a) * sz;
}

function fbm(x: number, z: number, octaves = 4): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// Biome definitions with center, radius, base height and color.
export interface Biome {
  id: string;
  cx: number;
  cz: number;
  radius: number;
  baseHeight: number;
  amplitude: number;
  color: [number, number, number];
  snow?: boolean;
  rocky?: boolean;
  volcanic?: boolean;
}

export const BIOMES: Biome[] = [
  { id: 'village', cx: 0, cz: 0, radius: 26, baseHeight: 0.2, amplitude: 0.4, color: [0.46, 0.55, 0.32] },
  { id: 'plains', cx: 22, cz: -6, radius: 30, baseHeight: 0.1, amplitude: 0.7, color: [0.55, 0.66, 0.38] },
  { id: 'forest', cx: -46, cz: -20, radius: 30, baseHeight: 0.3, amplitude: 1.1, color: [0.24, 0.42, 0.24] },
  { id: 'ruins', cx: -72, cz: -36, radius: 24, baseHeight: 0.5, amplitude: 0.9, color: [0.5, 0.46, 0.36] },
  { id: 'swamp', cx: -62, cz: 34, radius: 26, baseHeight: -0.2, amplitude: 0.5, color: [0.32, 0.42, 0.3] },
  { id: 'deep_forest', cx: 44, cz: -60, radius: 28, baseHeight: 0.6, amplitude: 1.4, color: [0.16, 0.32, 0.2] },
  { id: 'mountains', cx: 78, cz: 46, radius: 34, baseHeight: 6, amplitude: 9, color: [0.78, 0.82, 0.86], snow: true, rocky: true },
  { id: 'crystal_valley', cx: -34, cz: 62, radius: 26, baseHeight: 0.8, amplitude: 1.2, color: [0.5, 0.82, 0.7] },
  { id: 'volcanic', cx: 96, cz: -48, radius: 30, baseHeight: 1.5, amplitude: 3.5, color: [0.32, 0.2, 0.18], volcanic: true, rocky: true },
];

function biomeWeight(x: number, z: number, b: Biome): number {
  const d = Math.hypot(x - b.cx, z - b.cz) / b.radius;
  if (d >= 1) return 0;
  return Math.pow(1 - d, 1.6);
}

export interface GroundSample {
  height: number;
  color: [number, number, number];
  biome: string;
  snow: boolean;
  rocky: boolean;
  volcanic: boolean;
}

export function sampleGround(x: number, z: number): GroundSample {
  let totalW = 0;
  let height = 0;
  let r = 0;
  let g = 0;
  let bl = 0;
  let snow = false;
  let rocky = false;
  let volcanic = false;
  let dominantBiome = 'village';
  let maxW = 0;

  for (const b of BIOMES) {
    const w = biomeWeight(x, z, b);
    if (w <= 0) continue;
    const n = fbm(x * 0.08 + b.cx * 0.01, z * 0.08 + b.cz * 0.01, 4);
    const localHeight = b.baseHeight + (n - 0.5) * 2 * b.amplitude;
    height += localHeight * w;
    r += b.color[0] * w;
    g += b.color[1] * w;
    bl += b.color[2] * w;
    totalW += w;
    if (b.snow) snow = snow || w > 0.4;
    if (b.rocky) rocky = rocky || w > 0.3;
    if (b.volcanic) volcanic = volcanic || w > 0.4;
    if (w > maxW) {
      maxW = w;
      dominantBiome = b.id;
    }
  }

  if (totalW < 0.001) {
    // Outside any biome: distant ocean/barren
    const n = fbm(x * 0.05, z * 0.05, 3);
    height = -3 + n * 2;
    r = 0.1; g = 0.18; bl = 0.28;
    dominantBiome = 'ocean';
  } else {
    height /= totalW;
    r /= totalW;
    g /= totalW;
    bl /= totalW;
  }

  // Carve a flat village plaza
  const distVillage = Math.hypot(x, z);
  if (distVillage < 12) {
    height = height * (distVillage / 12) + 0.25 * (1 - distVillage / 12);
  }

  return { height, color: [r, g, bl], biome: dominantBiome, snow, rocky, volcanic };
}

export function getGroundHeight(x: number, z: number): number {
  return sampleGround(x, z).height;
}

// Keep entities inside the playable bounds.
export function clampToWorld(x: number, z: number): [number, number] {
  const lim = HALF_WORLD - 2;
  return [Math.max(-lim, Math.min(lim, x)), Math.max(-lim, Math.min(lim, z))];
}

export function regionAt(x: number, z: number): string {
  const s = sampleGround(x, z);
  return s.biome;
}
