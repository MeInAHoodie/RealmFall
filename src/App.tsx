import { useEffect } from 'react';
import { useGame } from '@/game/store';
import { GameScene } from '@/game/GameScene';
import { TitleScreen, ClassSelectScreen } from '@/game/ui/screens';
import { HUD } from '@/game/ui/HUD';
import { InventoryPanel, ChatPanel, WorldMap } from '@/game/ui/Overlays';
import { FloatingDamageLayer, ToastLayer, GameLog, RegionBanner } from '@/game/ui/Floating';

export default function App() {
  const screen = useGame((s) => s.screen);
  const toggleInventory = useGame((s) => s.toggleInventory);
  const toggleMap = useGame((s) => s.toggleMap);
  const toggleChat = useGame((s) => s.toggleChat);
  const toggleScoreboard = useGame((s) => s.toggleScoreboard);
  const togglePause = useGame((s) => s.togglePause);
  const paused = useGame((s) => s.paused);
  const showInventory = useGame((s) => s.showInventory);

  // Global hotkeys for panels (only during gameplay)
  useEffect(() => {
    if (screen !== 'game') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyI') { toggleInventory(); e.preventDefault(); }
      else if (e.code === 'KeyM') { toggleMap(); e.preventDefault(); }
      else if (e.code === 'Tab') { toggleScoreboard(); e.preventDefault(); }
      else if (e.code === 'Escape') {
        if (showInventory) toggleInventory();
        else togglePause();
        e.preventDefault();
      }
      else if (e.code === 'Enter') { toggleChat(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, toggleInventory, toggleMap, toggleChat, toggleScoreboard, togglePause, showInventory]);

  if (screen === 'title') {
    return <TitleScreen />;
  }

  if (screen === 'class-select') {
    return <ClassSelectScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-ink-900">
      <GameScene />
      <DamageVignette />
      <HUD />
      <GameLog />
      <RegionBanner />
      <FloatingDamageLayer />
      <ToastLayer />
      <InventoryPanel />
      <ChatPanel />
      <WorldMap />
      {paused && <PauseOverlay />}
      <Crosshair />
      <ControlsHint />
    </div>
  );
}

// Red edge glow that pulses when the local player takes damage.
function DamageVignette() {
  const playerHitFlash = useGame((s) => s.playerHitFlash);
  if (playerHitFlash <= 0.02) return null;
  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none damage-vignette"
      style={{ opacity: Math.min(1, playerHitFlash * 0.9) }}
    />
  );
}

function Crosshair() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
      <div className="w-1.5 h-1.5 rounded-full bg-white/40 border border-black/40" />
    </div>
  );
}

function PauseOverlay() {
  const togglePause = useGame((s) => s.togglePause);
  const setScreen = useGame((s) => s.setScreen);
  const getStats = useGame((s) => s.getStats);
  const level = useGame((s) => s.level);
  const kills = useGame((s) => s.kills);
  const bossKills = useGame((s) => s.bossKills);
  const damageTotal = useGame((s) => s.damageTotal);
  const stats = getStats();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in" onClick={togglePause}>
      <div className="panel-bright p-8 w-80 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl text-gold-400 tracking-wider mb-1">Paused</h2>
        <p className="text-white/40 text-xs mb-6">Press ESC to resume</p>
        <div className="grid grid-cols-2 gap-2 mb-6 text-left">
          <Stat label="Level" value={level} />
          <Stat label="Health" value={stats.health} />
          <Stat label="Damage" value={stats.damage} />
          <Stat label="Defense" value={stats.defense} />
          <Stat label="Kills" value={kills} />
          <Stat label="Bosses" value={bossKills} />
          <Stat label="Damage Dealt" value={damageTotal} />
          <Stat label="Crit" value={`${(stats.critChance * 100).toFixed(0)}%`} />
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={togglePause} className="btn-gold w-full">Resume</button>
          <button onClick={() => setScreen('title')} className="btn-ghost w-full">Return to Title</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between bg-white/[0.04] rounded px-2 py-1.5">
      <span className="text-white/50 text-xs">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

function ControlsHint() {
  const [show, setShow] = useShowHint();
  if (!show) return null;
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
      <div className="panel px-5 py-3 flex items-center gap-4 text-xs">
        <span className="text-white/60">WASD move · Mouse look · Shift sprint · Space jump</span>
        <span className="text-white/40">|</span>
        <span className="text-white/60">LMB/RMB attack · Q/E skills</span>
        <button onClick={() => setShow(false)} className="text-gold-400 hover:text-gold-500 ml-2">Got it</button>
      </div>
    </div>
  );
}

function useShowHint() {
  const [show, setShowState] = useStateWithStorage('realmfall:hint-seen', true);
  const setShow = (v: boolean) => {
    setShowState(v);
    if (!v) localStorage.setItem('realmfall:hint-seen', '1');
  };
  return [show, setShow] as const;
}

function useStateWithStorage(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [state, setState] = useState(() => {
    try { return localStorage.getItem(key) ? false : initial; } catch { return initial; }
  });
  return [state, setState];
}

import { useState } from 'react';
