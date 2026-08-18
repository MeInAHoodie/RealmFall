import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame, type MonsterInstance } from '@/game/store';
import { MONSTERS, BOSSES, SPAWN_GROUPS } from '@/game/data/monsters';
import { getGroundHeight } from '@/game/world/terrain';
import { bindMonsterSource, updateProjectiles, getProjectiles } from '@/game/combat/skills';

export function MonsterManager() {
  const monsters = useGame((s) => s.monsters);
  const spawnMonster = useGame((s) => s.spawnMonster);
  const damageMonster = useGame((s) => s.damageMonster);
  const addFloatingDamage = useGame((s) => s.addFloatingDamage);

  // Bind the monster source for the combat system once
  useEffect(() => {
    bindMonsterSource(() => useGame.getState().monsters);
  }, []);

  // Spawn all monsters on mount
  useEffect(() => {
    const existing = Object.keys(useGame.getState().monsters).length;
    if (existing === 0) {
      for (const spawn of SPAWN_GROUPS) {
        const isBoss = !!spawn.isBoss;
        const y = getGroundHeight(spawn.position[0], spawn.position[2]);
        spawnMonster(spawn.monsterId, [spawn.position[0], y, spawn.position[2]], isBoss);
      }
    }
  }, [spawnMonster]);

  useFrame((_, dt) => {
    updateProjectiles(dt, damageMonster, addFloatingDamage);
  });

  return (
    <group>
      {Object.values(monsters).map((m) => (
        <MonsterView key={m.id} m={m} />
      ))}
      <Projectiles />
    </group>
  );
}

function MonsterView({ m }: { m: MonsterInstance }) {
  const ref = useRef<THREE.Group>(null);
  const bobRef = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const grp = ref.current;
    if (!grp) return;
    // Smooth move toward stored position
    grp.position.x = THREE.MathUtils.lerp(grp.position.x, m.position[0], 0.25);
    grp.position.z = THREE.MathUtils.lerp(grp.position.z, m.position[2], 0.25);
    const gy = getGroundHeight(m.position[0], m.position[2]);
    grp.position.y = THREE.MathUtils.lerp(grp.position.y, m.state === 'dead' ? gy - 0.4 : gy, 0.2);

    // Face target or movement
    if (m.state === 'chase' || m.state === 'attack') {
      // face the local player — approximate by direction of next position
    }
    if (bobRef.current) {
      if (m.state !== 'dead') {
        bobRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 4 + m.position[0])) * 0.1 * m.scale;
      } else {
        bobRef.current.rotation.z = THREE.MathUtils.lerp(bobRef.current.rotation.z, Math.PI / 2, 0.08);
      }
    }
  });

  const def = MONSTERS[m.defId] || BOSSES[m.defId];
  const dead = m.state === 'dead';

  return (
    <group ref={ref} position={m.position}>
      <group ref={bobRef} scale={m.scale}>
        <MonsterShape kind={def?.kind ?? 'slime'} color={m.color} hitFlash={m.hitFlash} dead={dead} />
      </group>
      {/* Health bar */}
      {!dead && <HealthBar health={m.health} maxHealth={m.maxHealth} isBoss={m.isBoss} name={m.name} level={m.level} />}
    </group>
  );
}

