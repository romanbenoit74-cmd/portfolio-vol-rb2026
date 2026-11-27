// Core utilities: EventBus, spring physics, math helpers.
export class EventBus {
  constructor() { this.m = new Map(); }
  on(e, f) {
    let a = this.m.get(e);
    if (!a) this.m.set(e, (a = []));
    a.push(f);
    return () => this.off(e, f);
  }
  off(e, f) {
    const a = this.m.get(e);
    if (!a) return;
    const i = a.indexOf(f);
    if (i >= 0) a.splice(i, 1);
  }
  emit(e, d) {
    const a = this.m.get(e);
    if (a) for (const f of a.slice()) f(d);
  }
}
export const bus = new EventBus();

// Sub-stepped damped spring (stable for any dt).
export class Spring {
  constructor(v = 0, k = 120, c = 14) { this.x = v; this.v = 0; this.t = v; this.k = k; this.c = c; }
  update(dt) {
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += ((this.t - this.x) * this.k - this.v * this.c) * h;
      this.x += this.v * h;
    }
    return this.x;
  }
  kick(a) { this.v += a; }
  snap(v) { this.x = this.t = v; this.v = 0; }
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DIFFICULTY = {
  easy: { name: 'Facile', hp: 0.8, dmg: 0.5, spawn: 1.5, zones: 3 },
  normal: { name: 'Normal', hp: 1.0, dmg: 1.0, spawn: 1.0, zones: 2 },
  hard: { name: 'Difficile', hp: 1.5, dmg: 1.5, spawn: 0.6, zones: 2 },
};
