import { describe, it, expect } from 'vitest';
import { getGroundHeight, sampleGround, clampToWorld, regionAt, HALF_WORLD, BIOMES } from './terrainMath';

describe('terrainMath', () => {
  it('is deterministic for repeated queries', () => {
    expect(getGroundHeight(12.5, -33.2)).toBe(getGroundHeight(12.5, -33.2));
  });

  it('clamps coordinates to the world bounds', () => {
    const lim = HALF_WORLD - 2;
    expect(clampToWorld(9999, -9999)).toEqual([lim, -lim]);
    expect(clampToWorld(5, 3)).toEqual([5, 3]);
    expect(clampToWorld(-9999, 9999)).toEqual([-lim, lim]);
  });

  it('returns finite heights everywhere', () => {
    const points = [
      [0, 0],
      [20, -4],
      [-46, -20],
      [78, 46],
      [96, -48],
      [500, 500],
      [-500, 500],
    ];
    for (const [x, z] of points) {
      expect(Number.isFinite(getGroundHeight(x, z)), `at (${x}, ${z})`).toBe(true);
    }
  });

  it('samples the village biome at the origin', () => {
    const s = sampleGround(0, 0);
    expect(s.biome).toBe('village');
    expect(s.height).toBe(0.25); // flat village plaza carving
    expect(s.color).toHaveLength(3);
  });

  it('falls back to ocean outside all biomes', () => {
    expect(regionAt(500, 500)).toBe('ocean');
    expect(regionAt(-500, -500)).toBe('ocean');
  });

  it('marks mountain samples as snowy', () => {
    const s = sampleGround(78, 46);
    expect(s.biome).toBe('mountains');
    expect(s.snow).toBe(true);
    expect(s.rocky).toBe(true);
  });

  it('defines non-empty unique biome ids', () => {
    const ids = BIOMES.map((b) => b.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
