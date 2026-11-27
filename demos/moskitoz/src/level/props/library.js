// Bibliothèque: stacks of giant gilded books, graticule globes on a brass-armed stand, bookcases with plinth, crown and gilded
// spines, fluted wooden columns with volute capitals, tall corner bookcases, floating open books with text lines and a ribbon, a
// leaning book as ramp, thick books as parkour; bookshelves, a scholar's portrait, an arched window, a rolling ladder, a clock and
// a sconce on the walls; round rugs with borders, book piles, a footstool, an ink pot and a floor lamp. Golden dust floats around.
import { NC, NO, alongX, parkour, spread, square } from './common.js';
import { roundedBox } from '../../render/Style.js';

const bx = (w, h, d, r) => roundedBox(w, h, d, r, 1); // light bevelled box (108 triangles instead of 300): trims and secondary parts
const lt = (K, rt, rb, h, seg = 12) => K.lathe([[0, -h / 2], [rb, -h / 2], [rt, h / 2], [0, h / 2]], seg); // cheap straight cylinder / cone frustum
const COVERS = ['#C44A6A', '#3A7AC8', '#48A870', '#F7D774', '#8A5AC8', '#E8783A'];
const M = (K) => ({
  wood: K.m('#9A5A30', { pattern: 'planks', scale: 0.3 }), woodD: K.m('#7A4424'), woodL: K.m('#C4804F'), gold: K.m('#F7D774', { rim: 0.4 }), page: K.m('#FFF6E0', { pattern: 'stripes', color2: '#EADBB8', scale: 0.05 }),
  cover: COVERS.map((c) => K.m(c, { rim: 0.12 })), spine: COVERS.map((c) => K.f(c)), sea: K.m('#5AB8E8', { rim: 0.3, pattern: 'grid', color2: '#6EC6F0', scale: 0.35 }), land: K.m('#7AD070'), rug: K.m('#E0607A', { pattern: 'dots', color2: '#F7D774', scale: 0.3 }), rugD: K.m('#B43F5E'),
  glass: K.m('#B8E0F8', { rim: 0.5 }), face: K.m('#F2C8A0'), shade: K.m('#F7D774', { rim: 0.3 }), glow: K.glow('#FFE6A0', 1.6), ink: K.f('#4A2A1A'), red: K.m('#E0607A'), hair: K.m('#E8E0D4'),
});

