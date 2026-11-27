// Battle Royale rules (2–16 players), pure: the arena of src/tower/Arena.js, but one life. A circular safe zone shrinks toward the centre and
// stings whoever stands outside; the last player standing wins. The host decides eliminations; every machine keeps the same elimination order.
export const BR_TIME = 160, ZONE_GRACE = 20, ZONE_END = 125, ZONE_MIN = 3, ZONE_DPS = [4, 14], PLACE_BONUS = 500; // BR_TIME: one round
export const ROUNDS = 3, ROUND_PAUSE = 5; // a match = 3 rounds on 3 floors; seconds between two rounds

/** Radius of the safe zone `t` seconds into the match: full for ZONE_GRACE s, then linear down to ZONE_MIN at ZONE_END. */
export function zoneRadius(t, r0) {
  if (!(t > ZONE_GRACE)) return r0;
  const k = Math.min(1, (t - ZONE_GRACE) / (ZONE_END - ZONE_GRACE));
  return r0 + (Math.min(ZONE_MIN, r0) - r0) * k;
}
/** Damage per second to a player outside the zone: grows from ZONE_DPS[0] to ZONE_DPS[1] as the zone closes. */
export function zoneDps(t) {
  const k = Math.max(0, Math.min(1, (t - ZONE_GRACE) / (ZONE_END - ZONE_GRACE)));
  return ZONE_DPS[0] + (ZONE_DPS[1] - ZONE_DPS[0]) * k;
}
export const outsideZone = (x, z, r) => Math.hypot(x, z) > r;

/** Who is still in and in which order the others fell. `ids` = every player at the start. */
export class Standings {
  constructor(ids) { this.ids = new Set(ids); this.out = []; }
  /** true if `id` was in and is now out (unknown ids and repeats are ignored). */
  eliminate(id) { if (!this.ids.has(id) || this.out.includes(id)) return false; this.out.push(id); return true; }
  /** A player who left the room: out, but not a placement for the board. */
  leave(id) { this.eliminate(id); }
  alive() { return [...this.ids].filter((i) => !this.out.includes(i)); }
  isOut(id) { return this.out.includes(id); }
  /** Match is decided when at most one player is left (and there were at least two). */
  get decided() { return this.ids.size >= 2 && this.alive().length <= 1; }
  /** [{ id, place }] 1 = winner; `winner` (optional) is placed first, then the survivors, then the fallen from last to first. */
  places(winner) {
    const alive = this.alive(), top = winner != null && this.ids.has(winner) ? [winner] : [], rest = alive.filter((i) => !top.includes(i));
    return [...top, ...rest, ...[...this.out].reverse().filter((i) => !top.includes(i))].map((id, i) => ({ id, place: i + 1 }));
  }
}
/** Ids of a whole match ranked best first: most rounds won, then most kills (mosquitoes + players), then lowest id. */
export function matchRanking(ids, wins, kills) {
  return [...ids].sort((a, b) => (wins(b) - wins(a)) || (kills(b) - kills(a)) || a - b);
}
/** Winner when the clock runs out: the survivor with the most points (ties: lowest id). */
export function timeoutWinner(alive, score) {
  return [...alive].sort((a, b) => (score(b) - score(a)) || a - b)[0] ?? null;
}
