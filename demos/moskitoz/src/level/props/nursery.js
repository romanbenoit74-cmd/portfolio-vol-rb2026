// Chambre d'enfant: stacks of ABC toy blocks, painted toy chests, cot sides with bars, toy pegboards, giant crayons as
// pillars, block towers in the corners, floating blocks, a toy slide, blocks as parkour; rainbows, clouds, stars, an ABC
// frieze and a teddy bear on the walls; a round rug, a foam alphabet mat, balls, stacking rings and a little toy car on the
// floor; twinkles in the air. Letters are built from thin bars (plain 12-triangle boxes): cheap and readable.
import { NC, NO, alongX, parkour, spread, square } from './common.js';

const P = 0.02; // bevel <= 2 cm = plain box
const TOYS = ['#FFB84A', '#FF7AA8', '#6FD0FF', '#8AE07A', '#B98CFF', '#FF6B5B'];
const M = (K) => ({
  toy: TOYS.map((c) => K.m(c, { rim: 0.15 })), flat: TOYS.map((c) => K.f(c)), white: K.m('#FFFFFF', { rim: 0.1 }), wood: K.m('#FFD08A', { pattern: 'planks', scale: 0.3 }),
  paper: K.m('#F4EEE2'), cloud: K.m('#FFFFFF', { rim: 0.3 }), star: K.m('#FFD04A', { rim: 0.4 }), rug: K.m('#FFE08A', { pattern: 'dots', color2: '#FF9CC8', scale: 0.35 }), tyre: K.m('#3B1D40'),
});
const FONT = { // block letters as strokes [x0, y0, x1, y1] on a unit square
  A: [[0, 0, 0.5, 1], [1, 0, 0.5, 1], [0.22, 0.4, 0.78, 0.4]], B: [[0, 0, 0, 1], [0, 1, 0.85, 1], [0, 0.5, 0.85, 0.5], [0, 0, 0.85, 0], [0.85, 1, 0.85, 0.5], [0.85, 0.5, 0.85, 0]],
  C: [[0, 0, 0, 1], [0, 1, 1, 1], [0, 0, 1, 0]], D: [[0, 0, 0, 1], [0, 1, 0.8, 0.8], [0, 0, 0.8, 0.2], [0.8, 0.8, 0.8, 0.2]], E: [[0, 0, 0, 1], [0, 1, 1, 1], [0, 0.5, 0.8, 0.5], [0, 0, 1, 0]],
  H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0.5, 1, 0.5]], K: [[0, 0, 0, 1], [0, 0.5, 1, 1], [0, 0.5, 1, 0]], L: [[0, 0, 0, 1], [0, 0, 1, 0]], M: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 1, 0.5, 0.4], [1, 1, 0.5, 0.4]],
  O: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 1, 1, 1], [0, 0, 1, 0]], S: [[0, 0, 1, 0], [1, 0, 1, 0.5], [0, 0.5, 1, 0.5], [0, 0.5, 0, 1], [0, 1, 1, 1]], T: [[0.5, 0, 0.5, 1], [0, 1, 1, 1]], Y: [[0, 1, 0.5, 0.5], [1, 1, 0.5, 0.5], [0.5, 0, 0.5, 0.5]],
};
const LETTERS = Object.keys(FONT);
function glyph(K, g, mat, ch, x, y, w, h, z) { // one letter of thin bars centred on (x, y), w x h in size, stroke th = 0.22 w
  const th = w * 0.24;
  for (const [ax, ay, bx, by] of FONT[ch]) {
    const x1 = x + (ax - 0.5) * w, y1 = y + (ay - 0.5) * h, x2 = x + (bx - 0.5) * w, y2 = y + (by - 0.5) * h;
    K.add(g, K.box(Math.hypot(x2 - x1, y2 - y1) + th, th, 0.03, P), mat, (x1 + x2) / 2, (y1 + y2) / 2, z, 0, 0, Math.atan2(y2 - y1, x2 - x1), 1, NO);
  }
}
function star(K, g, mat, x, y, z, S, rot = 0, o = NO) { for (const a of [0, Math.PI / 4]) K.add(g, K.box(S, S, 0.04, P), mat, x, y, z, 0, 0, rot + a, 1, o); } // 8-point burst from two squares

