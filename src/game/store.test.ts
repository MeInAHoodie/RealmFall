import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGame } from './store';
import { LEVEL_CAP } from './data/progression';

type PartialState = Parameters<typeof useGame.setState>[0];

const baseState: PartialState = {
  screen: 'title',
  playerName: 'Wanderer',
  classId: null,
  level: 1,
  xp: 0,
  gold: 25,
  currentHealth: 100,
  currentMana: 60,
  inventory: [{ itemId: 'potion_minor', count: 3, uid: 'u-init' }],
  equipped: {},
  monsters: {},
  floatingDamage: [],
  impacts: [],
  playerHitFlash: 0,
  playerHitAt: 0,
  lastMonsterHitAt: 0,
  nearbyPlayers: [],
  log: [],
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
  chatMessages: [],
  chatInput: '',
  chatChannel: 'global',
  skillCooldowns: {},
  toast: null,
};

beforeEach(() => {
  useGame.setState(baseState);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('tickCooldowns', () => {
  it('decays cooldowns every tick until they clear', () => {
    useGame.getState().setSkillCooldown('w_slash', 0.6);
    for (let i = 0; i < 6; i++) {
      useGame.getState().tickCooldowns(0.1);
    }
    expect(useGame.getState().skillCooldowns['w_slash'] ?? 0).toBe(0);
  });

  it('reduces cooldowns partially across ticks', () => {
    useGame.getState().setSkillCooldown('w_slash', 0.6);
    useGame.getState().tickCooldowns(0.1);
    useGame.getState().tickCooldowns(0.1);
    expect(useGame.getState().skillCooldowns['w_slash']).toBe(0.4);
  });

  it('keeps a skill usable again after the cooldown clears', () => {
    useGame.getState().setSkillCooldown('w_slash', 0.2);
    useGame.getState().tickCooldowns(0.1);
    useGame.getState().tickCooldowns(0.1);
    useGame.getState().tickCooldowns(0.1);
    expect(useGame.getState().skillCooldowns['w_slash'] ?? 0).toBe(0);
  });

  it('does not touch state when no cooldowns are active', () => {
    let notifications = 0;
    const unsub = useGame.subscribe(() => notifications++);
    useGame.getState().tickCooldowns(0.1);
    unsub();
    expect(notifications).toBe(0);
  });
});

describe('grantXp', () => {
  it('ignores xp before a class is chosen', () => {
    useGame.getState().grantXp(50);
    expect(useGame.getState().xp).toBe(0);
  });

  it('accumulates xp without leveling up', () => {
    useGame.getState().chooseClass('warrior');
    useGame.getState().enterWorld();
    useGame.getState().grantXp(50);
    const st = useGame.getState();
    expect(st.xp).toBe(50);
    expect(st.level).toBe(1);
  });

  it('levels up and refills health/mana when thresholds are met', () => {
    useGame.getState().chooseClass('warrior');
    useGame.getState().enterWorld();
    useGame.getState().grantXp(120); // xpForLevel(1)
    const st = useGame.getState();
    expect(st.level).toBe(2);
    expect(st.xp).toBe(0);
    expect(st.currentHealth).toBe(246); // round(220 * 1.12)
    expect(st.currentMana).toBe(67); // round(60 * 1.12)
    expect(st.log.some((l) => l.kind === 'level')).toBe(true);
  });

  it('respects the level cap', () => {
    useGame.getState().chooseClass('warrior');
    useGame.getState().enterWorld();
    useGame.getState().grantXp(999999);
    expect(useGame.getState().level).toBe(LEVEL_CAP);
  });
});

describe('damagePlayer', () => {
  it('reduces health and flags the hit', () => {
    useGame.getState().damagePlayer(30);
    const st = useGame.getState();
    expect(st.currentHealth).toBe(70);
    expect(st.playerHitFlash).toBeGreaterThan(0);
    expect(st.playerHitAt).toBeGreaterThan(0);
  });

  it('defeats the player and respawns after the delay', () => {
    vi.useFakeTimers();
    try {
      useGame.getState().chooseClass('warrior');
      useGame.getState().enterWorld();
      useGame.getState().damagePlayer(10000);
      const st = useGame.getState();
      expect(st.paused).toBe(true);
      expect(st.currentHealth).toBe(0);
      vi.advanceTimersByTime(1800);
      const after = useGame.getState();
      expect(after.paused).toBe(false);
      expect(after.currentHealth).toBe(after.getStats().health);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('damageMonster', () => {
  it('applies defense mitigation with a minimum of 1 damage', () => {
    useGame.getState().spawnMonster('golem', [0, 0, 0]);
    const id = Object.keys(useGame.getState().monsters)[0];
    useGame.getState().damageMonster(id, 10, false);
    const m = useGame.getState().monsters[id];
    expect(m.health).toBe(419); // 420 - max(1, round(10 - 18*0.5))
    expect(m.hitFlash).toBe(1);
    expect(m.state).toBe('chase');
  });

  it('kills a monster, grants xp and loot', () => {
    useGame.getState().chooseClass('warrior');
    useGame.getState().enterWorld();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      useGame.getState().spawnMonster('slime', [5, 0, 5]);
      const id = Object.keys(useGame.getState().monsters)[0];
      useGame.getState().damageMonster(id, 100, true);
      const st = useGame.getState();
      const m = st.monsters[id];
      expect(m.state).toBe('dead');
      expect(st.kills).toBe(1);
      expect(st.damageTotal).toBe(100);
      expect(st.xp).toBe(12);
      expect(st.inventory.some((i) => i.itemId === 'mat_slime')).toBe(true);
      expect(st.floatingDamage.length).toBeGreaterThan(0);
      expect(st.floatingDamage[0].crit).toBe(true);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('increments bossKills and announces boss death', () => {
    useGame.getState().chooseClass('warrior');
    useGame.getState().enterWorld();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      useGame.getState().spawnMonster('forest_guardian', [0, 0, 0], true);
      const id = Object.keys(useGame.getState().monsters)[0];
      useGame.getState().damageMonster(id, 100000, false);
      const st = useGame.getState();
      expect(st.bossKills).toBe(1);
      expect(st.toast?.text).toContain('has fallen');
    } finally {
      randomSpy.mockRestore();
    }
  });
});

describe('inventory', () => {
  it('stacks stackable items', () => {
    useGame.getState().addItem('potion_minor', 2);
    const inv = useGame.getState().inventory;
    expect(inv).toHaveLength(1);
    expect(inv[0].count).toBe(5);
  });

  it('adds new entries for unowned items', () => {
    useGame.getState().addItem('mat_slime', 3);
    const inv = useGame.getState().inventory;
    expect(inv).toHaveLength(2);
    expect(inv[1]).toMatchObject({ itemId: 'mat_slime', count: 3 });
  });

  it('ignores unknown item ids', () => {
    const before = useGame.getState().inventory.length;
    useGame.getState().addItem('does_not_exist');
    expect(useGame.getState().inventory.length).toBe(before);
  });

  it('equips and unequips items', () => {
    useGame.getState().addItem('wpn_rusty_dagger');
    const uid = useGame.getState().inventory.find((i) => i.itemId === 'wpn_rusty_dagger')!.uid;
    useGame.getState().equipItem(uid);
    let st = useGame.getState();
    expect(st.equipped.weapon).toBe('wpn_rusty_dagger');
    expect(st.inventory.some((i) => i.uid === uid)).toBe(false);
    expect(st.getStats().damage).toBe(18 + 4); // warrior base + dagger
    st.unequip('weapon');
    st = useGame.getState();
    expect(st.equipped.weapon).toBeUndefined();
    expect(st.inventory.some((i) => i.itemId === 'wpn_rusty_dagger')).toBe(true);
  });

  it('consumes a potion from the stack', () => {
    useGame.getState().damagePlayer(30);
    const uid = useGame.getState().inventory[0].uid;
    useGame.getState().useConsumable(uid);
    const st = useGame.getState();
    expect(st.currentHealth).toBe(130); // 70 + 60, clamped to max
    expect(st.inventory[0].count).toBe(2);
  });

  it('does nothing for non-consumables', () => {
    useGame.getState().addItem('mat_slime');
    const uid = useGame.getState().inventory.find((i) => i.itemId === 'mat_slime')!.uid;
    const before = useGame.getState().inventory.length;
    useGame.getState().useConsumable(uid);
    expect(useGame.getState().inventory.length).toBe(before);
  });
});

describe('combat helpers', () => {
  it('consumes mana only when sufficient', () => {
    expect(useGame.getState().useMana(30)).toBe(true);
    expect(useGame.getState().currentMana).toBe(30);
    expect(useGame.getState().useMana(50)).toBe(false);
    expect(useGame.getState().currentMana).toBe(30);
  });

  it('applies class passives to stats', () => {
    useGame.getState().chooseClass('warrior');
    expect(useGame.getState().getStats().health).toBe(Math.round(220 * 1.1));
    useGame.getState().chooseClass('ranger');
    expect(useGame.getState().getStats().critChance).toBeCloseTo(0.22 + 0.06, 5);
  });

  it('appends impacts', () => {
    useGame.getState().addImpact(1, 2, 3, '#fff');
    const impacts = useGame.getState().impacts;
    expect(impacts).toHaveLength(1);
    expect(impacts[0]).toMatchObject({ x: 1, y: 2, z: 3, color: '#fff' });
  });

  it('prunes impacts older than 400ms', () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    try {
      useGame.getState().addImpact(1, 2, 3, '#fff');
      expect(useGame.getState().impacts).toHaveLength(1);
      vi.advanceTimersByTime(500);
      useGame.getState().addImpact(4, 5, 6, '#000');
      const impacts = useGame.getState().impacts;
      expect(impacts).toHaveLength(1);
      expect(impacts[0].x).toBe(4);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('spawning', () => {
  it('ignores unknown monster ids', () => {
    useGame.getState().spawnMonster('does_not_exist', [0, 0, 0]);
    expect(useGame.getState().monsters).toEqual({});
  });

  it('spawns a monster with full state', () => {
    useGame.getState().spawnMonster('slime', [10, 0, -10]);
    const m = Object.values(useGame.getState().monsters)[0];
    expect(m.state).toBe('idle');
    expect(m.maxHealth).toBe(40);
    expect(m.health).toBe(40);
    expect(m.position).toEqual([10, 0, -10]);
    expect(m.isBoss).toBe(false);
  });
});

describe('chat', () => {
  it('trims messages, uses the player name and clears input', () => {
    const s = useGame.getState();
    s.setChatInput('hello there');
    s.sendChat('  hello there  ');
    const st = useGame.getState();
    expect(st.chatMessages[st.chatMessages.length - 1]).toMatchObject({ text: 'hello there', sender: 'Wanderer' });
    expect(st.chatInput).toBe('');
  });

  it('ignores blank messages', () => {
    const s = useGame.getState();
    s.sendChat('   ');
    expect(useGame.getState().chatMessages).toHaveLength(0);
  });
});
