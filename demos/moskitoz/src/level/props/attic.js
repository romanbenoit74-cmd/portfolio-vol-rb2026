// Grenier: studded travel trunks with stickers and locks, taped cardboard boxes with labels, tied carpet rolls, box stacks and
// timber stud walls with bolted braces, turned wooden posts with iron bands, corner beams with a rope peg, loose floorboards,
// plank ramps, buckled old suitcases as parkour; round attic windows, bare bulbs, a dusty portrait, a hat rack and bunting on the
// walls; dust sheets, a ball and a teddy bear, toy blocks, a hatbox and a worn rug on the floor. Dust motes float in the light.
import { NC, NO, alongX, long, parkour, spread, square } from './common.js';
import { roundedBox } from '../../render/Style.js';

const bx = (w, h, d, r) => roundedBox(w, h, d, r, 1); // light bevelled box (108 triangles instead of 300): trims and secondary parts
const lt = (K, rt, rb, h, seg = 12) => K.lathe([[0, -h / 2], [rb, -h / 2], [rt, h / 2], [0, h / 2]], seg); // cheap straight cylinder / cone frustum
const M = (K) => ({
  trunk: K.m('#5A8FB8', { rim: 0.15 }), leather: K.m('#A8663C', { rim: 0.12 }), brass: K.m('#F2C14E', { rim: 0.4 }), card: K.m('#EFCB8E', { rim: 0.12 }), tape: K.f('#B8783C'),
  wood: K.m('#A86C3C', { pattern: 'planks', scale: 0.3 }), woodL: K.m('#D8A068', { pattern: 'planks', scale: 0.3 }), iron: K.m('#4A3A34'), rug: K.m('#D85A6A', { pattern: 'stripes', color2: '#F08A7A', scale: 0.25 }),
  sheet: K.m('#F4EEE2', { rim: 0.1, ao: 1 }), glass: K.m('#7AC7E8', { rim: 0.5 }), bulb: K.glow('#FFE0A0', 2), frame: K.m('#C49A3A'), face: K.m('#F2C8A0'), bear: K.m('#C88A52'), ball: K.m('#FF5B4A'), sticker: [K.f('#7AC7E8'), K.f('#FFD04A'), K.f('#FF8A7A')],
});

