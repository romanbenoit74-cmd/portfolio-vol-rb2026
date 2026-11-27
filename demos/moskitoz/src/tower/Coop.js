// Coop rules (spec 2026-10-04 §3), pure: team state (alive / downed / dead), the revive window, scaling by team size, who a mosquito targets.
// A player at 0 HP is downed for REVIVE_WINDOW seconds; a teammate's CLAP next to the body gets them back up. Everybody down = the run ends.
export const REVIVE_WINDOW = 15, REVIVE_HP = 40, REVIVE_RANGE = 3;

/** Difficulty by team size n (1..4): more HP and a bigger wave budget, damage unchanged. */
export const coopScale = (n) => { const k = Math.max(0, Math.min(3, (n | 0) - 1)); return { hp: 1 + 0.45 * k, budget: 1 + 0.6 * k }; };

export class Team {
  constructor(ids = []) { this.m = new Map(); ids.forEach((id) => this.add(id)); }
  add(id) { if (!this.m.has(id)) this.m.set(id, { state: 'alive', until: 0 }); }
  remove(id) { this.m.delete(id); }
  state(id) { const p = this.m.get(id); return p ? p.state : null; }
  ids(state) { return [...this.m].filter(([, p]) => !state || p.state === state).map(([id]) => id); }
  get size() { return this.m.size; }
  /** `now` in seconds. Returns false when the player is unknown or already down. */
  down(id, now) { const p = this.m.get(id); if (!p || p.state !== 'alive') return false; p.state = 'downed'; p.until = now + REVIVE_WINDOW; return true; }
  /** Teammate `by` revives `id`: only while the window is open, never oneself. */
  revive(id, by, now) {
    const p = this.m.get(id), q = this.m.get(by);
    if (!p || !q || id === by || p.state !== 'downed' || q.state !== 'alive' || now > p.until) return false;
    p.state = 'alive'; p.until = 0; return true;
  }
  /** The team clears a floor: everyone downed (not yet dead) is back on their feet for the next one. Returns their ids. */
  rescue() { const out = []; for (const [id, p] of this.m) if (p.state === 'downed') { p.state = 'alive'; p.until = 0; out.push(id); } return out; }
  /** A teammate's own state says they are back on their feet (revived on their machine). */
  stand(id) { const p = this.m.get(id); if (!p || p.state !== 'downed') return false; p.state = 'alive'; p.until = 0; return true; }
  /** Seconds left to save a downed player (0 if not downed). */
  left(id, now) { const p = this.m.get(id); return p && p.state === 'downed' ? Math.max(0, p.until - now) : 0; }
  /** Downed players whose window ran out become dead; returns their ids. */
  tick(now) { const out = []; for (const [id, p] of this.m) if (p.state === 'downed' && now > p.until) { p.state = 'dead'; out.push(id); } return out; }
  /** Nobody left standing (a team that is still empty or only has dead / downed players). */
  get wiped() { return this.m.size > 0 && ![...this.m.values()].some((p) => p.state === 'alive'); }
}

/** Nearest target among `cands` [{ id, x, y, z }] to a point; null when there are none. */
export function nearest(cands, p) {
  let best = null, bd = Infinity;
  for (const c of cands) { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2 + (c.z - p.z) ** 2; if (d < bd) { bd = d; best = c; } }
  return best;
}
/** Downed teammate that `me` can revive from where they stand (within REVIVE_RANGE), the closest one; null otherwise. */
export function reviveTarget(downed, me) {
  const near = nearest(downed.filter((d) => Math.hypot(d.x - me.x, d.z - me.z) <= REVIVE_RANGE && Math.abs(d.y - me.y) < 2.5), me);
  return near ? near.id : null;
}
