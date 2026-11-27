// Serre: raised beds of lettuces and tomatoes with plant tags, banded terracotta pots, potting benches with tools, glass partitions
// in white frames with glints, white iron columns with scrolled capitals and vines, hanging slatted shelves, plank ramps with
// stringers, giant pots as parkour; tomato trellises, cactus shelves, a watering can, a hose reel and hanging baskets on the walls;
// hose coils, seed trays, paving stones, soil spills and puddles on the floor.
import { NC, NO, alongX, parkour, spread, square } from './common.js';
import { roundedBox } from '../../render/Style.js';

const bx = (w, h, d, r) => roundedBox(w, h, d, r, 1); // light bevelled box (108 triangles instead of 300): trims and secondary parts
const lt = (K, rt, rb, h, seg = 12) => K.lathe([[0, -h / 2], [rb, -h / 2], [rt, h / 2], [0, h / 2]], seg); // cheap straight cylinder / cone frustum
const M = (K) => ({
  wood: K.m('#D8A868', { pattern: 'planks', scale: 0.3 }), woodD: K.m('#B08048'), soil: K.m('#6A4A30', { ao: 1 }), terra: K.m('#E0784A', { rim: 0.12 }), terraD: K.m('#C4623A'),
  lettuce: K.m('#8EE06A', { rim: 0.25 }), leaf: K.m('#48C870', { rim: 0.15 }), leafD: K.m('#34A85A'), leafL: K.m('#7EE29A', { rim: 0.2 }), tomato: K.m('#FF6F61', { rim: 0.4 }), white: K.m('#F4FBF8', { rim: 0.15 }),
  glass: K.m('#CFF6E6', { rim: 0.6, rimColor: '#FFFFFF' }), cactus: K.m('#5AB86A', { pattern: 'stripes', color2: '#4AA85A', scale: 0.12 }), hose: K.m('#3AC87A', { rim: 0.3 }), can: K.m('#4AA8E8', { rim: 0.3 }),
  tray: K.m('#2E3A34'), water: K.m('#9FE8FF', { rim: 0.4 }), brass: K.m('#F2C14E', { rim: 0.4 }), stone: K.m('#CFD8D2', { rim: 0.1 }), label: K.m('#FFF3D0'),
});

