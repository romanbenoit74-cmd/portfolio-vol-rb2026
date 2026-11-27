// Jardin (concept/js/biome-garden.js): flower planters, mossy boulders, bumpy hedges, stone walls topped with a picket
// fence, tree trunks, floating stepping stones, plank ramps, terracotta planter parkour; sunflowers, birdhouses and hedge
// bumps on the walls; stepping-stone path, grass tufts and flower patches on the lawn. Local origin at the bottom centre.
import { alongX } from './kit.js';
import { band } from './common.js';

const M = (K) => ({
  wood: K.m('#C98A52', { pattern: 'planks', scale: 0.3 }), woodL: K.m('#E8B878', { pattern: 'planks', scale: 0.3 }), soil: K.m('#7A5234', { ao: 1 }),
  stone: K.m('#B9C2C8', { rim: 0.1 }), stoneD: K.m('#98A3AC'), moss: K.m('#7FCB55', { ao: 1 }), hedge: K.m('#4AB15D', { pattern: 'dots', color2: '#3F9E52', scale: 0.45 }),
  white: K.m('#FFFFFF', { rim: 0.1 }), bark: K.m('#9A6A3E', { pattern: 'stripes', color2: '#8A5A34', scale: 0.35 }), leaf: K.m('#56C46A', { rim: 0.15 }), leafD: K.m('#3FA356'),
  terra: K.m('#E0784A'), terraD: K.m('#C4623A'), petal: [K.m('#FF7FA8'), K.m('#FFC62E'), K.m('#FFFFFF'), K.m('#B98CFF')], stem: K.m('#46A94F'),
  sun: K.m('#FFC62E', { rim: 0.2 }), sunC: K.m('#8A5A34'), roof: K.m('#F26B5B'), grass: K.m('#6FC54A'), path: K.m('#D8D2C4'),
});

function flowers(K, g, m, xs, y) { // tulip cups on stems
  for (const [x, z] of xs) { const c = m.petal[Math.floor(K.rnd() * 4)]; K.add(g, K.cyl(0.035, 0.035, 0.5, 0.01, 6), m.stem, x, y + 0.25, z, 0, 0, 0, 1, { ink: false, cast: false }); K.add(g, K.sphere(0.16, 12, 8), c, x, y + 0.55, z, 0, 0, 0, [1, 1.2, 1]); }
}
function planter(K, g, b) { // wooden planter box with soil and tulips
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, 0.12), m.wood, 0, H / 2, 0);
  K.add(g, K.box(L - 0.3, 0.12, T - 0.3, 0.05), m.soil, 0, H - 0.02, 0, 0, 0, 0, 1, { cast: false });
  const pts = []; for (let i = 0; i < Math.max(3, Math.round(L * 1.2)); i++) pts.push([(i + 0.5) / Math.max(3, Math.round(L * 1.2)) * (L - 0.6) - (L - 0.6) / 2, (K.rnd() - 0.5) * (T - 0.7)]);
  flowers(K, g, m, pts, H);
}
function boulder(K, g, b) { // mossy boulder filling its box, pebbles at the base
  const m = M(K), W = b.w, D = b.d, H = b.h;
  K.add(g, K.box(W, H, D, Math.min(W, D, H) * 0.42), m.stone, 0, H / 2, 0);
  K.add(g, K.box(W * 0.8, 0.18, D * 0.8, 0.09), m.moss, 0, H - 0.02, 0, 0, 0, 0, 1, { cast: false });
  for (const [x, z, s] of [[0.42, 0.4, 0.3], [-0.45, 0.3, 0.24], [0.1, -0.44, 0.26]]) K.add(g, K.sphere(s, 12, 8), m.stoneD, x * W, s * 0.6, z * D, 0, 0, 0, [1.2, 0.7, 1]);
}
function hedge(K, g, b) { // clipped hedge with a bumpy top
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(2, Math.round(L / 0.9));
  K.add(g, K.box(L, H - 0.25, T, Math.min(0.28, T * 0.45)), m.hedge, 0, (H - 0.25) / 2, 0);
  for (let i = 0; i < n; i++) K.add(g, K.sphere(T * 0.62, 12, 8), m.leaf, -L / 2 + (i + 0.5) * (L / n), H - 0.3, 0, 0, 0, 0, [L / n / (T * 1.1), 0.8, 1]);
}
function stoneWall(K, g, b) { // dry-stone base + white picket fence on top (the whole box is solid)
  const m = M(K), { L, T } = alongX(g, b), H = b.h, base = Math.min(1.2, H * 0.4), n = Math.max(3, Math.round(L / 0.45));
  K.add(g, K.box(L, base, T, 0.18), m.stone, 0, base / 2, 0);
  K.add(g, K.box(L - 0.1, H - base, T * 0.5, 0.06), m.woodL, 0, base + (H - base) / 2, 0, 0, 0, 0, 1, { ink: false }); // backing (keeps the box solid)
  for (let i = 0; i < n; i++) { const x = -L / 2 + (i + 0.5) * (L / n); K.add(g, K.box(0.28, H - base, T * 0.7, 0.1), m.white, x, base + (H - base) / 2, 0); K.add(g, K.cone(0.2, 0.3, 4), m.white, x, H + 0.1, 0, 0, Math.PI / 4, 0, 1, { cast: false }); }
}
function trunk(K, g, b) { // tree trunk to the sky, leafy crown on top
  const m = M(K), R = b.r, H = b.h;
  K.add(g, K.cyl(R, R * 1.15, H, 0.2, 18), m.bark, 0, H / 2, 0);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; K.add(g, K.sphere(R * 2.6, 14, 10), i % 2 ? m.leaf : m.leafD, Math.cos(a) * R * 2.4, H - 1.2 + (i % 2) * 0.8, Math.sin(a) * R * 2.4, 0, 0, 0, 1, { cast: false }); }
  for (const a of [0.4, 2.5, 4.4]) K.add(g, K.sphere(R * 0.55, 10, 8), m.bark, Math.cos(a) * R * 1.05, 0.3, Math.sin(a) * R * 1.05, 0, 0, 0, [1.4, 0.6, 1]);
}
function steppingStone(K, g, b, parkour = false) { // flat mossy stone (platform)
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H, b.d, Math.min(0.3, H * 0.48)), m.stone, 0, H / 2, 0);
  K.add(g, K.sphere(0.5, 12, 8), m.moss, b.w * 0.2, H - 0.02, -b.d * 0.15, 0, 0, 0, [1.4, 0.12, 1], { cast: false });
  if (parkour) band(K, g, b);
}
function potLid(K, g, b) { // parkour: square terracotta planter with soil and a flower
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H, b.d, 0.22), m.terra, 0, H / 2, 0);
  K.add(g, K.box(b.w - 0.4, 0.08, b.d - 0.4, 0.04), m.soil, 0, H, 0, 0, 0, 0, 1, { cast: false });
  flowers(K, g, m, [[b.w * 0.3, -b.d * 0.3]], H);
  band(K, g, b);
}
function plankRamp(K, g, b) { K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), M(K).woodL, 0, b.h / 2, 0); }

