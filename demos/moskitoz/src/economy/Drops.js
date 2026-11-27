// Coin economy rules (spec §8), pure and deterministic given an rng: kill gains, floor bonus, coin split, rain, chests.
import { PLAN_IDS } from './Items.js';

export const COIN_VALUES = { bronze: 1, silver: 5, gold: 25 };
export const KILL_COINS = { mosquito: 2, speedbug: 3, swarmling: 1, spitter: 4, kamikaze: 3, shield: 5, splitter: 5, healer: 7, heavy: 8, tyrant: 150 };
export const killValue = (type) => KILL_COINS[type] ?? 1;
export const floorBonus = (cleared) => 10 + Math.floor(cleared / 4);

/** Split a value into coins, largest first: 8 -> [silver, bronze, bronze, bronze]. */
export function coinsFor(value) {
  const out = []; let v = Math.max(0, Math.floor(value));
  for (const k of ['gold', 'silver', 'bronze']) while (v >= COIN_VALUES[k]) { out.push(k); v -= COIN_VALUES[k]; }
  return out;
}
/** Bonus coins added to the rain in the fall between two floors. */
export const rainBonus = (rnd) => 6 + Math.floor(rnd() * 5);
/** A toy chest on every boss floor, 5 % elsewhere (rnd seeded by the floor: same tower for everyone). */
export const chestHere = (rnd, boss) => boss || rnd() < 0.05;
/** 40..120 coins, or a Plan the player doesn't have yet (35 % on boss floors, 20 % elsewhere). */
export function chestContent(rnd, plans, boss) {
  const left = PLAN_IDS.filter((id) => !plans.includes(id));
  if (rnd() < (boss ? 0.35 : 0.2) && left.length) return { plan: left[Math.floor(rnd() * left.length)] };
  return { coins: 40 + Math.floor(rnd() * 81) };
}
