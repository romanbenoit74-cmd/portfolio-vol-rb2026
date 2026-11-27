// Loot chests of multiplayer matches (pure rules): where they stand and what each one holds. Every machine computes the same plan from the
// match seed (same level, same rng), so only the opening / swaps travel over the network. A chest holds ANY weapon or hand power of the
// catalogue, unlocked or not: it is a temporary loan for the match, swapped against what you brought (see src/tower/LootChests.js).
import { ITEMS } from '../economy/Items.js';
import { rng } from '../core/core.js';

export const LOOT = ITEMS.filter((i) => i.live && (i.slot === 'arme' || i.slot === 'pouvoir')).map((i) => i.id);
export const CHEST_COUNT = { coop: 4, arena: 5, br: 8 };
export const CHEST_RANGE = 2.6; // metres: how close you must be to open / swap

/** n chests spread over a w × d room: [{ i, x, z, item }]. `free(x, z)` says whether a chest fits there; chests keep their distance. */
export function lootPlan(seed, n, w, d, free = () => true, minGap = 9) {
  const r = rng((seed ^ 0x10075) >>> 0), out = [];
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    const x = (r() - 0.5) * (w - 10), z = (r() - 0.5) * (d - 10);
    if (Math.hypot(x, z) < 5 || out.some((c) => Math.hypot(c.x - x, c.z - z) < minGap) || !free(x, z)) continue;
    out.push({ i: out.length, x: +x.toFixed(2), z: +z.toFixed(2), item: LOOT[Math.floor(r() * LOOT.length)] });
  }
  return out;
}
/** The nearest chest within range of (x, z), or null. `chests` = [{ x, z }]. */
export function nearestChest(chests, x, z, range = CHEST_RANGE) {
  let best = null, bd = range;
  for (const c of chests) { const d = Math.hypot(c.x - x, c.z - z); if (d <= bd) { best = c; bd = d; } }
  return best;
}
