import { useGame, type InventoryItem } from '@/game/store';
import { ITEMS } from '@/game/data/items';
import type { EquipSlot, Rarity } from '@/game/types';
import { X, Coins } from 'lucide-react';
import { useState } from 'react';
import * as Icons from 'lucide-react';

const RARITY_TEXT: Record<Rarity, string> = {
  common: 'text-rarity-common',
  uncommon: 'text-rarity-uncommon',
  rare: 'text-rarity-rare',
  epic: 'text-rarity-epic',
  legendary: 'text-rarity-legendary',
  mythic: 'text-rarity-mythic',
};

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: 'Weapon',
  helmet: 'Helmet',
  chest: 'Chest',
  gloves: 'Gloves',
  legs: 'Legs',
  boots: 'Boots',
  ring: 'Ring',
  necklace: 'Necklace',
};

const SLOT_ORDER: EquipSlot[] = ['weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'ring', 'necklace'];

export function InventoryPanel() {
  const showInventory = useGame((s) => s.showInventory);
  const toggleInventory = useGame((s) => s.toggleInventory);
  const inventory = useGame((s) => s.inventory);
  const equipped = useGame((s) => s.equipped);
  const gold = useGame((s) => s.gold);
  const equipItem = useGame((s) => s.equipItem);
  const unequip = useGame((s) => s.unequip);
  const useConsumable = useGame((s) => s.useConsumable);
  const getStats = useGame((s) => s.getStats);
  const [selected, setSelected] = useState<string | null>(null);

  if (!showInventory) return null;
  const stats = getStats();
  const sel = selected ? inventory.find((i) => i.uid === selected) : null;
  const selDef = sel ? ITEMS[sel.itemId] : null;

  function IconFor({ name, className }: { name: string; className?: string }) {
    const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Package;
    return <Cmp className={className} />;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={toggleInventory}>
      <div className="panel w-[760px] max-w-[92vw] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-gold-400 tracking-wide text-lg">Inventory</h2>
            <span className="text-white/30 text-xs">— {inventory.length} items</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gold-400">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">{gold}</span>
            </div>
            <button onClick={toggleInventory} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Equipment + Stats */}
          <div className="w-64 border-r border-white/5 p-4 overflow-y-auto">
            <h3 className="hud-label mb-3">Equipment</h3>
            <div className="space-y-1.5">
              {SLOT_ORDER.map((slot) => {
                const id = equipped[slot];
                const def = id ? ITEMS[id] : null;
                return (
                  <div key={slot} className="flex items-center gap-2 p-2 rounded-md bg-white/[0.03] border border-white/5">
                    <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: def ? `${def.rarity === 'mythic' ? '#ff4d6d' : '#f5a623'}15` : '#ffffff05' }}>
                      {def ? <IconFor name={def.icon} className={`w-4 h-4 ${RARITY_TEXT[def.rarity]}`} /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-white/40">{SLOT_LABELS[slot]}</div>
                      <div className={`text-xs truncate ${def ? RARITY_TEXT[def.rarity] : 'text-white/30'}`}>{def ? def.name : 'Empty'}</div>
                    </div>
                    {def && (
                      <button onClick={() => unequip(slot)} className="text-white/30 hover:text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10">X</button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="divider my-4" />
            <h3 className="hud-label mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <StatRow label="Health" value={stats.health} color="#ff7a7a" />
              <StatRow label="Mana" value={stats.mana} color="#49c2ff" />
              <StatRow label="Damage" value={stats.damage} color="#f5a623" />
              <StatRow label="Defense" value={stats.defense} color="#9bd17a" />
              <StatRow label="Speed" value={stats.speed.toFixed(1)} color="#9bd17a" />
              <StatRow label="Crit" value={`${(stats.critChance * 100).toFixed(0)}%`} color="#ff9d5c" />
            </div>
          </div>

          {/* Middle: Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="hud-label mb-3">Backpack</h3>
            <div className="grid grid-cols-6 gap-2">
              {inventory.map((item) => {
                const def = ITEMS[item.itemId];
                if (!def) return null;
                const isSel = selected === item.uid;
                return (
                  <button
                    key={item.uid}
                    onClick={() => setSelected(item.uid)}
                    onDoubleClick={() => def.kind === 'consumable' ? useConsumable(item.uid) : def.kind === 'equip' ? equipItem(item.uid) : null}
                    className={`relative aspect-square rounded-md flex items-center justify-center group transition-all ${isSel ? 'ring-2 ring-gold-500' : 'hover:ring-1 hover:ring-white/20'}`}
                    style={{ background: `${rarityColor(def.rarity)}12` }}
                  >
                    <div className={`rarity-glow-${def.rarity} absolute inset-0 rounded-md`} />
                    <IconFor name={def.icon} className={`w-6 h-6 relative ${RARITY_TEXT[def.rarity]}`} />
                    {item.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] text-white/80 font-medium">{item.count}</span>
                    )}
                    {def.kind === 'equip' && equipped[def.slot!] !== item.itemId && (
                      <span className="absolute top-0.5 left-1 text-[8px] text-gold-400/70">E</span>
                    )}
                  </button>
                );
              })}
              {inventory.length === 0 && (
                <div className="col-span-6 text-center text-white/30 text-sm py-12">Your backpack is empty. Defeat monsters to find loot.</div>
              )}
            </div>
            <p className="text-white/30 text-[11px] mt-4">Double-click to equip or use. Right-click slot to compare.</p>
          </div>

          {/* Right: Item detail */}
          <div className="w-60 border-l border-white/5 p-4 overflow-y-auto">
            {selDef ? (
              <div className="animate-fade-in">
                <div className={`rarity-glow-${selDef.rarity} w-16 h-16 rounded-lg flex items-center justify-center mb-3 mx-auto`}
                  style={{ background: `${rarityColor(selDef.rarity)}18` }}>
                  <IconFor name={selDef.icon} className={`w-8 h-8 ${RARITY_TEXT[selDef.rarity]}`} />
                </div>
                <h3 className={`text-center font-display text-base ${RARITY_TEXT[selDef.rarity]}`}>{selDef.name}</h3>
                <div className="text-center text-[10px] uppercase tracking-wide text-white/40 mt-1">
                  {selDef.kind}{selDef.slot ? ` · ${SLOT_LABELS[selDef.slot]}` : ''}
                </div>
                <p className="text-white/55 text-xs leading-relaxed mt-3 text-center">{selDef.desc}</p>
                {selDef.stats && (
                  <div className="mt-3 space-y-1">
                    <div className="hud-label">Stats</div>
                    {selDef.stats.health && <StatLine label="Health" value={`+${selDef.stats.health}`} />}
                    {selDef.stats.mana && <StatLine label="Mana" value={`+${selDef.stats.mana}`} />}
                    {selDef.stats.damage && <StatLine label="Damage" value={`+${selDef.stats.damage}`} />}
                    {selDef.stats.defense && <StatLine label="Defense" value={`+${selDef.stats.defense}`} />}
                    {selDef.stats.speed && <StatLine label="Speed" value={`+${selDef.stats.speed}`} />}
                    {selDef.stats.critChance && <StatLine label="Crit" value={`+${(selDef.stats.critChance * 100).toFixed(0)}%`} />}
                  </div>
                )}
                <div className="flex items-center justify-center gap-1 mt-3 text-gold-400 text-sm">
                  <Coins className="w-3.5 h-3.5" /> {selDef.value}
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {selDef.kind === 'equip' && (
                    <button onClick={() => equipItem(sel!.uid)} className="btn-gold w-full text-xs py-2">Equip</button>
                  )}
                  {selDef.kind === 'consumable' && (
                    <button onClick={() => useConsumable(sel!.uid)} className="btn-gold w-full text-xs py-2">Use</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-white/30 text-sm py-12">Select an item to inspect it.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function rarityColor(r: Rarity): string {
  const map: Record<Rarity, string> = {
    common: '#cbd5e1',
    uncommon: '#6ba84f',
    rare: '#49c2ff',
    epic: '#c084fc',
    legendary: '#f5a623',
    mythic: '#ff4d6d',
  };
  return map[r];
}

function StatRow({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center justify-between bg-white/[0.03] rounded px-2 py-1">
      <span className="text-white/50">{label}</span>
      <span className="font-medium" style={{ color }}>{value}</span>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/50">{label}</span>
      <span className="text-moss-400">{value}</span>
    </div>
  );
}

// ---- Chat ----
export function ChatPanel() {
  const showChat = useGame((s) => s.showChat);
  const toggleChat = useGame((s) => s.toggleChat);
  const messages = useGame((s) => s.chatMessages);
  const chatInput = useGame((s) => s.chatInput);
  const setChatInput = useGame((s) => s.setChatInput);
  const sendChat = useGame((s) => s.sendChat);
  const channel = useGame((s) => s.chatChannel);
  const setChatChannel = useGame((s) => s.setChatChannel);

  if (!showChat) return null;
  const channelColor: Record<string, string> = { global: '#f5d68a', local: '#9bd17a', party: '#49c2ff' };

  return (
    <div className="absolute bottom-24 left-4 z-30 w-80 animate-rise-in">
      <div className="panel flex flex-col max-h-72">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex gap-1">
            {(['global', 'local', 'party'] as const).map((c) => (
              <button key={c} onClick={() => setChatChannel(c)}
                className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded ${channel === c ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={toggleChat} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 text-xs max-h-48">
          {messages.slice(-30).map((m) => (
            <div key={m.id} className="leading-snug">
              <span style={{ color: channelColor[m.channel] }} className="font-medium">[{m.channel}]</span>{' '}
              <span className="text-white/70">{m.sender}:</span>{' '}
              <span className="text-white/90">{m.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); sendChat(chatInput); }} className="flex items-center gap-2 px-3 py-2 border-t border-white/5">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: channelColor[channel] }}>[{channel}]</span>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-ink-900/60 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-gold-500/40"
          />
          <button type="submit" className="text-gold-400 text-xs hover:text-gold-500">Send</button>
        </form>
      </div>
    </div>
  );
}

// ---- World Map ----
export function WorldMap() {
  const showMap = useGame((s) => s.showMap);
  const toggleMap = useGame((s) => s.toggleMap);
  const region = useGame((s) => s.region);
  if (!showMap) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={toggleMap}>
      <div className="panel p-6 w-[680px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-gold-400 text-xl tracking-wide">World Map</h2>
          <button onClick={toggleMap} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-white/10"
          style={{ background: 'radial-gradient(ellipse at center, #1a2440, #0a0e16)' }}>
          {/* Biome markers */}
          {REGIONS_VISIBLE.map((r) => {
            const isCurrent = r.id === region;
            return (
              <div key={r.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer`}
                style={{ left: `${((r.center[0] + 110) / 220) * 100}%`, top: `${((r.center[1] + 110) / 220) * 100}%` }}>
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${isCurrent ? 'scale-150' : 'group-hover:scale-125'}`}
                  style={{ background: r.color, borderColor: isCurrent ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: isCurrent ? `0 0 12px ${r.color}` : 'none' }} />
                <div className={`text-[10px] mt-1 font-display tracking-wide whitespace-nowrap ${isCurrent ? 'text-white' : 'text-white/60'}`}>{r.name}</div>
                {isCurrent && <div className="text-[8px] text-gold-400 animate-pulse-glow">YOU ARE HERE</div>}
              </div>
            );
          })}
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 62.5" preserveAspectRatio="none">
            <polyline points={REGIONS_VISIBLE.map((r) => `${((r.center[0] + 110) / 220) * 100},${((r.center[1] + 110) / 220) * 62.5}`).join(' ')}
              fill="none" stroke="rgba(245,214,138,0.25)" strokeWidth="0.3" strokeDasharray="1,1" />
          </svg>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {REGIONS_VISIBLE.slice(0, 9).map((r) => (
            <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-white/[0.03]">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-white/80 truncate">{r.name}</div>
                <div className="text-white/30 text-[10px]">Lv. {r.recommendedLevel}+</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { REGIONS } from '@/game/data/items';
const REGIONS_VISIBLE = REGIONS;
