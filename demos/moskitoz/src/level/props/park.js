// Parc: stone flower beds with plinth and plaque, picnic tables with a checkered cloth and a basket, tiered fountains with a
// rubber duck, picket fences with ball posts, brick walls with pilasters and ivy, plane trees with spotted bark, tree-house
// decks, striped yellow slides, tree stumps with growth rings as parkour; lamp posts, park signs, benches, bins and bushes
// against the hedges; paved paths, puddles, frisbees, sandpits and daisies on the lawn.
import { NC, NO, alongX, parkour, spread, square } from './common.js';
import { roundedBox } from '../../render/Style.js';

const bx = (w, h, d, r) => roundedBox(w, h, d, r, 1); // light bevelled box (108 triangles instead of 300): trims and secondary parts
const lt = (K, rt, rb, h, seg = 12) => K.lathe([[0, -h / 2], [rb, -h / 2], [rt, h / 2], [0, h / 2]], seg); // cheap straight cylinder / cone frustum
const M = (K) => ({
  stone: K.m('#E0DCCC', { rim: 0.1 }), stoneD: K.m('#C4BFAE'), stoneL: K.m('#F0ECDF', { rim: 0.12 }), soil: K.m('#7A5234', { ao: 1 }), wood: K.m('#C98A52', { pattern: 'planks', scale: 0.3 }), woodD: K.m('#9A6438'),
  brick: K.m('#D8765A', { pattern: 'grid', color2: '#F0E2CC', scale: 0.3 }), ivy: K.m('#3FB352', { pattern: 'dots', color2: '#37A049', scale: 0.3 }), leaf: K.m('#4CC05E', { rim: 0.15 }), leafD: K.m('#37A049'), leafL: K.m('#78D86E', { rim: 0.15 }),
  bark: K.m('#C9B38E', { pattern: 'dots', color2: '#A8916C', scale: 0.5 }), barkD: K.m('#8F7A56'), water: K.m('#6FD6FF', { rim: 0.35 }), yel: K.m('#FFCF3F', { rim: 0.2 }), red: K.m('#FF5B4A'), iron: K.m('#2E4A3A'),
  petal: [K.m('#FFFFFF'), K.m('#FFCF3F'), K.m('#FF7FA8')], stem: K.m('#46A94F'), ring: K.m('#E2C28A'), gravel: K.m('#E8DFC8', { pattern: 'dots', color2: '#D2C8AE', scale: 0.15 }), glow: K.glow('#FFE9A0', 1.6),
  paint: K.m('#FFFFFF', { rim: 0.1 }), cloth: K.m('#FF5B4A', { pattern: 'checker', color2: '#FFFFFF', scale: 0.28 }), yelS: K.m('#FFCF3F', { pattern: 'stripes', color2: '#FFDD6E', scale: 0.22, rim: 0.2 }), beak: K.m('#FF9A3F'), sand: K.m('#F2D79A'),
});

