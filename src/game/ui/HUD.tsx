import { useGame } from '@/game/store';
import { CLASSES } from '@/game/data/classes';
import { REGIONS } from '@/game/data/items';
import { xpProgress } from '@/game/data/progression';
import { Heart, Droplet, Star, Crosshair, Map as MapIcon, Compass } from 'lucide-react';
import type { SkillDef, ClassId } from '@/game/types';

const CLASS_ICONS: Record<ClassId, typeof Heart> = {
  warrior: Heart,
  mage: Droplet,
  ranger: Crosshair,
};

const SLOT_KEYS: Record<string, string> = {
  basic: 'LMB',
  heavy: 'RMB',
  q: 'Q',
  e: 'E',
  r: 'R',
};

export function HUD() {
  const classId = useGame((s) => s.classId);
  const level = useGame((s) => s.level);
  const xp = useGame((s) => s.xp);
  const currentHealth = useGame((s) => s.currentHealth);
  const currentMana = useGame((s) => s.currentMana);
  const getStats = useGame((s) => s.getStats);
  const playerName = useGame((s) => s.playerName);
  const region = useGame((s) => s.region);
  const skillCooldowns = useGame((s) => s.skillCooldowns);

  if (!classId) return null;
  const def = CLASSES[classId];
  const stats = getStats();
  const xpInfo = xpProgress(xp, level);
  const Icon = CLASS_ICONS[classId];
  const regionDef = REGIONS.find((r) => r.id === region);
  const skills = def.skills.filter((s) => !s.passive);

  return (
    <>
      {/* Top Left — Player Portrait + Bars */}
      <div className="absolute top-4 left-4 z-30 w-72 animate-fade-in">
        <div className="panel p-3">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${def.primaryColor}22`, border: `1px solid ${def.primaryColor}66` }}>
              <Icon className="w-7 h-7" style={{ color: def.primaryColor }} />
              <div className="absolute -bottom-1.5 -right-1.5 bg-ink-900 border border-gold-500/50 rounded-md px-1.5 py-0.5 text-gold-400 text-xs font-display font-bold">
                {level}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{playerName}</div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: def.primaryColor }}>{def.name}</div>
              <div className="mt-1.5 space-y-1">
                <Bar value={currentHealth} max={stats.health} color="#ff5a5a" icon={Heart} />
                <Bar value={currentMana} max={stats.mana} color="#49c2ff" icon={Droplet} />
                <Bar value={xpInfo.current} max={xpInfo.needed} color="#f5d68a" icon={Star} thin />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Right — Minimap + Region */}
      <div className="absolute top-4 right-4 z-30 animate-fade-in">
        <div className="panel p-3 w-56">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-gold-400" />
              <span className="hud-label">{regionDef?.name ?? 'Unknown'}</span>
            </div>
            <span className="text-[10px] text-white/40">Lv. {regionDef?.recommendedLevel ?? '?'}</span>
          </div>
          <MiniMap />
          <div className="flex items-center justify-between mt-2 text-[10px] text-white/40">
            <span className="flex items-center gap-1"><MapIcon className="w-3 h-3" /> Press M</span>
            <span>N — Day</span>
          </div>
        </div>
      </div>

      {/* Bottom Center — Skill Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-rise-in">
        <div className="panel px-3 py-2 flex items-center gap-2">
          {skills.map((skill) => (
            <SkillSlot key={skill.id} skill={skill} cooldown={skillCooldowns[skill.id] ?? 0} primaryColor={def.primaryColor} />
          ))}
        </div>
      </div>

      {/* Bottom Right — Menu Buttons */}
      <BottomMenu />
    </>
  );
}

function Bar({ value, max, color, icon: Icon, thin }: { value: number; max: number; color: string; icon: typeof Heart; thin?: boolean }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className={`relative ${thin ? 'h-2' : 'h-3.5'} bg-ink-900/80 rounded-sm overflow-hidden border border-white/5`}>
      <div className="bar-fill h-full rounded-sm" style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
      {!thin && (
        <div className="absolute inset-0 flex items-center justify-between px-1.5 text-[9px] text-white/90 font-medium">
          <span className="flex items-center gap-0.5"><Icon className="w-2.5 h-2.5" />{Math.ceil(value)}</span>
          <span>{Math.ceil(max)}</span>
        </div>
      )}
    </div>
  );
}

function SkillSlot({ skill, cooldown, primaryColor }: { skill: SkillDef; cooldown: number; primaryColor: string }) {
  const key = SLOT_KEYS[skill.slot] ?? skill.slot.toUpperCase();
  const onCd = cooldown > 0;
  const pct = onCd ? cooldown / skill.cooldown : 0;
  return (
    <div className="relative w-12 h-12 rounded-md flex items-center justify-center group"
      style={{
        background: onCd ? '#1a1a1a' : `${primaryColor}1a`,
        border: `1px solid ${onCd ? '#333' : `${primaryColor}55`}`,
      }}>
      <SkillIcon effect={skill.effect} color={onCd ? '#555' : primaryColor} />
      {onCd && (
        <div className="absolute inset-0 rounded-md overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-black/60" style={{ height: `${pct * 100}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{cooldown.toFixed(1)}</div>
        </div>
      )}
      <div className="absolute -bottom-4 text-[9px] text-white/50 font-display tracking-wider">{key}</div>
      {skill.manaCost > 0 && (
        <div className="absolute -top-1 -right-1 text-[8px] text-frost-400 bg-ink-900 rounded px-1 border border-frost-500/30">{skill.manaCost}</div>
      )}
      {/* Tooltip */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 panel px-3 py-2 w-44 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-left z-40">
        <div className="text-white text-xs font-medium mb-0.5">{skill.name}</div>
        <div className="text-white/45 text-[10px] leading-snug">{skill.desc}</div>
        <div className="flex items-center gap-2 mt-1 text-[9px] text-white/50">
          <span>CD {skill.cooldown}s</span>
          {skill.manaCost > 0 && <span>MP {skill.manaCost}</span>}
        </div>
      </div>
    </div>
  );
}

