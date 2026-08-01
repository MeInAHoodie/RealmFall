import type { PlayerStats } from '../types';

export const LEVEL_CAP = 50;

export function xpForLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.5)) + 40;
}

export function statsForLevel(level: number, base: PlayerStats): PlayerStats {
  const growth = 1 + (level - 1) * 0.12;
  return {
    health: Math.round(base.health * growth),
    mana: Math.round(base.mana * growth),
    damage: Math.round(base.damage * (1 + (level - 1) * 0.08)),
    defense: Math.round(base.defense * (1 + (level - 1) * 0.07)),
    speed: base.speed,
    critChance: base.critChance + (level - 1) * 0.004,
  };
}

export function xpProgress(xp: number, level: number): { current: number; needed: number; pct: number } {
  const needed = xpForLevel(level);
  const pct = Math.min(1, xp / needed);
  return { current: xp, needed, pct };
}

export function applyItemStats(base: PlayerStats, items: (Partial<PlayerStats> | undefined)[]): PlayerStats {
  const out = { ...base };
  for (const s of items) {
    if (!s) continue;
    out.health += s.health ?? 0;
    out.mana += s.mana ?? 0;
    out.damage += s.damage ?? 0;
    out.defense += s.defense ?? 0;
    out.speed += s.speed ?? 0;
    out.critChance += s.critChance ?? 0;
  }
  return out;
}
