// Parkour reach rules: what a room may ask of the player, derived from the movement tuning (player/Moves.js).
// Pure (no three): the level generator places platforms with it and test/parkour.test.mjs checks every floor with it.
// Supports are plain rectangles { x0, x1, z0, z1, y } (y = top); moving ones also carry at(t) -> rectangle at time t.
import { CFG } from '../player/Moves.js';
import { STEP } from './Physics.js';
import { SURF, launchV } from './Surfaces.js';

const G = CFG.gravity, VD = launchV(CFG.djH);
export const BODY = { r: 0.4, h: 1.8 };
// a jump profile: feet rise of the first impulse and with the double jump at its apex (bounce pads and wall kicks have their own);
// a propulseur also sets the forward speed and the only direction it sends you. LIMITS: the player's own jump, no dash.
export const LIMITS = { rise1: CFG.jumpH, rise2: CFG.jumpH + CFG.djH };
export const jumpOf = (rise1, speed, dir) => ({ rise1, rise2: rise1 + CFG.djH, speed, dir });
export const ENVELOPE = { h: 0.8, d: 0.75, speed: CFG.sprint, window: 0.3 }; // window: share of a mover's cycle a jump must work
export const MAX_RISE = { single: LIMITS.rise1 * ENVELOPE.h, double: LIMITS.rise2 * ENVELOPE.h }; // 3.2 m · 5.2 m

/** Seconds in the air from take-off until the feet come back down to dy (m, relative); the double jump is used at the apex. -1: too high. */
export function airTime(dy, dj = true, jump = LIMITS) {
  const apex = dj ? jump.rise2 : jump.rise1;
  if (dy > apex) return -1;
  return launchV(jump.rise1) / G + (dj ? VD / G : 0) + Math.sqrt((2 * (apex - dy)) / G);
}
/** Longest edge-to-edge gap (m) for a height change dy, inside the design envelope. -1: too high. */
export function maxGap(dy, dj = true, jump = LIMITS) {
  const t = airTime(dy, dj, jump);
  return t < 0 ? -1 : t * (jump.speed ?? ENVELOPE.speed) * ENVELOPE.d;
}
/** Highest rise allowed from a support at height y in a room of height h (the head must clear the ceiling). */
export const maxRise = (y, h = Infinity, jump = LIMITS) => Math.min(jump.rise2 * ENVELOPE.h, h - BODY.h - 0.3 - y);

export const gapBetween = (a, b) => Math.hypot(Math.max(0, b.x0 - a.x1, a.x0 - b.x1), Math.max(0, b.z0 - a.z1, a.z0 - b.z1));
const sticksOut = (a, b, m) => a.x0 < b.x0 - m || a.x1 > b.x1 + m || a.z0 < b.z0 - m || a.z1 > b.z1 + m;

/** Can the player get from the top of a onto the top of b (design envelope)? h: room height; a.jump: the launch profile of a. */
export function canJump(a, b, h = Infinity, jump = a.jump || LIMITS) {
  const dy = b.y - a.y;
  if (dy > STEP && dy > maxRise(a.y, h, jump)) return false;
  // b right above a: the jump must start from a part of a that sticks out from under b
  if (dy > 0 && gapBetween(a, b) === 0 && !sticksOut(a, b, 0.8)) return false;
  if (jump.dir) { // a propulseur only sends you ahead (within about 35°)
    const dx = (b.x0 + b.x1 - a.x0 - a.x1) / 2, dz = (b.z0 + b.z1 - a.z0 - a.z1) / 2, L = Math.hypot(dx, dz);
    if (L > 0.5 && (dx * jump.dir.x + dz * jump.dir.z) / L < 0.82) return false;
  }
  return gapBetween(a, b) <= maxGap(Math.max(dy, 0), true, jump);
}

const SAMPLES = Array.from({ length: 96 }, (_, i) => i * 0.25); // 24 s of mover motion
const rectAt = (n, t) => (n.at ? n.at(t) : n);
/** Share of the sampled times where test(rectA, rectB) holds (1 or 0 when nothing moves). */
function share(a, b, test) {
  if (!a.at && !b.at) return test(a, b) ? 1 : 0;
  let k = 0;
  for (const t of SAMPLES) if (test(rectAt(a, t), rectAt(b, t))) k++;
  return k / SAMPLES.length;
}

/** Does a jump from support a land on support b often enough (movers: share of their cycle)? */
export const linked = (a, b, h = Infinity) => share(a, b, (ra, rb) => canJump(ra, rb, h, a.jump || LIMITS)) >= ENVELOPE.window;

/**
 * Supports reachable from the floor (indices into nodes). The floor reaches a node when its top is low enough and
 * o.floorNear(node) says there is free floor next to it; node.walk marks ramps (walked onto from the floor).
 */
export function reachable(nodes, { h = Infinity, floorNear = () => true } = {}) {
  const seen = new Set(), queue = [];
  const fromFloor = (n) => floorNear(n) && (n.walk || share(n, n, (r) => r.y <= Math.max(STEP, maxRise(0, h))) >= ENVELOPE.window);
  nodes.forEach((n, i) => { if (n.kick ? floorNear(n) : fromFloor(n)) { seen.add(i); queue.push(i); } });
  while (queue.length) {
    const a = nodes[queue.shift()];
    nodes.forEach((b, j) => {
      if (seen.has(j) || !linked(a, b, h)) return;
      seen.add(j); queue.push(j);
    });
  }
  return seen;
}

