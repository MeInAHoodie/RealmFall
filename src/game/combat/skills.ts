import type { SkillDef } from '../types';
import type { MonsterDef } from '../types';
import * as THREE from 'three';

type DamageMonsterFn = (id: string, amount: number, crit: boolean) => void;
type FloatingDamageFn = (text: string, x: number, y: number, z: number, color: string, crit: boolean) => void;

interface ActiveProjectile {
  id: string;
  skillId: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  crit: boolean;
  effect: string;
  life: number;
  range: number;
  traveled: number;
  pierce: boolean;
  hitSet: Set<string>;
}

const projectiles: ActiveProjectile[] = [];
let projId = 0;

const MONSTER_REGISTRY: Record<string, MonsterDef> = {};

// Monster instances are read from the store at cast time via a getter.
let getMonstersFn: (() => Record<string, { id: string; defId: string; position: [number, number, number]; state: string; scale: number; isBoss: boolean }>) | null = null;

export function bindMonsterSource(fn: () => Record<string, any>) {
  getMonstersFn = fn;
}

export function registerMonsterDef(def: MonsterDef) {
  MONSTER_REGISTRY[def.id] = def;
}

export function updateProjectiles(dt: number, damageMonster: DamageMonsterFn, addFloat: FloatingDamageFn) {
  if (!getMonstersFn) return;
  const monsters = getMonstersFn();
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const step = p.speed * dt;
    p.position.addScaledVector(p.direction, step);
    p.traveled += step;
    p.life -= dt;

    // Hit detection
    for (const [mid, m] of Object.entries(monsters)) {
      if (m.state === 'dead') continue;
      if (p.hitSet.has(mid)) continue;
      const dx = m.position[0] - p.position.x;
      const dy = m.position[1] + m.scale * 0.8 - p.position.y;
      const dz = m.position[2] - p.position.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < m.scale * 0.9 + 0.4) {
        damageMonster(mid, p.damage, p.crit);
        p.hitSet.add(mid);
        if (!p.pierce) {
          projectiles.splice(i, 1);
          break;
        }
      }
    }

    if (p.traveled > p.range || p.life <= 0) {
      projectiles.splice(i, 1);
    }
  }
}

export function getProjectiles() {
  return projectiles;
}

function spawnProjectile(
  origin: THREE.Vector3,
  yaw: number,
  skill: SkillDef,
  damage: number,
  crit: boolean,
  effect: string,
  opts: { pierce?: boolean; speed?: number; yOffset?: number; arc?: number } = {}
) {
  const dir = new THREE.Vector3(-Math.sin(yaw), opts.arc ?? 0, -Math.cos(yaw)).normalize();
  const pos = new THREE.Vector3(origin.x, origin.y + (opts.yOffset ?? 1.2), origin.z);
  projectiles.push({
    id: `proj_${++projId}`,
    skillId: skill.id,
    position: pos,
    direction: dir,
    speed: opts.speed ?? 28,
    damage,
    crit,
    effect,
    life: 2.5,
    range: skill.range,
    traveled: 0,
    pierce: opts.pierce ?? false,
    hitSet: new Set(),
  });
}

export function castSkill(
  skill: SkillDef,
  origin: THREE.Vector3,
  yaw: number,
  damage: number,
  crit: boolean,
  damageMonster: DamageMonsterFn,
  addFloat: FloatingDamageFn,
  monsterDefs: Record<string, MonsterDef>,
  bossDefs: Record<string, MonsterDef>
) {
  void addFloat;
  for (const d of Object.values(monsterDefs)) registerMonsterDef(d);
  for (const d of Object.values(bossDefs)) registerMonsterDef(d);

  switch (skill.effect) {
    case 'slash':
    case 'shield': {
      // Melee arc hit — instantly damage nearby enemies in front
      if (!getMonstersFn) return;
      const monsters = getMonstersFn();
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      for (const [mid, m] of Object.entries(monsters)) {
        if (m.state === 'dead') continue;
        const dx = m.position[0] - origin.x;
        const dz = m.position[2] - origin.z;
        const dist = Math.hypot(dx, dz);
        if (dist > skill.range) continue;
        const dot = (dx / dist) * forward.x + (dz / dist) * forward.z;
        if (dot > 0.3 || dist < 2) {
          damageMonster(mid, damage, crit);
        }
      }
      break;
    }
    case 'fire':
    case 'ice':
    case 'arrow':
    case 'pierce': {
      const isPierce = skill.effect === 'pierce' || skill.id === 'r_heavy';
      spawnProjectile(origin, yaw, skill, damage, crit, skill.effect, { pierce: isPierce, speed: skill.effect === 'arrow' || skill.effect === 'pierce' ? 36 : 26 });
      break;
    }
    default:
      break;
  }
}
