// Salle de bain (concept/js/biome-bath.js): claw-foot tub, laundry basket, pink sink cabinet, glass bath screen,
// toilet-paper roll pillars, tiled corner columns, soap bars (platforms / parkour), duckboard ramps; towels, round
// mirror, shower, duck shelf and a sky window on the walls, bath mat, puddles, scale, slippers and rubber ducks on the
// floor, soap bubbles in the air. Every recipe fits its box: local origin at the bottom centre, x ∈ [-w/2, w/2],
// y ∈ [0, h], z ∈ [-d/2, d/2]. Flat cloth / panels / tiny bars use bevel 0.02 (plain 12-triangle box): cheap in triangles.
import { alongX } from './kit.js';
import { band, rimOf, NO, NC } from './common.js';

const P = 0.02; // bevel <= 2 cm = plain box
const C = { ceramic: '#FFFFFF', chrome: '#CFE3EA', water: '#7FD3EE', cab: '#FFB3A7', cab2: '#FF9A8B', towelB: '#FF8FA3', soap: ['#FFB6D0', '#9FF0D2', '#FFE58A'], wood: '#E8B878', glass: '#BFEFFF', basket: '#F2D6A2', pot: '#FF8A5B', leaf: '#46C27A', duck: '#FFD23F', beak: '#FF8A2A' };
const M = (K) => ({
  ceramic: K.m(C.ceramic, { rim: 0.12, ao: 0.85 }), chrome: K.m(C.chrome, { shadow: 0.7, rim: 0.2 }), water: K.f(C.water), cab: K.m(C.cab), cab2: K.m(C.cab2),
  towelA: K.m(K.pal.accent, { pattern: 'stripes', color2: '#FFFFFF', scale: 0.22 }), towelB: K.m(C.towelB, { pattern: 'stripes', color2: '#FFFFFF', scale: 0.22 }),
  wood: K.m(C.wood, { pattern: 'planks', scale: 0.3 }), woodD: K.m('#D6A468', { pattern: 'planks', scale: 0.3 }), glass: K.f(C.glass), basket: K.m(C.basket, { pattern: 'stripes', color2: '#E3C28A', scale: 0.18 }),
  tiles: K.m(C.ceramic, { pattern: 'grid', lineA: 0.12, scale: 0.8, ao: 0.8 }), mosaic: K.m('#FFFFFF', { pattern: 'checker', color2: '#FFD0D8', scale: 0.26, ao: 0.9 }), white: K.f('#FFFFFF'),
  paper: K.m('#FFFFFF', { rim: 0.1, shadow: 0.72, pattern: 'dots', color2: '#EAF1F8', scale: 0.11 }), core: K.m('#C9D6E2'),
  mat: K.m(C.towelB, { pattern: 'dots', color2: '#FFC0CE', scale: 0.4, ao: 1 }), pot: K.m(C.pot), leaf: K.m(C.leaf), duck: K.m(C.duck, { rim: 0.3 }), beak: K.m(C.beak), eye: K.f('#1E1633'),
});

/** ramp with two edge rails (same top surface as the ramp): the slope stays the gameplay surface */
function railed(K, g, b, main, rail, w = 0.16) {
  const z = b.ramp.axis === 'z';
  K.add(g, K.rampGeo(z ? b.w - 2 * w : b.w, b.h, z ? b.d : b.d - 2 * w, b.ramp), main, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(z ? w : b.w, b.h, z ? b.d : w, b.ramp), rail, z ? s * (b.w / 2 - w / 2) : 0, b.h / 2, z ? 0 : s * (b.d / 2 - w / 2));
}
function tap(K, g, m, x, y, z, s = 1) { // chrome tap: stem, spout toward +z and two yellow cross handles
  K.add(g, K.capsule(0.07 * s, 0.34 * s, 3, 8), m.chrome, x, y + 0.2 * s, z, 0, 0, 0, 1, NC);
  K.add(g, K.capsule(0.06 * s, 0.34 * s, 3, 8), m.chrome, x, y + 0.42 * s, z + 0.15 * s, Math.PI / 2, 0, 0, 1, NC);
  for (const sd of [-1, 1]) K.add(g, K.sphere(0.08 * s, 6, 5), m.duck, x + sd * 0.2 * s, y + 0.1 * s, z, 0, 0, 0, 1, NO);
}
function bottle(K, g, m, c, x, y, z, s = 1) { // shampoo bottle: coloured body, chrome cap, white label
  K.add(g, K.capsule(0.13 * s, 0.3 * s, 4, 8), c, x, y + 0.28 * s, z, 0, 0, 0, 1, NC);
  K.add(g, K.sphere(0.07 * s, 6, 5), m.chrome, x, y + 0.64 * s, z, 0, 0, 0, 1, NC);
  K.add(g, K.box(0.2 * s, 0.17 * s, 0.02, P), m.white, x, y + 0.28 * s, z + 0.125 * s, 0, 0, 0, 1, NO);
}

