// Cave: barrels lying on cradles with taps and chalk marks, crates of bottles and straw, wine racks with a chalk label, banded
// stone columns, brick corner piers with stone quoins, strapped planks, stone ramps, hooped standing barrels as parkour; arched
// niches with a lantern, arched doors, a wall torch, pipes with valves, garlic braids and wine racks on the walls; puddles, straw,
// corks, drain grates and a bottle lying on the floor. Warm lantern light against the mint stone.
import { NC, NO, alongX, long, parkour, spread, square } from './common.js';
import { roundedBox } from '../../render/Style.js';

const bx = (w, h, d, r) => roundedBox(w, h, d, r, 1); // light bevelled box (108 triangles instead of 300): trims and secondary parts
const lt = (K, rt, rb, h, seg = 12) => K.lathe([[0, -h / 2], [rb, -h / 2], [rt, h / 2], [0, h / 2]], seg); // cheap straight cylinder / cone frustum
const M = (K) => ({
  oak: K.m('#B47C48', { pattern: 'planks', scale: 0.25 }), oakD: K.m('#8A5A32'), hoop: K.m('#5A6A66', { rim: 0.3 }), stone: K.m('#9CC9B6', { rim: 0.1 }), stoneD: K.m('#7FAF9C'), stoneL: K.m('#B4DCCB', { rim: 0.12 }),
  brick: K.m('#C98A6A', { pattern: 'grid', color2: '#E8D8C0', scale: 0.3 }), bottle: K.m('#2E6A4A', { rim: 0.45 }), amber: K.m('#C98A3A', { rim: 0.45 }), cork: K.m('#E0B878'), glow: K.glow('#FFC85A', 2.2),
  iron: K.m('#2A3A36'), pipe: K.m('#C0703A', { rim: 0.35 }), water: K.m('#7FD8C8', { rim: 0.4 }), straw: K.m('#F0C860'), dark: K.f('#14302A'), paper: K.f('#FFF3D6'), brass: K.m('#F2C14E', { rim: 0.4 }), garlic: K.m('#F6F0E2', { rim: 0.2 }),
});

