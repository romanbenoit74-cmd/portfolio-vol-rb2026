// Arsenal tuning (spec §10) and the pure rules behind it: no three.js here, so node --test can check damage,
// cooldowns, pressure, corrosion and hit selection. The weapon classes (src/weapons/*.js) read these numbers.

export const SPEC = {
  racket: {
    cd: 0.38, dmg: 15, range: 2.8, kb: 5,
    // right click: Grande Claque — the racket grows, then one wide slap that throws everything in front back and stuns it
    big: { cd: 5, windup: 0.24, dmg: 22, range: 4.6, dot: 0.1, kb: 16, up: 1.4, stun: 0.6, grow: 2.2 },
  },
  spray: { cd: 4, dmg: 8, poison: 3, r: 5, life: 3, tick: 0.6 },
  trap: { cd: 2.5, life: 25, max: 3, glue: 2, r: 1.5 },
  jumeaux: {
    rate: 8, dmg: 4, speed: 45, grav: 6, range: 16, slow: 1.2, bonus: 1.5, pair: 1, // pair: s between a green and a yellow hit
    corr: { dps: 1, life: 3, max: 5 },
    pressure: { max: 100, shot: 5, regen: 60, delay: 0.4 },
    burst: { dmg: 12, n: 2, cone: 20, range: 7, cost: 30, cd: 0.5 },
  },
  doigt: { charge: 0.5, dmg: 40, range: 30, width: 0.35, cd: 3, kb: 14 },
  grappin: { range: 30, cd: 4, dmg: 10, stun: 1.2, pullT: 0.35, reel: 7, swingT: 1.4, lift: 6 },
  toile: { range: 28, cd: 3.5, dmg: 14, stun: 2.5, r: 2.2, max: 3, zip: 15, zipT: 0.35 },
  mille: { dur: 1.5, every: 0.06, dmg: 9, range: 3.2, dot: 0.2, finisher: 30, cd: 10 },
  // arsenal v2 (phase 10)
  aspi: { range: 6, cone: 28, pull: 9, grab: 1.3, max: 5, suckDps: 6, speed: 26, grav: 9, blast: 3.6, base: 18, per: 12, puff: 3, cd: 0.6 },
  tapette: { windup: 0.32, dmg: 55, range: 3.6, dot: 0.45, squash: 0.45, wave: 5, waveDmg: 12, stun: 0.8, low: 2.6, cd: 1.1 },
  citro: { speed: 17, up: 6, grav: 16, hit: 16, r: 3, life: 5, dps: 8, push: 4, max: 4, cd: 1.1 },
  tourbillon: { speed: 6, life: 1.8, drill: 1.4, drillDps: 35, pull: 6.5, force: 22, burst: 60, burstR: 4.5, cd: 8 },
  clap: { windup: 0.28, r: 9, grow: 0.5, dmg: 55, stun: 1.5, low: 3, cd: 7 },
  onde: { charge: 1, dur: 1.2, range: 30, width: 1.1, dps: 160, cd: 12 },
};
/** mosquitoes the Aspirateur can swallow / the Tapette squashes in one blow: the small ones (scale ≤ threshold), never a boss */
export const isSmall = (def, max = 0.6) => !def.boss && def.scale <= max;
/** Aspirateur ball: blast damage for n swallowed mosquitoes (a puff when empty) */
export const aspiBlast = (n, o = SPEC.aspi) => (n > 0 ? o.base + o.per * n : o.puff);
/** Clap Sismique: radius of the ground wave t seconds after the slam (0 before, r once grown) */
export const clapRadius = (t, o = SPEC.clap) => (t <= 0 ? 0 : Math.min(o.r, (o.r * t) / o.grow));
/** Balance weights: average number of mosquitoes one use reaches, × safety (ranged 1.3, melee 0.8). Design estimates. */
export const REACH = { raquette: 1.6 * 0.8, brumi: 3, pieges: 0, jumeaux: 1.3, aspi: 2.5, tapette: 1.3 * 0.8, citro: 2.5 * 1.3, doigt: 2 * 1.3, grappin: 1, mille: 2 * 0.8, tourbillon: 3, clap: 4, toile: 2, onde: 3 * 1.3 };
/** Balance value of an item: sustained single-target dps × REACH (control items — Pièges, Grappin — are valued elsewhere). */
export const valueOf = (id, o = SPEC) => dpsOf(id, o) * (REACH[id] ?? 1);
/** Sustained damage per second on one target in reach, for balancing (hits land, no crits; cloud / zone / corrosion averaged). */
export function dpsOf(id, o = SPEC) {
  const J = o.jumeaux;
  switch (id) {
    case 'raquette': return o.racket.dmg / o.racket.cd;
    case 'brumi': return ((o.spray.dmg * Math.ceil(o.spray.life / o.spray.tick)) + o.spray.poison * 5) / o.spray.cd;
    case 'pieges': return 0; // control only
    case 'jumeaux': return J.rate * J.dmg * (1 + J.bonus) / 2 + J.corr.dps * J.corr.max;
    case 'aspi': return (aspiBlast(o.aspi.max, o.aspi) / (o.aspi.max * 0.7 + o.aspi.cd)) + o.aspi.suckDps;
    case 'tapette': return (o.tapette.dmg + o.tapette.waveDmg) / o.tapette.cd;
    case 'citro': return o.citro.hit / o.citro.cd + o.citro.dps * Math.min(o.citro.max, o.citro.life / o.citro.cd) * 0.35;
    case 'doigt': return o.doigt.dmg / (o.doigt.cd + o.doigt.charge);
    case 'grappin': return o.grappin.dmg / o.grappin.cd;
    case 'toile': return o.toile.dmg / o.toile.cd;
    case 'mille': return (o.mille.dmg * milleHits(o.mille) + o.mille.finisher) / o.mille.cd;
    case 'tourbillon': return (o.tourbillon.drillDps * o.tourbillon.life * 0.6 + o.tourbillon.burst) / o.tourbillon.cd;
    case 'clap': return o.clap.dmg / o.clap.cd;
    case 'onde': return (o.onde.dps * o.onde.dur) / (o.onde.cd + o.onde.charge);
    default: return 0;
  }
}

