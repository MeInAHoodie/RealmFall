import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { clampToWorld, getGroundHeight, sampleGround } from '@/game/world/terrain';
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

  const classId = useGame((s) => s.classId);
  const getStats = useGame((s) => s.getStats);
  const tickMonsters = useGame((s) => s.tickMonsters);
  const tickCooldowns = useGame((s) => s.tickCooldowns);
  const setRegion = useGame((s) => s.setRegion);
  const addFloatingDamage = useGame((s) => s.addFloatingDamage);
  const damageMonster = useGame((s) => s.damageMonster);
  const useMana = useGame((s) => s.useMana);
  const setSkillCooldown = useGame((s) => s.setSkillCooldown);
  const skillCooldowns = useGame((s) => s.skillCooldowns);
  const paused = useGame((s) => s.paused);

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
  }, [paused, skillCooldowns, classId]);

  function triggerSkill(slot: string) {
    const skill = skillBySlot[slot];
    if (!skill) return;
    if ((skillCooldowns[skill.id] ?? 0) > 0) return;
    if (skill.manaCost > 0) {
      const ok = useMana(skill.manaCost);
      if (!ok) return;
    }
    setSkillCooldown(skill.id, skill.cooldown);
    attackAnim.current = 0.35;
    lastSkillSlot.current = slot;
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
    const [nx, nz] = clampToWorld(grp.position.x + moveX * speed * dt, grp.position.z + moveZ * speed * dt);
    grp.position.x = nx;
    grp.position.z = nz;

    // Ground follow + jump
    const groundY = getGroundHeight(grp.position.x, grp.position.z);
    velocityY.current -= 18 * dt;
    grp.position.y += velocityY.current * dt;
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
      attackAnim.current = Math.max(0, attackAnim.current - dt);
      const t = 1 - attackAnim.current / 0.35;
      if (classId === 'warrior') model.rotation.z = Math.sin(t * Math.PI) * 0.6;
      else if (classId === 'mage') model.rotation.x = Math.sin(t * Math.PI) * 0.3;
      else model.rotation.x = Math.sin(t * Math.PI) * 0.5;
    } else {
      model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, 0, 0.2);
      model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, 0, 0.2);
    }
    if (hitAnim.current > 0) hitAnim.current = Math.max(0, hitAnim.current - dt);

    // Walk bob
    if (dir.lengthSq() > 0 && grounded.current) {
      onGround.current += dt * 10;
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

    // Game ticks
    tickCooldowns(dt);
    tickMonsters(dt, [grp.position.x, grp.position.y, grp.position.z], performance.now());
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
      </group>
    </group>
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
