import type { MonsterDef } from '../types';

export const MONSTERS: Record<string, MonsterDef> = {
  slime: {
    id: 'slime', name: 'Forest Slime', level: 1, health: 40, damage: 6, defense: 0, speed: 1.6,
    aggroRange: 7, attackRange: 1.6, attackCooldown: 1.4, xpReward: 12, respawnSeconds: 14,
    scale: 0.7, color: '#7ed957', region: 'plains', kind: 'slime',
    loot: [{ itemId: 'mat_slime', chance: 0.7, min: 1, max: 2 }],
  },
  wolf: {
    id: 'wolf', name: 'Gray Wolf', level: 3, health: 70, damage: 11, defense: 2, speed: 3.6,
    aggroRange: 11, attackRange: 1.8, attackCooldown: 1.0, xpReward: 24, respawnSeconds: 18,
    scale: 0.85, color: '#8a8f99', region: 'forest', kind: 'wolf',
    loot: [{ itemId: 'mat_pelt', chance: 0.5, min: 1, max: 1 }, { itemId: 'potion_minor', chance: 0.15, min: 1, max: 1 }],
  },
  goblin: {
    id: 'goblin', name: 'Goblin Scout', level: 5, health: 95, damage: 14, defense: 3, speed: 3.0,
    aggroRange: 9, attackRange: 2.0, attackCooldown: 1.2, xpReward: 38, respawnSeconds: 20,
    scale: 0.9, color: '#6fae4a', region: 'forest', kind: 'goblin',
    loot: [{ itemId: 'wpn_rusty_dagger', chance: 0.08, min: 1, max: 1 }, { itemId: 'mat_coin', chance: 0.9, min: 2, max: 8 }],
  },
  skeleton: {
    id: 'skeleton', name: 'Risen Skeleton', level: 8, health: 140, damage: 20, defense: 5, speed: 2.4,
    aggroRange: 10, attackRange: 2.2, attackCooldown: 1.3, xpReward: 60, respawnSeconds: 24,
    scale: 0.95, color: '#e8e4d3', region: 'ruins', kind: 'skeleton',
    loot: [{ itemId: 'mat_bone', chance: 0.6, min: 1, max: 3 }, { itemId: 'helm_skull', chance: 0.05, min: 1, max: 1 }],
  },
  spider: {
    id: 'spider', name: 'Cave Spider', level: 6, health: 110, damage: 16, defense: 2, speed: 3.2,
    aggroRange: 12, attackRange: 1.8, attackCooldown: 1.1, xpReward: 48, respawnSeconds: 20,
    scale: 0.8, color: '#3a2b50', region: 'swamp', kind: 'spider',
    loot: [{ itemId: 'mat_silk', chance: 0.55, min: 1, max: 2 }],
  },
  orc: {
    id: 'orc', name: 'Orc Brute', level: 12, health: 220, damage: 30, defense: 8, speed: 2.8,
    aggroRange: 10, attackRange: 2.4, attackCooldown: 1.5, xpReward: 95, respawnSeconds: 28,
    scale: 1.15, color: '#4f7a3a', region: 'deep_forest', kind: 'orc',
    loot: [{ itemId: 'wpn_orc_axe', chance: 0.06, min: 1, max: 1 }, { itemId: 'mat_coin', chance: 0.9, min: 5, max: 16 }],
  },
  golem: {
    id: 'golem', name: 'Stone Golem', level: 18, health: 420, damage: 42, defense: 18, speed: 1.8,
    aggroRange: 9, attackRange: 2.8, attackCooldown: 2.0, xpReward: 180, respawnSeconds: 40,
    scale: 1.4, color: '#9b8a6a', region: 'mountains', kind: 'golem',
    loot: [{ itemId: 'mat_stone', chance: 0.7, min: 1, max: 3 }, { itemId: 'chest_golem', chance: 0.04, min: 1, max: 1 }],
  },
  spirit: {
    id: 'spirit', name: 'Forest Spirit', level: 14, health: 260, damage: 34, defense: 6, speed: 3.4,
    aggroRange: 13, attackRange: 2.6, attackCooldown: 1.4, xpReward: 130, respawnSeconds: 30,
    scale: 1.0, color: '#9be8c4', region: 'crystal_valley', kind: 'spirit',
    loot: [{ itemId: 'mat_essence', chance: 0.4, min: 1, max: 2 }, { itemId: 'ring_spirit', chance: 0.05, min: 1, max: 1 }],
  },
  dragon: {
    id: 'dragon', name: 'Dragon Hatchling', level: 24, health: 680, damage: 60, defense: 14, speed: 3.0,
    aggroRange: 16, attackRange: 3.4, attackCooldown: 1.8, xpReward: 360, respawnSeconds: 60,
    scale: 1.3, color: '#ff5a3c', region: 'volcanic', kind: 'dragon',
    loot: [{ itemId: 'mat_scale', chance: 0.5, min: 1, max: 2 }, { itemId: 'wpn_dragon_sword', chance: 0.03, min: 1, max: 1 }],
  },
};