function tub(K, g, b) { // claw-foot tub: ceramic body with a coral band on chrome claw feet, water inside the rim, foam, tap
  const m = M(K), { L, T } = alongX(g, b), H = b.h, feet = Math.min(0.32, H * 0.2), bh = H - feet, r = Math.min(T * 0.32, bh * 0.45);
  K.add(g, K.box(L, bh, T, r), m.ceramic, 0, feet + bh / 2, 0);
  K.add(g, K.box(L + 0.05, 0.14, T + 0.05, 0.07), m.cab2, 0, feet + bh * 0.4, 0, 0, 0, 0, 1, NC); // coral band
  K.add(g, K.box(L - 2 * r * 0.8, 0.04, T - 2 * r * 0.8, P), m.water, 0, H + 0.005, 0, 0, 0, 0, 1, NO);
  for (const [x, z, k] of [[-0.3, 0.1, 1], [0.05, -0.15, 0.7], [0.3, 0.12, 0.85], [0.18, 0.22, 0.45]]) K.add(g, K.sphere(0.3 * k, 10, 8), m.white, x * L, H - 0.02 + 0.06 * k, z * T, 0, 0, 0, [1, 0.75, 1], NC); // foam
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (L / 2 - 0.5), z = sz * (T / 2 - 0.35);
    K.add(g, K.sphere(0.26, 12, 8), m.chrome, x, feet * 0.62, z, 0, 0, 0, [1, feet * 2.2, 1]);
    K.add(g, K.sphere(0.13, 6, 5), m.chrome, x + sx * 0.12, 0.1, z + sz * 0.1, 0, 0, 0, 1, NO); // toe
  }
  tap(K, g, m, -L / 2 + r * 0.9, H, 0, 1.3);
  duck(K, K.sub(g, L * 0.2, H - 0.04, -T * 0.05, 0.7), 0.6, true); // a rubber duck bathing
}
function basket(K, g, b) { // wicker laundry basket: weave bands, two ring handles, a towel and a sock peeking out
  const m = M(K), R = Math.min(b.w, b.d) / 2 * 0.96, H = b.h, bh = H - 0.14, rr = (y) => R * (0.88 + 0.12 * (y / bh));
  K.add(g, K.cyl(R, R * 0.88, bh, 0.12, 24), m.basket, 0, bh / 2, 0);
  for (const f of [0.3, 0.62]) K.add(g, K.torus(rr(bh * f) + 0.005, 0.045, 4, 20), m.woodD, 0, bh * f, 0, Math.PI / 2, 0, 0, 1, NO);
  K.add(g, K.torus(R * 0.96, 0.09, 8, 28), m.cab2, 0, H - 0.14, 0, Math.PI / 2);
  for (const s of [-1, 1]) K.add(g, K.torus(0.17, 0.04, 5, 12), m.cab2, s * (R * 0.96 + 0.02), bh * 0.8, 0, 0, Math.PI / 2, 0, 1, NC);
  K.add(g, K.box(R * 1.1, 0.3, R * 0.9, 0.12), m.towelB, R * 0.1, H - 0.15, 0.05, 0.2, 0.4, 0.15);
  K.add(g, K.capsule(0.11, 0.5, 3, 8), m.towelA, -R * 0.35, H - 0.02, -R * 0.25, 0.5, 0.3, 1.2, 1, NC);
}
function cabinet(K, g, b) { // pink sink cabinet: plinth, ceramic top with basin and tap, panelled doors on both sides
  const m = M(K), { L, T } = alongX(g, b), H = b.h, top = Math.min(0.26, H * 0.2), pl = 0.14, bh = H - top - pl;
  K.add(g, K.box(L - 0.3, pl, T - 0.3, P), m.cab2, 0, pl / 2, 0);
  K.add(g, K.box(L - 0.1, bh, T - 0.1, 0.16), m.cab, 0, pl + bh / 2, 0);
  K.add(g, K.box(L, top, T, 0.08), m.ceramic, 0, H - top / 2, 0);
  K.add(g, K.sphere(1, 14, 6), m.glass, L * 0.12, H + 0.008, 0, 0, 0, 0, [Math.min(L * 0.22, 1.1), 0.01, T * 0.28], NO);
  tap(K, g, m, L * 0.12, H, -T * 0.3, 0.9);
  const dw = (L - 0.5) / 2;
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    const x = sx * (dw / 2 + 0.08), z = sz * (T / 2 - 0.04);
    K.add(g, K.box(dw, bh * 0.72, 0.1, 0.045), m.cab2, x, pl + bh * 0.5, z, 0, 0, 0, 1, NC);
    K.add(g, K.box(dw * 0.7, bh * 0.5, 0.04, P), m.cab, x, pl + bh * 0.5, z + sz * 0.04, 0, 0, 0, 1, NO); // raised panel
    K.add(g, K.sphere(0.09, 6, 5), m.duck, sx * 0.22, pl + bh * 0.66, z + sz * 0.08, 0, 0, 0, 1, NO);
  }
}
function screen(K, g, b) { // glass bath screen: ceramic frame, sky-blue glass both sides with glints and drops, chrome rail and handle
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, Math.min(0.2, T * 0.45)), m.ceramic, 0, H / 2, 0);
  for (const s of [-1, 1]) {
    const d = K.sub(g, 0, 0, s * (T / 2 + 0.01), s > 0 ? 0 : Math.PI);
    K.add(d, K.box(L - 0.5, H - 0.7, 0.04, P), m.glass, 0, H / 2 + 0.1, 0, 0, 0, 0, 1, NO);
    K.add(d, K.box(0.16, H * 0.4, 0.03, P), m.white, -L * 0.2, H * 0.55, 0.02, 0, 0, 0.5, 1, NO); K.add(d, K.box(0.06, H * 0.2, 0.03, P), m.white, -L * 0.2 + 0.3, H * 0.4, 0.02, 0, 0, 0.5, 1, NO);
    for (let i = 0; i < 3; i++) K.add(d, K.sphere(1, 6, 4), m.white, (K.rnd() - 0.5) * (L - 1.2), H * (0.25 + K.rnd() * 0.55), 0.02, 0, 0, 0, [0.06, 0.1, 0.02], NO); // drops
    K.add(d, K.box(0.08, 0.6, 0.08, P), m.chrome, L / 2 - 0.45, H * 0.5, 0.1, 0, 0, 0, 1, NC);
    for (let i = 0; i < 4; i++) K.add(d, K.sphere(1, 8, 4), m.white, (i - 1.5) * 0.45 - L * 0.1, H * 0.82 + (i % 2) * 0.12, 0.02, 0, 0, 0, [0.12, 0.12, 0.02], NO); // bubble stickers
  }
  K.add(g, K.capsule(0.07, L - 0.4, 4, 10), m.chrome, 0, H - 0.02, 0, 0, 0, Math.PI / 2, 1, NC);
}
function tiledWall(K, g, b) { // tiled half-wall: baseboard, mosaic frieze, coral cap, towel bar with a towel on each side
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H - 0.2, T, 0.12), m.tiles, 0, (H - 0.2) / 2, 0);
  K.add(g, K.box(L + 0.06, 0.22, T + 0.06, P), m.cab2, 0, 0.11, 0, 0, 0, 0, 1, NC); // baseboard
  K.add(g, K.box(L, 0.22, T + 0.04, 0.08), m.cab2, 0, H - 0.11, 0);
  for (const s of [-1, 1]) {
    const d = K.sub(g, 0, 0, s * (T / 2 + 0.02), s > 0 ? 0 : Math.PI);
    K.add(d, K.box(L - 0.2, 0.34, 0.04, P), m.mosaic, 0, H * 0.5, 0, 0, 0, 0, 1, NO); // mosaic frieze
    K.add(d, K.box(1.4, 0.06, 0.06, P), m.chrome, L * 0.2, H - 0.5, 0.1, 0, 0, 0, 1, NC);
    K.add(d, K.box(1.2, 1.2, 0.08, P), s > 0 ? m.towelA : m.towelB, L * 0.2, H - 1.1, 0.12, 0, 0, 0.04, 1, NC);
    K.add(d, K.box(1.2, 0.1, 0.1, P), m.white, L * 0.2 + 0.02, H - 1.68, 0.12, 0, 0, 0.04, 1, NO); // towel hem
  }
}
function paperColumn(K, g, b) { // toilet-paper rolls stacked to the ceiling (spec §3.1): quilted paper, cardboard core, a loose tail
  const m = M(K), R = b.r, H = b.h, n = Math.max(1, Math.round(H / 1.35)), rh = H / n;
  K.add(g, K.cyl(R * 0.45, R * 0.45, H, 0.02, 8), m.core, 0, H / 2, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < n; i++) K.add(g, K.cyl(R, R, rh - 0.05, 0.14, 24), m.paper, 0, rh * i + rh / 2, 0, 0, (i * 1.3) % 6.28);
  K.add(g, K.cyl(R * 0.36, R * 0.36, 0.06, 0.02, 18), m.core, 0, H, 0, 0, 0, 0, 1, NC);
  const t = K.sub(g, 0, 0, 0, K.rnd() * 6.28), y0 = rh * (n > 1 ? n - 1 : 1) - 0.05; // the tail hangs from the second roll from the top
  K.add(t, K.box(R * 0.8, rh * 0.75, 0.04, P), m.paper, 0, y0 - rh * 0.4, R + 0.03, 0, 0, 0.04, 1, NO);
  K.add(t, K.box(R * 0.8, 0.14, 0.14, P), m.paper, 0, y0 - rh * 0.8, R + 0.07, 0, 0, 0, 1, NO); // curled end
}
function tiledColumn(K, g, b) { // corner column: tiles, plinth, mosaic bands with coral trims
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H, b.d, 0.2), m.tiles, 0, H / 2, 0);
  K.add(g, K.box(b.w + 0.12, 0.3, b.d + 0.12, P), m.cab2, 0, 0.15, 0, 0, 0, 0, 1, NC);
  for (const y of [0.95, H - 0.4]) {
    K.add(g, K.box(b.w + 0.08, 0.26, b.d + 0.08, 0.1), m.mosaic, 0, y, 0, 0, 0, 0, 1, NC);
    for (const dy of [-0.15, 0.15]) K.add(g, K.box(b.w + 0.12, 0.04, b.d + 0.12, P), m.cab2, 0, y + dy, 0, 0, 0, 0, 1, NO);
  }
}
function soap(K, g, b, parkour = false) { // soap bar (platform): pastel slab, embossed oval, foam bubbles; parkour: function band + ring
  const m = M(K), H = b.h, col = C.soap[Math.floor(K.rnd() * 3)];
  K.add(g, K.box(b.w, H, b.d, Math.min(0.26, H * 0.45)), K.m(col, { rim: 0.2, ao: 1 }), 0, H / 2, 0);
  K.add(g, K.sphere(1, 16, 5), m.white, 0, H + 0.01, 0, 0, 0, 0, [b.w * 0.33, 0.04, b.d * 0.3], NO); // embossed oval
  for (const [x, z, r] of [[-0.4, 0.38, 0.14], [-0.3, 0.3, 0.1]]) K.add(g, K.sphere(r, 8, 6), m.ceramic, x * b.w, H + r * 0.5, z * b.d, 0, 0, 0, 1, NO); // foam
  if (parkour) { band(K, g, b); K.add(g, K.torus(0.22, 0.06, 8, 20), K.f(rimOf(b)), b.w * 0.33, H + 0.06, b.d * 0.3, Math.PI / 2, 0, 0, 1, NC); }
}
function duckboard(K, g, b) { railed(K, g, b, M(K).wood, M(K).woodD, 0.18); } // wooden bath board ramp with darker side rails
function ceramicSlab(K, g, b) { // basin top: ceramic slab, sink bowl with drain, tap
  const m = M(K), { L, T } = alongX(g, b);
  K.add(g, K.box(L, b.h, T, Math.min(0.08, b.h * 0.4)), m.ceramic, 0, b.h / 2, 0);
  K.add(g, K.sphere(1, 16, 6), m.ceramic, 0, b.h + 0.005, 0.1, 0, 0, 0, [L * 0.33, 0.015, T * 0.3], NO);
  K.add(g, K.sphere(1, 16, 6), m.glass, 0, b.h + 0.02, 0.1, 0, 0, 0, [L * 0.28, 0.01, T * 0.25], NO);
  tap(K, g, m, 0, b.h, -T / 2 + 0.3, 1.1);
}
function toilet(K, g, b) { // toilet bowl: pedestal lathe, water, coral seat ring
  const m = M(K), R = Math.min(b.w, b.d) / 2, H = b.h;
  K.add(g, K.lathe([[0, 0], [R * 0.62, 0], [R * 0.66, H * 0.1], [R * 0.5, H * 0.45], [R * 0.78, H * 0.78], [R * 0.98, H * 0.94], [R, H], [0, H]], 32), m.ceramic, 0, 0, 0);
  K.add(g, K.sphere(1, 14, 5), m.water, 0, H + 0.01, 0, 0, 0, 0, [R * 0.64, 0.01, R * 0.64], NO);
  K.add(g, K.torus(R * 0.8, 0.1, 8, 28), m.cab2, 0, H + 0.04, 0, Math.PI / 2);
}
function tank(K, g, b) { // cistern: lid overhang, chrome button, side lever with a yellow knob
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H - 0.14, b.d, 0.2), m.ceramic, 0, (H - 0.14) / 2, 0);
  K.add(g, K.box(b.w + 0.08, 0.16, b.d + 0.08, 0.07), m.ceramic, 0, H - 0.08, 0);
  K.add(g, K.sphere(0.14, 8, 6), m.chrome, 0, H + 0.02, 0, 0, 0, 0, [1, 0.5, 1], NC);
  K.add(g, K.box(0.34, 0.07, 0.07, P), m.chrome, -b.w * 0.3, H * 0.7, b.d / 2 + 0.06, 0, 0, 0, 1, NC);
  K.add(g, K.sphere(0.08, 6, 5), m.duck, -b.w * 0.3 + 0.2, H * 0.7, b.d / 2 + 0.06, 0, 0, 0, 1, NO);
}
function shelf(K, g, b) { // wall shelf: bottles and a toothbrush cup
  const m = M(K), { L, T } = alongX(g, b), cols = [m.towelA, m.cab2, K.m('#6FD6FF')];
  K.add(g, K.box(L, b.h, T, 0.06), m.wood, 0, b.h / 2, 0);
  for (let i = 0; i < 3; i++) bottle(K, g, m, cols[i], (i - 1.2) * L * 0.25, b.h, 0, 0.8 + (i % 2) * 0.2);
  const cx = L * 0.36; K.add(g, K.cyl(0.14, 0.12, 0.3, 0.04, 10), m.ceramic, cx, b.h + 0.15, 0, 0, 0, 0, 1, NC);
  for (const [dx, c] of [[-0.05, m.cab2], [0.06, m.duck]]) K.add(g, K.box(0.05, 0.34, 0.05, P), c, cx + dx, b.h + 0.4, 0, 0, 0, dx * 3, 1, NO);
}
function radiator(K, g, b) { // radiator: fins between two bars, a yellow valve, a towel drying over the front
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(4, Math.round(L / 0.42));
  for (let i = 0; i < n; i++) K.add(g, K.box(0.26, H, T * 0.8, 0.1), m.ceramic, -L / 2 + (i + 0.5) * (L / n), H / 2, 0);
  for (const y of [0.15, H - 0.15]) K.add(g, K.capsule(0.07, L - 0.2, 6, 10), m.chrome, 0, y, 0, 0, 0, Math.PI / 2, 1, NC);
  K.add(g, K.sphere(0.1, 6, 5), m.duck, L / 2 - 0.1, H * 0.5, T * 0.45, 0, 0, 0, 1, NO);
  K.add(g, K.box(L * 0.26, H * 0.6, T * 0.8 + 0.12, P), m.towelB, -L * 0.18, H * 0.62, 0, 0, 0, 0, 1, NC);
}
function hamper(K, g, b) { railed(K, g, b, M(K).mat, M(K).cab2, 0.14); } // laundry heap ramp with coral rails
function plant(K, g, b) { // potted plant (the old decor plant, same collider: 0.9 s wide, 0.7 s tall): saucer, rim, leaves, a flower
  const m = M(K), s = b.h / 0.7;
  K.add(g, K.box(1.0 * s, 0.06 * s, 1.0 * s, P), m.ceramic, 0, 0.03 * s, 0, 0, 0, 0, 1, NC);
  K.add(g, K.cyl(0.45 * s, 0.34 * s, 0.7 * s, 0.08, 20), m.pot, 0, 0.37 * s, 0);
  K.add(g, K.cyl(0.48 * s, 0.47 * s, 0.1 * s, 0.03, 16), m.cab2, 0, 0.67 * s, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; K.add(g, K.sphere(0.3 * s, 10, 8), m.leaf, Math.cos(a) * 0.22 * s, 1.1 * s + (i % 2) * 0.2 * s, Math.sin(a) * 0.22 * s, Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5, [0.45, 1.5, 0.18]); }
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; K.add(g, K.sphere(0.09 * s, 6, 5), m.towelB, Math.cos(a) * 0.12 * s, 1.72 * s, Math.sin(a) * 0.12 * s, 0, 0, 0, 1, NO); }
  K.add(g, K.sphere(0.08 * s, 6, 5), m.duck, 0, 1.74 * s, 0, 0, 0, 0, 1, NO);
}
function duck(K, g, s = 1, lo = false) { // rubber duck (decor, no collision): body, head, wings, tail, beak, glossy eyes (lo: fewer facets)
  const m = M(K), q = lo ? 0 : 1;
  K.add(g, K.sphere(0.34 * s, lo ? 10 : 14, lo ? 8 : 10), m.duck, 0, 0.28 * s, 0, 0, 0, 0, [1.05, 0.82, 1.3]);
  K.add(g, K.sphere(0.22 * s, lo ? 8 : 12, lo ? 6 : 10), m.duck, 0, 0.62 * s, 0.22 * s);
  K.add(g, K.cone(0.1 * s, 0.24 * s, 8), m.beak, 0, 0.58 * s, 0.46 * s, Math.PI / 2, 0, 0, [1.3, 1, 0.55], NC); // beak
  K.add(g, K.cone(0.14 * s, 0.3 * s, 6), m.duck, 0, 0.44 * s, -0.44 * s, -2.3, 0, 0, 1, NC); // tail tip
  for (const sd of [-1, 1]) {
    if (q) K.add(g, K.sphere(0.2 * s, 8, 6), m.duck, sd * 0.33 * s, 0.3 * s, -0.04 * s, 0, 0, sd * 0.25, [0.35, 0.7, 1], NC);
    K.add(g, K.sphere(0.04 * s, 6, 5), m.eye, sd * 0.1 * s, 0.68 * s, 0.38 * s, 0, 0, 0, 1, NO);
  }
}