function HealthBar({ health, maxHealth, isBoss, name, level }: { health: number; maxHealth: number; isBoss: boolean; name: string; level: number }) {
  const pct = Math.max(0, health / maxHealth);
  const y = isBoss ? 3.2 : 1.8;
  return (
    <group position={[0, y / (isBoss ? 1.5 : 1), 0]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.2, 0.16]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-(1.2 / 2) + (1.2 * pct) / 2, 0, 0.01]} scale={[pct, 1, 1]}>
        <planeGeometry args={[1.2, 0.12]} />
        <meshBasicMaterial color={isBoss ? '#ff4d4d' : pct > 0.5 ? '#6ba84f' : pct > 0.25 ? '#e6b85c' : '#ff5a5a'} />
      </mesh>
      {/* Name tag via sprite-less text — rendered in HUD overlay instead for clarity */}
      {isBoss && (
        <mesh position={[0, 0.3, 0]}>
          <planeGeometry args={[2.2, 0.28]} />
          <meshBasicMaterial color="#2a0a0a" transparent opacity={0.7} />
        </mesh>
      )}
      {/* Level indicator dot */}
      <mesh position={[0.7, 0, 0.02]}>
        <circleGeometry args={[0.12, 8]} />
        <meshBasicMaterial color="#f5d68a" />
      </mesh>
      {isBoss && (
        <TextSprite text={`${name} Lv.${level}`} color="#ff8888" position={[0, 0.3, 0.03]} width={2.4} />
      )}
    </group>
  );
}

// Minimal sprite text using canvas texture
const textCache = new Map<string, THREE.Texture>();
function makeTextTexture(text: string, color: string): THREE.Texture {
  const key = `${text}|${color}`;
  const cached = textCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.font = 'bold 36px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 32);
  const tex = new THREE.CanvasTexture(canvas);
  textCache.set(key, tex);
  return tex;
}

function TextSprite({ text, color, position, width = 1.5 }: { text: string; color: string; position: [number, number, number]; width?: number }) {
  const tex = useMemo(() => makeTextTexture(text, color), [text, color]);
  return (
    <sprite position={position} scale={[width, width * 0.125, 1]}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  );
}

function MonsterShape({ kind, color, hitFlash, dead }: { kind: string; color: string; hitFlash: number; dead: boolean }) {
  const flashColor = hitFlash > 0.05 ? '#ffffff' : color;
  const matProps = { color: flashColor, flatShading: true, roughness: 0.85, emissive: hitFlash > 0.05 ? '#ffaaaa' : '#000000', emissiveIntensity: hitFlash > 0.05 ? 0.6 : 0, transparent: dead, opacity: dead ? 0.4 : 1 };

  switch (kind) {
    case 'slime':
      return (
        <group>
          <mesh position={[0, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.2, 0.6, 0.5]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.2, 0.6, 0.5]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </group>
      );
    case 'wolf':
      return (
        <group>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.5, 0.6, 1.1]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.7, -0.7]} castShadow>
            <boxGeometry args={[0.4, 0.5, 0.5]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* ears */}
          <mesh position={[0.15, 1.0, -0.7]} castShadow>
            <coneGeometry args={[0.1, 0.3, 4]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-0.15, 1.0, -0.7]} castShadow>
            <coneGeometry args={[0.1, 0.3, 4]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* legs */}
          {[[0.2, 0.3, 0.3], [-0.2, 0.3, 0.3], [0.2, 0.3, -0.3], [-0.2, 0.3, -0.3]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow>
              <boxGeometry args={[0.15, 0.6, 0.15]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          ))}
          {/* tail */}
          <mesh position={[0, 0.8, 0.7]} rotation={[0.6, 0, 0]} castShadow>
            <coneGeometry args={[0.12, 0.5, 4]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    case 'goblin':
    case 'bandit':
    case 'orc':
      return (
        <group>
          <mesh position={[0, 0.8, 0]} castShadow>
            <capsuleGeometry args={[0.3, 0.5, 4, 8]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <sphereGeometry args={[0.28, 8, 8]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {kind === 'orc' && (
            <mesh position={[0, 1.55, 0.25]} castShadow>
              <coneGeometry args={[0.08, 0.2, 4]} />
              <meshBasicMaterial color="#e8e4d3" />
            </mesh>
          )}
          <mesh position={[0.4, 0.9, 0.1]} rotation={[0.3, 0, 0.3]} castShadow>
            <boxGeometry args={[0.1, kind === 'orc' ? 1.0 : 0.7, 0.05]} />
            <meshStandardMaterial color="#cfd6e0" flatShading metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      );
    case 'skeleton':
      return (
        <group>
          <mesh position={[0, 0.8, 0]} castShadow>
            <capsuleGeometry args={[0.25, 0.5, 4, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 1.35, 0]} castShadow>
            <sphereGeometry args={[0.26, 8, 8]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.1, 1.4, 0.22]}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[-0.1, 1.4, 0.22]}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[0.4, 1.0, 0.1]} rotation={[0.4, 0, 0.3]} castShadow>
            <boxGeometry args={[0.08, 1.2, 0.05]} />
            <meshStandardMaterial color="#cfd6e0" flatShading metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      );
    case 'spider':
      return (
        <group>
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.4, 0.4, Math.sin(a) * 0.4]} rotation={[0, -a, 0.5]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.8, 4]} />
                <meshStandardMaterial {...matProps} />
              </mesh>
            );
          })}
        </group>
      );
    case 'golem':
      return (
        <group>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[1.0, 1.4, 0.8]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <boxGeometry args={[0.7, 0.6, 0.6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.6, 1.2, 0]} castShadow>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-0.6, 1.2, 0]} castShadow>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      );
    case 'spirit':
      return (
        <group>
          <mesh position={[0, 1.0, 0]} castShadow>
            <icosahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial {...matProps} transparent opacity={dead ? 0.2 : 0.7} emissive={color} emissiveIntensity={0.4} />
          </mesh>
          <pointLight position={[0, 1, 0]} color={color} intensity={1.5} distance={5} />
        </group>
      );
    case 'dragon':
    case 'boss':
      return (
        <group>
          <mesh position={[0, 1.4, 0]} castShadow>
            <dodecahedronGeometry args={[1.0, 0]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 2.4, -0.6]} castShadow>
            <coneGeometry args={[0.5, 1.0, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Wings */}
          <mesh position={[1.2, 1.6, 0]} rotation={[0, 0, -0.3]} castShadow>
            <boxGeometry args={[1.6, 0.1, 1.0]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-1.2, 1.6, 0]} rotation={[0, 0, 0.3]} castShadow>
            <boxGeometry args={[1.6, 0.1, 1.0]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <pointLight position={[0, 1.5, 0.5]} color={color} intensity={2} distance={8} />
        </group>
      );
    default:
      return (
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.8, 1.2, 0.8]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      );
  }
}