/** Box covering a collider over its whole motion (a moving platform's run, a lift's column): { min, max } as plain xyz. */
export function sweptBox(c) {
  const m = c.mover, e = (ax) => (m && m.type === ax ? m.amp : 0), ey = m && m.type === 'lift' ? m.amp : 0;
  return { min: { x: c.min.x - e('x'), y: c.min.y - ey, z: c.min.z - e('z') }, max: { x: c.max.x + e('x'), y: c.max.y + ey, z: c.max.z + e('z') } };
}
/** Sine motion shared by the level's moving platforms: offset along the mover's axis at time t. */
export const moverOffset = (m, t) => Math.sin(t * m.speed + m.phase) * m.amp;

/**
 * Supports of a built level (plain collider data: { min, max, ramp, mover, role, pk, kind, bounceH }): every top a player
 * can stand on, except full-height pillars, plus a launch strip in front of each wall-kick panel (jumped at from the floor).
 * Returns { nodes, floorNear } ready for reachable().
 */
export function levelSupports(level) {
  const { w, d, h } = level, cols = level.colliders, nodes = [];
  for (const c of cols) {
    if (c.kind === 'wall') { // wall kick: jump at the panel, kick off it, double jump (lands in front of either face)
      const ax = c.max.x - c.min.x < c.max.z - c.min.z, s = 0.6, k = SURF.kick, jump = jumpOf(k.rise);
      for (const side of [-1, 1]) {
        const r = ax ? { x0: side < 0 ? c.min.x - s : c.max.x, x1: side < 0 ? c.min.x : c.max.x + s, z0: c.min.z, z1: c.max.z }
          : { x0: c.min.x, x1: c.max.x, z0: side < 0 ? c.min.z - s : c.max.z, z1: side < 0 ? c.min.z : c.max.z + s };
        nodes.push({ ...r, y: Math.min(k.contact, c.max.y - 1), col: c, kick: true, jump });
      }
    }
    if (c.max.y >= h - 0.5) continue; // pillar up to the ceiling
    const n = { x0: c.min.x, x1: c.max.x, z0: c.min.z, z1: c.max.z, y: c.max.y, col: c };
    if (c.kind === 'bounce') n.jump = jumpOf(c.bounceH);
    else if (c.kind === 'launch') n.jump = jumpOf(c.bounceH, SURF.launch.push, c.dir);
    if (c.ramp) { // the high end of a ramp, reached by walking up from the floor
      const ax = c.ramp.axis === 'x', hi = c.ramp.dir > 0;
      if (ax) { if (hi) n.x0 = c.max.x - 1; else n.x1 = c.min.x + 1; } else if (hi) n.z0 = c.max.z - 1; else n.z1 = c.min.z + 1;
      n.walk = c.min.y < STEP;
    }
    if (c.mover) {
      const m = c.mover, hx = (c.max.x - c.min.x) / 2, hz = (c.max.z - c.min.z) / 2, ht = (c.max.y - c.min.y) / 2;
      n.at = (t) => {
        const o = moverOffset(m, t), x = m.base.x + (m.type === 'x' ? o : 0), z = m.base.z + (m.type === 'z' ? o : 0), y = m.base.y + (m.type === 'lift' ? o : 0);
        return { x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz, y: y + ht };
      };
    }
    nodes.push(n);
  }
  // free floor right next to a support: inside the room and not inside anything the body bumps into
  const blocked = (x, z) => Math.abs(x) > w / 2 - BODY.r || Math.abs(z) > d / 2 - BODY.r
    || cols.some((c) => !c.mover && !c.ramp && c.max.y > STEP && c.min.y < BODY.h && x > c.min.x - BODY.r && x < c.max.x + BODY.r && z > c.min.z - BODY.r && z < c.max.z + BODY.r);
  const floorNear = (n) => {
    const r = rectAt(n, 0), m = BODY.r + 0.3, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    if (n.at && n.col.mover.type !== 'lift') return true; // a sliding platform sweeps a long strip of floor
    return [[r.x0 - m, cz], [r.x1 + m, cz], [cx, r.z0 - m], [cx, r.z1 + m], [r.x0 - m, r.z0 - m], [r.x1 + m, r.z0 - m], [r.x0 - m, r.z1 + m], [r.x1 + m, r.z1 + m]].some(([x, z]) => !blocked(x, z));
  };
  return { nodes, floorNear };
}

/**
 * Floor connectivity: cells of a 0.5 m grid not blocked by anything taller than the double-jump envelope must form one region
 * (lower obstacles can be jumped over). Returns the number of cut-off cells.
 */
export function cutOffCells(level, cell = 0.5) {
  const { w, d } = level, nx = Math.floor(w / cell), nz = Math.floor(d / cell), tall = level.colliders.filter((c) => !c.mover && c.min.y < BODY.h && c.max.y > MAX_RISE.double);
  const free = new Uint8Array(nx * nz);
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    const x = -w / 2 + (i + 0.5) * cell, z = -d / 2 + (k + 0.5) * cell;
    if (Math.abs(x) > w / 2 - BODY.r || Math.abs(z) > d / 2 - BODY.r) continue;
    if (tall.some((c) => x > c.min.x - BODY.r && x < c.max.x + BODY.r && z > c.min.z - BODY.r && z < c.max.z + BODY.r)) continue;
    free[i * nz + k] = 1;
  }
  const total = free.reduce((s, v) => s + v, 0), start = free.indexOf(1);
  if (start < 0) return 0;
  const stack = [start]; free[start] = 2; let n = 1;
  while (stack.length) {
    const c = stack.pop(), i = Math.floor(c / nz), k = c % nz;
    for (const [a, b] of [[i + 1, k], [i - 1, k], [i, k + 1], [i, k - 1]]) {
      if (a < 0 || b < 0 || a >= nx || b >= nz || free[a * nz + b] !== 1) continue;
      free[a * nz + b] = 2; n++; stack.push(a * nz + b);
    }
  }
  return total - n;
}