function book(K, g, m, w, h, d, x, y, z, ry = 0, c = Math.floor(K.rnd() * 6)) { // cover + page block, gilded spine bands and a cover plate
  K.add(g, K.box(w, h, d, Math.min(0.08, h * 0.3)), m.cover[c], x, y, z, 0, ry, 0);
  K.add(g, K.box(w * 0.94, h * 0.8, d + 0.02, 0.01), m.page, x + w * 0.03, y, z, 0, ry, 0, 1, NO);
  const cs = Math.cos(ry), sn = Math.sin(ry), at = (ox, oz) => [x + ox * cs + oz * sn, z - ox * sn + oz * cs]; // local offset -> world
  for (const t of [-0.28, 0.28]) { const [px, pz] = at(-w / 2 - 0.005, t * d); K.add(g, K.box(0.03, h * 0.86, d * 0.12, 0.01), m.gold, px, y, pz, 0, ry, 0, 1, NO); } // spine bands
  const [cx, cz] = at(-w * 0.02, 0), ty = y + h / 2; // cover emblem: gilded frame, inset panel, diamond
  K.add(g, K.box(w * 0.5, 0.012, d * 0.45, 0.005), m.gold, cx, ty + 0.004, cz, 0, ry, 0, 1, NO); K.add(g, K.box(w * 0.5 - 0.1, 0.012, d * 0.45 - 0.1, 0.005), m.cover[c], cx, ty + 0.007, cz, 0, ry, 0, 1, NO); K.add(g, K.box(0.1, 0.012, 0.1, 0.005), m.gold, cx, ty + 0.011, cz, 0, ry + Math.PI / 4, 0, 1, NO);
}
function stack(K, g, b) { // giant books stacked to the box height, slightly twisted
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(2, Math.round(H / 0.45));
  for (let i = 0; i < n; i++) book(K, g, m, L * (0.9 + K.rnd() * 0.08), H / n - 0.01, T * (0.9 + K.rnd() * 0.08), 0, ((i + 0.5) * H) / n, 0, (K.rnd() - 0.5) * 0.12);
}
function globe(K, g, b) { // globe with graticule on a wooden stand: three feet, column, brass meridian arm, equator ring
  const m = M(K), S = Math.min(b.w, b.d), H = b.h, R = Math.min(S / 2 - 0.05, H * 0.4);
  K.add(g, K.cyl(S * 0.35, S * 0.4, 0.2, 0.06, 18), m.wood, 0, 0.1, 0); K.add(g, lt(K, 0.08, 0.1, H - 2 * R, 10), m.wood, 0, (H - 2 * R) / 2, 0, 0, 0, 0, 1, NC);
  K.add(g, K.torus(S * 0.3, 0.05, 4, 20), m.gold, 0, 0.22, 0, Math.PI / 2, 0, 0, 1, NO); K.add(g, lt(K, 0.14, 0.12, 0.12, 10), m.gold, 0, (H - 2 * R) * 0.6, 0, 0, 0, 0, 1, NO); // gilded base ring + collar
  K.add(g, K.sphere(R, 24, 16), m.sea, 0, H - R, 0);
  for (let i = 0; i < 4; i++) K.add(g, K.sphere(R * 0.45, 12, 8), m.land, Math.cos(i * 1.7) * R * 0.62, H - R + Math.sin(i * 2.3) * R * 0.45, Math.sin(i * 1.7) * R * 0.62, 0, 0, 0, [1, 0.8, 0.5], { ink: false, cast: false });
  K.add(g, K.torus(R * 1.08, 0.04, 5, 32), m.gold, 0, H - R, 0, 0, 0.4, 0, 1, NO); K.add(g, K.torus(R * 1.02, 0.025, 3, 28), m.gold, 0, H - R, 0, Math.PI / 2, 0, 0, 1, NO); // meridian + equator
  K.add(g, K.sphere(0.08, 8, 6), m.gold, 0, H - R + R * 1.06, 0, 0, 0, 0, 1, NO); // pin
}
function shelves(K, g, b) { // bookcase: plinth, crown, carcass, shelves, rows of gilded spines on both faces, a leaning book
  const m = M(K), { L, T } = alongX(g, b), H = b.h, lv = Math.max(2, Math.floor(H / 0.95));
  K.add(g, K.box(L, H, T, 0.05), m.wood, 0, H / 2, 0);
  K.add(g, bx(L + 0.1, 0.14, T + 0.1, 0.05), m.woodD, 0, 0.07, 0, 0, 0, 0, 1, NC); K.add(g, bx(L + 0.14, 0.18, T + 0.14, 0.06), m.woodL, 0, H - 0.09, 0, 0, 0, 0, 1, NC); // plinth + crown
  for (let i = 0; i < lv; i++) {
    const y0 = 0.12 + (i * H) / lv, bh = H / lv - 0.22;
    for (const s of [-1, 1]) { let x = -L / 2 + 0.1; while (x < L / 2 - 0.25) { const w = 0.14 + K.rnd() * 0.12, h = bh * (0.72 + K.rnd() * 0.26); K.add(g, K.box(w - 0.02, h, 0.06, 0.02), m.spine[Math.floor(K.rnd() * 6)], x + w / 2, y0 + h / 2, s * (T / 2 - 0.02), 0, 0, 0, 1, NO); if (K.rnd() < 0.25) K.add(g, K.box(w - 0.04, 0.03, 0.07, 0.01), m.gold, x + w / 2, y0 + h * 0.65, s * (T / 2 - 0.02), 0, 0, 0, 1, NO); x += w; } }
    K.add(g, K.box(L + 0.02, 0.06, T + 0.02, 0.02), m.woodL, 0, y0 - 0.04, 0, 0, 0, 0, 1, NO);
  }
}
function fluted(K, g, b) { // fluted wooden column with a gilded volute capital and a moulded base
  const m = M(K), R = (b.r ?? b.w / 2) * 0.85, H = b.h;
  K.add(g, K.cyl(R, R, H, 0.04, 12), m.woodL, 0, H / 2, 0);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; K.add(g, K.box(0.05, H - 1.2, 0.05, 0.02), m.wood, Math.cos(a) * R, H / 2, Math.sin(a) * R, 0, -a, 0, 1, NO); }
  K.add(g, K.box(R * 2.3, 0.4, R * 2.3, 0.08), m.gold, 0, H - 0.2, 0, 0, 0, 0, 1, NC); K.add(g, K.box(R * 2.3, 0.4, R * 2.3, 0.08), m.wood, 0, 0.2, 0, 0, 0, 0, 1, NC);
  for (const y of [0.5, H - 0.6]) K.add(g, lt(K, R * 1.05, R * 1.05, 0.14, 12), y < 1 ? m.wood : m.gold, 0, y, 0, 0, 0, 0, 1, NC); // mouldings
  for (const s of [-1, 1]) K.add(g, K.torus(R * 0.45, 0.07, 4, 12), m.gold, s * R * 1.0, H - 0.6, R * 1.0, 0, 0, 0, 1, NO); // volutes
}
function openBook(K, g, b) { // floating open book: two covers, curved page blocks, text lines, ribbon marker
  const m = M(K), c = m.cover[Math.floor(K.rnd() * 6)], H = b.h;
  for (const s of [-1, 1]) {
    K.add(g, K.box(b.w / 2, 0.08, b.d, 0.03), c, s * b.w / 4, 0.04, 0, 0, 0, s * -0.06);
    K.add(g, K.box(b.w / 2 - 0.12, H - 0.1, b.d - 0.15, 0.04), m.page, s * (b.w / 4 - 0.02), 0.08 + (H - 0.1) / 2, 0, 0, 0, s * -0.06, 1, NC);
    for (let i = 0; i < 4; i++) K.add(g, K.box(b.w / 2 - 0.5, 0.012, 0.05, 0.005), m.ink, s * (b.w / 4 - 0.02), H - 0.02 - (i % 2) * 0.012 + 0.012, (i - 1.5) * (b.d - 0.5) / 4, 0, 0, s * -0.06, 1, NO); // text lines
  }
  K.add(g, lt(K, 0.07, 0.07, b.d, 8), c, 0, 0.1, 0, Math.PI / 2, 0, 0, 1, NC); K.add(g, K.box(0.05, 0.02, b.d * 0.3, 0.01), m.gold, 0.12, H + 0.01, b.d / 2 - 0.1, 0, 0, 0, 1, NO); // spine + ribbon
}
function leaningBook(K, g, b) { // a closed book lying as a slope, gilded edges
  const m = M(K); K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.cover[Math.floor(K.rnd() * 6)], 0, b.h / 2, 0);
  K.add(g, K.rampGeo(b.w + 0.04, b.h * 0.7, b.d * 0.96, b.ramp), m.page, 0, b.h * 0.35, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(0.1, b.h, b.d, b.ramp), m.gold, s * (b.w / 2 - 0.05), b.h / 2 + 0.001, 0, 0, 0, 0, [1, 1.001, 1], NO);
}

