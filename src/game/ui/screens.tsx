import { useGame } from '@/game/store';
import { CLASS_LIST } from '@/game/data/classes';
import { LEVEL_CAP } from '@/game/data/progression';
import { Sword, Sparkles, Target, ChevronRight, Shield, Wand2, Heart, Zap, Gauge, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const CLASS_ICONS: Record<string, typeof Sword> = {
  warrior: Sword,
  mage: Sparkles,
  ranger: Target,
};

export function TitleScreen() {
  const setScreen = useGame((s) => s.setScreen);
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #1a2440 0%, #0a0e16 70%), linear-gradient(180deg, #0a0e16, #060810)',
      }}>
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 20%, #fff, transparent), radial-gradient(1px 1px at 55% 45%, #fff, transparent)', backgroundSize: '400px 400px' }} />
      <div className="relative text-center animate-rise-in">
        <p className="font-display tracking-[0.5em] text-gold-400/70 text-sm uppercase mb-4">A Mini MMO Adventure</p>
        <h1 className="font-display text-7xl md:text-8xl font-bold text-white mb-2 tracking-wider"
          style={{ textShadow: '0 0 40px rgba(245,214,138,0.4), 0 4px 0 rgba(0,0,0,0.4)' }}>
          REALMFALL
        </h1>
        <div className="divider w-64 mx-auto my-6" />
        <p className="text-white/60 max-w-md mx-auto mb-10 leading-relaxed">
          Explore a vast seamless fantasy world. Fight monsters, find loot, level up,
          and meet fellow adventurers across the realm. The world is the main attraction.
        </p>
        <button onClick={() => setScreen('class-select')} className="btn-gold text-base px-8 py-3.5 group">
          Begin Your Journey
          <ChevronRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <div className="mt-12 grid grid-cols-3 gap-8 text-center max-w-lg">
          <Stat label="World Size" value="1 Seamless Map" />
          <Stat label="Level Cap" value={`${LEVEL_CAP}`} />
          <Stat label="Regions" value="9 Biomes" />
        </div>
      </div>
      <p className="absolute bottom-6 text-white/30 text-xs font-display tracking-widest">v0.1 — PROTOTYPE</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-gold-400 text-lg">{value}</div>
      <div className="text-white/40 text-xs uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

export function ClassSelectScreen() {
  const classId = useGame((s) => s.classId);
  const chooseClass = useGame((s) => s.chooseClass);
  const enterWorld = useGame((s) => s.enterWorld);
  const playerName = useGame((s) => s.playerName);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const setScreen = useGame((s) => s.setScreen);
  const [hovered, setHovered] = useState<string | null>(null);

  const selected = classId ? CLASS_LIST.find((c) => c.id === classId) : null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a2030 0%, #0a0e16 80%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
        <h2 className="font-display text-4xl text-white mb-2 tracking-wider">Choose Your Path</h2>
        <p className="text-white/50 mb-8">Select a class to begin your adventure.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full mb-8">
          {CLASS_LIST.map((c) => {
            const Icon = CLASS_ICONS[c.id];
            const active = classId === c.id;
            const hovering = hovered === c.id;
            return (
              <button
                key={c.id}
                onClick={() => chooseClass(c.id)}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                className={`panel-bright p-6 text-left transition-all duration-300 group relative overflow-hidden ${
                  active ? 'ring-2 ring-gold-500 shadow-glow scale-[1.02]' : 'hover:scale-[1.01] hover:border-gold-500/40'
                }`}
                style={active ? { boxShadow: `0 0 30px ${c.primaryColor}40` } : undefined}
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-2xl"
                  style={{ background: c.primaryColor }} />
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: `${c.primaryColor}22`, border: `1px solid ${c.primaryColor}55` }}>
                    <Icon className="w-6 h-6" style={{ color: c.primaryColor }} />
                  </div>
                  <div>
                    <div className="font-display text-xl text-white">{c.name}</div>
                    <div className="text-xs uppercase tracking-wide" style={{ color: c.primaryColor }}>{c.role}</div>
                  </div>
                </div>
                <p className="text-white/55 text-sm leading-relaxed mb-4 min-h-[60px]">{c.desc}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniStat icon={Heart} label="HP" value={c.baseHealth} color="#ff7a7a" />
                  <MiniStat icon={Zap} label="MP" value={c.baseMana} color="#49c2ff" />
                  <MiniStat icon={Gauge} label="SPD" value={c.baseSpeed} color="#9bd17a" />
                </div>
                {active && (
                  <div className="absolute top-3 right-3 text-gold-400 text-xs font-display tracking-wider animate-pulse-glow">SELECTED</div>
                )}
                {hovering && !active && (
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="panel p-5 max-w-4xl w-full mb-6 animate-rise-in">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gold-400" />
              <h3 className="font-display text-gold-400 tracking-wide text-sm uppercase">{selected.name} — Skills</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selected.skills.map((s) => (
                <div key={s.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.03]">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${selected.primaryColor}22` }}>
                    {s.passive ? <Sparkles className="w-4 h-4 text-gold-400" /> : <Wand2 className="w-4 h-4" style={{ color: selected.primaryColor }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{s.name}</span>
                      {s.passive && <span className="text-[10px] uppercase tracking-wide text-gold-400/70">Passive</span>}
                      {!s.passive && (
                        <span className="text-[10px] uppercase tracking-wide text-white/40">
                          {s.slot === 'basic' ? 'LMB' : s.slot === 'heavy' ? 'RMB' : s.slot.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-white/45 text-xs leading-snug">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <label className="hud-label">Name</label>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={18}
            className="bg-ink-700/80 border border-white/10 rounded-md px-4 py-2 text-white text-sm focus:outline-none focus:border-gold-500/50 w-56"
            placeholder="Wanderer"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setScreen('title')} className="btn-ghost">Back</button>
          <button onClick={() => enterWorld()} disabled={!classId} className="btn-gold group">
            Enter the Realm
            <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: typeof Heart; label: string; value: number; color: string }) {
  return (
    <div className="bg-white/[0.04] rounded-md py-2 px-1">
      <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color }} />
      <div className="text-white text-xs font-semibold">{value}</div>
      <div className="text-white/40 text-[10px] uppercase">{label}</div>
    </div>
  );
}
