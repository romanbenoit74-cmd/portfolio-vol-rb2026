// Persistent player profile (spec §8): { v, coins, owned[], plans[], loadout: { weapon, power }, stats }.
// Pure helpers (tested) + a small localStorage-backed store. A corrupt or tampered profile falls back to safe values.
import { ITEMS, PLAN_IDS, DEFAULT_SKIN, item } from './Items.js';

export const PROFILE_KEY = 'mosq-profile-v1';
export const DEFAULT_PROFILE = Object.freeze({ v: 1, coins: 0, owned: ['raquette'], plans: [], loadout: { weapon: 'raquette', power: null, hands: DEFAULT_SKIN }, stats: { runs: 0, coinsEarned: 0, bestFloor: 0, biome: 1, hunt: {} } });
export const BIOME_COUNT = 20;
const nat = (x) => (Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0);
const ids = (a, ok) => (Array.isArray(a) ? [...new Set(a.filter((x) => typeof x === 'string' && ok(x)))] : []);

export function sanitizeProfile(raw) {
  let s = raw;
  if (typeof s === 'string') { try { s = JSON.parse(s); } catch { s = null; } }
  if (!s || typeof s !== 'object') s = {};
  const owned = ids(s.owned, (x) => !!item(x));
  if (!owned.includes('raquette')) owned.unshift('raquette'); // always given
  const lo = s.loadout || {}, has = (id, slot) => owned.includes(id) && item(id).slot === slot;
  const hands = has(lo.hands, 'mains') ? lo.hands : DEFAULT_SKIN;
  const st = s.stats || {};
  return {
    v: 1, coins: nat(s.coins), owned, plans: ids(s.plans, (x) => PLAN_IDS.includes(x)),
    loadout: { weapon: lo.weapon === null ? null : has(lo.weapon, 'arme') ? lo.weapon : 'raquette', power: has(lo.power, 'pouvoir') ? lo.power : null, hands }, // null weapon = bare hands (Pur)
    stats: {
      runs: nat(st.runs), coinsEarned: nat(st.coinsEarned), bestFloor: nat(st.bestFloor),
      biome: Math.min(BIOME_COUNT, Math.max(1, nat(st.biome))), // furthest biome reached in the tower (Chasse can pick 1..biome)
      hunt: Object.fromEntries(Object.entries(st.hunt && typeof st.hunt === 'object' ? st.hunt : {}).filter(([b, w]) => +b >= 1 && +b <= BIOME_COUNT && nat(w) > 0).map(([b, w]) => [+b, nat(w)])), // best wave per biome
    },
  };
}
const copy = (p) => sanitizeProfile(JSON.parse(JSON.stringify(p)));
export function bank(p, n) { const q = copy(p), v = nat(n); q.coins += v; q.stats.coinsEarned += v; return q; }
export function spend(p, n) { const v = nat(n); if (p.coins < v) return { ok: false, profile: p }; const q = copy(p); q.coins -= v; return { ok: true, profile: q }; }
export function reach(p, b) { const q = copy(p); q.stats.biome = Math.min(BIOME_COUNT, Math.max(q.stats.biome, nat(b))); return q; }
export function huntRecord(p, b, wave) { const q = copy(p), old = q.stats.hunt[b] || 0; if (nat(wave) > old) q.stats.hunt[b] = nat(wave); return { profile: q, record: nat(wave) > old }; }
export function buy(p, id) { // spec §9: price in coins, a Plan first for the ★★★ items
  const it = item(id); if (!it || p.owned.includes(id) || (it.plan && !p.plans.includes(id)) || p.coins < it.price) return { ok: false, profile: p };
  const q = copy(p); q.coins -= it.price; q.owned.push(id); return { ok: true, profile: q };
}
export function equip(p, slot, id) { // id null = empty slot (weapon null = bare hands, Pur; hands null = default skin)
  const q = copy(p), key = slot === 'arme' ? 'weapon' : slot === 'mains' ? 'hands' : 'power';
  if (slot === 'mains' && (id === null || id === DEFAULT_SKIN)) id = DEFAULT_SKIN;
  else if (id !== null && !(q.owned.includes(id) && item(id).slot === slot)) return p;
  q.loadout[key] = id; return sanitizeProfile(q);
}
export function addPlan(p, id) { const q = copy(p); if (PLAN_IDS.includes(id) && !q.plans.includes(id)) q.plans.push(id); return q; }

// ---- store (browser) ----
let current = null;
const subs = new Set();
export const Profile = {
  get() { if (!current) { try { current = sanitizeProfile(localStorage.getItem(PROFILE_KEY)); } catch { current = sanitizeProfile(null); } } return current; },
  set(p, silent = false) { current = sanitizeProfile(p); try { localStorage.setItem(PROFILE_KEY, JSON.stringify(current)); } catch { /* no storage */ } if (!silent) subs.forEach((f) => f(current)); return current; },
  replace(p) { return this.set(p, true); }, // account sync adopting a profile: no push back
  subscribe(f) { subs.add(f); return () => subs.delete(f); },
  bank(n) { return n > 0 ? this.set(bank(this.get(), n)) : this.get(); },
  addPlan(id) { return this.set(addPlan(this.get(), id)); },
  reach(b) { return this.set(reach(this.get(), b)); },
  huntRecord(b, wave) { const r = huntRecord(this.get(), b, wave); this.set(r.profile); return r.record; },
  buy(id) { const r = buy(this.get(), id); if (r.ok) this.set(r.profile); return r.ok; },
  equip(slot, id) { return this.set(equip(this.get(), slot, id)); },
  endRun(cleared) { const q = copy(this.get()); q.stats.runs++; q.stats.bestFloor = Math.max(q.stats.bestFloor, nat(cleared)); return this.set(q); },
  reload() { current = null; return this.get(); },
};
export { ITEMS };