export default {
  bas: [{ make: stack }, square(globe)],
  haut: [{ make: shelves }],
  pilier: [{ make: fluted }],
  coin: [{ make: (K, g, b) => shelves(K, g, b) }],
  plateforme: [{ make: openBook }],
  rampe: [{ make: leaningBook }],
  parkour: [parkour((K, g, b) => book(K, g, M(K), b.w, b.h, b.d, 0, b.h / 2, 0)), parkour(openBook)],
  solCount: [5, 3], // floor decals per room: rugs, book piles, stools, lamps, inkwells
  ambient: { n: 100, color: '#FFE6A8', size: 0.07, rise: 0.04, sway: 0.5, glow: true }, // golden dust motes (Ambient.js)
  mural: [
    { make(K, g) { shelves(K, g, { w: 3.6, d: 0.7, h: 3.4 }); g.children.forEach((c) => (c.position.z += 0.4)); } },
    { make(K, g) { // scholar's portrait: gilded double frame, white hair, spectacles, an open book
      const m = M(K); K.add(g, K.box(1.6, 2.1, 0.12, 0.06), m.gold, 0, 2.8, 0.06, 0, 0, 0, 1, NC); K.add(g, K.box(1.4, 1.9, 0.04, 0.02), m.woodD, 0, 2.8, 0.13, 0, 0, 0, 1, NO); K.add(g, K.box(1.3, 1.8, 0.02, 0.01), m.cover[1], 0, 2.8, 0.15, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.5, 8, 6), m.cover[0], 0, 2.25, 0.17, 0, 0, 0, [1.2, 0.8, 0.2], NO); K.add(g, K.sphere(0.4, 8, 6), m.hair, 0, 3.05, 0.17, 0, 0, 0, [1, 1, 0.2], NO); K.add(g, K.sphere(0.34, 10, 8), m.face, 0, 2.98, 0.19, 0, 0, 0, [1, 1.15, 0.2], NO);
      for (const s of [-1, 1]) K.add(g, K.torus(0.1, 0.015, 4, 12), m.gold, s * 0.14, 3.02, 0.23, 0, 0, 0, 1, NO); K.add(g, K.box(0.2, 0.03, 0.02, 0.01), m.hair, 0, 2.86, 0.23, 0, 0, 0, 1, NO); K.add(g, K.box(0.6, 0.12, 0.04, 0.02), m.page, 0, 2.3, 0.22, 0, 0, 0, 1, NO);
    } },
    { make(K, g, o) { const m = M(K), y = Math.min(o.h - 2.6, 3.4); K.add(g, bx(2.2, 2.4, 0.12, 0.05), m.wood, 0, y, 0.06, 0, 0, 0, 1, NC); K.add(g, lt(K, 1.1, 1.1, 0.12, 24), m.wood, 0, y + 1.2, 0.06, Math.PI / 2, 0, 0, 1, NC); K.add(g, K.box(1.9, 2.3, 0.02, 0.01), m.glass, 0, y + 0.1, 0.14, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.95, 0.95, 0.02, 24), m.glass, 0, y + 1.2, 0.14, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, K.box(0.1, 3.5, 0.04, 0.015), m.woodL, 0, y + 0.7, 0.17, 0, 0, 0, 1, NO); K.add(g, K.box(1.9, 0.08, 0.04, 0.015), m.woodL, 0, y + 0.1, 0.17, 0, 0, 0, 1, NO); K.add(g, bx(2.6, 0.14, 0.4, 0.05), m.woodL, 0, y - 1.25, 0.2, 0, 0, 0, 1, NC); } }, // arched window with mullions and a sill
    { make(K, g, o) { // rolling ladder against the shelves: two rails, rungs, wheel feet
      const m = M(K), H = Math.min(o.h - 0.8, 4.2); for (const x of [-0.45, 0.45]) { K.add(g, K.box(0.1, H, 0.1, 0.01), m.woodL, x, H / 2, 0.35, 0, 0, x * 0.1, 1, NC); K.add(g, K.sphere(0.1, 6, 4), m.gold, x * 1.05, 0.1, 0.42, 0, 0, 0, 1, NO); }
      for (let i = 0; i < Math.floor(H / 0.45); i++) K.add(g, lt(K, 0.04, 0.04, 0.9, 5), m.wood, 0, 0.5 + i * 0.45, 0.35, 0, 0, Math.PI / 2, 1, NO); K.add(g, K.box(1.2, 0.08, 0.08, 0.03), m.gold, 0, H + 0.05, 0.3, 0, 0, 0, 1, NO);
    } },
    { make(K, g, o) { // wall clock: gilded ring, white face, hands, tick marks and a pendulum
      const m = M(K), y = Math.min(o.h - 1.4, 3.6); K.add(g, lt(K, 0.65, 0.65, 0.16, 24), m.gold, 0, y, 0.1, Math.PI / 2, 0, 0, 1, NC); K.add(g, lt(K, 0.52, 0.52, 0.04, 24), m.page, 0, y, 0.2, Math.PI / 2, 0, 0, 1, NO);
      for (let i = 0; i < 12; i++) K.add(g, K.box(0.04, i % 3 ? 0.06 : 0.11, 0.02, 0.01), m.ink, Math.sin(i * 0.5236) * 0.42, y + Math.cos(i * 0.5236) * 0.42, 0.23, 0, 0, -i * 0.5236, 1, NO);
      K.add(g, K.box(0.05, 0.34, 0.02, 0.01), m.ink, 0, y + 0.15, 0.24, 0, 0, 0, 1, NO); K.add(g, K.box(0.04, 0.26, 0.02, 0.01), m.red, 0.1, y + 0.05, 0.25, 0, 0, -1.1, 1, NO);
      K.add(g, lt(K, 0.015, 0.015, 0.9, 4), m.gold, 0, y - 1.0, 0.1, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.14, 0.14, 0.05, 12), m.gold, 0, y - 1.45, 0.1, Math.PI / 2, 0, 0, 1, NC);
    } },
    { make(K, g, o) { // brass sconce lamp: bracket, shade and a real glow
      const m = M(K), y = Math.min(o.h - 1.8, 3.2); K.add(g, bx(0.3, 0.5, 0.08, 0.03), m.gold, 0, y, 0.04, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.04, 0.04, 0.4, 6), m.gold, 0, y + 0.1, 0.25, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, lt(K, 0.14, 0.24, 0.3, 12), m.shade, 0, y + 0.35, 0.42, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.12, 8, 6), m.glow, 0, y + 0.22, 0.42, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 2.1, make(K, g) { const m = M(K); K.add(g, lt(K, 1.9, 1.9, 0.03, 32), m.rug, 0, 0.015, 0, 0, 0, 0, 1, NO); K.add(g, K.torus(1.75, 0.05, 3, 36), m.gold, 0, 0.035, 0, Math.PI / 2, 0, 0, 1, NO); K.add(g, lt(K, 1.2, 1.2, 0.04, 28), m.rugD, 0, 0.02, 0, 0, 0, 0, 1, NO); K.add(g, K.torus(1.2, 0.04, 3, 32), m.gold, 0, 0.045, 0, Math.PI / 2, 0, 0, 1, NO); K.add(g, lt(K, 0.45, 0.45, 0.05, 8), m.gold, 0, 0.03, 0, 0, 0, 0, 1, NO); } }, // round rug with gilded border rings and a medallion
    { r: 1.0, make(K, g) { const m = M(K); for (let i = 0; i < 4; i++) book(K, g, m, 0.9, 0.18, 0.65, 0, 0.09 + i * 0.19, 0, K.rnd() * 0.8); } },
    { r: 0.9, make(K, g) { const m = M(K); K.add(g, lt(K, 0.35, 0.4, 0.1, 16), m.wood, 0, 0.05, 0, 0, 0, 0, 1, NC); K.add(g, lt(K, 0.04, 0.04, 2.6, 8), m.wood, 0, 1.35, 0, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.3, 0.5, 0.5, 16), m.shade, 0, 2.8, 0, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.15, 10, 8), m.glow, 0, 2.6, 0, 0, 0, 0, 1, NO); K.add(g, lt(K, 0.1, 0.1, 0.06, 10), m.gold, 0, 0.13, 0, 0, 0, 0, 1, NO); } },
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, lt(K, 0.4, 0.4, 0.3, 18), m.cover[0], 0, 0.3, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(0.4, 0.03, 3, 16), m.gold, 0, 0.3, 0, Math.PI / 2, 0, 0, 1, NO); for (let i = 0; i < 3; i++) K.add(g, lt(K, 0.04, 0.05, 0.16, 6), m.wood, Math.cos(i * 2.1 + 0.5) * 0.28, 0.08, Math.sin(i * 2.1 + 0.5) * 0.28, 0, 0, 0, 1, NO); } }, // footstool
    { r: 0.9, make(K, g) { const m = M(K); book(K, g, m, 0.6, 0.08, 0.45, -0.2, 0.04, 0, 0.3, 1); K.add(g, lt(K, 0.14, 0.16, 0.2, 10), m.ink, 0.4, 0.1, 0.2, 0, 0, 0, 1, NC); K.add(g, K.capsule(0.025, 0.4, 3, 6), m.page, 0.5, 0.38, 0.2, 0, 0, -0.5, 1, NO); K.add(g, K.sphere(0.07, 6, 4), m.red, 0.62, 0.52, 0.2, 0, 0, 0, [0.5, 1.4, 0.3], NO); } }, // book, ink pot and quill
  ],
};