// ---- Projectiles ----
function Projectiles() {
  const groupRef = useRef<THREE.Group>(null);
  const meshes = useRef<Map<string, THREE.Mesh>>(new Map());

  useFrame(() => {
    const grp = groupRef.current;
    if (!grp) return;
    const projs = getProjectiles();
    const seen = new Set<string>();
    for (const p of projs) {
      seen.add(p.id);
      let mesh = meshes.current.get(p.id);
      if (!mesh) {
        mesh = createProjectileMesh(p.effect);
        grp.add(mesh);
        meshes.current.set(p.id, mesh);
      }
      mesh.position.copy(p.position);
      mesh.lookAt(p.position.clone().add(p.direction));
    }
    // Remove stale
    for (const [id, mesh] of meshes.current) {
      if (!seen.has(id)) {
        grp.remove(mesh);
        meshes.current.delete(id);
      }
    }
  });

  return <group ref={groupRef} />;
}

function createProjectileMesh(effect: string): THREE.Mesh {
  let geo: THREE.BufferGeometry;
  let color: string;
  switch (effect) {
    case 'fire':
      geo = new THREE.SphereGeometry(0.22, 8, 6);
      color = '#ff6a1a';
      break;
    case 'ice':
      geo = new THREE.OctahedronGeometry(0.25, 0);
      color = '#8fe3ff';
      break;
    case 'arrow':
    case 'pierce':
      geo = new THREE.ConeGeometry(0.08, 0.6, 6);
      color = '#f5d68a';
      break;
    default:
      geo = new THREE.SphereGeometry(0.2, 6, 6);
      color = '#ffffff';
  }
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}
