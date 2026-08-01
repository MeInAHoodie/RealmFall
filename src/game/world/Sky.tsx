import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGame } from '@/game/store';

// Day-night cycle: worldTime 0..1 (0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk)
function sunPosition(t: number): THREE.Vector3 {
  const angle = t * Math.PI * 2 - Math.PI / 2;
  return new THREE.Vector3(Math.cos(angle) * 100, Math.sin(angle) * 100, 40);
}

function skyColors(t: number): { top: THREE.Color; bottom: THREE.Color; sun: THREE.Color; ambient: number; fog: THREE.Color } {
  const c = new THREE.Color();
  // Day
  const dayTop = new THREE.Color('#4a9fd6');
  const dayBot = new THREE.Color('#bfe3f0');
  const nightTop = new THREE.Color('#0a1226');
  const nightBot = new THREE.Color('#1a2440');
  const dawnTop = new THREE.Color('#3a4a8a');
  const dawnBot = new THREE.Color('#ff9a5a');

  const lerp = (a: THREE.Color, b: THREE.Color, k: number) => a.clone().lerp(b, THREE.MathUtils.clamp(k, 0, 1));

  let top: THREE.Color;
  let bot: THREE.Color;
  let sun: THREE.Color;
  let ambient: number;
  let fog: THREE.Color;

  if (t < 0.2 || t > 0.8) {
    // Night
    const k = t > 0.8 ? (t - 0.8) / 0.2 : (0.2 - t) / 0.2;
    top = lerp(nightTop, dawnTop, k * 0.5);
    bot = lerp(nightBot, dawnBot, k * 0.3);
    sun = new THREE.Color('#5577cc');
    ambient = 0.25 + k * 0.15;
    fog = lerp(new THREE.Color('#0a1226'), new THREE.Color('#2a3a6a'), k * 0.3);
  } else if (t < 0.35) {
    // Dawn -> day
    const k = (t - 0.2) / 0.15;
    top = lerp(dawnTop, dayTop, k);
    bot = lerp(dawnBot, dayBot, k);
    sun = lerp(new THREE.Color('#ff9a5a'), new THREE.Color('#fff6e0'), k);
    ambient = 0.4 + k * 0.5;
    fog = lerp(new THREE.Color('#2a3a6a'), new THREE.Color('#a8c8e0'), k);
  } else if (t < 0.65) {
    // Day
    top = dayTop;
    bot = dayBot;
    sun = new THREE.Color('#fff6e0');
    ambient = 0.9;
    fog = new THREE.Color('#a8c8e0');
  } else {
    // Day -> dusk -> night
    const k = (t - 0.65) / 0.15;
    top = lerp(dayTop, dawnTop, k);
    bot = lerp(dayBot, dawnBot, k);
    sun = lerp(new THREE.Color('#fff6e0'), new THREE.Color('#ff7a3a'), k);
    ambient = 0.9 - k * 0.5;
    fog = lerp(new THREE.Color('#a8c8e0'), new THREE.Color('#3a3a5a'), k);
  }
  void c;
  return { top, bottom: bot, sun, ambient, fog };
}

export function Sky() {
  const { scene } = useThree();
  const worldTime = useGame((s) => s.worldTime);
  const setWorldTime = useGame((s) => s.setWorldTime);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const moonRef = useRef<THREE.DirectionalLight>(null);

  // Advance time
  useFrame((_, dt) => {
    const t = (useGame.getState().worldTime + dt / 180) % 1; // 3 min day cycle
    setWorldTime(t);
  });

  const colors = useMemo(() => skyColors(worldTime), [worldTime]);

  useFrame(() => {
    const t = useGame.getState().worldTime;
    const c = skyColors(t);
    const sun = sunPosition(t);
    if (sunRef.current) {
      sunRef.current.position.copy(sun);
      sunRef.current.color.copy(c.sun);
      sunRef.current.intensity = Math.max(0.05, Math.sin(t * Math.PI) * 1.2);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = c.ambient;
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(c.top);
      hemiRef.current.groundColor.copy(c.bottom);
    }
    if (moonRef.current) {
      moonRef.current.position.copy(sun.clone().multiplyScalar(-1));
      moonRef.current.intensity = t < 0.2 || t > 0.8 ? 0.4 : 0;
    }
    scene.background = c.top.clone().lerp(c.bottom, 0.3);
    if (scene.fog) {
      (scene.fog as THREE.Fog).color.copy(c.fog);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} intensity={0.6} groundColor="#3a4a2a" />
      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={1.2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0005}
      />
      <directionalLight ref={moonRef} intensity={0} color="#8fb4ff" />
    </>
  );
}

// ---- Stars (visible at night) ----
export function Stars() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(Math.random() * 0.5 + 0.5);
      const r = 150;
      positions[i * 3] = Math.sin(theta) * Math.cos(phi) * r;
      positions[i * 3 + 1] = Math.cos(theta) * r;
      positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(() => {
    const t = useGame.getState().worldTime;
    const mat = ref.current?.material as THREE.PointsMaterial;
    if (mat) {
      const visible = t < 0.25 || t > 0.75;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, visible ? 0.9 : 0, 0.05);
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.7} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
  );
}

// ---- Clouds ----
export function Clouds() {
  const ref = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const out: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 14; i++) {
      out.push({
        pos: [(Math.random() - 0.5) * 240, 30 + Math.random() * 15, (Math.random() - 0.5) * 240],
        scale: 6 + Math.random() * 8,
      });
    }
    return out;
  }, []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.position.x += dt * 0.6;
  });
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={c.pos} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} flatShading roughness={1} />
          </mesh>
          <mesh position={[0.8, 0.2, 0]}>
            <sphereGeometry args={[0.7, 8, 6]} />
            <meshStandardMaterial color="#f0f0f0" transparent opacity={0.6} flatShading roughness={1} />
          </mesh>
          <mesh position={[-0.7, 0.1, 0.2]}>
            <sphereGeometry args={[0.6, 8, 6]} />
            <meshStandardMaterial color="#f5f5f5" transparent opacity={0.6} flatShading roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---- Weather particles ----
export function Weather() {
  const weather = useGame((s) => s.weather);
  const ref = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.PointsMaterial;
    const w = useGame.getState().weather;
    mat.visible = w !== 'clear';
    if (w === 'snow') {
      mat.color.set('#ffffff');
      mat.size = 0.2;
    } else if (w === 'fog') {
      mat.color.set('#cccccc');
      mat.size = 0.15;
    } else {
      mat.color.set('#88aacc');
      mat.size = 0.12;
    }
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const fall = w === 'snow' ? 3 : w === 'fog' ? 0.5 : 22;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= fall * dt;
      if (arr[i + 1] < 0) arr[i + 1] = 40;
    }
    pos.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} visible={weather !== 'clear'}><pointsMaterial size={0.12} transparent opacity={0.6} /></points>;
}
