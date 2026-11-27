// Pure profile merge shared by the worker (authoritative, with guard rails) and the browser (re-applies the changes made while
// a sync was in flight). Delta based: coins = server.coins + (client.coins - base.coins), where `base` is the snapshot of the
// server profile the client last saw. Friends trust level: bounds are checked, nothing is cryptographically proven.
import { sanitizeProfile } from './Profile.js';
import { item } from './Items.js';

export const LIMITS = { gainBase: 5000, gainPerSec: 100, importCoins: 1000000 }; // coins a client may add per sync: base + perSec × seconds since last sync
const nat = (x) => (Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0);
export const snapshot = (p) => ({ coins: p.coins, coinsEarned: p.stats.coinsEarned, runs: p.stats.runs });
const no = (reason) => ({ ok: false, reason });

/** -> { ok: true, profile } | { ok: false, reason } */
export function mergeProfile(server, client, base, { elapsedSec = 0, importing = false } = {}) {
  const s = sanitizeProfile(server), c = sanitizeProfile(client);
  const b = { coins: nat(base && base.coins), coinsEarned: nat(base && base.coinsEarned), runs: nat(base && base.runs) };
  const gain = c.stats.coinsEarned - b.coinsEarned;
  if (gain < 0) return no('negative-gain');
  if (importing) { if (c.coins > LIMITS.importCoins) return no('import-too-rich'); }
  else if (gain > LIMITS.gainBase + LIMITS.gainPerSec * Math.max(0, elapsedSec)) return no('gain-too-high');
  if (c.coins > b.coins + gain) return no('coins-not-earned'); // coins can only come from banked earnings
  const plans = [...new Set([...s.plans, ...c.plans])];
  if (!importing) {
    const fresh = c.owned.filter((id) => !s.owned.includes(id)), spent = b.coins + gain - c.coins;
    if (fresh.reduce((n, id) => n + item(id).price, 0) > spent) return no('items-not-paid');
    if (fresh.some((id) => item(id).plan && !plans.includes(id))) return no('plan-missing');
  }
  const hunt = { ...s.stats.hunt };
  for (const [k, w] of Object.entries(c.stats.hunt)) hunt[k] = Math.max(hunt[k] || 0, w);
  return {
    ok: true,
    profile: sanitizeProfile({
      v: 1, coins: Math.max(0, s.coins + c.coins - b.coins), owned: [...new Set([...s.owned, ...c.owned])], plans, loadout: c.loadout,
      stats: { runs: s.stats.runs + Math.max(0, c.stats.runs - b.runs), coinsEarned: s.stats.coinsEarned + gain, bestFloor: Math.max(s.stats.bestFloor, c.stats.bestFloor), biome: Math.max(s.stats.biome, c.stats.biome), hunt },
    }),
  };
}