function SkillIcon({ effect, color }: { effect?: string; color: string }) {
  // Simple stylized glyphs
  const common = 'w-6 h-6';
  switch (effect) {
    case 'slash': return <Crosshair className={common} style={{ color, transform: 'rotate(45deg)' }} />;
    case 'fire': return <span className="text-lg" style={{ color }}>🔥</span>;
    case 'ice': return <span className="text-lg" style={{ color }}>❄</span>;
    case 'arrow': return <Crosshair className={common} style={{ color }} />;
    case 'pierce': return <Crosshair className={common} style={{ color, transform: 'rotate(90deg)' }} />;
    case 'shield': return <span className="text-lg" style={{ color }}>🛡</span>;
    default: return <Crosshair className={common} style={{ color }} />;
  }
}

import { Backpack, User, Settings, MessageSquare, ScrollText, X, Package } from 'lucide-react';

function BottomMenu() {
  const showInventory = useGame((s) => s.showInventory);
  const toggleInventory = useGame((s) => s.toggleInventory);
  const showMap = useGame((s) => s.showMap);
  const toggleMap = useGame((s) => s.toggleMap);
  const showChat = useGame((s) => s.showChat);
  const toggleChat = useGame((s) => s.toggleChat);
  return (
    <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2 animate-fade-in">
      <MenuBtn icon={Backpack} label="Inventory" hotkey="I" active={showInventory} onClick={toggleInventory} />
      <MenuBtn icon={MessageSquare} label="Chat" hotkey="Enter" active={showChat} onClick={toggleChat} />
      <MenuBtn icon={MapIcon} label="World Map" hotkey="M" active={showMap} onClick={toggleMap} />
    </div>
  );
}

function MenuBtn({ icon: Icon, label, hotkey, active, onClick }: { icon: typeof Package; label: string; hotkey: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`panel px-3 py-2 flex items-center gap-2 group transition-all ${active ? 'ring-1 ring-gold-500/50' : 'hover:bg-white/5'}`}>
      <Icon className={`w-4 h-4 ${active ? 'text-gold-400' : 'text-white/60'}`} />
      <span className={`text-xs ${active ? 'text-gold-400' : 'text-white/60'}`}>{label}</span>
      <span className="text-[9px] text-white/30 border border-white/10 rounded px-1 ml-1">{hotkey}</span>
    </button>
  );
}

// ---- Minimap ----
import { useRef, useEffect } from 'react';
import { BIOMES, sampleGround } from '@/game/world/terrainMath';
import { SPAWN_GROUPS } from '@/game/data/monsters';

function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerPosRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    let raf = 0;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(render); return; }
      const ctx = canvas.getContext('2d')!;
      const W = canvas.width;
      const H = canvas.height;
      const scale = W / 220; // world 220 -> minimap
      const cx = W / 2;
      const cy = H / 2;

      // Read player position from the DOM group (we'll track via store-less approach)
      // Use the group's world position through a module-level ref set by the controller
      const [px, pz] = playerPosRef.current;

      ctx.fillStyle = '#0a0e16';
      ctx.fillRect(0, 0, W, H);

      // Draw biome regions
      for (const b of BIOMES) {
        ctx.fillStyle = `rgba(${b.color[0] * 255 | 0}, ${b.color[1] * 255 | 0}, ${b.color[2] * 255 | 0}, 0.5)`;
        ctx.beginPath();
        ctx.arc(cx + b.cx * scale - px * scale, cy + b.cz * scale - pz * scale, b.radius * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw monster dots
      const monsters = useGame.getState().monsters;
      for (const m of Object.values(monsters)) {
        if (m.state === 'dead') continue;
        const x = cx + m.position[0] * scale - px * scale;
        const y = cy + m.position[2] * scale - pz * scale;
        if (x < 0 || x > W || y < 0 || y > H) continue;
        ctx.fillStyle = m.isBoss ? '#ff4d4d' : '#ff8a5a';
        ctx.fillRect(x - 1, y - 1, m.isBoss ? 3 : 2, m.isBoss ? 3 : 2);
      }

      // Draw player (center)
      ctx.fillStyle = '#f5d68a';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Frame
      ctx.strokeStyle = 'rgba(245,214,138,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // Subscribe to player position via a custom event
    const onPos = (e: Event) => {
      const ce = e as CustomEvent<[number, number]>;
      playerPosRef.current = ce.detail;
    };
    window.addEventListener('realmfall:playerpos', onPos as EventListener);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('realmfall:playerpos', onPos as EventListener);
    };
  }, []);

  return <canvas ref={canvasRef} width={192} height={144} className="rounded-md w-full" />;
}

export function emitPlayerPos(x: number, z: number) {
  window.dispatchEvent(new CustomEvent('realmfall:playerpos', { detail: [x, z] }));
}