function daisy(K, g, m, x, y, z, c = 0) { // flat bloom on a stem, yellow heart, one leaf
  K.add(g, lt(K, 0.03, 0.03, 0.34, 4), m.stem, x, y + 0.17, z, 0, 0, 0, 1, NO);
  K.add(g, K.sphere(0.13, 8, 6), m.petal[c], x, y + 0.37, z, 0, 0, 0, [1, 0.5, 1], NO); K.add(g, K.sphere(0.06, 6, 4), c === 1 ? m.red : m.yel, x, y + 0.42, z, 0, 0, 0, 1, NO);
  K.add(g, K.sphere(0.09, 6, 4), m.leafD, x + 0.1, y + 0.12, z, 0, 0, 0.5, [1.4, 0.4, 0.8], NO);
}
function bed(K, g, b) { // raised stone flower bed: plinth, coping, front plaque, daisies
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, 0.16), m.stone, 0, H / 2, 0);
  K.add(g, bx(L + 0.12, 0.22, T + 0.12, 0.09), m.stoneD, 0, 0.11, 0, 0, 0, 0, 1, NC); // plinth
  K.add(g, bx(L + 0.1, 0.18, T + 0.1, 0.08), m.stoneL, 0, H - 0.09, 0, 0, 0, 0, 1, NC); // coping
  K.add(g, K.box(L - 0.4, 0.1, T - 0.4, 0.01), m.soil, 0, H + 0.02, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) { // plaque with a little flower on both faces
    K.add(g, K.box(Math.min(1, L * 0.3), 0.3, 0.06, 0.01), m.stoneL, 0, H * 0.5, s * (T / 2 + 0.02), 0, 0, 0, 1, NO);
    K.add(g, K.sphere(0.07, 6, 4), m.petal[2], 0, H * 0.5, s * (T / 2 + 0.07), 0, 0, 0, [1, 1, 0.4], NO); K.add(g, K.sphere(0.035, 6, 4), m.yel, 0, H * 0.5, s * (T / 2 + 0.1), 0, 0, 0, 1, NO);
  }
  for (const x of spread(Math.max(3, Math.round(L * 1.3)), L - 0.7)) daisy(K, g, m, x, H + 0.05, (K.rnd() - 0.5) * (T - 0.8), Math.floor(K.rnd() * 3));
}
function picnic(K, g, b) { // picnic table: plank top, checkered cloth, basket, benches and A-frame legs inside the box
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  for (const z of spread(4, T * 0.6)) K.add(g, K.box(L, 0.14, T * 0.14, 0.04), m.wood, 0, H - 0.07, z);
  for (const s of [-1, 1]) K.add(g, K.box(L * 0.95, 0.12, T * 0.16, 0.04), m.wood, 0, H * 0.5, s * T * 0.4);
  for (const x of [-1, 1]) for (const s of [-1, 1]) K.add(g, K.box(0.14, H * 1.08, 0.14, 0.01), m.woodD, x * L * 0.35, H / 2, s * T * 0.2, s * 0.42, 0, 0, 1, NO);
  K.add(g, K.box(L * 0.7, 0.1, 0.1, 0.01), m.woodD, 0, H * 0.3, 0, 0, 0, 0, 1, NC); // cross brace
  K.add(g, K.box(L * 0.55, 0.03, T * 0.5, 0.01), m.cloth, 0, H + 0.015, 0, 0, 0, 0, 1, NO); // cloth runner
  K.add(g, lt(K, 0.2, 0.17, 0.2, 10), m.ring, -L * 0.12, H + 0.13, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(0.17, 0.03, 4, 10, Math.PI), m.ring, -L * 0.12, H + 0.22, 0, 0, 0, 0, 1, NO); // wicker basket + handle
  for (const [x, z] of [[0.1, 0.1], [0.28, -0.08]]) { K.add(g, K.sphere(0.1, 8, 6), m.red, L * 0.1 + x, H + 0.13, z, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.03, 6, 4), m.leafD, L * 0.1 + x, H + 0.24, z, 0, 0, 0, 1, NO); } // apples
}
function fountain(K, g, b) { // round stone basin with rim, water, a rubber duck, a tiered spout
  const m = M(K), R = Math.min(b.w, b.d) / 2, H = b.h;
  K.add(g, K.cyl(R, R * 1.05, H, 0.12, 24), m.stone, 0, H / 2, 0);
  K.add(g, K.torus(R - 0.02, 0.1, 5, 24), m.stoneL, 0, H - 0.02, 0, Math.PI / 2, 0, 0, 1, NC); // rim
  K.add(g, lt(K, R * 1.08, R * 1.1, 0.14, 24), m.stoneD, 0, 0.07, 0, 0, 0, 0, 1, NC); // foot
  K.add(g, lt(K, R * 0.85, R * 0.85, 0.06, 24), m.water, 0, H - 0.05, 0, 0, 0, 0, 1, NO);
  K.add(g, lt(K, 0.12, 0.2, 0.34, 10), m.stoneD, 0, H + 0.12, 0, 0, 0, 0, 1, NC);
  K.add(g, lt(K, R * 0.36, R * 0.22, 0.14, 16), m.stoneL, 0, H + 0.32, 0, 0, 0, 0, 1, NC); K.add(g, lt(K, R * 0.3, R * 0.3, 0.04, 16), m.water, 0, H + 0.4, 0, 0, 0, 0, 1, NO);
  K.add(g, K.sphere(0.1, 8, 6), m.water, 0, H + 0.52, 0, 0, 0, 0, [1, 1.7, 1], NO); for (const a of [0.5, 3.6]) K.add(g, K.sphere(0.05, 6, 4), m.water, Math.cos(a) * 0.22, H + 0.44, Math.sin(a) * 0.22, 0, 0, 0, 1, NO);
  const dx = R * 0.55, dz = R * 0.3; // rubber duck
  K.add(g, K.sphere(0.2, 10, 8), m.yel, dx, H + 0.02, dz, 0, 0, 0, [1.2, 0.9, 1], NC); K.add(g, K.sphere(0.12, 8, 6), m.yel, dx + 0.14, H + 0.2, dz, 0, 0, 0, 1, NC);
  K.add(g, K.box(0.1, 0.04, 0.1, 0.01), m.beak, dx + 0.27, H + 0.18, dz, 0, 0, 0, 1, NO); for (const s of [-1, 1]) K.add(g, K.sphere(0.03, 6, 4), m.iron, dx + 0.2, H + 0.25, dz + s * 0.07, 0, 0, 0, 1, NO);
}
function fence(K, g, b) { // white picket fence: ball-capped posts, two rails, pointed pickets (solid backing keeps the box whole)
  const m = M(K), { L, T } = alongX(g, b), H = b.h, np = Math.max(2, Math.round(L / 1.6)) + 1;
  K.add(g, K.box(L - 0.1, H * 0.9, T * 0.25, 0.01), m.woodD, 0, H * 0.45, 0, 0, 0, 0, 1, { ink: false });
  for (const y of [H * 0.3, H * 0.72]) K.add(g, bx(L, 0.18, T * 0.6, 0.05), m.wood, 0, y, 0, 0, 0, 0, 1, NC);
  for (const x of spread(Math.max(3, Math.round(L / 0.42)), L - 0.5)) { K.add(g, K.box(0.2, H * 0.82, T * 0.3, 0.01), m.paint, x, H * 0.41, T * 0.3, 0, 0, 0, 1, NC); K.add(g, K.cone(0.14, 0.22, 4), m.paint, x, H * 0.82 + 0.1, T * 0.3, 0, Math.PI / 4, 0, 1, NC); }
  for (const x of spread(np, L)) { K.add(g, K.box(0.24, H * 0.94, T, 0.06), m.woodD, x, H * 0.47, 0); K.add(g, K.sphere(0.17, 8, 6), m.stoneL, x, H * 0.94 + 0.06, 0, 0, 0, 0, 1, NO); } // posts + ball caps
}
function brickWall(K, g, b) { // brick wall, stone plinth and coping, end pilasters, ivy clumps with vines
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H - 0.15, T, 0.06), m.brick, 0, (H - 0.15) / 2, 0);
  K.add(g, bx(L + 0.1, 0.15, T + 0.12, 0.05), m.stone, 0, H - 0.075, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(L + 0.06, 0.3, T + 0.1, 0.1), m.stoneD, 0, 0.15, 0, 0, 0, 0, 1, NC); // plinth
  for (const s of [-1, 1]) { K.add(g, bx(0.5, H - 0.1, T + 0.16, 0.12), m.stone, s * (L / 2 - 0.25), (H - 0.1) / 2, 0, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.22, 8, 6), m.stoneL, s * (L / 2 - 0.25), H + 0.04, 0, 0, 0, 0, 1, NO); } // pilasters + finials
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = (K.rnd() - 0.5) * (L - 1.8), y = H * (0.45 + K.rnd() * 0.3), z = s * T * 0.45;
    K.add(g, K.sphere(0.7, 12, 8), m.ivy, x, y, z, 0, 0, 0, [1.2, 1, 0.25], NC);
    K.add(g, K.sphere(0.2, 6, 4), m.leafL, x + 0.5, y - 0.3, z + s * 0.12, 0, 0, 0.4, [1.2, 0.8, 0.4], NO); K.add(g, K.sphere(0.12, 6, 4), m.petal[2], x - 0.3, y + 0.25, z + s * 0.2, 0, 0, 0, [1, 1, 0.5], NO);
    K.add(g, lt(K, 0.04, 0.04, 0.6, 4), m.ivy, x + 0.2, y - 0.8, z + s * 0.05, 0, 0, 0.15, 1, NO); // hanging vine
  }
}
function plane(K, g, b) { // plane tree: spotted trunk with root flares to the sky, layered crown
  const m = M(K), R = b.r, H = b.h;
  K.add(g, K.cyl(R, R * 1.2, H, 0.2, 18), m.bark, 0, H / 2, 0);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.4; K.add(g, K.sphere(R * 2.8, 12, 9), i % 2 ? m.leaf : m.leafD, Math.cos(a) * R * 2.2, H - 1 + (i % 2) * 0.9, Math.sin(a) * R * 2.2, 0, 0, 0, 1, NC); }
  for (const a of [0.9, 3.0, 5.1]) K.add(g, K.sphere(R * 1.9, 10, 7), m.leafL, Math.cos(a) * R * 1.5, H + 0.5, Math.sin(a) * R * 1.5, 0, 0, 0, 1, NO); // sunlit top
  K.add(g, lt(K, R * 1.6, R * 1.7, 0.25, 18), m.ring, 0, 0.12, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; K.add(g, K.sphere(R * 0.6, 8, 6), m.bark, Math.cos(a) * R * 1.15, 0.3, Math.sin(a) * R * 1.15, 0, 0, 0, [1.5, 0.7, 1], NO); } // root flares
  for (let i = 0; i < 9; i++) { const a = K.rnd() * 6.28, y = 1 + K.rnd() * (H - 2.5); K.add(g, K.sphere(R * 0.4, 6, 4), m.barkD, Math.cos(a) * R * 0.98, y, Math.sin(a) * R * 0.98, 0, Math.PI / 2 - a, 0, [1, 1.5, 0.35], NO); } // bark spots
}
function deck(K, g, b) { // tree-house deck: gapped planks, joists, fascia, corner posts with caps and braces
  const m = M(K), H = b.h, n = Math.max(3, Math.round(b.d / 0.5)), hx = b.w / 2, hz = b.d / 2;
  for (const z of spread(n, b.d)) K.add(g, K.box(b.w, H * 0.5, b.d / n - 0.05, 0.03), m.wood, 0, H * 0.75, z);
  for (const x of [-1, 1]) K.add(g, K.box(0.2, H * 0.5, b.d, 0.01), m.woodD, x * (hx - 0.15), H * 0.25, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) K.add(g, bx(b.w + 0.06, H * 0.28, 0.12, 0.04), m.woodD, 0, H * 0.7, s * (hz + 0.01), 0, 0, 0, 1, NC); // fascia boards
  for (const x of [-1, 1]) for (const z of [-1, 1]) { K.add(g, bx(0.26, H * 0.72, 0.26, 0.07), m.woodD, x * (hx - 0.22), H * 0.36, z * (hz - 0.22), 0, 0, 0, 1, NC); K.add(g, K.sphere(0.16, 6, 4), m.woodD, x * (hx - 0.22), H * 0.74, z * (hz - 0.22), 0, 0, 0, 1, NO); }
  for (const x of [-1, 1]) K.add(g, K.box(0.1, 0.1, Math.hypot(b.d - 0.5, H * 0.5), 0.01), m.wood, x * (hx - 0.22), H * 0.36, 0, Math.atan2(H * 0.5, b.d - 0.5), 0, 0, 1, NO); // diagonal braces
}
function slide(K, g, b) { // playground slide: striped yellow chute with red side rails and ball finials
  const m = M(K), hi = b.ramp.axis === 'z' ? (b.ramp.dir > 0 ? 1 : -1) : 0;
  K.add(g, K.rampGeo(b.w - 0.3, b.h, b.d, b.ramp), m.yelS, 0, b.h / 2, 0);
  for (const s of [-1, 1]) {
    K.add(g, K.rampGeo(0.15, b.h, b.d, b.ramp), m.red, s * (b.w / 2 - 0.075), b.h / 2 + 0.001, 0, 0, 0, 0, [1, 1.001, 1]);
    if (hi) { K.add(g, K.sphere(0.13, 8, 6), m.red, s * (b.w / 2 - 0.075), b.h + 0.04, hi * (b.d / 2 - 0.1), 0, 0, 0, 1, NC); K.add(g, K.sphere(0.1, 6, 4), m.red, s * (b.w / 2 - 0.075), 0.1, -hi * (b.d / 2 - 0.08), 0, 0, 0, 1, NO); }
  }
}
function stump(K, g, b) { // tree stump: growth rings; a mushroom and root flares when tall
  const m = M(K), R = Math.min(b.w, b.d) / 2, H = b.h;
  K.add(g, K.cyl(R * 0.95, R, H, 0.1, 18), m.woodD, 0, H / 2, 0);
  for (const [r, mat, y] of [[0.8, m.ring, 0.005], [0.58, m.woodD, 0.012], [0.38, m.ring, 0.019], [0.16, m.woodD, 0.026]]) K.add(g, lt(K, R * r, R * r, 0.02, 18), mat, 0, H + y, 0, 0, 0, 0, 1, NO); // growth rings
  if (H < 1.2) { return; } // low parkour stump: just the rings
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.3; K.add(g, K.sphere(R * 0.32, 8, 6), m.woodD, Math.cos(a) * R * 1.0, 0.18, Math.sin(a) * R * 1.0, 0, 0, 0, [1.4, 0.7, 1], NO); } // roots
  const mx = Math.cos(1.0) * R * 1.02, mz = Math.sin(1.0) * R * 1.02; // red mushroom with white dots
  K.add(g, lt(K, 0.05, 0.06, 0.2, 6), m.paint, mx, 0.1, mz, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.16, 8, 6), m.red, mx, 0.24, mz, 0, 0, 0, [1, 0.65, 1], NO);
  for (const a of [0.3, 2.2, 4.1]) K.add(g, K.sphere(0.03, 6, 4), m.paint, mx + Math.cos(a) * 0.09, 0.3, mz + Math.sin(a) * 0.09, 0, 0, 0, 1, NO);
}