function sticker(K, g, m, i, x, y, z, s) { // travel sticker on a face (s = +-1 side): disc, label or pennant, each with a small mark
  const r = 0.18 + (i % 3) * 0.03, f = m.sticker[i % 3];
  if (i % 3 === 0) { K.add(g, lt(K, r, r, 0.03, 10), f, x, y, z, Math.PI / 2, 0, 0, 1, NO); K.add(g, lt(K, r * 0.4, r * 0.4, 0.04, 6), m.sheet, x, y, z + s * 0.01, Math.PI / 2, 0, 0, 1, NO); }
  else if (i % 3 === 1) { K.add(g, K.box(r * 2.2, r * 1.5, 0.03, 0.01), f, x, y, z, 0, 0, 0.1, 1, NO); K.add(g, K.box(r * 1.4, 0.05, 0.04, 0.01), m.ball, x, y, z + s * 0.01, 0, 0, 0.1, 1, NO); }
  else { K.add(g, K.cone(r, r * 1.6, 3), f, x, y, z, Math.PI / 2, 0, 0, [1, 0.12, 1], NO); K.add(g, K.sphere(0.04, 6, 4), m.sheet, x - r * 0.3, y, z + s * 0.01, 0, 0, 0, 1, NO); }
}
function trunk(K, g, b) { // travel trunk: domed lid, leather straps, brass corners and lock, side handles, stickers
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H * 0.78, T, 0.1), m.trunk, 0, H * 0.39, 0);
  K.add(g, K.cyl(T / 2, T / 2, L, 0.08, 16), m.trunk, 0, H * 0.78, 0, 0, 0, Math.PI / 2, [(H * 0.22) / (T / 2), 1, 1]); // half-sunk: a low dome
  K.add(g, K.box(L + 0.06, 0.16, T + 0.06, 0.01), m.iron, 0, 0.1, 0, 0, 0, 0, 1, NC); // bottom rim
  K.add(g, K.box(L + 0.04, 0.12, T + 0.04, 0.01), m.iron, 0, H * 0.74, 0, 0, 0, 0, 1, NC); // lid edge
  for (const x of [-L * 0.3, L * 0.3]) K.add(g, bx(0.2, H * 0.8, T + 0.04, 0.04), m.leather, x, H * 0.4, 0, 0, 0, 0, 1, NC);
  for (const x of [-1, 1]) for (const z of [-1, 1]) K.add(g, bx(0.24, 0.24, 0.24, 0.06), m.brass, x * (L / 2 - 0.1), 0.12, z * (T / 2 - 0.1), 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) {
    K.add(g, K.box(0.32, 0.3, 0.06, 0.01), m.brass, 0, H * 0.7, s * (T / 2 + 0.02), 0, 0, 0, 1, NO); K.add(g, lt(K, 0.03, 0.03, 0.08, 6), m.iron, 0, H * 0.68, s * (T / 2 + 0.06), Math.PI / 2, 0, 0, 1, NO); // lock plate + keyhole
    for (let i = 0; i < 2; i++) sticker(K, g, m, i + (s > 0 ? 0 : 1), (i ? 1 : -1) * L * 0.16, H * 0.3, s * (T / 2 + 0.02), s);
  }
  for (const x of [-1, 1]) K.add(g, K.torus(0.12, 0.035, 4, 10, Math.PI), m.iron, x * (L / 2 + 0.01), H * 0.5, 0, 0, Math.PI / 2, 0, 1, NO); // end handles
}
function label(K, g, m, x, y, z, w, ry = 0) { // shipping label on a box: paper, two text bars
  K.add(g, K.box(w, w * 0.65, 0.03, 0.01), m.sheet, x, y, z, 0, ry, 0, 1, NO); K.add(g, K.box(w * 0.6, 0.035, 0.04, 0.01), m.iron, x - w * 0.1, y + w * 0.12, z, 0, ry, 0, 1, NO); K.add(g, K.box(w * 0.35, 0.035, 0.04, 0.01), m.ball, x - w * 0.2, y - w * 0.13, z, 0, ry, 0, 1, NO);
}
function boxes(K, g, b) { // taped cardboard boxes stacked to the box height, flaps seam, labels
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(1, Math.round(H / 0.9)), cols = Math.max(1, Math.round(L / 1.4));
  for (let j = 0; j < n; j++) for (const x of spread(cols, L)) {
    const w = L / cols - 0.06, h = H / n - 0.03, y = (j * H) / n + h / 2, r = (K.rnd() - 0.5) * 0.08;
    K.add(g, K.box(w, h, T - 0.05, 0.04), m.card, x, y, 0, 0, r, 0);
    K.add(g, K.box(w * 0.18, h + 0.01, T - 0.03, 0.01), m.tape, x, y, 0, 0, r, 0, 1, NO);
    K.add(g, K.box(w - 0.02, 0.03, 0.03, 0.01), m.iron, x, y + h / 2 - 0.1, (T - 0.05) / 2 + 0.005, 0, r, 0, 1, NO); // flap seam
    if (K.rnd() < 0.7) for (const s of [-1, 1]) if (s > 0 || K.rnd() < 0.5) label(K, g, m, x - w * 0.22, y - h * 0.08, s * ((T - 0.05) / 2 + 0.02), Math.min(0.42, w * 0.4), r);
  }
}
function carpetRoll(K, g, b) { // rolled carpets lying along the box, tied with rope, spiral ends
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(1, Math.floor(H / T));
  K.add(g, K.box(L * 0.95, H * 0.98, T * 0.6, 0.1), m.card, 0, H * 0.49, 0, 0, 0, 0, 1, { ink: false });
  for (let i = 0; i < n; i++) {
    const R = Math.min(T, H / n) / 2, y = ((i + 0.5) * H) / n, c = [m.rug, m.woodL, m.trunk][i % 3];
    K.add(g, K.cyl(R, R, L, 0.06, 18), c, 0, y, 0, 0, 0, Math.PI / 2);
    for (const x of [-L * 0.3, L * 0.3]) K.add(g, K.torus(R, 0.04, 4, 16), m.card, x, y, 0, 0, Math.PI / 2, 0, 1, NO); // rope ties
    for (const s of [-1, 1]) K.add(g, K.torus(R * 0.55, 0.035, 4, 14), m.iron, s * (L / 2 + 0.005), y, 0, 0, Math.PI / 2, 0, 1, NO); // rolled-up end
  }
}
function studs(K, g, b) { // timber stud wall: lath backing, studs, plates, bolted diagonal brace, iron angle brackets
  const m = M(K), { L, T } = alongX(g, b), H = b.h, xs = spread(Math.max(2, Math.round(L / 1.2)) + 1, L);
  K.add(g, K.box(L, H, T * 0.3, 0.03), m.card, 0, H / 2, 0, 0, 0, 0, 1, { ink: false });
  for (const x of xs) K.add(g, K.box(0.2, H, T, 0.04), m.wood, x, H / 2, 0);
  for (const y of [0.1, H - 0.1]) K.add(g, K.box(L, 0.2, T, 0.04), m.wood, 0, y, 0, 0, 0, 0, 1, NC);
  K.add(g, K.box(Math.hypot(L, H) * 0.9, 0.18, T * 0.9, 0.04), m.wood, 0, H / 2, 0, 0, 0, Math.atan2(H, L), 1, NC);
  for (const x of xs) for (const y of [0.1, H - 0.1]) for (const s of [-1, 1]) K.add(g, K.sphere(0.05, 6, 4), m.brass, x, y, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); // nail heads
  for (const s of [-1, 1]) for (const e of [-1, 1]) K.add(g, K.box(0.28, 0.28, 0.05, 0.01), m.iron, e * (L / 2 - 0.2), 0.3, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); // brackets
}
function post(K, g, b) { // turned wooden post: plinth, bulge, iron bands with bolts, capital
  const m = M(K), R = (b.r ?? b.w / 2) * 0.82, H = b.h;
  K.add(g, K.cyl(R, R, H, 0.06, 14), m.wood, 0, H / 2, 0);
  K.add(g, bx(R * 2.4, 0.4, R * 2.4, 0.08), m.woodL, 0, 0.2, 0, 0, 0, 0, 1, NC); K.add(g, bx(R * 2.3, 0.3, R * 2.3, 0.07), m.woodL, 0, H - 0.15, 0, 0, 0, 0, 1, NC);
  K.add(g, K.sphere(R * 1.08, 12, 8), m.wood, 0, H * 0.55, 0, 0, 0, 0, [1, 0.7, 1], NC);
  for (const y of [0.8, H - 0.55]) { K.add(g, lt(K, R * 1.04, R * 1.04, 0.16, 14), m.iron, 0, y, 0, 0, 0, 0, 1, NC); for (let i = 0; i < 3; i++) K.add(g, K.sphere(0.05, 6, 4), m.brass, Math.cos(i * 2.1 + 0.4) * R * 1.05, y, Math.sin(i * 2.1 + 0.4) * R * 1.05, 0, 0, 0, 1, NO); }
}
function beam(K, g, b) { // corner beam: iron-banded timber with a base plate and a rope coil on a peg
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H, b.d, 0.08), m.wood, 0, H / 2, 0);
  for (const y of [1.4, H - 1.1]) { K.add(g, K.box(b.w + 0.04, 0.3, b.d + 0.04, 0.01), m.iron, 0, y, 0, 0, 0, 0, 1, NC); for (const s of [-1, 1]) K.add(g, K.sphere(0.06, 6, 4), m.brass, s * b.w * 0.25, y, b.d / 2 + 0.03, 0, 0, 0, 1, NO); }
  K.add(g, bx(b.w + 0.1, 0.16, b.d + 0.1, 0.05), m.iron, 0, 0.08, 0, 0, 0, 0, 1, NC);
  K.add(g, lt(K, 0.05, 0.05, 0.3, 6), m.iron, 0, 2.3, b.d / 2 + 0.12, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.torus(0.22, 0.06, 4, 12), m.card, 0, 2.2, b.d / 2 + 0.2, 0, 0, 0, 1, NO); K.add(g, K.torus(0.15, 0.05, 4, 10), m.card, 0, 2.2, b.d / 2 + 0.26, 0, 0, 0, 1, NO); // rope coil
}
function boards(K, g, b, pk = false) { // loose floorboards over a dark gap, nail heads and knots (parkour: single material)
  const m = M(K); if (!pk) K.add(g, K.box(b.w - 0.1, b.h * 0.7, b.d - 0.1, 0.01), m.iron, 0, b.h * 0.35, 0, 0, 0, 0, 1, { ink: false });
  for (const z of spread(4, b.d)) {
    const ox = (K.rnd() - 0.5) * 0.15, w = b.w + (K.rnd() - 0.5) * 0.3; K.add(g, K.box(w, b.h, b.d / 4 - 0.05, 0.04), m.woodL, ox, b.h / 2, z);
    if (pk) continue;
    for (const s of [-1, 1]) K.add(g, K.sphere(0.045, 6, 4), m.iron, ox + s * (w / 2 - 0.2), b.h + 0.005, z, 0, 0, 0, [1, 0.3, 1], NO);
    K.add(g, K.sphere(0.07, 6, 4), m.iron, ox + (K.rnd() - 0.5) * w * 0.5, b.h + 0.005, z, 0, 0, 0, [1.4, 0.2, 0.8], NO);
  }
}
function suitcase(K, g, b) { // leather suitcase: trim, buckled strap, brass latches and corners, handle, travel stickers
  const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.1), m.leather, 0, b.h / 2, 0);
  K.add(g, K.box(b.w + 0.04, 0.1, b.d + 0.04, 0.01), m.iron, 0, b.h * 0.52, 0, 0, 0, 0, 1, NC); // seam trim
  K.add(g, K.box(0.2, b.h + 0.04, b.d + 0.04, 0.01), m.sticker[0], b.w * 0.25, b.h / 2, 0, 0, 0, 0, 1, NC); // strap
  for (const s of [-1, 1]) { K.add(g, K.box(0.18, 0.16, 0.06, 0.01), m.iron, -b.w * 0.2, b.h * 0.5, s * (b.d / 2 + 0.02), 0, 0, 0, 1, NO); for (const x of [-1, 1]) K.add(g, K.sphere(0.1, 6, 4), m.iron, x * (b.w / 2 - 0.05), 0.1, s * (b.d / 2 - 0.05), 0, 0, 0, 1, NO); }
  K.add(g, K.torus(0.25, 0.05, 4, 12, Math.PI), m.iron, 0, b.h, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < 3; i++) K.add(g, lt(K, 0.3, 0.3, 0.02, 12), m.sticker[i], (i - 1) * 0.9, b.h + 0.01, (K.rnd() - 0.5) * 1.5, 0, 0, 0, 1, NO);
}
function ramp(K, g, b) { // plank ramp with side stringers
  const m = M(K); K.add(g, K.rampGeo(b.w - 0.3, b.h, b.d, b.ramp), m.woodL, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(0.15, b.h, b.d, b.ramp), m.wood, s * (b.w / 2 - 0.075), b.h / 2 + 0.001, 0, 0, 0, 0, [1, 1.001, 1]);
}

