import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { bindMonsterSource, castSkill, updateProjectiles } from './skills';
import { MONSTERS, BOSSES } from '../data/monsters';
import type { SkillDef } from '../types';

const fireSkill: SkillDef = {
  id: 'm_fire',
  name: 'Fire Bolt',
  classId: 'mage',
  slot: 'basic',
  cooldown: 0.55,
  range: 18,
  damage: 1.0,
  manaCost: 0,
  effect: 'fire',
  desc: 'test skill',
};

function makeMonsters() {
  return {
    front: { id: 'front', defId: 'slime', position: [0, 0, -5] as [number, number, number], state: 'idle', scale: 0.7, isBoss: false },
    back: { id: 'back', defId: 'slime', position: [0, 0, 5] as [number, number, number], state: 'idle', scale: 0.7, isBoss: false },
  };
}

type DamageMonsterFn = (id: string, amount: number, crit: boolean) => void;
type FloatingDamageFn = (text: string, x: number, y: number, z: number, color: string, crit: boolean) => void;

// Advances projectiles until they have traveled far enough to hit (or miss).
function tickProjectiles(damageMonster: DamageMonsterFn, addFloat: FloatingDamageFn) {
  for (let i = 0; i < 6; i++) {
    updateProjectiles(0.1, damageMonster, addFloat);
  }
}

beforeEach(() => {
  bindMonsterSource(() => makeMonsters());
});

describe('castSkill aim direction', () => {
  it('fires projectiles toward where the player faces (yaw=0 => -Z)', () => {
    const damageMonster: DamageMonsterFn = vi.fn();
    const addFloat: FloatingDamageFn = vi.fn();
    castSkill(fireSkill, new THREE.Vector3(0, 0, 0), 0, 50, false, damageMonster, addFloat, MONSTERS, BOSSES);
    tickProjectiles(damageMonster, addFloat);
    expect(damageMonster).toHaveBeenCalledWith('front', 50, false);
    expect(damageMonster).not.toHaveBeenCalledWith('back', 50, false);
  });

  it('fires projectiles behind when the player turns 180 degrees', () => {
    const damageMonster: DamageMonsterFn = vi.fn();
    const addFloat: FloatingDamageFn = vi.fn();
    castSkill(fireSkill, new THREE.Vector3(0, 0, 0), Math.PI, 50, false, damageMonster, addFloat, MONSTERS, BOSSES);
    tickProjectiles(damageMonster, addFloat);
    expect(damageMonster).toHaveBeenCalledWith('back', 50, false);
    expect(damageMonster).not.toHaveBeenCalledWith('front', 50, false);
  });
});