function block(K, g, m, s, x, y, z, ry = 0) { // toy block: coloured cube, white plates on two faces with a letter or a shape in a contrasting colour
  const c = Math.floor(K.rnd() * 6), c2 = (c + 3) % 6;
  K.add(g, K.box(s, s, s, s * 0.12), m.toy[c], x, y, z, 0, ry, 0);
  const d = K.sub(g, x, y, z, ry);
  for (const f of [-1, 1]) {
    const e = K.sub(d, 0, 0, f * (s / 2 + 0.01), f > 0 ? 0 : Math.PI), r = K.rnd();
    K.add(e, K.box(s * 0.7, s * 0.7, 0.02, P), m.white, 0, 0, 0, 0, 0, 0, 1, NO);
    if (r < 0.55) glyph(K, e, m.flat[c2], LETTERS[Math.floor(K.rnd() * LETTERS.length)], 0, 0, s * 0.34, s * 0.44, 0.02);
    else if (r < 0.75) K.add(e, K.sphere(s * 0.22, 10, 4), m.flat[c2], 0, 0, 0.02, 0, 0, 0, [1, 1, 0.1], NO);
    else if (r < 0.9) K.add(e, K.cone(s * 0.26, 0.03, 3), m.flat[c2], 0, 0, 0.03, Math.PI / 2, 0, 0, 1, NO);
    else star(K, e, m.flat[c2], 0, 0, 0.02, s * 0.36);
  }
}
function blocks(K, g, b) { // blocks filling the box: a grid of cubes, layers up to the top
  const m = M(K), { L, T } = alongX(g, b), H = b.h, s0 = Math.min(T, H), nx = Math.max(1, Math.round(L / s0)), ny = Math.max(1, Math.round(H / s0));
  const sx = L / nx, sy = H / ny, s = Math.min(sx, sy, T);
  for (let j = 0; j < ny; j++) for (const x of spread(nx, L)) block(K, g, m, s * 0.98, x, sy * (j + 0.5), 0, (K.rnd() - 0.5) * 0.1);
  if (s < T - 0.2 || s < sx - 0.2) K.add(g, K.box(L * 0.9, H * 0.95, T * 0.9, 0.1), m.toy[2], 0, H * 0.475, 0, 0, 0, 0, 1, { ink: false }); // core keeps the box solid
}
function chest(K, g, b) { // painted toy chest: domed-look lid, gold clasp and corner brackets, a big heart on both sides
  const m = M(K), { L, T } = alongX(g, b), H = b.h, c = Math.floor(K.rnd() * 6), k = Math.min(0.5, H * 0.3, L * 0.3);
  K.add(g, K.box(L, H * 0.8, T, 0.1), m.toy[c], 0, H * 0.4, 0);
  K.add(g, K.box(L + 0.08, H * 0.2, T + 0.08, 0.12), m.toy[(c + 2) % 6], 0, H * 0.9, 0);
  K.add(g, K.box(L + 0.04, 0.12, T + 0.04, P), m.white, 0, 0.06, 0, 0, 0, 0, 1, NC);
  for (const f of [-1, 1]) {
    const d = K.sub(g, 0, 0, f * (T / 2 + 0.02), f > 0 ? 0 : Math.PI);
    for (const s of [-1, 1]) K.add(d, K.sphere(k * 0.38, 8, 6), m.flat[(c + 4) % 6], s * k * 0.28, H * 0.42 + k * 0.2, 0.02, 0, 0, 0, [1, 1, 0.3], NO); // heart: two lobes and a diamond
    K.add(d, K.box(k * 0.62, k * 0.62, 0.04, P), m.flat[(c + 4) % 6], 0, H * 0.42 - k * 0.02, 0.02, 0, 0, Math.PI / 4, 1, NO);
    K.add(d, K.box(0.34, 0.26, 0.06, P), m.star, 0, H * 0.78, 0.03, 0, 0, 0, 1, NC); K.add(d, K.sphere(0.04, 6, 4), m.tyre, 0, H * 0.78, 0.07, 0, 0, 0, 1, NO); // clasp and keyhole
    for (const s of [-1, 1]) K.add(d, K.box(0.14, H * 0.8, 0.05, P), m.star, s * (L / 2 - 0.08), H * 0.4, 0.01, 0, 0, 0, 1, NC);
  }
}
function cot(K, g, b) { // cot side: rails with star decals, thick round bars, posts with ball finials (solid pale backing)
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L - 0.2, H - 0.3, Math.min(T * 0.2, 0.1), 0.02), m.paper, 0, H / 2, 0, 0, 0, 0, 1, { ink: false });
  for (const y of [0.15, H - 0.15]) K.add(g, K.box(L, 0.3, T, 0.1), m.white, 0, y, 0, 0, 0, 0, 1, NC);
  for (const x of spread(Math.max(4, Math.round(L / 0.45)), L - 0.3)) K.add(g, K.cyl(0.09, 0.09, H - 0.3, 0.02, 8), m.toy[1], x, H / 2, 0, 0, 0, 0, 1, NO);
  for (const x of [-1, 1]) { K.add(g, K.box(0.3, H - 0.2, T, 0.1), m.white, x * (L / 2 - 0.15), (H - 0.2) / 2, 0); K.add(g, K.sphere(0.2, 8, 6), m.toy[0], x * (L / 2 - 0.15), H - 0.1, 0, 0, 0, 0, 1, NC); }
  for (const s of [-1, 1]) for (const f of [-0.3, 0, 0.3]) star(K, g, m.star, f * L, 0.15, s * (T / 2 + 0.03), 0.2, f); // stars on the lower rail
}
function pegboard(K, g, b) { // toy pegboard wall: wooden board, TOYS sign, coloured pegs on both faces
  const m = M(K), { L, T } = alongX(g, b), H = b.h, c = Math.floor(K.rnd() * 6);
  K.add(g, K.box(L, H, T, 0.08), m.wood, 0, H / 2, 0);
  const u = Math.min(0.5, L / 6, H * 0.12);
  for (const s of [-1, 1]) {
    const d = K.sub(g, 0, 0, s * (T / 2 + 0.01), s > 0 ? 0 : Math.PI);
    K.add(d, K.box(Math.min(L * 0.8, u * 5.6), u * 1.7, 0.06, P), m.toy[c], 0, H - u * 1.3, 0.02, 0, 0, 0, 1, NC);
    [...'TOYS'].forEach((ch, i) => glyph(K, d, m.white, ch, (i - 1.5) * u * 1.25, H - u * 1.3, u * 0.8, u * 1.1, 0.06));
    for (const y of spread(3, H * 0.6)) for (const x of spread(Math.max(2, Math.round(L / 1.1)), L - 0.6)) K.add(d, K.sphere(0.22, 8, 6), m.toy[Math.floor(K.rnd() * 6)], x, y + H * 0.28, 0.03, 0, 0, 0, [1, 1, 0.45], NO);
  }
}
function crayon(K, g, b) { // giant crayon standing on its tip-less end: wrapper with a torn zigzag top, label and stripes
  const m = M(K), R = b.r ?? b.w / 2, H = b.h, c = Math.floor(K.rnd() * 6), top = H * 0.7;
  K.add(g, K.cyl(R * 0.95, R * 0.95, H, 0.06, 12), m.toy[c], 0, H / 2, 0);
  K.add(g, K.cyl(R, R, H * 0.5, 0.04, 12), m.paper, 0, H * 0.45, 0, 0, 0, 0, 1, NC);
  for (const y of [H * 0.24, H * 0.66]) K.add(g, K.cyl(R * 1.02, R * 1.02, 0.25, 0.02, 12), m.toy[c], 0, y, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; K.add(g, K.cone(R * 0.2, R * 0.5, 3), m.paper, Math.cos(a) * R * 0.97, top + R * 0.05, Math.sin(a) * R * 0.97, 0, -a, 0, 1, NO); } // torn paper
  for (const a of [0, Math.PI]) { const d = K.sub(g, 0, H * 0.45, 0, a); K.add(d, K.sphere(1, 10, 4), m.white, 0, 0, R * 1.0, 0, 0, 0, [R * 0.55, H * 0.1, 0.03], NO); star(K, d, m.flat[c], 0, 0, R * 1.04, R * 0.5); }
}
function tower(K, g, b) { const m = M(K), n = Math.max(2, Math.round(b.h / b.w)), s = b.h / n; for (let i = 0; i < n; i++) block(K, g, m, Math.min(b.w, s) * 0.98, 0, s * (i + 0.5), 0, i * 0.2); }
function slab(K, g, b) { // toy slab: coloured block with a white plate and a big letter on top
  const m = M(K), c = Math.floor(K.rnd() * 6), k = Math.min(b.w, b.d) * 0.34;
  K.add(g, K.box(b.w, b.h, b.d, 0.12), m.toy[c], 0, b.h / 2, 0); K.add(g, K.box(b.w * 0.6, 0.02, b.d * 0.6, 0.01), m.white, 0, b.h + 0.01, 0, 0, 0, 0, 1, NO);
  const d = K.sub(g, 0, b.h + 0.02, 0, 0); d.rotation.order = 'YXZ'; d.rotation.set(-Math.PI / 2, Math.floor(K.rnd() * 4) * Math.PI / 2, 0);
  glyph(K, d, m.flat[(c + 3) % 6], LETTERS[Math.floor(K.rnd() * LETTERS.length)], 0, 0, k, k * 1.25, 0.02);
}
function slide(K, g, b) { // toy slide: blue ramp, pink rails, a white centre stripe
  const m = M(K); K.add(g, K.rampGeo(b.w - 0.3, b.h, b.d, b.ramp), m.toy[2], 0, b.h / 2, 0);
  K.add(g, K.rampGeo(Math.min(0.5, b.w * 0.2), b.h + 0.02, b.d, b.ramp), m.white, 0, b.h / 2 + 0.01, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(0.15, b.h * 1.02, b.d, b.ramp), m.toy[1], s * (b.w / 2 - 0.075), b.h * 0.51, 0);
}

