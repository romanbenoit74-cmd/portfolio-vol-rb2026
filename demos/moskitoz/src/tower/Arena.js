// Arena rules (spec 2026-10-04 §4), pure: 5 minutes in one biome, every player for themselves. Mosquitoes are easy points, players are worth more.
// The host keeps the score (`Board`) and broadcasts it every second; a K.O. player is back after RESPAWN seconds, invulnerable for a moment.
export const ARENA_TIME = 300, RESPAWN = 3, RESPAWN_SHIELD = 2.5, FRAG_PTS = 150, DEATH_PTS = 25, CREDIT_WINDOW = 6;
export const PVP_SCALE = 0.6, PVP_HIT_MAX = 60; // player-vs-player damage: scaled down from the mosquito damage, capped per message

/** Points for a mosquito killed (its `pts` in TYPES: 1 for a mosquito, 50 for the tyrant). */
export const killPoints = (pts) => Math.max(1, Math.round(pts)) * 10;
/** Damage a player takes from a hit that was meant for a mosquito: scaled, and bounded so a forged message cannot one-shot. */
export const pvpDamage = (amount) => Math.max(0, Math.min(PVP_HIT_MAX, (Number.isFinite(amount) ? amount : 0) * PVP_SCALE));
/** Who gets the frag for a K.O.: the last player who hurt the victim within CREDIT_WINDOW seconds, else nobody. */
export const creditFor = (last, now) => (last && now - last.t <= CREDIT_WINDOW ? last.id : null);

export class Board {
  constructor() { this.s = new Map(); }
  add(id, pts) { this.s.set(id, (this.s.get(id) || 0) + pts); }
  ensure(id) { if (!this.s.has(id)) this.s.set(id, 0); }
  get(id) { return this.s.get(id) || 0; }
  remove(id) { this.s.delete(id); }
  /** [{ id, score, rank }] best first; equal scores share the rank, ties broken by id for a stable order. */
  ranking() {
    const a = [...this.s].map(([id, score]) => ({ id, score })).sort((x, y) => y.score - x.score || x.id - y.id);
    a.forEach((e, i) => { e.rank = i > 0 && e.score === a[i - 1].score ? a[i - 1].rank : i + 1; });
    return a;
  }
  /** Wire form [[id, score], ...]; decode refuses anything that is not a short list of integer pairs. */
  encode() { return [...this.s]; }
  load(a) {
    if (!Array.isArray(a) || a.length > 16 || a.some((p) => !Array.isArray(p) || p.length !== 2 || !Number.isInteger(p[0]) || !Number.isFinite(p[1]) || p[1] < -1e6 || p[1] > 1e9)) return false;
    this.s = new Map(a.map(([id, s]) => [id, Math.round(s)])); return true;
  }
}

/** A spawn point for a respawning player: the first of up to 30 random spots on a ring around the centre that `isFree` accepts. */
export function pickSpawn(rnd, w, d, isFree) {
  const r = Math.min(w, d) * 0.32;
  for (let k = 0; k < 30; k++) {
    const a = rnd() * Math.PI * 2, x = Math.cos(a) * r * (0.4 + rnd() * 0.6), z = Math.sin(a) * r * (0.4 + rnd() * 0.6);
    if (isFree(x, 1, z)) return { x, z };
  }
  return { x: 0, z: 4 };
}
/** Biome of an arena from the room seed (1..20), the same on every machine. */
export const arenaBiome = (seed) => 1 + (Math.abs(Math.floor(seed)) % 20);
