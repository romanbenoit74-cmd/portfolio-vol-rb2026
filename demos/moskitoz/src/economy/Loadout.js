// Loadout and Menace (spec §9), pure: which weapon / hand power a run uses, the Menace M it adds and what M does
// to the tower (mosquito HP, wave budget, score). The daily challenge imposes one loadout per day for everyone.
import { ITEMS, item } from './Items.js';

/** item id -> engine weapon id (src/weapons, Combat.arsenal) */
export const WEAPON_OF = { raquette: 'racket', brumi: 'spray', pieges: 'trap', jumeaux: 'jumeaux', aspi: 'aspi', tapette: 'tapette', citro: 'citro' };
export const menace = (lo) => (lo && lo.weapon ? item(lo.weapon).menace : 0) + (lo && lo.power ? item(lo.power).menace : 0);
export const menaceMods = (M) => ({ hp: 1 + 0.1 * M, budget: 1 + 0.08 * M, score: 1 + 0.25 * M });

const live = (slot) => ITEMS.filter((i) => i.live && i.slot === slot).map((i) => i.id);
/** Same loadout for everyone on a given day (dayKey = yyyymmdd), owned or not: a free trial. */
export function dailyLoadout(day) {
  let s = day >>> 0; const r = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  r(); const w = live('arme'), p = live('pouvoir');
  return { weapon: w[Math.floor(r() * w.length)], power: p.length ? p[Math.floor(r() * p.length)] : null };
}
/** Loadout of a run: the daily one in the Défi, else the profile's, limited to owned and playable items. */
export function runLoadout(mode, profile, day) {
  if (mode && mode.daily) return dailyLoadout(day);
  const lo = profile.loadout, ok = (id, slot) => id && profile.owned.includes(id) && item(id) && item(id).live && item(id).slot === slot;
  return { weapon: lo.weapon === null ? null : ok(lo.weapon, 'arme') ? lo.weapon : 'raquette', power: ok(lo.power, 'pouvoir') ? lo.power : null };
}
