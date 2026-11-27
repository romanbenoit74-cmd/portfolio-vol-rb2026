// Toit (the tower roof, intro floor): the hand-placed boxes of Level.buildRoof() get looks — air-conditioning units with a
// fan grille, a stairwell hut with its door, a water tank on steel legs — plus vents, puddles and gravel on the floor.
import { NC, NO, alongX } from './common.js';

const M = (K) => ({
  metal: K.m('#D8E2EA', { rim: 0.3 }), metalD: K.m('#9AA8B4'), grille: K.m('#5A6878', { pattern: 'grid', color2: '#3A4654', scale: 0.08 }), fan: K.m('#2E3A48'),
  plaster: K.m('#F2E2C8', { rim: 0.1 }), trim: K.m('#C9B89A'), door: K.m('#B8763C', { pattern: 'planks', scale: 0.25 }), knob: K.m('#FFC62E', { rim: 0.5 }),
  tank: K.m('#C8D8E4', { pattern: 'stripes', color2: '#B8C8D6', scale: 0.4, rim: 0.3 }), water: K.m('#9FD4F0', { rim: 0.5 }), gravel: K.m('#A8B0BC', { pattern: 'dots', color2: '#949CA8', scale: 0.12 }),
});

function ac(K, g, b) { // AC unit: metal casing, round fan grille on top, side louvres
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, 0.1), m.metal, 0, H / 2, 0);
  const R = Math.min(L, T) * 0.36; K.add(g, K.cyl(R, R, 0.06, 0.02, 24), m.grille, -L * 0.18, H + 0.02, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < 3; i++) K.add(g, K.box(R * 1.8, 0.03, 0.16, 0.01), m.fan, -L * 0.18, H + 0.06, 0, 0, (i * Math.PI) / 3, 0, 1, NO);
  for (const s of [-1, 1]) for (let y = 0.35; y < H - 0.2; y += 0.22) K.add(g, K.box(L * 0.55, 0.05, 0.03, 0.01), m.metalD, L * 0.15, y, s * (T / 2 + 0.01), 0, 0, 0, 1, NO);
}
function hut(K, g, b) { // stairwell hut: plaster box, flat roof slab, vent pipe
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H - 0.2, b.d, 0.08), m.plaster, 0, (H - 0.2) / 2, 0);
  K.add(g, K.box(b.w + 0.3, 0.2, b.d + 0.3, 0.06), m.trim, 0, H - 0.1, 0, 0, 0, 0, 1, NC);
  K.add(g, K.cyl(0.18, 0.18, 0.6, 0.04, 12), m.metalD, b.w * 0.3, H + 0.3, b.d * 0.2, 0, 0, 0, 1, NC);
}
function door(K, g, b) { const m = M(K); K.add(g, K.box(b.w, b.h, b.d + 0.04, 0.02), m.door, 0, b.h / 2, 0, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.07, 8, 6), m.knob, b.w * 0.35, b.h * 0.45, -b.d / 2 - 0.05, 0, 0, 0, 1, NO); }
function leg(K, g, b) { const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.04), m.metalD, 0, b.h / 2, 0); }
function tank(K, g, b) { // water tank: banded drum with a domed lid
  const m = M(K), R = b.r ?? b.w / 2;
  K.add(g, K.cyl(R, R, b.h, 0.1, 28), m.tank, 0, b.h / 2, 0);
  K.add(g, K.sphere(R, 24, 10), m.metal, 0, b.h, 0, 0, 0, 0, [1, 0.25, 1], NC);
  for (const y of [0.3, b.h - 0.3]) K.add(g, K.torus(R * 1.01, 0.05, 6, 32), m.metalD, 0, y, 0, Math.PI / 2, 0, 0, 1, NO);
}

export default {
  looks: { ac, hut, door, leg, tank },
  sol: [
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.cyl(0.25, 0.25, 0.9, 0.04, 12), m.metalD, 0, 0.45, 0); K.add(g, K.cyl(0.4, 0.3, 0.2, 0.05, 12), m.metal, 0, 0.95, 0, 0, 0, 0, 1, NC); } }, // vent
    { r: 1.4, make(K, g) { K.add(g, K.cyl(1.2, 1.2, 0.02, 0.01, 20), M(K).water, 0, 0.012, 0, 0, 0, 0, [1, 1, 0.6], NO); } },
    { r: 1.8, make(K, g) { K.add(g, K.box(3, 0.03, 2, 0.015), M(K).gravel, 0, 0.015, 0, 0, 0, 0, 1, NO); } },
  ],
};