export default {
  bas: [{ make: bed }, { make: picnic }, square(fountain)],
  haut: [{ make: fence }, { make: brickWall }],
  pilier: [{ make: plane }],
  coin: [{ make: (K, g, b) => brickWall(K, g, b) }],
  plateforme: [{ make: deck }],
  rampe: [{ make: slide }],
  parkour: [parkour(stump), parkour(deck)],
  solCount: [6, 4], // floor decals per room: paths, puddles, sandpits, leaves, flower patches
  ambient: { n: 60, color: '#FFFFFF', size: 0.1, rise: 0.1, sway: 1.1, glow: false }, // dandelion fluff drifting (Ambient.js)
  mural: [
    { make(K, g) { // lamp post: base, collars, lantern with a cap
      const m = M(K); K.add(g, lt(K, 0.22, 0.28, 0.3, 12), m.iron, 0, 0.15, 0.6, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.09, 0.14, 4.2, 10), m.iron, 0, 2.1, 0.6, 0, 0, 0, 1, NC);
      for (const y of [0.55, 3.7]) K.add(g, K.torus(0.14, 0.05, 4, 12), m.iron, 0, y, 0.6, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, bx(0.5, 0.12, 0.5, 0.05), m.iron, 0, 4.18, 0.6, 0, 0, 0, 1, NC); K.add(g, K.box(0.36, 0.44, 0.36, 0.01), m.glow, 0, 4.48, 0.6, 0, 0, 0, 1, NO);
      K.add(g, K.cone(0.42, 0.34, 4), m.iron, 0, 4.88, 0.6, 0, Math.PI / 4, 0, 1, NC); K.add(g, K.sphere(0.07, 6, 4), m.iron, 0, 5.1, 0.6, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // park sign: framed board with a tree icon and an arrow
      const m = M(K); for (const x of [-0.8, 0.8]) K.add(g, bx(0.14, 2.2, 0.14, 0.04), m.woodD, x, 1.1, 0.4, 0, 0, 0, 1, NC); K.add(g, bx(2.2, 0.9, 0.12, 0.05), m.wood, 0, 2.2, 0.4, 0, 0, 0, 1, NC); K.add(g, K.box(1.9, 0.62, 0.02, 0.01), m.leafD, 0, 2.2, 0.47, 0, 0, 0, 1, NO);
      K.add(g, K.box(0.07, 0.3, 0.02, 0.01), m.woodD, -0.5, 2.1, 0.49, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.2, 8, 6), m.leafL, -0.5, 2.38, 0.5, 0, 0, 0, [1, 1, 0.3], NO);
      K.add(g, K.box(0.7, 0.08, 0.02, 0.01), m.yel, 0.3, 2.2, 0.49, 0, 0, 0, 1, NO); K.add(g, K.cone(0.14, 0.24, 3), m.yel, 0.72, 2.2, 0.49, 0, 0, -Math.PI / 2, [1, 1, 0.15], NO);
    } },
    { make(K, g) { const m = M(K); for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 1.3; K.add(g, K.sphere(0.9, 12, 8), i % 2 ? m.leaf : m.leafD, x, 0.7, 0.6, 0, 0, 0, [1, 0.85, 0.7], NC); K.add(g, K.sphere(0.1, 6, 4), m.petal[i % 3], x + 0.3, 1.0, 0.9, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.1, 6, 4), m.petal[(i + 1) % 3], x - 0.35, 0.8, 0.95, 0, 0, 0, 1, NO); } } }, // bushes in bloom
    { make(K, g) { // park bench: slatted seat and back on iron legs
      const m = M(K); for (const x of [-0.95, 0.95]) { K.add(g, bx(0.12, 0.9, 0.7, 0.04), m.iron, x, 0.45, 0.65, 0, 0, 0, 1, NC); K.add(g, K.torus(0.16, 0.04, 4, 10), m.iron, x, 0.95, 0.4, 0, Math.PI / 2, 0, 1, NO); }
      for (const z of [0.5, 0.75]) K.add(g, K.box(2.2, 0.08, 0.2, 0.01), m.wood, 0, 0.5, z, 0, 0, 0, 1, NC);
      for (const y of [0.85, 1.12]) K.add(g, K.box(2.2, 0.2, 0.07, 0.01), m.wood, 0, y, 0.38, -0.12, 0, 0, 1, NC);
    } },
    { make(K, g) { // litter bin: iron drum with a yellow band and a domed lid
      const m = M(K); K.add(g, K.cyl(0.36, 0.3, 0.95, 0.08, 12), m.iron, 0, 0.48, 0.55); K.add(g, lt(K, 0.37, 0.36, 0.16, 12), m.yel, 0, 0.62, 0.55, 0, 0, 0, 1, NC);
      K.add(g, K.sphere(0.4, 10, 8), m.yel, 0, 0.98, 0.55, 0, 0, 0, [1, 0.45, 1], NC); K.add(g, K.sphere(0.06, 6, 4), m.iron, 0, 1.18, 0.55, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 3.4, make(K, g) { const m = M(K); K.add(g, K.box(6, 0.03, 1.4, 0.01), m.gravel, 0, 0.015, 0, 0, 0, 0, 1, NO); for (const x of spread(5, 5)) K.add(g, bx(0.8, 0.06, 0.62, 0.03), m.stoneL, x, 0.03, Math.sin(x * 1.7) * 0.2, 0, x * 0.1, 0, 1, NO); } }, // gravel path with flagstones
    { r: 1.3, make(K, g) { const m = M(K); K.add(g, lt(K, 1.1, 1.1, 0.02, 20), m.water, 0, 0.012, 0, 0, 0, 0, [1, 1, 0.6], NO); K.add(g, K.torus(0.5, 0.015, 3, 20), m.paint, 0.1, 0.03, 0, Math.PI / 2, 0, 0, [1, 0.6, 1], NO); K.add(g, K.sphere(0.12, 6, 4), m.leafL, -0.5, 0.03, 0.1, 0, 0.6, 0, [1.4, 0.15, 0.8], NO); } }, // puddle with a ripple and a leaf
    { r: 1.0, make(K, g) { const m = M(K); K.add(g, lt(K, 0.35, 0.3, 0.06, 16), m.red, 0, 0.04, 0, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.2, 0.2, 0.07, 12), m.paint, 0, 0.045, 0, 0, 0, 0, 1, NO); for (let i = 0; i < 5; i++) daisy(K, g, m, 0.8 + (K.rnd() - 0.5), 0, (K.rnd() - 0.5) * 1.2, i % 3); } }, // frisbee and daisies
    { r: 1.5, make(K, g) { // sandpit with bucket and shovel
      const m = M(K); K.add(g, lt(K, 1.25, 1.3, 0.14, 22), m.stoneD, 0, 0.07, 0, 0, 0, 0, 1, NC); K.add(g, lt(K, 1.1, 1.1, 0.12, 22), m.sand, 0, 0.1, 0, 0, 0, 0, 1, NO);
      K.add(g, lt(K, 0.2, 0.15, 0.26, 12), m.yel, 0.4, 0.26, 0.2, 0, 0, 0, 1, NC); K.add(g, K.box(0.07, 0.07, 0.5, 0.01), m.red, -0.4, 0.2, -0.3, 0.1, 0.5, 0, 1, NO); K.add(g, K.box(0.2, 0.04, 0.2, 0.01), m.red, -0.55, 0.18, -0.55, 0.1, 0.5, 0, 1, NO);
    } },
    { r: 1.2, make(K, g) { const m = M(K); for (let i = 0; i < 7; i++) K.add(g, K.sphere(0.16, 8, 6), [m.leaf, m.leafL, m.yel, m.leafD][i % 4], (K.rnd() - 0.5) * 1.5, 0.03, (K.rnd() - 0.5) * 1.5, 0, K.rnd() * 3, 0, [1.4, 0.12, 0.9], NO); } }, // fallen leaves
  ],
};