export default {
  bas: [
    { fits: (b) => Math.max(b.w, b.d) / Math.min(b.w, b.d) >= 1.3 && Math.min(b.w, b.d) >= 1.8, make: tub },
    { fits: (b) => Math.max(b.w, b.d) / Math.min(b.w, b.d) < 1.3, make: basket },
    { make: cabinet },
  ],
  haut: [{ make: screen }, { make: tiledWall }],
  pilier: [{ make: paperColumn }],
  coin: [{ make: tiledColumn }],
  plateforme: [{ make: (K, g, b) => soap(K, g, b) }],
  rampe: [{ make: duckboard }],
  parkour: [{ make: (K, g, b) => soap(K, g, b, true) }],
  looks: { tub, basket, cabinet, ceramicSlab, toilet, tank, shelf, radiator, hamper, plant, soap: (K, g, b) => soap(K, g, b), duckboard,
    bathMat: (K, g, b) => { // bath mat: dotted rug with a white stitched border
      const m = M(K); K.add(g, K.box(b.w, 0.06, b.d, 0.03), m.mat, 0, 0.03, 0, 0, 0, 0, 1, NC);
      for (const s of [-1, 1]) { K.add(g, K.box(b.w - 0.3, 0.012, 0.05, 0.005), m.white, 0, 0.066, s * (b.d / 2 - 0.15), 0, 0, 0, 1, NO); K.add(g, K.box(0.05, 0.012, b.d - 0.3, 0.005), m.white, s * (b.w / 2 - 0.15), 0.066, 0, 0, 0, 0, 1, NO); }
    }, skip: () => {} },
  solCount: [5, 3], // floor decals per room: [at least, up to this many more]
  ambient: { n: 70, color: '#FFFFFF', size: 0.16, rise: 0.45, sway: 0.35, glow: false }, // soap bubbles drifting up (Ambient.js)
  mural: [
    { make(K, g) { // towel rack: wall plates, bar, striped towels with hems
      const m = M(K); K.add(g, K.capsule(0.07, 3.4, 4, 10), m.chrome, 0, 3.6, 0.3, 0, 0, Math.PI / 2, 1, NC);
      for (const s of [-1, 1]) { K.add(g, K.box(0.3, 0.3, 0.08, P), m.chrome, s * 1.8, 3.6, 0.04, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.12, 6, 5), m.duck, s * 1.82, 3.6, 0.3, 0, 0, 0, 1, NO); }
      K.add(g, K.box(1.3, 1.9, 0.16, P), m.towelA, -0.8, 2.7, 0.36, 0, 0, 0.04, 1, NC); K.add(g, K.box(1.2, 1.5, 0.16, P), m.towelB, 0.8, 2.9, 0.36, 0, 0, -0.05, 1, NC);
      K.add(g, K.box(1.3, 0.1, 0.18, P), m.white, -0.79, 1.8, 0.36, 0, 0, 0.04, 1, NO); K.add(g, K.box(1.2, 0.1, 0.18, P), m.white, 0.82, 2.2, 0.36, 0, 0, -0.05, 1, NO);
    } },
    { make(K, g) { // round mirror with a chrome frame over a bottle shelf
      const m = M(K); K.add(g, K.cyl(1.2, 1.2, 0.14, 0.06, 32), m.chrome, 0, 4.4, 0.1, Math.PI / 2);
      K.add(g, K.cyl(1.0, 1.0, 0.06, 0.02, 32), m.glass, 0, 4.4, 0.18, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, K.box(0.16, 1.1, 0.02, P), m.white, -0.3, 4.55, 0.22, 0, 0, -0.6, 1, NO); K.add(g, K.box(0.07, 0.4, 0.02, P), m.white, -0.62, 4.15, 0.22, 0, 0, -0.6, 1, NO);
      K.add(g, K.box(2.6, 0.14, 0.6, 0.05), m.ceramic, 0, 3.1, 0.3, 0, 0, 0, 1, NC);
      for (const s of [-1, 1]) K.add(g, K.box(0.1, 0.3, 0.3, P), m.chrome, s * 1.0, 2.9, 0.2, 0, 0, 0, 1, NO);
      [m.towelA, m.cab2, K.m('#6FD6FF')].forEach((c, i) => bottle(K, g, m, c, (i - 1) * 0.8, 3.17, 0.3, 0.85));
    } },
    { make(K, g) { // window with sky, clouds, a sill and a potted flower
      const m = M(K); K.add(g, K.box(3.4, 2.6, 0.3, 0.2), m.ceramic, 0, 4.4, 0.05, 0, 0, 0, 1, NC);
      K.add(g, K.box(2.9, 2.1, 0.1, P), K.f('#9EE3FF'), 0, 4.4, 0.18, 0, 0, 0, 1, NO);
      K.add(g, K.box(0.12, 2.1, 0.14, P), m.ceramic, 0, 4.4, 0.24, 0, 0, 0, 1, NC); K.add(g, K.box(2.9, 0.12, 0.14, P), m.ceramic, 0, 4.4, 0.24, 0, 0, 0, 1, NC);
      K.add(g, K.sphere(0.35, 10, 6), m.white, -0.7, 4.8, 0.2, 0, 0, 0, [1.6, 0.7, 0.3], NO); K.add(g, K.sphere(0.22, 8, 6), m.white, -0.1, 4.7, 0.2, 0, 0, 0, [1.5, 0.7, 0.3], NO);
      K.add(g, K.box(3.8, 0.16, 0.6, P), m.ceramic, 0, 3.0, 0.3, 0, 0, 0, 1, NC);
      K.add(g, K.cyl(0.24, 0.18, 0.3, 0.05, 10), m.pot, 1.1, 3.23, 0.32, 0, 0, 0, 1, NC);
      for (let i = 0; i < 2; i++) K.add(g, K.sphere(0.16, 6, 5), m.leaf, 1.1 + (i - 0.5) * 0.26, 3.6, 0.32, 0, 0, (i - 0.5) * 0.8, [0.6, 1.5, 0.5], NO);
      K.add(g, K.sphere(0.1, 6, 5), m.towelB, 1.1, 3.9, 0.32, 0, 0, 0, 1, NO);
    } },
    { make(K, g, o) { // shower: pipe, tap handles, tilted head and streaming water
      const m = M(K), top = Math.min(o.h - 1.6, 6);
      K.add(g, K.capsule(0.08, top - 0.3, 4, 8), m.chrome, 0, top / 2, 0.14, 0, 0, 0, 1, NC);
      K.add(g, K.capsule(0.07, 0.9, 3, 8), m.chrome, 0, top, 0.5, Math.PI / 2, 0, 0, 1, NC);
      K.add(g, K.cyl(0.55, 0.5, 0.14, 0.05, 16), m.chrome, 0, top - 0.12, 0.95, 0.35, 0, 0, 1, NC);
      for (const s of [-1, 1]) K.add(g, K.sphere(0.1, 6, 5), m.duck, s * 0.32, 1.9, 0.26, 0, 0, 0, 1, NO);
      K.add(g, K.box(0.7, 0.07, 0.07, P), m.chrome, 0, 1.9, 0.2, 0, 0, 0, 1, NC);
      for (let i = -2; i <= 2; i++) K.add(g, K.box(0.05, top - 0.5, 0.03, P), m.water, i * 0.17 + (i % 2) * 0.05, (top - 0.5) / 2 - 0.05, 1.05 + Math.abs(i) * 0.05, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(1, 14, 4), m.water, 0, 0.012, 1.2, 0, 0, 0, [0.9, 0.004, 0.45], NO);
    } },
    { make(K, g) { // wall shelf with a parade of rubber ducks
      const m = M(K); K.add(g, K.box(4.2, 0.18, 0.7, 0.06), m.wood, 0, 3.4, 0.35, 0, 0, 0, 1, NC);
      for (const s of [-1, 1]) K.add(g, K.box(0.1, 0.4, 0.5, P), m.chrome, s * 1.7, 3.16, 0.3, 0, 0, 0, 1, NO);
      [[-1.3, 0.55], [0, 0.7], [1.3, 0.45]].forEach(([x, s]) => duck(K, K.sub(g, x, 3.5, 0.4), s, true));
    } },
    { make(K, g) { // tile frieze: mosaic band with coral trims and a row of little bubbles
      const m = M(K); K.add(g, K.box(5.4, 0.5, 0.08, P), m.mosaic, 0, 2.6, 0.04, 0, 0, 0, 1, NC);
      for (const dy of [-0.3, 0.3]) K.add(g, K.box(5.5, 0.1, 0.12, P), m.cab2, 0, 2.6 + dy, 0.06, 0, 0, 0, 1, NC);
      for (let i = 0; i < 5; i++) K.add(g, K.sphere(0.16 + (i % 3) * 0.05, 8, 6), m.ceramic, (i - 2) * 1.1, 3.35 + (i % 2) * 0.4, 0.12, 0, 0, 0, [1, 1, 0.3], NO);
    } },
  ],
  sol: [
    { r: 2.6, make(K, g) { // bath mat: dotted rug with a stitched border and two foot prints
      const m = M(K); K.add(g, K.box(4.2, 0.08, 2.6, 0.05), m.mat, 0, 0.04, 0, 0, 0, 0, 1, NC);
      for (const s of [-1, 1]) { K.add(g, K.box(3.8, 0.012, 0.06, 0.005), m.white, 0, 0.086, s * 1.05, 0, 0, 0, 1, NO); K.add(g, K.box(0.06, 0.012, 2.1, 0.005), m.white, s * 1.9, 0.086, 0, 0, 0, 0, 1, NO); K.add(g, K.sphere(1, 12, 4), m.glass, s * 0.35, 0.09, 0.1, 0, 0, 0, [0.22, 0.004, 0.42], NO); }
    } },
    { r: 1.4, make(K, g) { // puddle with a glint
      K.add(g, K.sphere(1, 20, 8), K.f('#BDEBF7'), 0, 0.012, 0, 0, 0, 0, [1.3, 0.004, 0.8], NO); K.add(g, K.sphere(1, 16, 6), K.f('#BDEBF7'), 1.2, 0.012, 0.5, 0, 0, 0, [0.45, 0.004, 0.35], NO);
      K.add(g, K.sphere(1, 10, 4), M(K).white, -0.3, 0.02, -0.15, 0, 0, 0.2, [0.4, 0.004, 0.08], NO);
    } },
    { r: 0.8, make(K, g) { K.add(g, K.sphere(1, 14, 4), K.f('#BDEBF7'), 0, 0.012, 0.05, 0, 0, 0, [0.85, 0.004, 0.85], NO); duck(K, g, 1); } }, // duck in a puddle
    { r: 1.1, make(K, g) { // bathroom scale: coral body, white plate, dark display, foot prints
      const m = M(K); K.add(g, K.box(1.5, 0.18, 1.5, 0.08), m.cab2, 0, 0.09, 0);
      K.add(g, K.box(1.2, 0.03, 1.2, P), m.white, 0, 0.195, -0.05, 0, 0, 0, 1, NO); K.add(g, K.box(0.6, 0.03, 0.2, P), m.eye, 0, 0.2, 0.55, 0, 0, 0, 1, NO);
      for (const s of [-1, 1]) K.add(g, K.sphere(1, 12, 4), m.glass, s * 0.3, 0.21, -0.1, 0, 0, 0, [0.2, 0.004, 0.36], NO);
    } },
    { r: 1.2, make(K, g) { // toilet-paper roll with a trailing sheet
      const m = M(K); K.add(g, K.cyl(0.36, 0.36, 0.6, 0.08, 14), m.paper, 0, 0.36, 0, 0, 0, Math.PI / 2);
      [[0.6, 0.2, 0.1], [1.05, -0.05, 0.3], [1.5, 0.15, -0.1]].forEach(([x, z, r]) => K.add(g, K.box(0.5, 0.02, 0.34, P), m.white, x - 0.2, 0.012, z, 0, r, 0, 1, NO));
    } },
    { r: 1.0, make(K, g) { // pair of fluffy slippers
      const m = M(K); for (const s of [-1, 1]) { K.add(g, K.sphere(0.5, 10, 6), m.cab2, s * 0.4, 0.14, 0, 0, s * 0.15, 0, [0.55, 0.3, 1]); K.add(g, K.sphere(0.3, 8, 6), m.ceramic, s * 0.4, 0.2, 0.34, 0, 0, 0, [1.2, 0.5, 0.6], NO); }
    } },
    { r: 1.0, make(K, g) { // heap of soap suds
      const m = M(K); [[0, 0, 0.42], [0.45, 0.2, 0.3], [-0.4, 0.3, 0.26], [-0.2, -0.2, 0.34]].forEach(([x, z, r]) => K.add(g, K.sphere(r, 8, 6), m.ceramic, x, r * 0.6, z, 0, 0, 0, [1, 0.85, 1], NC));
    } },
  ],
};
