import { create } from 'zustand';
import type { ClassId, ItemDef, EquipSlot, PlayerStats } from './types';
import { CLASSES } from './data/classes';
import { ITEMS } from './data/items';
import { LEVEL_CAP, xpForLevel, statsForLevel, applyItemStats } from './data/progression';

export interface InventoryItem {
  itemId: string;
  count: number;
  uid: string;
}

export interface FloatingDamage {
  id: number;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  crit: boolean;
}

export interface ImpactFx {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
  born: number;
}

export interface PlayerEntity {
  id: string;
  name: string;
  classId: ClassId;
  position: [number, number, number];
  rotation: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  isLocal: boolean;
}

export interface MonsterInstance {
  id: string;
  defId: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  position: [number, number, number];
  spawnPos: [number, number, number];
  state: 'idle' | 'chase' | 'attack' | 'dead' | 'returning';
  target: string | null;
  lastAttack: number;
  respawnAt: number;
  isBoss: boolean;
  scale: number;
  color: string;
  hitFlash: number;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  speed: number;
  damage: number;
  defense: number;
  xpReward: number;
  patrol: [number, number, number];
}

export type LogKind = 'loot' | 'level' | 'combat' | 'system' | 'quest';
export interface LogEntry {
  id: number;
  kind: LogKind;
  text: string;
  time: number;
}

type Screen = 'title' | 'class-select' | 'game';

interface GameState {
  screen: Screen;
  playerName: string;
  classId: ClassId | null;
  level: number;
  xp: number;
  gold: number;
  currentHealth: number;
  currentMana: number;
  inventory: InventoryItem[];
  equipped: Partial<Record<EquipSlot, string>>;
  monsters: Record<string, MonsterInstance>;
  floatingDamage: FloatingDamage[];
  impacts: ImpactFx[];
  playerHitFlash: number;
  playerHitAt: number;
  lastMonsterHitAt: number;
  nearbyPlayers: PlayerEntity[];
  log: LogEntry[];
  worldTime: number; // 0..1 day cycle
  weather: 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
  region: string;
  paused: boolean;
  scoreboardOpen: boolean;
  damageTotal: number;
  kills: number;
  bossKills: number;
  showInventory: boolean;
  showMap: boolean;
  showChat: boolean;
  chatMessages: { id: number; channel: 'global' | 'local' | 'party'; sender: string; text: string }[];
  chatInput: string;
  chatChannel: 'global' | 'local' | 'party';
  skillCooldowns: Record<string, number>;
  toast: { id: number; text: string; sub?: string } | null;

  // actions
  setScreen: (s: Screen) => void;
  setPlayerName: (n: string) => void;
  chooseClass: (c: ClassId) => void;
  enterWorld: () => void;
  grantXp: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  useMana: (amount: number) => boolean;
  addItem: (itemId: string, count?: number) => void;
  removeItem: (uid: string) => void;
  equipItem: (uid: string) => void;
  unequip: (slot: EquipSlot) => void;
  useConsumable: (uid: string) => void;
  getStats: () => PlayerStats;
  spawnMonster: (defId: string, position: [number, number, number], isBoss?: boolean) => void;
  damageMonster: (id: string, amount: number, crit: boolean) => void;
  setMonsterState: (id: string, patch: Partial<MonsterInstance>) => void;
  tickMonsters: (dt: number, playerPos: [number, number, number], now: number) => void;
  addFloatingDamage: (text: string, x: number, y: number, z: number, color: string, crit: boolean) => void;
  clearFloatingDamage: (id: number) => void;
  addImpact: (x: number, y: number, z: number, color: string) => void;
  setWorldTime: (t: number) => void;
  setWeather: (w: GameState['weather']) => void;
  setRegion: (r: string) => void;
  togglePause: () => void;
  toggleScoreboard: () => void;
  toggleInventory: () => void;
  toggleMap: () => void;
  toggleChat: () => void;
  sendChat: (text: string) => void;
  setChatInput: (t: string) => void;
  setChatChannel: (c: GameState['chatChannel']) => void;
  setSkillCooldown: (skillId: string, seconds: number) => void;
  tickCooldowns: (dt: number) => void;
  showToast: (text: string, sub?: string) => void;
  clearToast: () => void;
  logEvent: (kind: LogKind, text: string) => void;
  addNearbyPlayer: (p: PlayerEntity) => void;
  removeNearbyPlayer: (id: string) => void;
}