export const BOSSES: Record<string, MonsterDef> = {
  forest_guardian: {
    id: 'forest_guardian', name: 'Forest Guardian', level: 10, health: 1200, damage: 32, defense: 10, speed: 2.2,
    aggroRange: 14, attackRange: 4.0, attackCooldown: 1.6, xpReward: 600, respawnSeconds: 120,
    scale: 2.0, color: '#3fae5a', region: 'forest', kind: 'boss',
    loot: [
      { itemId: 'chest_guardian', chance: 1.0, min: 1, max: 1 },
      { itemId: 'wpn_guardian_bow', chance: 0.5, min: 1, max: 1 },
      { itemId: 'mat_essence', chance: 1.0, min: 2, max: 5 },
    ],
  },
  ice_titan: {
    id: 'ice_titan', name: 'Ice Titan', level: 20, health: 3200, damage: 55, defense: 20, speed: 2.0,
    aggroRange: 16, attackRange: 4.5, attackCooldown: 1.8, xpReward: 1400, respawnSeconds: 180,
    scale: 2.6, color: '#7fd9ff', region: 'mountains', kind: 'boss',
    loot: [
      { itemId: 'chest_titan', chance: 1.0, min: 1, max: 1 },
      { itemId: 'wpn_ice_staff', chance: 0.5, min: 1, max: 1 },
      { itemId: 'mat_scale', chance: 1.0, min: 3, max: 6 },
    ],
  },
  fire_dragon: {
    id: 'fire_dragon', name: 'Pyrothrane, the Ember Wyrm', level: 32, health: 6500, damage: 85, defense: 28, speed: 2.6,
    aggroRange: 20, attackRange: 5.0, attackCooldown: 1.7, xpReward: 3200, respawnSeconds: 240,
    scale: 2.8, color: '#ff4422', region: 'volcanic', kind: 'boss',
    loot: [
      { itemId: 'chest_dragon', chance: 1.0, min: 1, max: 1 },
      { itemId: 'wpn_dragon_sword', chance: 0.7, min: 1, max: 1 },
      { itemId: 'mat_scale', chance: 1.0, min: 5, max: 10 },
    ],
  },
};

export const ALL_MONSTERS = { ...MONSTERS, ...BOSSES };

export interface SpawnDef {
  monsterId: string;
  position: [number, number, number];
  isBoss?: boolean;
}

export const SPAWN_GROUPS: SpawnDef[] = [
  // Plains (low level)
  { monsterId: 'slime', position: [18, 0, -12] },
  { monsterId: 'slime', position: [24, 0, -6] },
  { monsterId: 'slime', position: [14, 0, 4] },
  { monsterId: 'slime', position: [-10, 0, 18] },
  { monsterId: 'slime', position: [-22, 0, 10] },
  // Forest
  { monsterId: 'wolf', position: [-38, 0, -20] },
  { monsterId: 'wolf', position: [-44, 0, -14] },
  { monsterId: 'goblin', position: [-52, 0, -28] },
  { monsterId: 'goblin', position: [-58, 0, -22] },
  // Ruins
  { monsterId: 'skeleton', position: [-70, 0, -40] },
  { monsterId: 'skeleton', position: [-76, 0, -34] },
  // Swamp
  { monsterId: 'spider', position: [-64, 0, 30] },
  { monsterId: 'spider', position: [-58, 0, 36] },
  { monsterId: 'spider', position: [-70, 0, 38] },
  // Deep forest -> orcs
  { monsterId: 'orc', position: [40, 0, -60] },
  { monsterId: 'orc', position: [48, 0, -66] },
  // Mountains -> golems
  { monsterId: 'golem', position: [70, 0, 40] },
  { monsterId: 'golem', position: [78, 0, 46] },
  // Crystal valley -> spirits
  { monsterId: 'spirit', position: [-30, 0, 60] },
  { monsterId: 'spirit', position: [-38, 0, 66] },
  // Volcanic -> dragon hatchlings
  { monsterId: 'dragon', position: [90, 0, -40] },
  { monsterId: 'dragon', position: [96, 0, -48] },
  // Bosses
  { monsterId: 'forest_guardian', position: [-60, 0, -44], isBoss: true },
  { monsterId: 'ice_titan', position: [82, 0, 52], isBoss: true },
  { monsterId: 'fire_dragon', position: [100, 0, -52], isBoss: true },
];