function sprout(K, g, m, x, y, z) { // lettuce rosette (centre + frilly leaves) or a staked tomato plant
  if (K.rnd() < 0.6) {
    K.add(g, K.sphere(0.2, 10, 8), m.lettuce, x, y + 0.12, z, 0, K.rnd() * 3, 0, [1, 0.7, 1], NC);
    for (let i = 0; i < 2; i++) { const a = i * 3.1 + K.rnd(); K.add(g, K.sphere(0.15, 6, 4), m.leafL, x + Math.cos(a) * 0.17, y + 0.1, z + Math.sin(a) * 0.17, 0, -a, 0.3, [1.2, 0.5, 0.8], NO); }
  } else {
    K.add(g, lt(K, 0.02, 0.02, 0.5, 4), m.woodD, x, y + 0.25, z, 0, 0, 0, 1, NO);
    K.add(g, K.sphere(0.2, 8, 6), m.leafD, x, y + 0.17, z, 0, 0, 0, [1, 0.9, 1], NC);
    for (let i = 0; i < 3; i++) K.add(g, K.sphere(0.09, 6, 4), m.tomato, x + Math.cos(i * 2) * 0.17, y + 0.2 + i * 0.07, z + Math.sin(i * 2) * 0.17, 0, 0, 0, 1, NO);
  }
}
function sprouts(K, g, m, L, T, y) { // plants on a soil top
  for (const x of spread(Math.max(2, Math.round(L / 0.8)), L - 0.5)) for (const z of spread(Math.max(1, Math.round(T / 0.9)), T - 0.5)) sprout(K, g, m, x, y, z);
}
function bed(K, g, b) { // raised wooden bed: corner posts, rim frame, a plant label
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, 0.1), m.wood, 0, H / 2, 0); K.add(g, K.box(L - 0.25, 0.1, T - 0.25, 0.01), m.soil, 0, H - 0.02, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(L + 0.08, 0.12, T + 0.08, 0.05), m.woodD, 0, H - 0.05, 0, 0, 0, 0, 1, NC); // rim frame
  for (const x of [-1, 1]) for (const z of [-1, 1]) K.add(g, K.box(0.2, H + 0.04, 0.2, 0.01), m.woodD, x * (L / 2 - 0.08), H / 2, z * (T / 2 - 0.08), 0, 0, 0, 1, NC);
  sprouts(K, g, m, L - 0.3, T - 0.3, H + 0.02);
  K.add(g, lt(K, 0.015, 0.015, 0.3, 4), m.woodD, -L / 2 + 0.5, H + 0.17, T / 2 - 0.3, 0, 0, 0, 1, NO); K.add(g, K.box(0.14, 0.1, 0.02, 0.01), m.tomato, -L / 2 + 0.5, H + 0.34, T / 2 - 0.3, 0, 0, 0, 1, NO); // plant tag
}
function pots(K, g, b) { // big banded terracotta pot with a saucer and a leafy plant
  const m = M(K), S = Math.min(b.w, b.d), H = b.h, R = S / 2 - 0.05;
  K.add(g, K.cyl(R, R * 0.78, H - 0.15, 0.08, 16), m.terra, 0, (H - 0.15) / 2 + 0.05, 0); K.add(g, lt(K, R + 0.04, R + 0.04, 0.2, 16), m.terraD, 0, H - 0.1, 0, 0, 0, 0, 1, NC);
  K.add(g, lt(K, R * 0.9, R * 0.9, 0.04, 16), m.soil, 0, H - 0.03, 0, 0, 0, 0, 1, NO);
  K.add(g, lt(K, R * 0.86, R * 0.86, 0.08, 16), m.terraD, 0, 0.04, 0, 0, 0, 0, 1, NC); // saucer
  K.add(g, lt(K, R * 0.9, R * 0.86, 0.1, 16), m.terraD, 0, H * 0.5, 0, 0, 0, 0, 1, NC); // painted band
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; K.add(g, K.sphere(0.05, 6, 4), m.tomato, Math.cos(a) * R * 0.9, H * 0.5, Math.sin(a) * R * 0.9, 0, 0, 0, 1, NO); } // coral dots on the band
  for (let i = 0; i < 5; i++) { const a = i * 1.3; K.add(g, K.sphere(Math.min(R * 0.5, 0.5), 8, 6), [m.leaf, m.leafD][i % 2], Math.cos(a) * R * 0.34, H + 0.08 + (i % 2) * 0.06, Math.sin(a) * R * 0.34, 0, -a, Math.cos(a) * 0.3, [1, 0.32, 0.5], NC); }
  K.add(g, K.sphere(0.1, 6, 4), m.tomato, R * 0.15, H + 0.3, R * 0.1, 0, 0, 0, 1, NO);
}
function bench(K, g, b) { // potting bench: two shelves loaded with pots, solid back, a trowel on top
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T * 0.3, 0.04), m.woodD, 0, H / 2, 0, 0, 0, 0, 1, { ink: false });
  K.add(g, bx(L + 0.06, 0.14, T + 0.06, 0.05), m.wood, 0, H - 0.07, 0, 0, 0, 0, 1, NC); // top
  for (const y of [H * 0.3, H * 0.62]) { // two shelves of pots under the top
    K.add(g, bx(L, 0.12, T, 0.04), m.wood, 0, y, 0, 0, 0, 0, 1, NC);
    for (const x of spread(Math.max(2, Math.round(L / 1)), L - 0.6)) for (const s of [-1, 1]) {
      K.add(g, lt(K, 0.18, 0.13, 0.3, 10), m.terra, x, y + 0.2, s * T * 0.28, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.19, 0.19, 0.06, 10), m.terraD, x, y + 0.33, s * T * 0.28, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.2, 8, 6), K.rnd() < 0.5 ? m.leaf : m.leafL, x, y + 0.45, s * T * 0.28, 0, 0, 0, [1, 0.7, 1], NO);
    }
  }
  for (const x of [-1, 1]) K.add(g, bx(0.16, H - 0.1, T, 0.04), m.woodD, x * (L / 2 - 0.08), (H - 0.1) / 2, 0, 0, 0, 0, 1, NC);
  K.add(g, K.box(0.14, 0.04, 0.5, 0.01), m.can, L * 0.3, H + 0.02, 0.1, 0, 0.4, 0, 1, NO); K.add(g, K.box(0.1, 0.03, 0.18, 0.01), m.can, L * 0.3 - 0.1, H + 0.02, -0.22, 0, 0.4, 0, 1, NO); // trowel
}
function glassWall(K, g, b) { // glass partition: white frame, pale panes with glints, a fruiting vine along the top
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(2, Math.round(L / 1.4));
  K.add(g, K.box(L - 0.1, H - 0.1, T * 0.25, 0.02), m.glass, 0, H / 2, 0);
  for (let i = 0; i <= n; i++) K.add(g, K.box(0.12, H, T, 0.03), m.white, -L / 2 + 0.06 + (i * (L - 0.12)) / n, H / 2, 0, 0, 0, 0, 1, NC); // mullions
  for (const y of [0.1, H * 0.5, H - 0.06]) K.add(g, K.box(L, y < 0.2 ? 0.2 : 0.12, T, 0.03), m.white, 0, y, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) { const x = -L / 2 + 0.06 + ((i + 0.3) * (L - 0.12)) / n; K.add(g, K.box(0.07, H * 0.3, 0.02, 0.01), m.white, x, H * 0.72, s * T * 0.14, 0, 0, 0.5, 1, NO); K.add(g, K.box(0.04, H * 0.14, 0.02, 0.01), m.white, x + 0.18, H * 0.66, s * T * 0.14, 0, 0, 0.5, 1, NO); } // glints
  for (const x of spread(Math.max(3, Math.round(L / 0.7)), L)) { K.add(g, K.sphere(0.22, 8, 6), m.leaf, x, H - 0.1, 0, 0, 0, 0, [1, 0.6, 1.6], NO); if (K.rnd() < 0.25) K.add(g, K.sphere(0.09, 6, 4), m.tomato, x + 0.1, H - 0.3, T * 0.4, 0, 0, 0, 1, NO); }
}
function column(K, g, b) { // white iron column: flared base and scrolled capital, a vine spiralling up with leaf pairs
  const m = M(K), R = (b.r ?? b.w / 2) * 0.7, H = b.h;
  K.add(g, K.cyl(R, R, H, 0.04, 14), m.white, 0, H / 2, 0);
  K.add(g, lt(K, R * 1.5, R * 1.7, 0.3, 14), m.white, 0, 0.15, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(R * 1.1, 0.07, 4, 14), m.white, 0, 0.42, 0, Math.PI / 2, 0, 0, 1, NO); // base + bead
  K.add(g, lt(K, R * 1.7, R * 1.1, 0.34, 14), m.white, 0, H - 0.17, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(R * 1.15, 0.07, 4, 14), m.brass, 0, H - 0.4, 0, Math.PI / 2, 0, 0, 1, NO); // capital + brass ring
  for (let i = 0; i < Math.floor(H / 0.5); i++) { const a = i * 1.4; K.add(g, K.sphere(0.2, 8, 6), i % 2 ? m.leaf : m.leafD, Math.cos(a) * R, 0.6 + i * 0.5, Math.sin(a) * R, 0, a, 0, [1, 0.5, 1.4], NO); K.add(g, K.sphere(0.06, 6, 4), m.leafD, Math.cos(a + 0.7) * R * 1.02, 0.85 + i * 0.5, Math.sin(a + 0.7) * R * 1.02, 0, 0, 0, 1, NO); if (i % 5 === 2) K.add(g, K.sphere(0.09, 6, 4), m.tomato, Math.cos(a + 0.5) * R * 1.12, 0.6 + i * 0.5, Math.sin(a + 0.5) * R * 1.12, 0, 0, 0, 1, NO); }
}
function pillar(K, g, b) { // corner pier: white post on a plinth with a capital and a few climbing leaves
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w * 0.6, H, b.d * 0.6, 0.05), m.white, 0, H / 2, 0); K.add(g, K.box(b.w, 0.4, b.d, 0.06), m.white, 0, 0.2, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(b.w * 0.82, 0.3, b.d * 0.82, 0.06), m.white, 0, H - 0.15, 0, 0, 0, 0, 1, NC); K.add(g, K.box(b.w * 0.64, 0.1, b.d * 0.64, 0.01), m.brass, 0, H - 0.34, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < 5; i++) { const a = i * 1.57, y = 0.8 + i * 0.7; K.add(g, K.sphere(0.2, 6, 4), i % 2 ? m.leaf : m.leafD, Math.cos(a) * b.w * 0.33, y, Math.sin(a) * b.d * 0.33, 0, a, 0, [1, 0.5, 1.4], NO); }
}
function shelf(K, g, b) { // slatted hanging shelf: gapped slats, coral front lip, end rails, brass bolts
  const m = M(K), hx = b.w / 2;
  for (const z of spread(5, b.d)) K.add(g, K.box(b.w, b.h * 0.6, b.d / 5 - 0.07, 0.03), m.wood, 0, b.h * 0.7, z);
  for (const x of [-1, 1]) K.add(g, K.box(0.12, b.h * 0.4, b.d, 0.01), m.woodD, x * (hx - 0.1), b.h * 0.2, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) K.add(g, K.box(b.w + 0.04, b.h * 0.34, 0.1, 0.01), m.tomato, 0, b.h * 0.62, s * (b.d / 2 + 0.01), 0, 0, 0, 1, NC); // lips
  for (const x of [-1, 1]) for (const z of [-1, 1]) K.add(g, K.sphere(0.1, 6, 4), m.woodD, x * (hx - 0.1), b.h * 0.5, z * (b.d / 2 + 0.05), 0, 0, 0, 1, NO); // bolts
}
function plankRamp(K, g, b) { // plank ramp with side stringers
  const m = M(K); K.add(g, K.rampGeo(b.w - 0.3, b.h, b.d, b.ramp), m.wood, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(0.15, b.h, b.d, b.ramp), m.woodD, s * (b.w / 2 - 0.075), b.h / 2 + 0.001, 0, 0, 0, 0, [1, 1.001, 1]);
}

