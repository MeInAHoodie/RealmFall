import type { ItemDef, RegionDef } from '../types';

export const ITEMS: Record<string, ItemDef> = {
  // Materials
  mat_slime: { id: 'mat_slime', name: 'Slime Gel', kind: 'material', rarity: 'common', icon: 'Droplet', stackable: true, value: 3, desc: 'Sticky gel harvested from a slime. Used in alchemy.' },
  mat_pelt: { id: 'mat_pelt', name: 'Wolf Pelt', kind: 'material', rarity: 'common', icon: 'Package', stackable: true, value: 8, desc: 'A coarse gray wolf pelt.' },
  mat_bone: { id: 'mat_bone', name: 'Old Bone', kind: 'material', rarity: 'common', icon: 'Bone', stackable: true, value: 6, desc: 'A brittle, ancient bone.' },
  mat_silk: { id: 'mat_silk', name: 'Spider Silk', kind: 'material', rarity: 'uncommon', icon: 'Wind', stackable: true, value: 14, desc: 'Silky thread with a faint glow.' },
  mat_stone: { id: 'mat_stone', name: 'Golem Core', kind: 'material', rarity: 'rare', icon: 'Gem', stackable: true, value: 40, desc: 'A chunk of enchanted stone.' },
  mat_essence: { id: 'mat_essence', name: 'Spirit Essence', kind: 'material', rarity: 'rare', icon: 'Sparkles', stackable: true, value: 55, desc: 'Ethereal essence of a forest spirit.' },
  mat_scale: { id: 'mat_scale', name: 'Dragon Scale', kind: 'material', rarity: 'epic', icon: 'Shield', stackable: true, value: 120, desc: 'A shimmering dragon scale, warm to the touch.' },
  mat_coin: { id: 'mat_coin', name: 'Gold Coins', kind: 'material', rarity: 'common', icon: 'Coins', stackable: true, value: 1, desc: 'A handful of gold coins.' },

  // Consumables
  potion_minor: { id: 'potion_minor', name: 'Minor Health Potion', kind: 'consumable', rarity: 'common', icon: 'FlaskConical', stackable: true, value: 10, desc: 'Restores 60 health. Right-click to use.' },

  // Weapons
  wpn_rusty_dagger: { id: 'wpn_rusty_dagger', name: 'Rusty Dagger', kind: 'equip', rarity: 'uncommon', slot: 'weapon', icon: 'Sword', value: 20, stats: { damage: 4 }, desc: 'A pitted old dagger. Still sharp enough.' },
  wpn_orc_axe: { id: 'wpn_orc_axe', name: 'Orc Cleaver', kind: 'equip', rarity: 'rare', slot: 'weapon', icon: 'Axe', value: 75, stats: { damage: 12, speed: -0.3 }, desc: 'A brutal orcish axe.' },
  wpn_guardian_bow: { id: 'wpn_guardian_bow', name: 'Guardian Longbow', kind: 'equip', rarity: 'epic', slot: 'weapon', icon: 'Target', value: 180, stats: { damage: 20, critChance: 0.08 }, desc: 'Carved from living wood by the Forest Guardian.' },
  wpn_ice_staff: { id: 'wpn_ice_staff', name: 'Staff of Eternal Winter', kind: 'equip', rarity: 'epic', slot: 'weapon', icon: 'Wand2', value: 220, stats: { damage: 22, mana: 30 }, desc: 'A staff that hums with frozen power.' },
  wpn_dragon_sword: { id: 'wpn_dragon_sword', name: 'Drakefang Blade', kind: 'equip', rarity: 'legendary', slot: 'weapon', icon: 'Sword', value: 480, stats: { damage: 38, critChance: 0.1, defense: 6 }, desc: 'Forged from dragonbone and ember-steel.' },

  // Armor
  helm_skull: { id: 'helm_skull', name: 'Skull Helm', kind: 'equip', rarity: 'uncommon', slot: 'helmet', icon: 'HardHat', value: 30, stats: { defense: 4, health: 20 }, desc: 'A helm fashioned from an ancient skull.' },
  chest_golem: { id: 'chest_golem', name: 'Stoneplate Cuirass', kind: 'equip', rarity: 'rare', slot: 'chest', icon: 'Shield', value: 120, stats: { defense: 14, health: 60 }, desc: 'Armor hewn from a golem core.' },
  chest_guardian: { id: 'chest_guardian', name: 'Guardian Barkmail', kind: 'equip', rarity: 'epic', slot: 'chest', icon: 'Shield', value: 240, stats: { defense: 22, health: 110, speed: 0.4 }, desc: 'Living bark armor that mends itself.' },
  chest_titan: { id: 'chest_titan', name: 'Titanplate', kind: 'equip', rarity: 'legendary', slot: 'chest', icon: 'Shield', value: 520, stats: { defense: 38, health: 220, mana: 40 }, desc: 'Forged from glacial ice that never melts.' },
  chest_dragon: { id: 'chest_dragon', name: 'Wyrm Scale Mail', kind: 'equip', rarity: 'mythic', slot: 'chest', icon: 'Shield', value: 980, stats: { defense: 56, health: 380, mana: 60, critChance: 0.06 }, desc: 'The pinnacle of dragon-forged protection.' },

  // Accessories
  ring_spirit: { id: 'ring_spirit', name: 'Ring of Whispers', kind: 'equip', rarity: 'rare', slot: 'ring', icon: 'Circle', value: 90, stats: { mana: 40, critChance: 0.05 }, desc: 'You hear faint voices when worn.' },
};

export const ITEM_LIST = Object.values(ITEMS);

export const REGIONS: RegionDef[] = [
  { id: 'village', name: 'Oakhaven Village', desc: 'A peaceful starting village nestled in a valley.', center: [0, 0], recommendedLevel: 0, music: 'Village Theme', color: '#c9933a' },
  { id: 'plains', name: 'Sunpetal Plains', desc: 'Rolling flower plains east of the village.', center: [20, -4], recommendedLevel: 1, music: 'Plains Theme', color: '#9bd17a' },
  { id: 'forest', name: 'Whisperwood', desc: 'A dense forest to the west.', center: [-48, -22], recommendedLevel: 3, music: 'Forest Theme', color: '#3f7a2e' },
  { id: 'ruins', name: 'Ancient Ruins', desc: 'Crumbling stonework beyond the forest.', center: [-72, -36], recommendedLevel: 7, music: 'Ruins Theme', color: '#b8a878' },
  { id: 'swamp', name: 'Mistmire Swamp', desc: 'A damp bog south of the ruins.', center: [-64, 34], recommendedLevel: 6, music: 'Swamp Theme', color: '#5a7a4a' },
  { id: 'deep_forest', name: 'Gloomwood Deep', desc: 'Dark woods where orcs prowl.', center: [44, -62], recommendedLevel: 11, music: 'Deep Forest Theme', color: '#2a5a2a' },
  { id: 'mountains', name: 'Frostspire Mountains', desc: 'Snowy peaks where golems wander.', center: [74, 44], recommendedLevel: 17, music: 'Mountain Theme', color: '#cfe3f0' },
  { id: 'crystal_valley', name: 'Crystal Valley', desc: 'A glittering vale of spirits.', center: [-34, 62], recommendedLevel: 13, music: 'Crystal Theme', color: '#9be8c4' },
  { id: 'volcanic', name: 'Emberfall Caldera', desc: 'A scorched volcanic region.', center: [94, -46], recommendedLevel: 23, music: 'Volcanic Theme', color: '#ff5a3c' },
];