/** weapon cooldown: global cooldown bonus, then the s35 fire-rate bonus */
export const weaponCd = (base, st) => (base * (st.cdMul ?? 1)) / (st.rateMul ?? 1);
/** hand power cooldown: global cooldown bonus and the s65 power bonus */
export const powerCd = (base, st) => base * (st.cdMul ?? 1) * (st.powerCdMul ?? 1);

/** Jumeaux pressure gauge: 5 per shot, 30 per double squirt, refills at 60/s after 0.4 s without firing. */
export class Pressure {
  constructor(o = SPEC.jumeaux.pressure) { this.o = o; this.v = o.max; this.idle = 0; }
  spend(n) { if (this.v < n) return false; this.v -= n; this.idle = 0; return true; }
  update(dt) { this.idle += dt; if (this.idle >= this.o.delay) this.v = Math.min(this.o.max, this.v + this.o.regen * dt); }
  get ratio() { return this.v / this.o.max; }
}

/** Corrosion (yellow jet): +1 dmg/s per stack, 5 stacks max, each hit refreshes the 3 s timer. Returns damage for dt. */
export function corrode(s, dt, o = SPEC.jumeaux.corr) {
  if (!s || s.t <= 0) return 0;
  const d = Math.min(dt, s.t); s.t -= dt;
  return s.n * o.dps * d;
}
export function addCorrosion(s, o = SPEC.jumeaux.corr) {
  s = s || { n: 0, t: 0 }; s.n = Math.min(o.max, s.n + 1); s.t = o.life; return s;
}
/** Twin bonus: a jet that lands on a target hit by the other colour less than `pair` s ago deals ×bonus. */
export function twinMul(mark, colour, now, o = SPEC.jumeaux) {
  const other = colour === 'vert' ? mark.jaune : mark.vert;
  return other != null && now - other <= o.pair ? o.bonus : 1;
}

/** Targets pierced by a ray (Doigt-Canon): every {pos, radius} within width of the segment, sorted by distance. */
export function pierce(origin, dir, targets, range, width) {
  const out = [];
  for (const e of targets) {
    const rx = e.pos.x - origin.x, ry = e.pos.y - origin.y, rz = e.pos.z - origin.z;
    const t = rx * dir.x + ry * dir.y + rz * dir.z; if (t < 0 || t > range) continue;
    const px = rx - dir.x * t, py = ry - dir.y * t, pz = rz - dir.z * t;
    if (px * px + py * py + pz * pz <= (e.radius + width) ** 2) out.push({ e, t });
  }
  return out.sort((a, b) => a.t - b.t).map((h) => h.e);
}
/** Cone test (double squirt, Mille Claques): within range and half-angle `deg` of dir. */
export function inCone(origin, dir, p, range, deg) {
  const x = p.x - origin.x, y = p.y - origin.y, z = p.z - origin.z, d = Math.hypot(x, y, z);
  if (d > range) return false; if (d < 1e-6) return true;
  return (x * dir.x + y * dir.y + z * dir.z) / d >= Math.cos((deg * Math.PI) / 180);
}
/** Number of slaps in one Mille Claques burst (the finisher comes on top). */
export function milleHits(o = SPEC.mille) { return Math.floor(o.dur / o.every + 1e-9); }