export default {
  bas: [{ make: bed }, square(pots)],
  haut: [{ make: bench }, { make: glassWall }],
  pilier: [{ make: column }],
  coin: [{ make: pillar }],
  plateforme: [{ make: shelf }],
  rampe: [{ make: plankRamp }],
  parkour: [parkour((K, g, b) => pots(K, g, { ...b, h: b.h })), parkour(shelf)],
  solCount: [6, 4], // floor decals per room: hoses, trays, paving stones, soil spills
  ambient: { n: 80, color: '#FFFBD6', size: 0.1, rise: 0.15, sway: 0.7, glow: true }, // sunlit pollen motes (Ambient.js)
  mural: [
    { make(K, g) { // tomato trellis: posts, rails, pot, vines and ripe tomatoes
      const m = M(K); for (const x of [-1, 0, 1]) K.add(g, K.box(0.08, 3.4, 0.08, 0.02), m.woodD, x, 1.7, 0.25, 0, 0, 0, 1, NC);
      for (const y of [1, 2, 3]) K.add(g, K.box(2.4, 0.06, 0.06, 0.02), m.woodD, 0, y, 0.25, 0, 0, 0, 1, NO);
      K.add(g, lt(K, 0.4, 0.3, 0.5, 12), m.terra, 0, 0.25, 0.4, 0, 0, 0, 1, NC);
      for (let i = 0; i < 12; i++) { const x = (K.rnd() - 0.5) * 2.2, y = 0.8 + K.rnd() * 2.6; K.add(g, K.sphere(0.25, 8, 6), m.leaf, x, y, 0.3, 0, 0, 0, [1, 0.8, 0.5], NO); if (i % 2) K.add(g, K.sphere(0.16, 8, 6), m.tomato, x + 0.15, y - 0.15, 0.42, 0, 0, 0, 1, NO); }
    } },
    { make(K, g) { // cactus shelf on brackets
      const m = M(K); K.add(g, bx(2.6, 0.12, 0.6, 0.04), m.wood, 0, 2.2, 0.3, 0, 0, 0, 1, NC); for (const x of [-1, 1]) K.add(g, K.box(0.1, 0.4, 0.4, 0.01), m.woodD, x * 1.0, 1.95, 0.25, 0, 0, 0, 1, NC);
      for (const [i, x] of [-0.8, 0, 0.8].entries()) { K.add(g, lt(K, 0.18, 0.14, 0.3, 10), m.terra, x, 2.42, 0.3, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.19, 0.19, 0.06, 10), m.terraD, x, 2.57, 0.3, 0, 0, 0, 1, NO);
        if (i === 1) K.add(g, K.sphere(0.2, 10, 8), m.cactus, x, 2.78, 0.3, 0, 0, 0, 1, NO); else { K.add(g, K.capsule(0.12, 0.3, 3, 8), m.cactus, x, 2.8, 0.3, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.06, 0.06, 0.16, 6), m.cactus, x + 0.14, 2.82, 0.3, 0, 0, -0.8, 1, NO); }
        K.add(g, K.sphere(0.06, 6, 4), m.tomato, x, i === 1 ? 2.98 : 3.05, 0.3, 0, 0, 0, 1, NO); }
    } },
    { make(K, g) { // watering can with a rosette spout, handle and stripe, on a shelf
      const m = M(K); K.add(g, bx(1.3, 0.14, 0.24, 0.05), m.wood, 0, 2.2, 0.2, 0, 0, 0, 1, NC);
      K.add(g, lt(K, 0.35, 0.4, 0.6, 14), m.can, 0, 2.6, 0.45, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.41, 0.41, 0.08, 14), m.white, 0, 2.6, 0.45, 0, 0, 0, 1, NO);
      K.add(g, lt(K, 0.05, 0.07, 0.8, 8), m.can, 0.5, 2.8, 0.45, 0, 0, -0.9, 1, NO); K.add(g, lt(K, 0.14, 0.1, 0.1, 10), m.brass, 0.85, 3.12, 0.45, 0, 0, -0.9, 1, NO);
      K.add(g, K.torus(0.25, 0.05, 4, 12, Math.PI), m.can, 0, 2.9, 0.45, 0, 0, 0, 1, NO); K.add(g, K.torus(0.22, 0.045, 4, 12, Math.PI * 1.1), m.can, -0.34, 2.6, 0.45, 0, 0, Math.PI / 2 + 0.2, 1, NO);
    } },
    { make(K, g) { // hose reel: drum with coils, hub, crank and a nozzle
      const m = M(K); K.add(g, K.box(0.2, 1.1, 0.2, 0.01), m.white, 0, 0.55, 0.35, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.7, 0.7, 0.4, 18), m.white, 0, 1.55, 0.5, Math.PI / 2, 0, 0, 1, NC);
      for (let i = 0; i < 3; i++) K.add(g, K.torus(0.55 - i * 0.12, 0.1, 4, 18), m.hose, 0, 1.55, 0.74, 0, 0, 0, 1, NO);
      K.add(g, lt(K, 0.1, 0.1, 0.1, 8), m.brass, 0, 1.55, 0.78, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.box(0.5, 0.08, 0.08, 0.01), m.brass, 0.25, 1.55, 0.86, 0, 0, 0.5, 1, NO); K.add(g, K.sphere(0.1, 6, 4), m.tomato, 0.45, 1.8, 0.86, 0, 0, 0, 1, NO);
    } },
    { make(K, g, o) { // hanging fern basket on two chains
      const m = M(K), y = Math.min(o.h - 1.2, 3.8);
      for (const s of [-1, 1]) K.add(g, lt(K, 0.015, 0.015, 1.1, 4), m.brass, s * 0.3, y + 0.6, 0.45, 0, 0, s * -0.3, 1, NO); K.add(g, K.sphere(0.07, 6, 4), m.brass, 0, y + 1.15, 0.45, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.5, 12, 8), m.terraD, 0, y, 0.45, 0, 0, 0, [1, 0.6, 1], NC);
      for (let i = 0; i < 7; i++) { const a = i * 0.9; K.add(g, K.sphere(0.28, 8, 6), i % 2 ? m.leaf : m.leafL, Math.cos(a) * 0.4, y + 0.2 - (i % 3) * 0.15, 0.45 + Math.sin(a) * 0.4, 0, -a, 0.3, [0.5, 1.2, 0.4], NO); }
      K.add(g, K.sphere(0.1, 6, 4), m.tomato, 0.1, y + 0.4, 0.5, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 1.2, make(K, g) { const m = M(K); for (let i = 0; i < 3; i++) K.add(g, K.torus(0.8 - i * 0.2, 0.07, 6, 24), m.hose, 0, 0.07 + i * 0.001, 0, Math.PI / 2, 0, 0, 1, NC); K.add(g, lt(K, 0.07, 0.07, 0.3, 6), m.brass, 0.85, 0.08, 0.3, 0, 0, Math.PI / 2, 1, NO); K.add(g, lt(K, 0.1, 0.07, 0.14, 6), m.tomato, 1.06, 0.08, 0.3, 0, 0, Math.PI / 2, 1, NO); } }, // hose coil with a nozzle
    { r: 1.2, make(K, g) { const m = M(K); K.add(g, K.box(1.6, 0.14, 1.0, 0.03), m.tray, 0, 0.07, 0, 0, 0, 0, 1, NC); K.add(g, K.box(1.45, 0.04, 0.85, 0.01), m.soil, 0, 0.14, 0, 0, 0, 0, 1, NO); for (const x of spread(4, 1.3)) for (const z of spread(2, 0.7)) K.add(g, K.sphere(0.1, 8, 6), m.lettuce, x, 0.18, z, 0, 0, 0, [1, 0.6, 1], NO); K.add(g, K.box(0.3, 0.02, 0.18, 0.01), m.label, 0.5, 0.16, 0.62, 0, 0.2, 0, 1, NO); } }, // seed tray
    { r: 1.3, make(K, g) { const m = M(K); K.add(g, lt(K, 1.1, 1.1, 0.02, 20), m.water, 0, 0.012, 0, 0, 0, 0, [1, 1, 0.6], NO); K.add(g, K.torus(0.5, 0.015, 3, 20), m.white, 0.1, 0.03, 0, Math.PI / 2, 0, 0, [1, 0.6, 1], NO); } }, // puddle with a ripple
    { r: 1.8, make(K, g) { const m = M(K); for (let i = 0; i < 5; i++) K.add(g, bx(0.8, 0.06, 0.8, 0.03), m.stone, (i % 3 - 1) * 0.95, 0.03, (Math.floor(i / 3) - 0.5) * 1.0, 0, i * 0.5, 0, 1, NO); } }, // paving stones
    { r: 1.2, make(K, g) { const m = M(K); K.add(g, K.sphere(0.8, 12, 6), m.soil, 0, 0, 0, 0, 0, 0, [1.2, 0.35, 0.9], NC); K.add(g, lt(K, 0.04, 0.04, 0.7, 4), m.woodD, 0.5, 0.2, 0.5, 0.4, 0.8, 1.2, 1, NO); K.add(g, K.box(0.2, 0.04, 0.26, 0.01), m.can, 0.2, 0.12, 0.3, 0.1, 0.8, 0.3, 1, NO); } }, // soil heap with a trowel
  ],
};
