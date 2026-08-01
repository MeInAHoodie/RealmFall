import { useRef, useEffect, useMemo } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { clampToWorld, getGroundHeight, sampleGround } from '@/game/world/terrainMath';
import { useGame } from '@/game/store';
import { CLASSES } from '@/game/data/classes';
import { MONSTERS, BOSSES } from '@/game/data/monsters';
import { castSkill } from '@/game/combat/skills';
import { emitPlayerPos } from '@/game/ui/HUD';

const KEY_MAP: Record<string, string> = {
  KeyW: 'forward', KeyS: 'back', KeyA: 'left', KeyD: 'right',
  ShiftLeft: 'sprint', Space: 'jump',
};

interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
}

export function PlayerController() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const input = useRef<InputState>({ forward: false, back: false, left: false, right: false, sprint: false, jump: false });
  const yaw = useRef(0);
  const pitch = useRef(0.35);
  const velocityY = useRef(0);
  const grounded = useRef(true);
  const onGround = useRef(0);
  const camDist = useRef(8);
  const camTarget = useRef(new THREE.Vector3());
  const camCurrent = useRef(new THREE.Vector3(0, 6, 10));
  const attackAnim = useRef(0);
  const hitAnim = useRef(0);
  const lastSkillSlot = useRef<string>('');
  const lastSkillEffect = useRef<string>('');
  const shake = useRef(0);
  const lastPlayerHitAt = useRef(0);

  const classId = useGame((s) => s.classId);
  const getStats = useGame((s) => s.getStats);
  const tickMonsters = useGame((s) => s.tickMonsters);
  const tickCooldowns = useGame((s) => s.tickCooldowns);
  const setRegion = useGame((s) => s.setRegion);
  const addFloatingDamage = useGame((s) => s.addFloatingDamage);
  const damageMonster = useGame((s) => s.damageMonster);
  const useMana = useGame((s) => s.useMana);
  const setSkillCooldown = useGame((s) => s.setSkillCooldown);
  const paused = useGame((s) => s.paused);
  const showInventory = useGame((s) => s.showInventory);

  const def = classId ? CLASSES[classId] : CLASSES.warrior;
  const skills = def.skills.filter((s) => !s.passive);
  const skillBySlot = useMemo(() => {
    const map: Record<string, typeof skills[number]> = {};
    for (const s of skills) map[s.slot] = s;
    return map;
  }, [skills]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code in KEY_MAP) {
        input.current[KEY_MAP[e.code] as keyof InputState] = true;
        e.preventDefault();
      }
      if (e.code === 'Space') {
        if (grounded.current) {
          velocityY.current = 6.5;
          grounded.current = false;
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code in KEY_MAP) {
        input.current[KEY_MAP[e.code] as keyof InputState] = false;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Mouse look (pointer lock)
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const onClick = () => {
      if (!document.pointerLockElement && !paused) canvas.requestPointerLock();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current -= e.movementX * 0.0024;
      pitch.current = THREE.MathUtils.clamp(pitch.current + e.movementY * 0.0024, 0.05, 1.2);
    };
    const onWheel = (e: WheelEvent) => {
      camDist.current = THREE.MathUtils.clamp(camDist.current + e.deltaY * 0.01, 4, 14);
    };
    canvas.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel);
    return () => {
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [paused]);

  // Cursor follows the inventory: free the pointer while it's open so the
  // cursor is visible and clickable, re-lock when it closes. If the browser
  // rejects the re-lock (no user gesture), the canvas click handler above is
  // the fallback.
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    if (showInventory) {
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (!paused && !document.pointerLockElement) {
      try {
        canvas.requestPointerLock();
      } catch {
        // Ignore: re-lock happens on the next canvas click.
      }
    }
  }, [showInventory, paused]);

  // Mouse attack
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (paused || document.pointerLockElement === null) return;
      if (e.button === 0) triggerSkill('basic');
      if (e.button === 2) triggerSkill('heavy');
    };
    const onKey = (e: KeyboardEvent) => {
      if (paused) return;
      if (e.code === 'KeyQ') triggerSkill('q');
      if (e.code === 'KeyE') triggerSkill('e');
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('contextmenu', prevent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, classId]);

  function triggerSkill(slot: string) {
    const skill = skillBySlot[slot];
    if (!skill) return;
    if ((useGame.getState().skillCooldowns[skill.id] ?? 0) > 0) return;
    if (skill.manaCost > 0) {
      const ok = useMana(skill.manaCost);
      if (!ok) return;
    }
    setSkillCooldown(skill.id, skill.cooldown);
    attackAnim.current = 0.35;
    lastSkillSlot.current = slot;
    lastSkillEffect.current = skill.effect ?? '';
    shake.current = Math.max(shake.current, 0.14);
    const stats = getStats();
    const isCrit = Math.random() < stats.critChance;
    const dmg = stats.damage * skill.damage * (isCrit ? 1.8 : 1);
    const origin = groupRef.current ? groupRef.current.position : new THREE.Vector3();
    castSkill(skill, origin, yaw.current, dmg, isCrit, damageMonster, addFloatingDamage, MONSTERS, BOSSES);
  }

  useFrame((state, dt) => {
    const grp = groupRef.current;
    const model = modelRef.current;
    if (!grp || !model) return;
    if (paused) return;

    const now = performance.now();
    const gs = useGame.getState();
    // Brief hit-stop for impact weight when landing or taking a hit.
    const hitStop = 70; // ms
    const effectiveDt = now - gs.lastMonsterHitAt < hitStop || now - gs.playerHitAt < hitStop ? dt * 0.25 : dt;
    // Hurt detection: react to damage events fired by the store.
    if (gs.playerHitAt !== lastPlayerHitAt.current) {
      lastPlayerHitAt.current = gs.playerHitAt;
      if (gs.playerHitAt > 0) {
        hitAnim.current = 1;
        shake.current = Math.max(shake.current, 0.42);
      }
    }

    const stats = getStats();
    const speed = stats.speed * (input.current.sprint ? 1.6 : 1) * (input.current.jump ? 1 : 1);
    const dir = new THREE.Vector3();
    if (input.current.forward) dir.z -= 1;
    if (input.current.back) dir.z += 1;
    if (input.current.left) dir.x -= 1;
    if (input.current.right) dir.x += 1;
    if (dir.lengthSq() > 0) dir.normalize();

    // Rotate movement by yaw
    const moveX = dir.x * Math.cos(yaw.current) + dir.z * Math.sin(yaw.current);
    const moveZ = -dir.x * Math.sin(yaw.current) + dir.z * Math.cos(yaw.current);
    const [nx, nz] = clampToWorld(grp.position.x + moveX * speed * effectiveDt, grp.position.z + moveZ * speed * effectiveDt);
    grp.position.x = nx;
    grp.position.z = nz;

    // Ground follow + jump
    const groundY = getGroundHeight(grp.position.x, grp.position.z);
    velocityY.current -= 18 * effectiveDt;
    grp.position.y += velocityY.current * effectiveDt;
    if (grp.position.y <= groundY) {
      grp.position.y = groundY;
      velocityY.current = 0;
      grounded.current = true;
    } else {
      grounded.current = false;
    }

    // Facing: rotate model toward movement or camera if attacking
    if (dir.lengthSq() > 0) {
      const targetRot = Math.atan2(moveX, moveZ);
      model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRot, 0.18);
    } else if (attackAnim.current > 0) {
      model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, yaw.current, 0.3);
    }

    // Attack/hit animation
    if (attackAnim.current > 0) {
      attackAnim.current = Math.max(0, attackAnim.current - effectiveDt);
      const t = 1 - attackAnim.current / 0.35;
      if (classId === 'warrior') model.rotation.z = Math.sin(t * Math.PI) * 0.6;
      else if (classId === 'mage') model.rotation.x = Math.sin(t * Math.PI) * 0.3;
      else model.rotation.x = Math.sin(t * Math.PI) * 0.5;
    } else {
      model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, 0, 0.2);
      model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, 0, 0.2);
    }
    // Hurt stagger: recoil lean + scale pulse
    if (hitAnim.current > 0) {
      hitAnim.current = Math.max(0, hitAnim.current - effectiveDt * 2.5);
      const t = hitAnim.current;
      model.rotation.z += Math.sin(t * Math.PI * 3) * 0.3 * t;
      model.rotation.x -= Math.sin(t * Math.PI * 2) * 0.14 * t;
      const p = 1 + t * 0.08;
      model.scale.set(p, p, p);
    } else {
      model.scale.set(1, 1, 1);
    }

    // Walk bob
    if (dir.lengthSq() > 0 && grounded.current) {
      onGround.current += effectiveDt * 10;
      model.position.y = Math.abs(Math.sin(onGround.current)) * 0.12;
    } else {
      model.position.y = THREE.MathUtils.lerp(model.position.y, 0, 0.2);
    }

    // Camera follow (smooth third-person)
    const camYaw = yaw.current;
    const camOffset = new THREE.Vector3(
      Math.sin(camYaw) * Math.cos(pitch.current) * camDist.current,
      Math.sin(pitch.current) * camDist.current + 2.2,
      Math.cos(camYaw) * Math.cos(pitch.current) * camDist.current
    );
    camTarget.current.set(grp.position.x, grp.position.y + 1.6, grp.position.z);
    camCurrent.current.lerp(camTarget.current.clone().add(camOffset), 0.12);
    camera.position.copy(camCurrent.current);
    camera.lookAt(grp.position.x, grp.position.y + 1.2, grp.position.z);
    // Camera shake (decays over real time so it recovers during hit-stop)
    if (shake.current > 0.001) {
      const s = shake.current;
      camera.position.x += (Math.random() - 0.5) * s * 0.55;
      camera.position.y += (Math.random() - 0.5) * s * 0.55;
      camera.rotation.z += (Math.random() - 0.5) * s * 0.06;
    }
    shake.current = Math.max(0, shake.current - dt * 3.2);

    // Game ticks
    tickCooldowns(effectiveDt);
    tickMonsters(effectiveDt, [grp.position.x, grp.position.y, grp.position.z], now);
    emitPlayerPos(grp.position.x, grp.position.z);

    // Region detection
    const r = regionFromPos(grp.position.x, grp.position.z);
    setRegion(r);

    // Water death floor safety
    if (grp.position.y < -3) {
      grp.position.set(0, getGroundHeight(0, 0), 0);
    }
  });

  return (
    <group ref={groupRef} position={[0, getGroundHeight(0, 0), 6]}>
      <group ref={modelRef}>
        <CharacterModel classId={def.id} primary={def.primaryColor} accent={def.accentColor} />
        <SlashArc attackAnim={attackAnim} lastSkillEffect={lastSkillEffect} color={def.accentColor} />
      </group>
    </group>
  );
}

