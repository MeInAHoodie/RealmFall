import { describe, it, expect } from 'vitest';
import { MONSTERS, BOSSES, ALL_MONSTERS, SPAWN_GROUPS } from './monsters';
import { ITEMS, REGIONS } from './items';
import { CLASSES } from './classes';
import { HALF_WORLD } from '../world/terrainMath';

const STAT_KEYS = ['health', 'mana', 'damage', 'defense', 'speed', 'critChance'];
const VALID_SLOTS = ['weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'ring', 'necklace'];

describe('data integrity', () => {
  it('every monster loot item exists in ITEMS', () => {
    const missing: string[] = [];
    for (const m of Object.values(ALL_MONSTERS)) {
      for (const l of m.loot) {
        if (!ITEMS[l.itemId]) missing.push(`${m.id}:${l.itemId}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every monster spawns in a known region', () => {
    const regionIds = new Set(REGIONS.map((r) => r.id));
    const bad = Object.values(ALL_MONSTERS).filter((m) => !regionIds.has(m.region)).map((m) => m.id);
    expect(bad).toEqual([]);
  });

  it('every spawn group references a valid monster', () => {
    const bad = SPAWN_GROUPS.filter((g) => !ALL_MONSTERS[g.monsterId]).map((g) => g.monsterId);
    expect(bad).toEqual([]);
  });

  it('spawn positions stay inside the world bounds', () => {
    const lim = HALF_WORLD - 2;
    const bad = SPAWN_GROUPS.filter((g) => Math.abs(g.position[0]) > lim || Math.abs(g.position[2]) > lim).map((g) => g.position);
    expect(bad).toEqual([]);
  });

  it('loot entries have sane chance and count ranges', () => {
    for (const m of Object.values(ALL_MONSTERS)) {
      for (const l of m.loot) {
        expect(l.chance, `${m.id}:${l.itemId}`).toBeGreaterThan(0);
        expect(l.chance, `${m.id}:${l.itemId}`).toBeLessThanOrEqual(1);
        expect(l.min, `${m.id}:${l.itemId}`).toBeGreaterThan(0);
        expect(l.max, `${m.id}:${l.itemId}`).toBeGreaterThanOrEqual(l.min);
      }
    }
  });

  it('class skill ids are unique per class and match their class', () => {
    for (const c of Object.values(CLASSES)) {
      const ids = c.skills.map((s) => s.id);
      expect(new Set(ids).size, `${c.id} skills`).toBe(ids.length);
      for (const s of c.skills) {
        expect(s.classId).toBe(c.id);
      }
    }
  });

  it('equip items define a valid slot and only known stats', () => {
    for (const it of Object.values(ITEMS)) {
      if (it.kind !== 'equip') continue;
      expect(VALID_SLOTS, `${it.id} slot`).toContain(it.slot);
      if (it.stats) {
        for (const k of Object.keys(it.stats)) {
          expect(STAT_KEYS, `${it.id} stat ${k}`).toContain(k);
        }
      }
    }
  });

  it('item ids are unique and match their map key', () => {
    const ids = Object.keys(ITEMS);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [k, v] of Object.entries(ITEMS)) {
      expect(v.id).toBe(k);
    }
  });

  it('bosses and monsters do not share ids', () => {
    const shared = Object.keys(MONSTERS).filter((id) => BOSSES[id]);
    expect(shared).toEqual([]);
  });
});
