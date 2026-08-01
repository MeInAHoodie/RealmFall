import { describe, it, expect } from 'vitest';
import { LEVEL_CAP, xpForLevel, statsForLevel, xpProgress, applyItemStats } from './progression';

const base = { health: 100, mana: 50, damage: 20, defense: 10, speed: 5, critChance: 0.05 };

describe('progression', () => {
  it('has a level cap of 50', () => {
    expect(LEVEL_CAP).toBe(50);
  });

  it('xpForLevel grows monotonically with level', () => {
    let prev = 0;
    for (let l = 1; l <= LEVEL_CAP; l++) {
      const xp = xpForLevel(l);
      expect(xp).toBeGreaterThan(prev);
      prev = xp;
    }
  });

  it('xpForLevel returns positive finite values', () => {
    for (let l = 1; l <= LEVEL_CAP; l++) {
      const xp = xpForLevel(l);
      expect(Number.isFinite(xp)).toBe(true);
      expect(xp).toBeGreaterThan(0);
    }
  });

  it('statsForLevel scales with level and keeps speed constant', () => {
    expect(statsForLevel(1, base)).toEqual(base);
    const s10 = statsForLevel(10, base);
    expect(s10.health).toBeGreaterThan(base.health);
    expect(s10.damage).toBeGreaterThan(base.damage);
    expect(s10.defense).toBeGreaterThan(base.defense);
    expect(s10.speed).toBe(base.speed);
    expect(s10.critChance).toBeGreaterThan(base.critChance);
  });

  it('statsForLevel is deterministic', () => {
    expect(statsForLevel(7, base)).toEqual(statsForLevel(7, base));
  });

  it('applyItemStats accumulates only defined stats', () => {
    const out = applyItemStats(base, [{ damage: 5 }, undefined, { health: 30, speed: 1 }]);
    expect(out).toEqual({ health: 130, mana: 50, damage: 25, defense: 10, speed: 6, critChance: 0.05 });
  });

  it('applyItemStats ignores undefined and empty entries', () => {
    expect(applyItemStats(base, [undefined, {}, undefined])).toEqual(base);
  });

  it('xpProgress clamps pct at 1', () => {
    const p = xpProgress(1000, 1);
    expect(p.current).toBe(1000);
    expect(p.needed).toBe(xpForLevel(1));
    expect(p.pct).toBe(1);
  });
});
