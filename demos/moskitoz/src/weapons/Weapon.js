// Common interface of the arsenal (spec §11): one object per weapon (key 2, left / right click) or hand power (key F).
// Combat.js owns the shared helpers (hit, strike, cones, fx) and delegates to the equipped object.
export class Weapon {
  constructor(combat) { this.c = combat; this.g = combat.g; this.p = combat.p; this.cd = 0; }
  get st() { return this.p.stats; }
  get enemies() { return this.g.enemies.list; }
  equip() {}
  unequip() {}
  down() {} // left click / F pressed
  up() {} // left click / F released
  alt() {} // right click
  update(dt) { this.cd -= dt; } // runs every frame, equipped or not (clouds, traps, projectiles keep living)
  reset() { this.cd = 0; }
  hud() { return 0; } // HUD ring: part of the cooldown still to go, 0..1
}

/** Distance to the first wall / prop / floor / ceiling along a ray (marching), capped at max. */
export function march(level, o, d, max, step = 0.25) {
  if (!level) return max;
  for (let t = step; t <= max; t += step) {
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    if (y <= 0 || y >= level.h || Math.abs(x) >= level.w / 2 || Math.abs(z) >= level.d / 2 || !level.isFree(x, y, z, 0.05)) return t;
  }
  return max;
}