export default {
  bas: [{ make: planter }, { make: boulder }],
  haut: [{ make: hedge }, { make: stoneWall }],
  pilier: [{ make: trunk }],
  coin: [{ make: (K, g, b) => boulder(K, g, b) }],
  plateforme: [{ make: (K, g, b) => steppingStone(K, g, b) }],
  rampe: [{ make: plankRamp }],
  parkour: [{ make: (K, g, b) => potLid(K, g, b) }, { make: (K, g, b) => steppingStone(K, g, b, true) }],
  looks: { planter, boulder, hedge, stoneWall, trunk, steppingStone: (K, g, b) => steppingStone(K, g, b), plankRamp },
  ambient: { n: 70, color: '#FFF6B0', size: 0.09, rise: 0.12, sway: 0.9, glow: false }, // pollen drifting (Ambient.js)
  mural: [
    { make(K, g) { // sunflowers against the hedge
      const m = M(K);
      for (const [x, h] of [[-1.2, 3.4], [0, 4.2], [1.3, 3.0]]) {
        K.add(g, K.cyl(0.07, 0.09, h, 0.03, 8), m.stem, x, h / 2, 0.5, 0, 0, 0, 1, { cast: false });
        K.add(g, K.cyl(0.62, 0.62, 0.1, 0.04, 16), m.sun, x, h + 0.1, 0.6, Math.PI / 2 - 0.3, 0, 0, 1, { cast: false });
        K.add(g, K.cyl(0.3, 0.3, 0.14, 0.05, 16), m.sunC, x, h + 0.1, 0.66, Math.PI / 2 - 0.3, 0, 0, 1, { cast: false });
        K.add(g, K.sphere(0.3, 10, 6), m.leaf, x + 0.25, h * 0.45, 0.5, 0, 0, 0.6, [1.4, 0.35, 0.8], { cast: false });
      }
    } },
    { make(K, g) { // birdhouse on a post
      const m = M(K); K.add(g, K.cyl(0.08, 0.08, 3.2, 0.03, 8), m.wood, 0, 1.6, 0.4, 0, 0, 0, 1, { cast: false });
      K.add(g, K.box(0.9, 0.8, 0.8, 0.12), m.woodL, 0, 3.55, 0.4, 0, 0, 0, 1, { cast: false });
      K.add(g, K.cone(0.72, 0.5, 4), m.roof, 0, 4.2, 0.4, 0, Math.PI / 4, 0, 1, { cast: false });
      K.add(g, K.cyl(0.14, 0.14, 0.04, 0.01, 14), K.f('#2A2140'), 0, 3.6, 0.82, Math.PI / 2, 0, 0, 1, { ink: false, cast: false });
    } },
  ],
  sol: [
    { r: 3.4, make(K, g) { const m = M(K); for (let i = 0; i < 5; i++) K.add(g, K.box(0.9, 0.08, 0.7, 0.3), m.path, (i - 2) * 1.2, 0.04, Math.sin(i * 1.3) * 0.4, 0, i * 0.7, 0, 1, { cast: false }); } },
    { r: 1.2, make(K, g) { const m = M(K); for (let i = 0; i < 6; i++) { const a = i * 1.05; K.add(g, K.cone(0.12, 0.5, 5), m.grass, Math.cos(a) * 0.4, 0.25, Math.sin(a) * 0.4, Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, 1, { cast: false }); } } },
    { r: 1.4, make(K, g) { const m = M(K); flowers(K, g, m, [[0, 0], [0.5, 0.3], [-0.4, 0.4], [0.2, -0.5], [-0.5, -0.3]], 0); } },
  ],
};