function barrels(K, g, b) { // barrels lying on a cradle, hoops with studs, end rings, bung, a tap and a chalk mark
  const m = M(K), { L, T } = alongX(g, b), H = b.h, R = Math.min(T, H) / 2, n = Math.max(1, Math.round(L / (R * 2.4)));
  K.add(g, K.box(L, H * 0.25, T * 0.8, 0.05), m.oakD, 0, H * 0.125, 0, 0, 0, 0, 1, NC);
  for (const [i, x] of spread(n, L).entries()) {
    const len = L / n - 0.1;
    K.add(g, K.cyl(R * 0.9, R * 0.9, len, 0.1, 20), m.oak, x, H - R, 0, 0, 0, Math.PI / 2); // flat ends
    K.add(g, K.sphere(R, 20, 14), m.oak, x, H - R, 0, 0, 0, Math.PI / 2, [1, (len / (2 * R)) * 0.98, 1], { ink: false }); // bulge
    for (const k of [-0.3, 0.3]) { K.add(g, K.torus(R * 0.96, 0.05, 5, 24), m.hoop, x + k * len, H - R, 0, 0, Math.PI / 2, 0, 1, NO); for (let j = 0; j < 4; j++) K.add(g, K.sphere(0.04, 6, 4), m.brass, x + k * len * 1.02, H - R + Math.cos(j * 0.6 - 0.9) * R * 0.97, Math.sin(j * 0.6 - 0.9) * R * 0.97, 0, 0, 0, 1, NO); } // hoops + brass studs
    for (const s of [-1, 1]) K.add(g, K.torus(R * 0.62, 0.03, 3, 16), m.oakD, x + s * (len / 2 + 0.005), H - R, 0, 0, Math.PI / 2, 0, 1, NO); // end rings
    K.add(g, lt(K, 0.08, 0.08, 0.06, 6), m.cork, x, H - 0.02, 0, 0, 0, 0, 1, NO);
    if (i === n - 1) { K.add(g, lt(K, 0.05, 0.05, 0.16, 6), m.brass, x + len / 2 + 0.07, H - R - R * 0.35, 0, 0, 0, Math.PI / 2, 1, NO); K.add(g, K.box(0.04, 0.04, 0.2, 0.01), m.brass, x + len / 2 + 0.14, H - R - R * 0.35 + 0.05, 0, 0, 0, 0, 1, NO); } // tap
    else K.add(g, K.box(0.04, R * 0.3, R * 0.5, 0.01), m.paper, x + len / 2 + 0.005, H - R + R * 0.25, 0, 0, 0, 0, 1, NO); // chalk mark
  }
}
function bottleCrate(K, g, b) { // wooden crate: slatted faces, corner posts, handle slots, bottle necks and straw
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H - 0.2, T, 0.06), m.oak, 0, (H - 0.2) / 2, 0);
  for (const x of [-1, 1]) for (const z of [-1, 1]) K.add(g, K.box(0.16, H - 0.16, 0.16, 0.01), m.oakD, x * (L / 2 - 0.06), (H - 0.2) / 2, z * (T / 2 - 0.06), 0, 0, 0, 1, NC); // corner posts
  for (const s of [-1, 1]) { K.add(g, K.box(L - 0.1, 0.1, 0.05, 0.01), m.oakD, 0, H * 0.35, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); K.add(g, K.box(0.34, 0.1, 0.05, 0.01), m.dark, 0, H * 0.62, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); } // slat + handle slot
  K.add(g, K.box(L - 0.1, 0.06, T - 0.1, 0.01), m.cork, 0, H - 0.18, 0, 0, 0, 0, 1, NO);
  for (const x of spread(Math.max(2, Math.round(L / 0.45)), L - 0.3)) for (const z of spread(Math.max(1, Math.round(T / 0.5)), T - 0.3)) {
    K.add(g, lt(K, 0.06, 0.1, 0.22, 8), K.rnd() < 0.7 ? m.bottle : m.amber, x, H - 0.12, z, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.05, 0.05, 0.06, 6), m.cork, x, H - 0.01, z, 0, 0, 0, 1, NO);
  }
}
function wineRack(K, g, b) { // oak rack with feet and a top cap, bottle bottoms on both faces, a chalk label
  const m = M(K), { L, T } = alongX(g, b), H = b.h, cols = Math.max(2, Math.round(L / 0.5)), rows = Math.max(2, Math.round(H / 0.5));
  K.add(g, K.box(L, H, T * 0.8, 0.06), m.oakD, 0, H / 2, 0);
  for (const x of spread(cols, L - 0.2)) for (let j = 0; j < rows; j++) for (const s of [-1, 1]) if (K.rnd() < 0.75) {
    const y = ((j + 0.5) * H) / rows;
    K.add(g, lt(K, 0.13, 0.13, 0.05, 8), K.rnd() < 0.7 ? m.bottle : m.amber, x, y, s * T * 0.4, Math.PI / 2, 0, 0, 1, NO); K.add(g, lt(K, 0.05, 0.05, 0.03, 5), m.cork, x, y, s * (T * 0.4 + 0.03), Math.PI / 2, 0, 0, 1, NO);
  }
  for (const x of spread(cols + 1, L)) K.add(g, K.box(0.06, H, T, 0.01), m.oak, x, H / 2, 0, 0, 0, 0, 1, NO); // dividers
  K.add(g, bx(L + 0.08, 0.14, T + 0.08, 0.05), m.oak, 0, H - 0.07, 0, 0, 0, 0, 1, NC); K.add(g, bx(L + 0.08, 0.14, T + 0.08, 0.05), m.oakD, 0, 0.07, 0, 0, 0, 0, 1, NC); // cap + foot
  K.add(g, K.box(0.5, 0.26, 0.04, 0.01), m.dark, L * 0.3, H * 0.5, T * 0.5 + 0.03, 0, 0, 0, 1, NO); K.add(g, K.box(0.3, 0.03, 0.05, 0.01), m.paper, L * 0.3, H * 0.5 + 0.04, T * 0.5 + 0.045, 0, 0, 0, 1, NO); K.add(g, K.box(0.2, 0.03, 0.05, 0.01), m.paper, L * 0.3 - 0.04, H * 0.5 - 0.04, T * 0.5 + 0.045, 0, 0, 0, 1, NO); // chalkboard
}
function column(K, g, b) { // stacked stone drums: plinth, two-tier capital, chips
  const m = M(K), R = b.r ?? b.w / 2, H = b.h, n = Math.max(3, Math.round(H / 1.4));
  for (let i = 0; i < n; i++) {
    const r = R * (0.94 + (i % 2) * 0.04), y = ((i + 0.5) * H) / n; K.add(g, K.cyl(r, r, H / n - 0.04, 0.08, 16), i % 2 ? m.stone : m.stoneD, 0, y, 0);
    K.add(g, K.sphere(0.07, 6, 4), m.stoneD, Math.cos(i * 2.3) * r, y + 0.1, Math.sin(i * 2.3) * r, 0, 0, 0, [1.4, 1, 0.5], NO); // chip
  }
  K.add(g, bx(R * 2.3, 0.3, R * 2.3, 0.07), m.stoneD, 0, 0.15, 0, 0, 0, 0, 1, NC); // plinth
  K.add(g, K.box(R * 2.1, 0.4, R * 2.1, 0.08), m.stoneD, 0, H - 0.2, 0, 0, 0, 0, 1, NC); K.add(g, bx(R * 2.5, 0.16, R * 2.5, 0.05), m.stoneL, 0, H - 0.08, 0, 0, 0, 0, 1, NC); // capital
}
function brickPier(K, g, b) { // brick pier: plinth, stone cap, quoin blocks up the front corners
  const m = M(K), H = b.h; K.add(g, K.box(b.w, H, b.d, 0.08), m.brick, 0, H / 2, 0); K.add(g, bx(b.w + 0.06, 0.3, b.d + 0.06, 0.06), m.stone, 0, 0.15, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(b.w + 0.12, 0.2, b.d + 0.12, 0.06), m.stoneL, 0, H - 0.1, 0, 0, 0, 0, 1, NC);
  for (let j = 0; j < Math.floor((H - 0.6) / 0.5); j++) for (const s of [-1, 1]) K.add(g, K.box(j % 2 ? 0.34 : 0.22, 0.4, 0.26, 0.01), m.stoneL, s * (b.w / 2 - 0.1), 0.62 + j * 0.5, b.d / 2 - 0.05, 0, 0, 0, 1, NC);
}
function plank(K, g, b) { // strapped planks: iron straps with bolts across the boards
  const m = M(K); for (const z of spread(3, b.d)) K.add(g, K.box(b.w, b.h, b.d / 3 - 0.06, 0.05), m.oak, 0, b.h / 2, z);
  for (const x of [-1, 1]) { K.add(g, K.box(0.18, b.h + 0.04, b.d + 0.04, 0.01), m.hoop, x * (b.w / 2 - 0.35), b.h / 2, 0, 0, 0, 0, 1, NC); for (const z of spread(3, b.d)) K.add(g, K.sphere(0.05, 6, 4), m.hoop, x * (b.w / 2 - 0.35), b.h + 0.02, z, 0, 0, 0, [1, 0.5, 1], NO); }
}
function barrelUp(K, g, b) { // standing barrel (parkour): iron hoops, chime lip, lid boards, a brand tag
  const m = M(K), R = Math.min(b.w, b.d) / 2 - 0.05, H = b.h;
  K.add(g, K.cyl(R, R, H, 0.08, 20), m.oak, 0, H / 2, 0); K.add(g, lt(K, R * 0.9, R * 0.9, 0.02, 20), m.oakD, 0, H + 0.005, 0, 0, 0, 0, 1, NO);
  K.add(g, K.torus(R * 0.93, 0.05, 4, 20), m.oakD, 0, H - 0.01, 0, Math.PI / 2, 0, 0, 1, NO); // chime lip
  for (const z of [-0.3, 0, 0.3]) K.add(g, K.box(R * 1.7, 0.012, 0.03, 0.005), m.oak, 0, H + 0.016, z * R, 0, 0, 0, 1, NO); // board seams
  for (const y of [0.1, H * 0.5, H - 0.12]) K.add(g, lt(K, R * 1.015, R * 1.015, 0.12, 18), m.hoop, 0, Math.min(y, H - 0.1), 0, 0, 0, 0, 1, NC);
  K.add(g, lt(K, 0.16, 0.16, 0.04, 10), m.amber, 0, H * 0.72, R * 1.0 + 0.01, Math.PI / 2, 0, 0, 1, NO); // brand tag
}
function rampStone(K, g, b) { // stone ramp with side kerbs
  const m = M(K); K.add(g, K.rampGeo(b.w - 0.3, b.h, b.d, b.ramp), m.stone, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(0.15, b.h, b.d, b.ramp), m.stoneD, s * (b.w / 2 - 0.075), b.h / 2 + 0.001, 0, 0, 0, 0, [1, 1.001, 1]);
}
function brickWall(K, g, b) { // brick wall with a stone coping, plinth and buttresses
  const m = M(K), { L, T } = alongX(g, b); K.add(g, K.box(L, b.h, T, 0.06), m.brick, 0, b.h / 2, 0); K.add(g, bx(L + 0.06, 0.2, T + 0.1, 0.05), m.stone, 0, b.h - 0.1, 0, 0, 0, 0, 1, NC); K.add(g, bx(L + 0.06, 0.3, T + 0.1, 0.06), m.stoneD, 0, 0.15, 0, 0, 0, 0, 1, NC);
  for (const x of spread(Math.max(2, Math.round(L / 2.4)) + 1, L - 0.3)) K.add(g, K.box(0.3, b.h - 0.3, T + 0.1, 0.01), m.stone, x, b.h / 2, 0, 0, 0, 0, 1, NC);
}