let uidCounter = 0;
const uid = () => `u${++uidCounter}`;
let dmgCounter = 0;
let impactCounter = 0;
let logCounter = 0;
let chatCounter = 0;

function rollLoot(loot: { itemId: string; chance: number; min: number; max: number }[]): { itemId: string; count: number }[] {
  const out: { itemId: string; count: number }[] = [];
  for (const entry of loot) {
    if (Math.random() < entry.chance) {
      const count = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
      out.push({ itemId: entry.itemId, count });
    }
  }
  return out;
}

export const useGame = create<GameState>((set, get) => ({
  screen: 'title',
  playerName: 'Wanderer',
  classId: null,
  level: 1,
  xp: 0,
  gold: 25,
  currentHealth: 100,
  currentMana: 60,
  inventory: [{ itemId: 'potion_minor', count: 3, uid: uid() }],
  equipped: {},
  monsters: {},
  floatingDamage: [],
  impacts: [],
  playerHitFlash: 0,
  playerHitAt: 0,
  lastMonsterHitAt: 0,
  nearbyPlayers: [],
  log: [{ id: ++logCounter, kind: 'system', text: 'Welcome to Realmfall.', time: Date.now() }],
  worldTime: 0.32,
  weather: 'clear',
  region: 'village',
  paused: false,
  scoreboardOpen: false,
  damageTotal: 0,
  kills: 0,
  bossKills: 0,
  showInventory: false,
  showMap: false,
  showChat: false,
  chatMessages: [
    { id: ++chatCounter, channel: 'global', sender: 'System', text: 'Global chat connected. Be kind to your fellow adventurers.' },
  ],
  chatInput: '',
  chatChannel: 'global',
  skillCooldowns: {},
  toast: null,

  setScreen: (s) => set({ screen: s }),
  setPlayerName: (n) => set({ playerName: n.slice(0, 18) || 'Wanderer' }),
  chooseClass: (c) => set({ classId: c }),
  enterWorld: () => {
    const { classId } = get();
    if (!classId) return;
    const def = CLASSES[classId];
    const base = statsForLevel(1, {
      health: def.baseHealth,
      mana: def.baseMana,
      damage: def.baseDamage,
      defense: def.baseDefense,
      speed: def.baseSpeed,
      critChance: def.critChance,
    });
    set({
      screen: 'game',
      level: 1,
      xp: 0,
      currentHealth: base.health,
      currentMana: base.mana,
    });
  },

  grantXp: (amount) => {
    const { level, xp, classId } = get();
    if (!classId || level >= LEVEL_CAP) return;
    let newLevel = level;
    let newXp = xp + amount;
    while (newLevel < LEVEL_CAP && newXp >= xpForLevel(newLevel)) {
      newXp -= xpForLevel(newLevel);
      newLevel++;
    }
    if (newLevel > level) {
      const def = CLASSES[classId];
      const base = statsForLevel(newLevel, {
        health: def.baseHealth,
        mana: def.baseMana,
        damage: def.baseDamage,
        defense: def.baseDefense,
        speed: def.baseSpeed,
        critChance: def.critChance,
      });
      const stats = applyItemStats(base, Object.values(get().equipped).map((id) => ITEMS[id]?.stats));
      set({
        level: newLevel,
        xp: newXp,
        currentHealth: stats.health,
        currentMana: stats.mana,
      });
      get().logEvent('level', `Reached level ${newLevel}! Stats increased.`);
      get().showToast(`Level Up! Now level ${newLevel}`, 'Health and mana restored');
    } else {
      set({ xp: newXp });
    }
  },

  damagePlayer: (amount) => {
    const { currentHealth } = get();
    const hp = Math.max(0, currentHealth - amount);
    set({
      currentHealth: hp,
      playerHitFlash: Math.min(1, 0.55 + amount / 40),
      playerHitAt: performance.now(),
    });
    if (hp <= 0) {
      set({ paused: true });
      get().logEvent('combat', 'You were defeated. Respawning at the village...');
      setTimeout(() => {
        const stats = get().getStats();
        set({ currentHealth: stats.health, currentMana: stats.mana, paused: false, screen: 'game' });
      }, 1800);
    }
  },
  healPlayer: (amount) => {
    const { currentHealth } = get();
    const max = get().getStats().health;
    set({ currentHealth: Math.min(max, currentHealth + amount) });
  },
  useMana: (amount) => {
    const { currentMana } = get();
    if (currentMana < amount) return false;
    set({ currentMana: Math.max(0, currentMana - amount) });
    return true;
  },

  addItem: (itemId, count = 1) => {
    const def = ITEMS[itemId];
    if (!def) return;
    const { inventory } = get();
    if (def.stackable) {
      const existing = inventory.find((i) => i.itemId === itemId);
      if (existing) {
        set({ inventory: inventory.map((i) => (i.uid === existing.uid ? { ...i, count: i.count + count } : i)) });
        get().logEvent('loot', `Looted ${count}x ${def.name}`);
        return;
      }
    }
    set({ inventory: [...inventory, { itemId, count, uid: uid() }] });
    get().logEvent('loot', `Looted ${count > 1 ? count + 'x ' : ''}${def.name}`);
  },
  removeItem: (u) => set({ inventory: get().inventory.filter((i) => i.uid !== u) }),
  equipItem: (u) => {
    const inv = get().inventory;
    const item = inv.find((i) => i.uid === u);
    if (!item) return;
    const def = ITEMS[item.itemId];
    if (!def || def.kind !== 'equip' || !def.slot) return;
    const { equipped } = get();
    const previous = equipped[def.slot];
    const newEquipped = { ...equipped, [def.slot]: item.itemId };
    let newInv = inv.filter((i) => i.uid !== u);
    if (previous) {
      const prevDef = ITEMS[previous];
      newInv = [...newInv, { itemId: previous, count: 1, uid: uid() }];
      get().logEvent('loot', `Unequipped ${prevDef?.name}`);
    }
    set({ equipped: newEquipped, inventory: newInv });
    get().logEvent('loot', `Equipped ${def.name}`);
    const stats = get().getStats();
    set({ currentHealth: Math.min(stats.health, get().currentHealth), currentMana: Math.min(stats.mana, get().currentMana) });
  },
  unequip: (slot) => {
    const { equipped } = get();
    const id = equipped[slot];
    if (!id) return;
    const def = ITEMS[id];
    const newEquipped = { ...equipped };
    delete newEquipped[slot];
    set({
      equipped: newEquipped,
      inventory: [...get().inventory, { itemId: id, count: 1, uid: uid() }],
    });
    get().logEvent('loot', `Unequipped ${def?.name}`);
  },
  useConsumable: (u) => {
    const item = get().inventory.find((i) => i.uid === u);
    if (!item) return;
    const def = ITEMS[item.itemId];
    if (def?.kind !== 'consumable') return;
    if (item.itemId === 'potion_minor') get().healPlayer(60);
    get().logEvent('combat', `Used ${def.name}`);
    if (item.count > 1) {
      set({ inventory: get().inventory.map((i) => (i.uid === u ? { ...i, count: i.count - 1 } : i)) });
    } else {
      get().removeItem(u);
    }
  },

  getStats: () => {
    const { classId, level, equipped } = get();
    const def = classId ? CLASSES[classId] : CLASSES.warrior;
    let base = statsForLevel(level, {
      health: def.baseHealth,
      mana: def.baseMana,
      damage: def.baseDamage,
      defense: def.baseDefense,
      speed: def.baseSpeed,
      critChance: def.critChance,
    });
    // class passives
    if (def.id === 'warrior') base.health = Math.round(base.health * 1.1);
    if (def.id === 'mage') base.mana = Math.round(base.mana * 1.0);
    if (def.id === 'ranger') base.critChance += 0.06;
    base = applyItemStats(base, Object.values(equipped).map((id) => ITEMS[id]?.stats));
    return base;
  },

  spawnMonster: (defId, position, isBoss = false) => {
    const def = MONSTER_LOOKUP[defId];
    if (!def) return;
    const id = `m_${defId}_${++uidCounter}`;
    const m: MonsterInstance = {
      id,
      defId,
      name: def.name,
      level: def.level,
      health: def.health,
      maxHealth: def.health,
      position: [...position] as [number, number, number],
      spawnPos: [...position] as [number, number, number],
      state: 'idle',
      target: null,
      lastAttack: 0,
      respawnAt: 0,
      isBoss,
      scale: def.scale,
      color: def.color,
      hitFlash: 0,
      aggroRange: def.aggroRange,
      attackRange: def.attackRange,
      attackCooldown: def.attackCooldown,
      speed: def.speed,
      damage: def.damage,
      defense: def.defense,
      xpReward: def.xpReward,
      patrol: [...position] as [number, number, number],
    };
    set({ monsters: { ...get().monsters, [id]: m } });
  },

  damageMonster: (id, amount, crit) => {
    const m = get().monsters[id];
    if (!m || m.state === 'dead') return;
    const dmg = Math.max(1, Math.round(amount - m.defense * 0.5));
    const hp = m.health - dmg;
    set({
      monsters: { ...get().monsters, [id]: { ...m, health: hp, hitFlash: 1, state: hp <= 0 ? 'dead' : m.state === 'idle' ? 'chase' : m.state, target: 'local', respawnAt: hp <= 0 ? Date.now() + (m.isBoss ? 120 : 20) * 1000 : 0 } },
      damageTotal: get().damageTotal + dmg,
      lastMonsterHitAt: performance.now(),
    });
    get().addFloatingDamage(String(dmg), m.position[0], m.position[1] + m.scale * 1.5, m.position[2], crit ? '#ffd166' : '#ffffff', crit);
    get().addImpact(m.position[0], m.position[1] + m.scale * 0.9, m.position[2], crit ? '#ffd166' : '#ffffff');
    if (hp <= 0) {
      const def = MONSTER_LOOKUP[m.defId];
      const loot = rollLoot(def.loot);
      for (const l of loot) get().addItem(l.itemId, l.count);
      get().grantXp(m.xpReward);
      set({ kills: get().kills + 1, bossKills: get().bossKills + (m.isBoss ? 1 : 0) });
      get().logEvent('combat', `Defeated ${m.name} (+${m.xpReward} XP)`);
      if (m.isBoss) {
        get().showToast(`${m.name} has fallen!`, 'Rare loot awarded');
      }
    }
  },
  setMonsterState: (id, patch) => {
    const m = get().monsters[id];
    if (!m) return;
    set({ monsters: { ...get().monsters, [id]: { ...m, ...patch } } });
  },

  tickMonsters: (dt, playerPos, now) => {
    const monsters = get().monsters;
    const updated: Record<string, MonsterInstance> = {};
    for (const [id, m] of Object.entries(monsters)) {
      let nm = m;
      if (m.state === 'dead') {
        if (now >= m.respawnAt) {
          const def = MONSTER_LOOKUP[m.defId];
          nm = { ...m, state: 'idle', health: m.maxHealth, position: [...m.spawnPos], target: null, hitFlash: 0 };
          void def;
        } else {
          updated[id] = m;
          continue;
        }
      }
      if (nm.state !== 'dead') {
        const dx = playerPos[0] - nm.position[0];
        const dz = playerPos[2] - nm.position[2];
        const dist = Math.hypot(dx, dz);
        if (nm.state === 'idle' && dist < nm.aggroRange) {
          nm = { ...nm, state: 'chase', target: 'local' };
        } else if (nm.state === 'chase') {
          if (dist > nm.aggroRange * 1.8) {
            nm = { ...nm, state: 'returning', target: null };
          } else if (dist <= nm.attackRange) {
            nm = { ...nm, state: 'attack' };
          } else {
            const move = nm.speed * dt;
            const angle = Math.atan2(dx, dz);
            nm = { ...nm, position: [nm.position[0] + Math.sin(angle) * move, nm.position[1], nm.position[2] + Math.cos(angle) * move] };
          }
        } else if (nm.state === 'attack') {
          if (dist > nm.attackRange * 1.3) {
            nm = { ...nm, state: 'chase' };
          } else if (now - nm.lastAttack > nm.attackCooldown * 1000) {
            nm = { ...nm, lastAttack: now };
            const stats = get().getStats();
            const raw = nm.damage;
            const mitigation = Math.max(0, stats.defense * 0.5);
            const final = Math.max(1, Math.round(raw - mitigation));
            get().damagePlayer(final);
            get().addFloatingDamage(String(final), playerPos[0], playerPos[1] + 1.6, playerPos[2], '#ff5a5a', false);
          }
        } else if (nm.state === 'returning') {
          const sx = nm.spawnPos[0] - nm.position[0];
          const sz = nm.spawnPos[2] - nm.position[2];
          const sdist = Math.hypot(sx, sz);
          if (sdist < 1) {
            nm = { ...nm, state: 'idle', health: nm.maxHealth };
          } else {
            const move = nm.speed * dt;
            const angle = Math.atan2(sx, sz);
            nm = { ...nm, position: [nm.position[0] + Math.sin(angle) * move, nm.position[1], nm.position[2] + Math.cos(angle) * move] };
          }
        }
        if (nm.hitFlash > 0) nm = { ...nm, hitFlash: Math.max(0, nm.hitFlash - dt * 3) };
      }
      updated[id] = nm;
    }
    set({ monsters: updated });
  },

  addFloatingDamage: (text, x, y, z, color, crit) => {
    const id = ++dmgCounter;
    set({ floatingDamage: [...get().floatingDamage, { id, text, x, y, z, color, crit }] });
    setTimeout(() => get().clearFloatingDamage(id), 1000);
  },
  clearFloatingDamage: (id) => set({ floatingDamage: get().floatingDamage.filter((f) => f.id !== id) }),
  addImpact: (x, y, z, color) => {
    const now = performance.now();
    set({
      impacts: [
        ...get().impacts.filter((i) => now - i.born < 400),
        { id: ++impactCounter, x, y, z, color, born: now },
      ],
    });
  },

  setWorldTime: (t) => set({ worldTime: t }),
  setWeather: (w) => set({ weather: w }),
  setRegion: (r) => {
    if (get().region !== r) set({ region: r });
  },
  togglePause: () => set({ paused: !get().paused }),
  toggleScoreboard: () => set({ scoreboardOpen: !get().scoreboardOpen }),
  toggleInventory: () => set({ showInventory: !get().showInventory }),
  toggleMap: () => set({ showMap: !get().showMap }),
  toggleChat: () => set({ showChat: !get().showChat }),
  sendChat: (text) => {
    const t = text.trim();
    if (!t) return;
    const { playerName, chatChannel } = get();
    set({
      chatMessages: [...get().chatMessages.slice(-40), { id: ++chatCounter, channel: chatChannel, sender: playerName, text: t }],
      chatInput: '',
    });
  },
  setChatInput: (t) => set({ chatInput: t }),
  setChatChannel: (c) => set({ chatChannel: c }),
  setSkillCooldown: (skillId, seconds) => set({ skillCooldowns: { ...get().skillCooldowns, [skillId]: seconds } }),
  tickCooldowns: (dt) => {
    const cd = get().skillCooldowns;
    const keys = Object.keys(cd);
    if (keys.length === 0) return;
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(cd)) {
      const n = Math.max(0, v - dt);
      if (n > 1e-9) next[k] = n;
    }
    set({ skillCooldowns: next });
    const { playerHitFlash } = get();
    if (playerHitFlash > 0) set({ playerHitFlash: Math.max(0, playerHitFlash - dt * 2.5) });
  },
  showToast: (text, sub) => {
    const id = ++uidCounter;
    set({ toast: { id, text, sub } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 3000);
  },
  clearToast: () => set({ toast: null }),
  logEvent: (kind, text) => set({ log: [...get().log.slice(-40), { id: ++logCounter, kind, text, time: Date.now() }] }),
  addNearbyPlayer: (p) => {
    const existing = get().nearbyPlayers.find((e) => e.id === p.id);
    if (existing) {
      set({ nearbyPlayers: get().nearbyPlayers.map((e) => (e.id === p.id ? p : e)) });
    } else {
      set({ nearbyPlayers: [...get().nearbyPlayers, p] });
    }
  },
  removeNearbyPlayer: (id) => set({ nearbyPlayers: get().nearbyPlayers.filter((p) => p.id !== id) }),
}));

import { MONSTERS, BOSSES } from './data/monsters';
const MONSTER_LOOKUP: Record<string, typeof MONSTERS[string]> = { ...MONSTERS, ...BOSSES };

export type { ItemDef };