export default {
  bas: [{ make: trunk }, { make: boxes }, long(carpetRoll, 1.3)],
  haut: [{ make: boxes }, { make: studs }],
  pilier: [{ make: post }],
  coin: [{ make: beam }],
  plateforme: [{ make: boards }],
  rampe: [{ make: ramp }],
  parkour: [parkour(suitcase), parkour((K, g, b) => boards(K, g, b, true))],
  solCount: [6, 3], // floor decals per room: dust sheets, toys, hatboxes, rugs
  ambient: { n: 110, color: '#FFF1CC', size: 0.07, rise: 0.04, sway: 0.5, glow: true }, // dust motes in the light (Ambient.js)
  mural: [
    { make(K, g, o) { // round window: thick frame, cross bars, sill, a pot and a candle
      const m = M(K), y = Math.min(o.h - 1.6, 4); K.add(g, K.torus(0.95, 0.16, 8, 24), m.wood, 0, y, 0.1, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.95, 0.95, 0.04, 24), m.glass, 0, y, 0.06, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, K.box(1.9, 0.1, 0.05, 0.01), m.wood, 0, y, 0.12, 0, 0, 0, 1, NO); K.add(g, K.box(0.1, 1.9, 0.05, 0.01), m.wood, 0, y, 0.12, 0, 0, 0, 1, NO);
      K.add(g, bx(2.5, 0.14, 0.4, 0.05), m.woodL, 0, y - 1.12, 0.25, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.12, 6, 4), m.ball, 0.7, y - 0.98, 0.3, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.1, 0.07, 0.14, 8), m.iron, -0.7, y - 1.02, 0.3, 0, 0, 0, 1, NO); // sill + pot
    } },
    { make(K, g, o) { const m = M(K), top = o.h - 0.1; K.add(g, lt(K, 0.02, 0.02, 2, 4), m.iron, 0, top - 1, 1.2, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.1, 0.07, 0.16, 8), m.iron, 0, top - 2.05, 1.2, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.2, 12, 8), m.bulb, 0, top - 2.2, 1.2, 0, 0, 0, [1, 1.25, 1], NO); } }, // bare bulb on a cord
    { make(K, g) { // dusty portrait: double frame, sitter with a moustache and shoulders
      const m = M(K); K.add(g, bx(1.4, 1.8, 0.1, 0.05), m.frame, 0, 2.4, 0.06, 0, 0, 0.06, 1, NC); K.add(g, K.box(1.2, 1.6, 0.04, 0.01), m.iron, 0, 2.4, 0.11, 0, 0, 0.06, 1, NO); K.add(g, K.box(1.1, 1.5, 0.02, 0.01), m.glass, 0, 2.4, 0.14, 0, 0, 0.06, 1, NO);
      K.add(g, K.sphere(0.5, 8, 6), m.iron, 0, 2.0, 0.16, 0, 0, 0.06, [1.2, 0.8, 0.2], NO); K.add(g, K.sphere(0.32, 10, 8), m.face, 0, 2.55, 0.18, 0, 0, 0.06, [1, 1.15, 0.2], NO);
      K.add(g, K.box(0.3, 0.05, 0.03, 0.01), m.iron, 0, 2.45, 0.22, 0, 0, 0.06, 1, NO); for (const s of [-1, 1]) K.add(g, K.sphere(0.035, 6, 4), m.iron, s * 0.1, 2.62, 0.22, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // hat rack: board with pegs, a top hat and a scarf
      const m = M(K); K.add(g, bx(1.8, 0.3, 0.1, 0.04), m.wood, 0, 3.0, 0.05, 0, 0, 0, 1, NC);
      for (const x of [-0.6, 0, 0.6]) K.add(g, lt(K, 0.04, 0.04, 0.3, 6), m.iron, x, 3.0, 0.22, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, lt(K, 0.26, 0.26, 0.05, 12), m.iron, -0.6, 2.82, 0.4, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.18, 0.2, 0.34, 12), m.iron, -0.6, 3.0, 0.4, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.19, 0.19, 0.05, 12), m.trunk, -0.6, 2.92, 0.4, 0, 0, 0, 1, NO);
      K.add(g, bx(0.18, 0.9, 0.06, 0.03), m.trunk, 0.6, 2.5, 0.28, 0, 0, 0.05, 1, NC); K.add(g, K.box(0.18, 0.2, 0.07, 0.01), m.sheet, 0.6, 2.25, 0.29, 0, 0, 0.05, 1, NO);
    } },
    { make(K, g, o) { // bunting: sagging string of triangular flags
      const m = M(K), y = Math.min(o.h - 1.2, 4.6);
      for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.55, dy = -Math.sin(((i + 0.5) / 7) * Math.PI) * 0.35; K.add(g, K.cone(0.22, 0.45, 3), [m.trunk, m.ball, m.brass][i % 3], x, y + dy - 0.2, 0.15, 0, 0, Math.PI, [1, 1, 0.15], NO); K.add(g, K.box(0.62, 0.025, 0.025, 0.01), m.card, x, y + dy + 0.02, 0.14, 0, 0, 0, 1, NO); }
    } },
  ],
  sol: [
    { r: 1.4, make(K, g) { const m = M(K); K.add(g, K.sphere(1, 16, 10), m.sheet, 0, 0, 0, 0, 0, 0, [1.2, 0.9, 1]); K.add(g, K.sphere(0.5, 12, 8), m.sheet, 0.5, 0.75, 0.2, 0, 0, 0, [1, 0.8, 1], NC); K.add(g, K.sphere(0.4, 8, 6), m.sheet, -0.7, 0.2, 0.5, 0, 0, 0, [1.2, 0.5, 1], NO); K.add(g, K.sphere(0.3, 8, 6), m.sheet, 0.9, 0.1, -0.7, 0, 0, 0, [1.4, 0.4, 1], NO); } }, // dust sheet over a lump, folds
    { r: 1.2, make(K, g) { // ball, teddy bear with ears, snout, eyes and arms
      const m = M(K); K.add(g, K.sphere(0.35, 16, 10), m.ball, 0, 0.35, 0); K.add(g, K.torus(0.352, 0.03, 4, 14), m.sheet, 0, 0.35, 0, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, K.sphere(0.3, 12, 8), m.bear, 0.9, 0.3, 0.2); K.add(g, K.sphere(0.22, 10, 8), m.bear, 0.9, 0.72, 0.2, 0, 0, 0, 1, NC);
      for (const s of [-1, 1]) { K.add(g, K.sphere(0.08, 6, 4), m.bear, 0.9 + s * 0.16, 0.9, 0.2, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.03, 6, 4), m.iron, 0.9 + s * 0.08, 0.76, 0.4, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.09, 6, 4), m.bear, 0.9 + s * 0.32, 0.38, 0.28, 0, 0, 0, [1, 1.4, 1], NO); K.add(g, K.sphere(0.1, 6, 4), m.bear, 0.9 + s * 0.15, 0.08, 0.4, 0, 0, 0, [1, 0.8, 1.3], NO); }
      K.add(g, K.sphere(0.09, 6, 4), m.face, 0.9, 0.68, 0.4, 0, 0, 0, [1, 0.8, 0.8], NO); K.add(g, K.sphere(0.03, 6, 4), m.iron, 0.9, 0.7, 0.47, 0, 0, 0, 1, NO); K.add(g, K.box(0.34, 0.07, 0.03, 0.01), m.trunk, 0.9, 0.5, 0.3, 0, 0, 0, 1, NO); // bow tie
    } },
    { r: 2.0, make(K, g) { const m = M(K); K.add(g, K.box(3.4, 0.03, 2.2, 0.01), m.rug, 0, 0.015, 0, 0, 0, 0, 1, NO); K.add(g, K.box(3.0, 0.04, 1.8, 0.01), m.sheet, 0, 0.018, 0, 0, 0, 0, 1, NO); K.add(g, K.box(2.8, 0.045, 1.6, 0.01), m.rug, 0, 0.02, 0, 0, 0, 0, 1, NO); for (const s of [-1, 1]) for (const z of spread(14, 2)) K.add(g, K.box(0.18, 0.02, 0.04, 0.01), m.sheet, s * 1.78, 0.012, z, 0, 0, 0, 1, NO); } }, // worn rug with a border and fringe
    { r: 1.0, make(K, g) { const m = M(K); for (const [x, y, z, ry, c] of [[0, 0.17, 0, 0.2, m.trunk], [0.42, 0.17, 0.1, -0.3, m.ball], [0.2, 0.5, 0.05, 0.5, m.brass]]) { K.add(g, bx(0.34, 0.34, 0.34, 0.05), c, x, y, z, 0, ry, 0, 1, NC); K.add(g, K.box(0.14, 0.14, 0.02, 0.01), m.sheet, x + Math.sin(ry) * 0.17, y, z + Math.cos(ry) * 0.17, 0, ry, 0, 1, NO); } } }, // toy blocks
    { r: 0.9, make(K, g) { const m = M(K); K.add(g, lt(K, 0.4, 0.4, 0.4, 16), m.card, 0, 0.2, 0, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.44, 0.44, 0.14, 16), m.ball, 0, 0.45, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(0.4, 0.035, 4, 16), m.trunk, 0, 0.3, 0, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.sphere(0.07, 6, 4), m.trunk, 0, 0.55, 0, 0, 0, 0, 1, NO); } }, // hatbox
  ],
};