export default {
  bas: [long(barrels, 1.2), square(bottleCrate), { make: bottleCrate }],
  haut: [{ make: wineRack }, { make: brickWall }],
  pilier: [{ make: column }],
  coin: [{ make: brickPier }],
  plateforme: [{ make: plank }],
  rampe: [{ make: rampStone }],
  parkour: [parkour(barrelUp), parkour(plank)],
  solCount: [6, 3], // floor decals per room: puddles, straw, corks, drains, flagstones
  ambient: { n: 90, color: '#FFE6B0', size: 0.06, rise: 0.05, sway: 0.4, glow: true }, // dust motes in the lantern light (Ambient.js)
  mural: [
    { make(K, g) { // arched niche with a keystone, a shelf of bottles and a hanging lantern
      const m = M(K); K.add(g, K.box(2.2, 2.4, 0.3, 0.1), m.stoneD, 0, 1.2, 0.05, 0, 0, 0, 1, NC); K.add(g, K.cyl(1.1, 1.1, 0.3, 0.08, 20), m.stoneD, 0, 2.4, 0.05, Math.PI / 2, 0, 0, 1, NC);
      K.add(g, K.box(1.6, 2.2, 0.05, 0.01), m.dark, 0, 1.3, 0.22, 0, 0, 0, 1, NO); K.add(g, bx(0.34, 0.5, 0.2, 0.05), m.stoneL, 0, 3.5, 0.2, 0, 0, 0, 1, NC); K.add(g, K.box(1.5, 0.08, 0.3, 0.01), m.oak, 0, 0.9, 0.35, 0, 0, 0, 1, NO);
      for (const x of [-0.45, 0.1, 0.5]) K.add(g, lt(K, 0.04, 0.09, 0.4, 8), x > 0.3 ? m.amber : m.bottle, x, 1.14, 0.37, 0, 0, 0, 1, NO);
      K.add(g, lt(K, 0.015, 0.015, 0.5, 4), m.iron, 0, 2.65, 0.45, 0, 0, 0, 1, NO); K.add(g, bx(0.34, 0.46, 0.34, 0.06), m.iron, 0, 2.3, 0.45, 0, 0, 0, 1, NC); K.add(g, K.box(0.24, 0.32, 0.24, 0.01), m.glow, 0, 2.3, 0.45, 0, 0, 0, 1, NO); K.add(g, K.cone(0.26, 0.16, 4), m.iron, 0, 2.62, 0.45, 0, Math.PI / 4, 0, 1, NC);
    } },
    { make(K, g, o) { // pipe run with flanges, a wheel valve and a drip
      const m = M(K), y = Math.min(o.h - 1.2, 5); K.add(g, K.cyl(0.16, 0.16, 6, 0.04, 12), m.pipe, 0, y, 0.3, 0, 0, Math.PI / 2, 1, NC); K.add(g, K.cyl(0.16, 0.16, y, 0.04, 12), m.pipe, 2.9, y / 2, 0.3, 0, 0, 0, 1, NC); K.add(g, K.torus(0.26, 0.08, 6, 16), m.hoop, 2.9, 1.2, 0.3, Math.PI / 2, 0, 0, 1, NO);
      for (const x of [-2.2, -0.6, 1.4]) K.add(g, lt(K, 0.24, 0.24, 0.1, 12), m.hoop, x, y, 0.3, 0, 0, Math.PI / 2, 1, NO); // flanges
      K.add(g, lt(K, 0.05, 0.05, 0.3, 6), m.iron, 0.4, y + 0.3, 0.3, 0, 0, 0, 1, NO); K.add(g, K.torus(0.2, 0.035, 4, 12), m.brass, 0.4, y + 0.48, 0.3, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.05, 6, 4), m.water, -0.6, y - 0.4, 0.3, 0, 0, 0, [1, 1.6, 1], NO);
    } },
    { make(K, g) { wineRack(K, g, { w: 3, d: 0.6, h: 2.2 }); g.children.forEach((c) => (c.position.z += 0.35)); } },
    { make(K, g) { // arched oak door with iron straps and a ring knocker
      const m = M(K); K.add(g, bx(2.2, 2.6, 0.3, 0.1), m.stoneL, 0, 1.3, 0.05, 0, 0, 0, 1, NC); K.add(g, lt(K, 1.1, 1.1, 0.3, 20), m.stoneL, 0, 2.6, 0.05, Math.PI / 2, 0, 0, 1, NC);
      K.add(g, K.box(1.7, 2.5, 0.1, 0.01), m.oak, 0, 1.25, 0.24, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.85, 0.85, 0.1, 20), m.oak, 0, 2.5, 0.24, Math.PI / 2, 0, 0, 1, NO);
      for (const y of [0.6, 1.9]) K.add(g, K.box(1.7, 0.16, 0.05, 0.01), m.iron, 0, y, 0.31, 0, 0, 0, 1, NO); K.add(g, K.torus(0.14, 0.03, 4, 12), m.brass, 0.5, 1.2, 0.34, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.06, 6, 4), m.brass, 0.5, 1.34, 0.32, 0, 0, 0, 1, NO);
    } },
    { make(K, g, o) { // wall torch (a real light) and a garlic braid
      const m = M(K), y = Math.min(o.h - 2, 3.4); K.add(g, bx(0.2, 0.7, 0.2, 0.05), m.iron, 0, y, 0.2, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.2, 0.12, 0.2, 10), m.iron, 0, y + 0.45, 0.3, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.2, 8, 6), m.glow, 0, y + 0.7, 0.3, 0, 0, 0, [1, 1.5, 1], NO);
      K.add(g, lt(K, 0.01, 0.01, 1.4, 4), m.cork, 1.4, y, 0.15, 0, 0, 0, 1, NO); for (let i = 0; i < 5; i++) K.add(g, K.sphere(0.16, 8, 6), m.garlic, 1.4 + (i % 2 ? 0.1 : -0.1), y + 0.55 - i * 0.28, 0.2, 0, 0, 0, [1, 1.1, 1], NC);
    } },
  ],
  sol: [
    { r: 1.4, make(K, g) { const m = M(K); K.add(g, lt(K, 1.2, 1.2, 0.02, 20), m.water, 0, 0.012, 0, 0, 0, 0, [1, 1, 0.65], NO); K.add(g, K.torus(0.5, 0.015, 3, 20), m.stoneL, 0.1, 0.03, 0, Math.PI / 2, 0, 0, [1, 0.65, 1], NO); } }, // puddle with a ripple
    { r: 1.2, make(K, g) { const m = M(K); for (let i = 0; i < 7; i++) K.add(g, K.capsule(0.03, 0.8, 3, 5), m.straw, (K.rnd() - 0.5) * 1.2, 0.04, (K.rnd() - 0.5) * 1.2, Math.PI / 2, K.rnd() * 3, 0, 1, NO); K.add(g, lt(K, 0.08, 0.08, 0.5, 8), m.straw, 0, 0.1, 0, Math.PI / 2, 0.5, 0, 1, NO); K.add(g, K.torus(0.085, 0.015, 3, 10), m.cork, 0.07, 0.1, 0.06, 0, 0.5, 0, 1, NO); } }, // straw with a tied bundle
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.capsule(0.12, 0.4, 4, 10), m.bottle, 0, 0.12, 0, 0, 0, Math.PI / 2, 1, NC); K.add(g, lt(K, 0.05, 0.05, 0.16, 8), m.bottle, 0.36, 0.12, 0, 0, 0, Math.PI / 2, 1, NO); K.add(g, lt(K, 0.125, 0.125, 0.16, 10), m.paper, -0.04, 0.12, 0, 0, 0, Math.PI / 2, 1, NO); K.add(g, lt(K, 0.04, 0.04, 0.07, 6), m.cork, 0.5, 0.12, 0, 0, 0, Math.PI / 2, 1, NO); } }, // bottle with a label
    { r: 1.0, make(K, g) { const m = M(K); K.add(g, lt(K, 0.6, 0.6, 0.05, 18), m.iron, 0, 0.025, 0, 0, 0, 0, 1, NC); for (const x of spread(5, 0.7)) K.add(g, K.box(0.07, 0.05, 0.9, 0.01), m.hoop, x, 0.06, 0, 0, 0, 0, 1, NO); K.add(g, K.torus(0.58, 0.04, 4, 18), m.hoop, 0, 0.05, 0, Math.PI / 2, 0, 0, 1, NO); } }, // drain grate
    { r: 0.9, make(K, g) { const m = M(K); for (let i = 0; i < 6; i++) K.add(g, lt(K, 0.07, 0.07, 0.12, 6), m.cork, (K.rnd() - 0.5) * 1.1, 0.07, (K.rnd() - 0.5) * 1.1, K.rnd() * 3, 0, K.rnd() * 3, 1, NO); } }, // scattered corks
    { r: 1.4, make(K, g) { const m = M(K); for (const [x, z, w, d] of [[-0.6, -0.4, 1, 0.7], [0.5, -0.45, 0.9, 0.8], [-0.5, 0.5, 0.8, 0.8], [0.5, 0.45, 1, 0.7]]) K.add(g, bx(w, 0.06, d, 0.03), m.stoneL, x, 0.03, z, 0, (x + z) * 0.1, 0, 1, NO); } }, // flagstones
  ],
};
