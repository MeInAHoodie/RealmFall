export type ClassId = 'warrior' | 'mage' | 'ranger';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type EquipSlot = 'weapon' | 'helmet' | 'chest' | 'gloves' | 'legs' | 'boots' | 'ring' | 'necklace';
export type ItemKind = 'equip' | 'material' | 'consumable';
export type SkillId = string;

export interface SkillDef {
  id: SkillId;
  name: string;
  classId: ClassId;
  slot: 'basic' | 'heavy' | 'q' | 'e' | 'r';
  cooldown: number; // seconds
  range: number;
  damage: number; // base damage multiplier or flat
  manaCost: number;
  effect?: 'fire' | 'ice' | 'pierce' | 'slash' | 'shield' | 'arrow';
  passive?: boolean;
  desc: string;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  role: string;
  desc: string;
  baseHealth: number;
  baseMana: number;
  baseDamage: number;
  baseDefense: number;
  baseSpeed: number;
  critChance: number;
  primaryColor: string;
  accentColor: string;
  skills: SkillDef[];
}

export interface MonsterDef {
  id: string;
  name: string;
  level: number;
  health: number;
  damage: number;
  defense: number;
  speed: number;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  xpReward: number;
  respawnSeconds: number;
  scale: number;
  color: string;
  region: string;
  loot: LootEntry[];
  kind: 'slime' | 'wolf' | 'goblin' | 'skeleton' | 'spider' | 'bandit' | 'orc' | 'golem' | 'spirit' | 'dragon' | 'boss';
}

export interface LootEntry {
  itemId: string;
  chance: number;
  min: number;
  max: number;
}

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  slot?: EquipSlot;
  icon: string; // lucide icon name
  stats?: Partial<PlayerStats>;
  stackable?: boolean;
  value: number;
  desc: string;
}

export interface PlayerStats {
  health: number;
  mana: number;
  damage: number;
  defense: number;
  speed: number;
  critChance: number;
}

export interface RegionDef {
  id: string;
  name: string;
  desc: string;
  center: [number, number];
  recommendedLevel: number;
  music: string;
  color: string;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
