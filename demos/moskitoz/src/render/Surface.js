// Height of the walkable surface under a point (pure, tested): floor (0) or the top of the highest collider below it.
// Used to lay splats where a mosquito dies. Colliders are the level AABBs ({ min, max, ramp: { axis, dir } | null }).
export function surfaceBelow(colliders, x, y, z) {
  let top = 0;
  for (const c of colliders) {
    if (x < c.min.x || x > c.max.x || z < c.min.z || z > c.max.z) continue;
    let h = c.max.y;
    if (c.ramp) {
      const a = c.ramp.axis === 'x' ? (x - c.min.x) / (c.max.x - c.min.x) : (z - c.min.z) / (c.max.z - c.min.z);
      h = c.min.y + (c.max.y - c.min.y) * (c.ramp.dir > 0 ? a : 1 - a);
    }
    if (h <= y + 1e-3 && h > top) top = h;
  }
  return top;
}
