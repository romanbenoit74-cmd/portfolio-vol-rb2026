// AABB / ramp collision for the player capsule (cylinder) and flying sphere enemies.
import { clamp } from '../core/core.js';

export const STEP = 0.45;

export function rampTop(c, x, z) {
  const ax = c.ramp.axis === 'x';
  const lo = ax ? c.min.x : c.min.z, hi = ax ? c.max.x : c.max.z;
  let t = (clamp(ax ? x : z, lo, hi) - lo) / (hi - lo);
  if (c.ramp.dir < 0) t = 1 - t;
  return c.min.y + (c.max.y - c.min.y) * t;
}
export const topAt = (c, x, z) => (c.ramp ? rampTop(c, x, z) : c.max.y);

// body: {pos(feet), vel, radius, height, onGround, wall:{x,z}|null}
export function moveBody(b, level, dt) {
  const cols = level.colliders, r = b.radius;
  b.wall = null;
  b.pos.x += b.vel.x * dt; b.pos.z += b.vel.z * dt;
  const feet = b.pos.y, head = feet + b.height;
  for (const c of cols) {
    if (head <= c.min.y + 0.02) continue;
    const cx = clamp(b.pos.x, c.min.x, c.max.x), cz = clamp(b.pos.z, c.min.z, c.max.z);
    if (feet >= topAt(c, cx, cz) - STEP) continue;
    let dx = b.pos.x - cx, dz = b.pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    let nx, nz;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2); nx = dx / d; nz = dz / d;
      b.pos.x += nx * (r - d); b.pos.z += nz * (r - d);
    } else {
      const l = b.pos.x - c.min.x, rr = c.max.x - b.pos.x, f = b.pos.z - c.min.z, bk = c.max.z - b.pos.z;
      const m = Math.min(l, rr, f, bk);
      nx = nz = 0;
      if (m === l) { nx = -1; b.pos.x = c.min.x - r; } else if (m === rr) { nx = 1; b.pos.x = c.max.x + r; }
      else if (m === f) { nz = -1; b.pos.z = c.min.z - r; } else { nz = 1; b.pos.z = c.max.z + r; }
    }
    b.wall = { x: nx, z: nz };
    const dot = b.vel.x * nx + b.vel.z * nz;
    if (dot < 0) { b.vel.x -= dot * nx; b.vel.z -= dot * nz; }
  }
  // room walls
  const hw = level.w / 2 - r, hd = level.d / 2 - r;
  if (b.pos.x < -hw) { b.pos.x = -hw; b.wall = { x: 1, z: 0 }; if (b.vel.x < 0) b.vel.x = 0; }
  if (b.pos.x > hw) { b.pos.x = hw; b.wall = { x: -1, z: 0 }; if (b.vel.x > 0) b.vel.x = 0; }
  if (b.pos.z < -hd) { b.pos.z = -hd; b.wall = { x: 0, z: 1 }; if (b.vel.z < 0) b.vel.z = 0; }
  if (b.pos.z > hd) { b.pos.z = hd; b.wall = { x: 0, z: -1 }; if (b.vel.z > 0) b.vel.z = 0; }

  // vertical
  const prevFeet = b.pos.y, prevHead = prevFeet + b.height;
  b.pos.y += b.vel.y * dt;
  let ground = 0, ceil = level.h, stand = null;
  const gr = r * 0.7;
  const hl = level.hole, inHole = hl && hl.z > 0 && Math.hypot(b.pos.x - hl.x, b.pos.z - hl.y) < hl.z - 0.35;
  if (inHole) ground = -1e6;
  else for (const c of cols) {
    if (b.pos.x < c.min.x - gr || b.pos.x > c.max.x + gr || b.pos.z < c.min.z - gr || b.pos.z > c.max.z + gr) continue;
    const top = topAt(c, b.pos.x, b.pos.z);
    if (top <= prevFeet + STEP) { if (top > ground) { ground = top; stand = c; } }
    else if (c.min.y >= prevHead - 0.05 && c.min.y < ceil) ceil = c.min.y;
  }
  if (b.pos.y + b.height > ceil) { b.pos.y = ceil - b.height; if (b.vel.y > 0) b.vel.y = 0; }
  const was = b.onGround;
  if (b.pos.y <= ground + 0.001 && b.vel.y <= 0) { b.pos.y = ground; b.vel.y = 0; b.onGround = true; }
  else if (was && b.vel.y <= 0 && b.pos.y - ground < 0.3) { b.pos.y = ground; b.vel.y = 0; b.onGround = true; }
  else b.onGround = false;
  b.stand = b.onGround ? stand : null;
}

// Push a sphere out of solids + room bounds. Returns nothing; mutates pos.
export function pushSphere(pos, r, level) {
  for (const c of level.colliders) {
    const cx = clamp(pos.x, c.min.x, c.max.x), cy = clamp(pos.y, c.min.y, c.max.y), cz = clamp(pos.z, c.min.z, c.max.z);
    const dx = pos.x - cx, dy = pos.y - cy, dz = pos.z - cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; pos.x += dx * k; pos.y += dy * k; pos.z += dz * k; }
    else pos.y = c.max.y + r;
  }
  pos.x = clamp(pos.x, -level.w / 2 + r, level.w / 2 - r);
  pos.z = clamp(pos.z, -level.d / 2 + r, level.d / 2 - r);
  pos.y = clamp(pos.y, r, level.h - r);
}

export function sphereFree(level, x, y, z, r) {
  for (const c of level.colliders) {
    const cx = clamp(x, c.min.x, c.max.x), cy = clamp(y, c.min.y, c.max.y), cz = clamp(z, c.min.z, c.max.z);
    if ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 < r * r) return false;
  }
  return true;
}
