import { useGame } from '@/game/store';
import { REGIONS } from '@/game/data/items';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, ChevronUp, Skull, Coins } from 'lucide-react';
import * as THREE from 'three';

// ---- Floating damage numbers (screen-space, projected from world) ----
export function FloatingDamageLayer() {
  const floatingDamage = useGame((s) => s.floatingDamage);
  const [, force] = useState(0);
  const rafRef = useRef(0);

  // Re-render at animation fps to keep projection fresh
  useEffect(() => {
    const loop = () => { force((n) => n + 1); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {floatingDamage.map((d) => {
        // Use stored screen projection if available, else approximate center
        const screen = projectWorld(d.x, d.y, d.z);
        if (!screen) return null;
        return (
          <div key={d.id} className="absolute dmg-float font-display font-bold"
            style={{
              left: `${screen.x}px`,
              top: `${screen.y}px`,
              color: d.color,
              fontSize: d.crit ? '32px' : '20px',
              textShadow: '0 2px 6px rgba(0,0,0,0.8)',
              transform: 'translate(-50%, 0)',
            }}>
            {d.crit ? `${d.text}!` : d.text}
          </div>
        );
      })}
    </div>
  );
}

// Bridge: the canvas component emits screen-projected positions for damage numbers.
let projectFn: ((x: number, y: number, z: number) => { x: number; y: number } | null) | null = null;
export function bindProjector(fn: (x: number, y: number, z: number) => { x: number; y: number } | null) {
  projectFn = fn;
}
function projectWorld(x: number, y: number, z: number) {
  return projectFn ? projectFn(x, y, z) : null;
}

// ---- Toast notifications ----
export function ToastLayer() {
  const toast = useGame((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 animate-rise-in pointer-events-none">
      <div className="panel-bright px-6 py-4 text-center shadow-glow">
        <Sparkles className="w-6 h-6 text-gold-400 mx-auto mb-1" />
        <div className="font-display text-lg text-gold-400 tracking-wide">{toast.text}</div>
        {toast.sub && <div className="text-white/60 text-xs mt-1">{toast.sub}</div>}
      </div>
    </div>
  );
}

// ---- Combat / loot log (bottom left) ----
export function GameLog() {
  const log = useGame((s) => s.log);
  const [expanded, setExpanded] = useState(false);
  const recent = log.slice(-5);
  const iconFor = (kind: string) => {
    switch (kind) {
      case 'loot': return <Coins className="w-3 h-3 text-gold-400" />;
      case 'level': return <ChevronUp className="w-3 h-3 text-moss-400" />;
      case 'combat': return <Skull className="w-3 h-3 text-ember-500" />;
      default: return <Sparkles className="w-3 h-3 text-white/40" />;
    }
  };
  return (
    <div className="absolute bottom-4 left-4 z-20 w-72"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}>
      <div className={`panel px-3 py-2 transition-all ${expanded ? 'max-h-48 overflow-y-auto' : 'max-h-32 overflow-hidden'}`}>
        <div className="hud-label mb-1.5 flex items-center justify-between">
          <span>Adventure Log</span>
          <span className="text-white/30 normal-case text-[10px]">{log.length}</span>
        </div>
        <div className="space-y-1 text-[11px]">
          {(expanded ? log.slice(-30).reverse() : recent.reverse()).map((e) => (
            <div key={e.id} className="flex items-start gap-1.5 leading-snug">
              {iconFor(e.kind)}
              <span className="text-white/65">{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Region name banner on entering a new region ----
export function RegionBanner() {
  const region = useGame((s) => s.region);
  const [shown, setShown] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (region !== shown) {
      setShown(region);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [region, shown]);

  const r = REGIONS.find((x) => x.id === region);
  if (!r) return null;
  return (
    <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-700 ${visible ? 'opacity-100 -translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className="text-center">
        <div className="hud-label" style={{ color: r.color }}>{r.name}</div>
        <div className="font-display text-3xl text-white tracking-wider mt-1" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
          {r.name}
        </div>
        <div className="text-white/50 text-xs mt-1 max-w-xs">{r.desc}</div>
      </div>
    </div>
  );
}