// Visible crescent that sweeps in front of the player during melee attacks.
function SlashArc({ attackAnim, lastSkillEffect, color }: { attackAnim: MutableRefObject<number>; lastSkillEffect: MutableRefObject<string>; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = attackAnim.current;
    const melee = lastSkillEffect.current === 'slash' || lastSkillEffect.current === 'shield';
    const active = melee && t > 0;
    mesh.visible = active;
    if (!active) return;
    const p = 1 - t / 0.35;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.sin(Math.min(1, p * 1.5) * Math.PI) * 0.85;
    const s = 0.65 + p * 0.6;
    mesh.scale.set(s, s, s);
    mesh.rotation.z = p * 0.9;
  });

  return (
    <mesh ref={ref} position={[0, 1.3, 1.35]} rotation={[Math.PI * 0.33, 0, 0]} visible={false}>
      <torusGeometry args={[1.05, 0.07, 8, 28, Math.PI * 1.15]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function regionFromPos(x: number, z: number): string {
  return sampleGround(x, z).biome;
}

// ---- Character model ----
export function CharacterModel({ classId, primary, accent }: { classId: string; primary: string; accent: string }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.7, 4, 8]} />
        <meshStandardMaterial color={primary} flatShading roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshStandardMaterial color="#f0c9a0" flatShading roughness={0.8} />
      </mesh>
      {/* Face: two eyes mark the model's forward (+Z) direction */}
      <mesh position={[0.09, 1.77, 0.26]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
      </mesh>
      <mesh position={[-0.09, 1.77, 0.26]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
      </mesh>
      {/* Cape / accent */}
      <mesh position={[0, 1.0, -0.25]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.08]} />
        <meshStandardMaterial color={accent} flatShading roughness={0.8} />
      </mesh>
      {/* Class-specific weapon */}
      {classId === 'warrior' && (
        <group position={[0.45, 1.0, 0.2]} rotation={[0.4, 0, 0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 1.4, 0.18]} />
            <meshStandardMaterial color="#cfd6e0" flatShading metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.8, 0]} castShadow>
            <boxGeometry args={[0.18, 0.3, 0.3]} />
            <meshStandardMaterial color="#5b3a22" flatShading />
          </mesh>
        </group>
      )}
      {classId === 'mage' && (
        <group position={[0.45, 0.9, 0.1]} rotation={[0.2, 0, -0.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
            <meshStandardMaterial color="#5b3a22" flatShading />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <icosahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
      {classId === 'ranger' && (
        <group position={[0.4, 1.0, 0.1]} rotation={[0, 0, -0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.06, 1.4, 0.12]} />
            <meshStandardMaterial color="#5b3a22" flatShading />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.04, 0.6, 0.18]} />
            <meshStandardMaterial color="#cfd6e0" flatShading metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}
