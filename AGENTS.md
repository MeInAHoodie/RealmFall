# AGENTS.md

3D web action RPG ("mini MMO") prototype. React 18 + TypeScript + Vite, Tailwind, three / @react-three/fiber v8, zustand. No backend, no multiplayer, no CI.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint .`)
- `npm run typecheck` — `tsc --noEmit -p tsconfig.app.json`
- `npm test` — run the Vitest suite once (`vitest run`)
- `npm run test:watch` — Vitest in watch mode

## Tests

- Vitest (node environment, no jsdom) runs via the `test` block in `vite.config.ts`. Colocate `*.test.ts` next to the module under test.
- Only pure Node-testable modules are covered so far: `store.ts` (zustand logic), `data/` (progression + cross-file integrity), `world/terrainMath.ts`. Do **not** import R3F/three-dependent components (`PlayerController`, `MonsterManager`, `GameScene`) into tests.
- `store.test.ts` resets the singleton `useGame` state in `beforeEach` via `useGame.setState(...)`; keep new tests isolated the same way.
- When adding/editing data (`items.ts`, `monsters.ts`, `classes.ts`) or store logic, run `npm test` and extend the relevant suite. The data-integrity suite is cheap insurance against dangling loot/region/stat references.
- The cooldown regression (skill cooldowns freezing) is covered by the `tickCooldowns` suite — `tickCooldowns` clears sub-epsilon values (`1e-9`) so float residue never leaves a blocked skill. Keep that contract.
- Use explicit imports from `vitest` (`import { describe, it, expect, vi } from 'vitest'`) — no globals, so `tsconfig.app.json` stays untouched.

## Known breakage (do not assume green)

- `npm run typecheck` passes. Keep it green: it used to fail with TS1149 because `src/game/world/terrain.ts` vs `Terrain.tsx` differed only in casing — `terrain.ts` was renamed to `terrainMath.ts`. Never create two files that differ only by case, and don't reintroduce a lowercase `terrain.ts`.
- `npm run lint` currently reports pre-existing errors (e.g. react-hooks in `src/game/ui/Overlays.tsx`, unused vars in `src/game/world/Sky.tsx`). Don't fix unrelated lint errors silently; just don't add new ones.

## Architecture

- **Single zustand store** `useGame` in `src/game/store.ts` holds ALL game state and most game logic (monster AI tick, damage, XP/level, inventory/equip, chat, cooldowns). Mutate gameplay through store actions, not React state.
- **3D scene** is one R3F `<Canvas>` in `src/game/GameScene.tsx`. `entities/PlayerController.tsx` owns input, movement, camera, and drives store ticks each frame. `entities/MonsterManager.tsx` spawns all monsters on mount (only if the store's `monsters` is empty) and renders them; its `MonsterShape` switch maps `MonsterDef.kind` → primitive mesh.
- **Game data** lives in `src/game/data/` (`classes.ts`, `items.ts`, `monsters.ts`, `progression.ts`), typed by `src/game/types.ts`. Add monsters/items/classes by editing data files + `types.ts` union types; monsters also need a shape in `MonsterManager`'s switch.
- **World helpers vs component**: `src/game/world/terrainMath.ts` (procedural height/biome math: `getGroundHeight`, `clampToWorld`, `sampleGround`) vs `Terrain.tsx` (component). Kept in separate files — never merge or rename to a name differing only by case.
- **Imperative↔React bridge**: `combat/skills.ts` (projectile engine) and UI layers like `ui/Floating.tsx` are module-level singletons wired via bind/emit functions (`bindMonsterSource`, `bindProjector`, `emitPlayerPos`) that components register in `useEffect`. Keep this pattern for combat/projectiles/floating-damage code — don't convert to React state.

## Conventions

- Use the `@/` path alias (`@/game/...` → `src/...`); relative imports are not used.
- Tailwind theme in `tailwind.config.js`: custom colors `ink-*`, `gold-*`, `ember-*`, `frost-*`, `moss-*`, `rarity.*`; fonts `font-display` (Cinzel) / `font-body` (Inter). Reusable CSS classes (`btn-gold`, `btn-ghost`, `panel`, `panel-bright`, `divider`) are defined in `src/index.css`.
- Use `lucide-react` for all icons (project brief, `.bolt/prompt`); prefer polished, non-cookie-cutter UI.
- Global hotkeys (I / M / Tab / Esc / Enter) live in `src/App.tsx` and only fire during gameplay; input handlers in `PlayerController` must respect the `paused` flag.
- React 18 `StrictMode` is on — effects run twice in dev; guard mount-only logic (see MonsterManager spawn guard).

## Dependencies status

- `@supabase/supabase-js` is installed but **unused** anywhere in `src`; there are no `.env` files. Don't assume any backend is wired up.