export default {
  bas: [{ make: blocks }, { make: chest }],
  haut: [{ make: cot }, { make: pegboard }],
  pilier: [{ make: crayon }],
  coin: [{ make: tower }],
  plateforme: [{ make: slab }],
  rampe: [{ make: slide }],
  parkour: [parkour(slab)],
  solCount: [5, 3], // floor decals per room: [at least, up to this many more]
  ambient: { n: 60, color: '#FFF3B0', size: 0.16, rise: 0.18, sway: 0.5, glow: true }, // twinkling dust drifting up (Ambient.js)
  mural: [
    { make(K, g) { const m = M(K); ['#FF6B5B', '#FFB84A', '#FFE04A', '#8AE07A', '#6FD0FF'].forEach((c, i) => K.add(g, K.torus(2.2 - i * 0.28, 0.14, 6, 28, Math.PI), K.m(c), 0, 1.4, 0.12, 0, 0, 0, 1, NC)); for (const x of [-2.2, 2.2]) { K.add(g, K.sphere(0.5, 12, 8), m.cloud, x, 1.4, 0.3, 0, 0, 0, [1.4, 0.8, 0.5], NC); K.add(g, K.sphere(0.34, 10, 6), m.cloud, x + Math.sign(x) * 0.5, 1.3, 0.3, 0, 0, 0, [1.3, 0.8, 0.5], NO); } } }, // rainbow
    { make(K, g) { const m = M(K); for (let i = 0; i < 5; i++) star(K, g, m.star, (i - 2) * 0.9, 2.4 + Math.sin(i * 1.7) * 0.6, 0.1, 0.5 + (i % 2) * 0.15, i, NC); } }, // stars
    { make(K, g) { const m = M(K); for (const [x, y, s] of [[-1.0, 3.4, 0.6], [0.2, 3.7, 0.8], [1.3, 3.3, 0.55]]) { K.add(g, K.sphere(s, 12, 8), m.cloud, x, y, 0.3, 0, 0, 0, [1.3, 0.8, 0.5], NC); K.add(g, K.sphere(s * 0.6, 10, 6), m.cloud, x + s * 0.8, y - s * 0.2, 0.3, 0, 0, 0, [1.3, 0.8, 0.5], NO); } } }, // clouds
    { make(K, g) { const m = M(K); [...'ABCDE'].forEach((ch, i) => { const x = (i - 2) * 1.1; K.add(g, K.box(0.9, 0.9, 0.12, P), m.toy[i], x, 2.4 + (i % 2) * 0.12, 0.06, 0, 0, (i - 2) * 0.04, 1, NC); glyph(K, g, m.white, ch, x, 2.4 + (i % 2) * 0.12, 0.4, 0.55, 0.13); }); } }, // ABC frieze
    { make(K, g) { // teddy bear sitting on a little shelf
      const m = M(K); K.add(g, K.box(1.8, 0.16, 0.8, P), m.wood, 0, 2.6, 0.4, 0, 0, 0, 1, NC);
      K.add(g, K.sphere(0.6, 10, 8), m.toy[0], 0, 3.25, 0.4, 0, 0, 0, [1, 1.05, 0.9]); K.add(g, K.sphere(0.38, 8, 6), m.cloud, 0, 3.15, 0.85, 0, 0, 0, [1, 1.1, 0.4], NO);
      K.add(g, K.sphere(0.42, 10, 8), m.toy[0], 0, 4.1, 0.45);
      for (const s of [-1, 1]) {
        K.add(g, K.sphere(0.16, 8, 6), m.toy[0], s * 0.34, 4.45, 0.4, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.08, 6, 5), m.toy[1], s * 0.34, 4.45, 0.52, 0, 0, 0, 1, NO);
        K.add(g, K.sphere(0.06, 6, 5), m.tyre, s * 0.15, 4.18, 0.86, 0, 0, 0, 1, NO);
        K.add(g, K.sphere(0.2, 8, 6), m.toy[0], s * 0.66, 3.35, 0.5, 0, 0, s * 0.5, [1, 1.4, 1], NC); K.add(g, K.sphere(0.22, 8, 6), m.toy[0], s * 0.35, 2.85, 0.7, 0, 0, 0, [1, 0.8, 1.2], NC);
      }
      K.add(g, K.sphere(0.17, 8, 6), m.cloud, 0, 4.0, 0.84, 0, 0, 0, [1, 0.8, 0.7], NC); K.add(g, K.sphere(0.06, 6, 5), m.tyre, 0, 4.06, 1.0, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.12, 6, 5), m.toy[5], -0.12, 3.68, 0.78, 0, 0, 0, [1.2, 0.8, 0.8], NO); K.add(g, K.sphere(0.12, 6, 5), m.toy[5], 0.12, 3.68, 0.78, 0, 0, 0, [1.2, 0.8, 0.8], NO);
    } },
  ],
  sol: [
    { r: 2.1, make(K, g) { const m = M(K); K.add(g, K.cyl(1.9, 1.9, 0.03, 0.015, 32), m.rug, 0, 0.015, 0, 0, 0, 0, 1, NO); K.add(g, K.sphere(1, 24, 4), m.white, 0, 0.034, 0, 0, 0, 0, [1.4, 0.006, 1.4], NO); K.add(g, K.sphere(1, 20, 4), m.toy[1], 0, 0.04, 0, 0, 0, 0, [0.9, 0.006, 0.9], NO); for (let i = 0; i < 5; i++) { const a = i * 1.257; star(K, g, m.star, Math.cos(a) * 1.15, 0.05, Math.sin(a) * 1.15, 0.3, a); } } }, // round rug with rings and stars
    { r: 1.0, make(K, g) { const m = M(K); K.add(g, K.sphere(0.4, 12, 8), m.toy[5], 0, 0.4, 0); K.add(g, K.torus(0.4, 0.05, 4, 16), m.white, 0, 0.4, 0, 0.4, 0, 0, 1, NO); K.add(g, K.sphere(0.25, 10, 8), m.toy[2], 0.8, 0.25, 0.3); K.add(g, K.torus(0.25, 0.04, 4, 14), m.white, 0.8, 0.25, 0.3, 0.9, 0.4, 0, 1, NO); } }, // balls
    { r: 0.9, make(K, g) { const m = M(K); K.add(g, K.box(1.0, 0.3, 0.55, 0.1), m.toy[0], 0, 0.25, 0); K.add(g, K.box(0.5, 0.25, 0.5, 0.08), m.toy[2], -0.05, 0.5, 0); K.add(g, K.box(0.36, 0.14, 0.52, P), m.white, -0.05, 0.52, 0, 0, 0, 0, 1, NO); for (const s of [-1, 1]) { K.add(g, K.sphere(0.07, 6, 5), m.star, 0.5, 0.28, s * 0.16, 0, 0, 0, 1, NO); K.add(g, K.box(0.9, 0.05, 0.02, P), m.white, 0, 0.27, s * 0.28, 0, 0, 0, 1, NO); } for (const x of [-0.32, 0.32]) for (const z of [-0.3, 0.3]) { K.add(g, K.cyl(0.13, 0.13, 0.08, 0.02, 12), m.tyre, x, 0.13, z, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.sphere(0.05, 5, 4), m.star, x, 0.13, z + Math.sign(z) * 0.05, 0, 0, 0, 1, NO); } } }, // toy car
    { r: 1.2, make(K, g) { const m = M(K); for (let i = 0; i < 9; i++) { const x = (i % 3 - 1) * 0.92, z = (Math.floor(i / 3) - 1) * 0.92; K.add(g, K.box(0.9, 0.05, 0.9, P), m.toy[(i * 5) % 6], x, 0.03, z, 0, 0, 0, 1, NO); const d = K.sub(g, x, 0.06, z, 0); d.rotation.set(-Math.PI / 2, 0, 0); glyph(K, d, m.white, LETTERS[(i * 4 + 1) % LETTERS.length], 0, 0, 0.36, 0.5, 0.03); } } }, // foam alphabet mat
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.cyl(0.07, 0.07, 1.2, 0.02, 8), m.wood, 0, 0.6, 0, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.12, 8, 6), m.toy[5], 0, 1.22, 0, 0, 0, 0, 1, NC); for (let i = 0; i < 4; i++) K.add(g, K.torus(0.46 - i * 0.1, 0.11, 6, 14), m.toy[(i * 2) % 6], 0, 0.12 + i * 0.22, 0, Math.PI / 2); } }, // stacking rings
  ],
};
