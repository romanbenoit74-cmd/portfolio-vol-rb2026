// Bonbons: cupcake bases with iced gumdrops, layered cake slices, wrapped chocolate bars, wafer walls with chocolate caps,
// candy canes with bows as pillars, frilly macaron towers in the corners, floating cookies, chocolate ramps, macarons as
// parkour; lollipops, wrapped sweets, ice-cream cones, cupcakes and sprinkles on the walls; sprinkles, syrup puddles,
// donuts, gummy worms and gummy bears on the floor; sparkles in the air. Flat bits are plain 12-triangle boxes (cheap).
import { NC, NO, alongX, parkour, spread, square } from './common.js';

const P = 0.02; // bevel <= 2 cm = plain box
const POP = ['#FF6EAC', '#8AF0D4', '#FFD04A', '#B98CFF', '#FF8A5B', '#7AD0FF'];
const M = (K) => ({
  choc: K.m('#7A4A30', { pattern: 'grid', color2: '#6A3E26', scale: 0.4 }), chocL: K.m('#9A6440', { rim: 0.2 }), sponge: K.m('#FFE0A8'), cream: K.m('#FFFFFF', { rim: 0.2 }),
  pop: POP.map((c) => K.m(c, { rim: 0.35 })), flat: POP.map((c) => K.f(c)), wafer: K.m('#F2C080', { pattern: 'grid', color2: '#D8A060', scale: 0.18 }), waferC: K.m('#FFF0F6'),
  cane: K.m('#FFFFFF', { pattern: 'stripes', color2: '#FF4A6A', scale: 0.5, rim: 0.3 }), cookie: K.m('#E8B070', { rim: 0.15 }), chip: K.m('#5A3420'), stick: K.m('#FFFFFF'), jelly: K.m('#FF5B7A', { rim: 0.5 }),
});
const FONT = { Y: [[0, 1, 0.5, 0.5], [1, 1, 0.5, 0.5], [0.5, 0, 0.5, 0.5]], U: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0, 1, 0]], M: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 1, 0.5, 0.4], [1, 1, 0.5, 0.4]] };
function word(K, g, mat, txt, cx, cy, u, h, z) { // letters as thin bars, centred on (cx, cy): u = letter width, h = height
  const adv = u * 1.4, th = u * 0.26, x0 = cx - ((txt.length - 1) * adv) / 2;
  [...txt].forEach((ch, i) => {
    for (const [ax, ay, bx, by] of FONT[ch]) {
      const x1 = x0 + i * adv + (ax - 0.5) * u, y1 = cy + (ay - 0.5) * h, x2 = x0 + i * adv + (bx - 0.5) * u, y2 = cy + (by - 0.5) * h;
      K.add(g, K.box(Math.hypot(x2 - x1, y2 - y1) + th, th, 0.04, P), mat, (x1 + x2) / 2, (y1 + y2) / 2, z, 0, 0, Math.atan2(y2 - y1, x2 - x1), 1, NO);
    }
  });
}
/** ramp with two edge rails (same top surface as the ramp): the slope stays the gameplay surface */
function railed(K, g, b, main, rail, w = 0.16) {
  const z = b.ramp.axis === 'z';
  K.add(g, K.rampGeo(z ? b.w - 2 * w : b.w, b.h, z ? b.d : b.d - 2 * w, b.ramp), main, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(z ? w : b.w, b.h, z ? b.d : w, b.ramp), rail, z ? s * (b.w / 2 - w / 2) : 0, b.h / 2, z ? 0 : s * (b.d / 2 - w / 2));
}
const sprinkle = (K, g, m, x, y, z, ry, i) => K.add(g, K.box(0.05, 0.035, 0.17, P), m.pop[i % 6], x, y, z, 0, ry, 0, 1, NO); // lying on a top / the floor
const sprinkleW = (K, g, m, x, y, z, rz, i) => K.add(g, K.box(0.17, 0.05, 0.035, P), m.pop[i % 6], x, y, z, 0, 0, rz, 1, NO); // stuck on a wall

function gumdrops(K, g, b) { // cupcake: striped paper liner, sponge, cream band with drips, sugared gumdrops with glints
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L - 0.1, H * 0.32, T - 0.1, 0.1), m.cane, 0, H * 0.16, 0);
  K.add(g, K.box(L, H * 0.4, T, 0.15), m.sponge, 0, H * 0.5, 0); K.add(g, K.box(L + 0.06, 0.2, T + 0.06, 0.1), m.cream, 0, H * 0.7, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) {
    for (const x of spread(Math.max(2, Math.round(L / 0.7)), L - 0.3)) K.add(g, K.sphere(0.11, 6, 5), m.cream, x, H * 0.7 - 0.2, s * (T / 2 + 0.05), 0, 0, 0, [1, 1.5 + K.rnd() * 1.4, 0.7], NO);
    for (const z of spread(Math.max(1, Math.round(T / 0.7)), T - 0.3)) K.add(g, K.sphere(0.11, 6, 5), m.cream, s * (L / 2 + 0.05), H * 0.7 - 0.2, z, 0, 0, 0, [0.7, 1.5 + K.rnd() * 1.4, 1], NO);
  }
  for (const x of spread(Math.max(2, Math.round(L / 1.1)), L - 0.5)) for (const z of spread(Math.max(1, Math.round(T / 1.1)), T - 0.5)) {
    K.add(g, K.sphere(0.4, 12, 8), m.pop[Math.floor(K.rnd() * 6)], x, H * 0.72, z, 0, 0, 0, [1, (H * 0.28) / 0.4, 1], NC);
    K.add(g, K.sphere(0.07, 5, 4), m.cream, x - 0.14, H * 0.72 + H * 0.2, z + 0.1, 0, 0, 0, 1, NO); // glint
  }
}
function cake(K, g, b) { // layered cake block: sponge, cream and jam layers, piped cream corners, sprinkles, a cherry with a stem
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = 3;
  for (let i = 0; i < n; i++) { K.add(g, K.box(L, H / n - 0.12, T, 0.1), m.sponge, 0, (i * H) / n + (H / n - 0.12) / 2, 0); K.add(g, K.box(L - 0.04, 0.12, T - 0.04, 0.05), i === n - 1 ? m.cream : m.pop[0], 0, ((i + 1) * H) / n - 0.06, 0, 0, 0, 0, 1, NC); }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add(g, K.sphere(0.17, 8, 6), m.cream, sx * (L / 2 - 0.2), H + 0.03, sz * (T / 2 - 0.2), 0, 0, 0, [1, 0.8, 1], NC);
  for (let i = 0; i < 6; i++) sprinkle(K, g, m, (K.rnd() - 0.5) * (L - 0.8), H + 0.02, (K.rnd() - 0.5) * (T - 0.8), K.rnd() * 3, i);
  K.add(g, K.sphere(0.22, 10, 8), m.jelly, 0, H + 0.14, 0, 0, 0, 0, 1, NC); K.add(g, K.box(0.04, 0.3, 0.04, P), m.chocL, 0.06, H + 0.4, 0, 0, 0, -0.3, 1, NO);
}
function chocolate(K, g, b) { // chocolate bar with a torn mint wrapper reading YUM on both faces
  const m = M(K), { L, T } = alongX(g, b), H = b.h, ww = L * 0.46, u = Math.min(ww / 4.4, H * 0.3);
  K.add(g, K.box(L, H, T, 0.12), m.choc, 0, H / 2, 0);
  K.add(g, K.box(ww, H + 0.04, T + 0.06, 0.06), m.pop[1], -L / 2 + ww / 2, H / 2, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) {
    const d = K.sub(g, 0, 0, s * (T / 2 + 0.03), s > 0 ? 0 : Math.PI);
    word(K, d, m.stick, 'YUM', -L / 2 + ww / 2, H / 2, u, u * 1.5, 0.02);
    for (let i = 0; i < 4; i++) K.add(d, K.cone(0.1, 0.18, 3), m.pop[1], -L / 2 + ww + 0.05, H * (0.2 + 0.2 * i), 0.01, 0, 0, -Math.PI / 2, 1, NO); // torn edge
  }
}
function waferWall(K, g, b) { // wafer wall: layered wafers with cream, a chocolate cap with drips and a cream zigzag
  const m = M(K), { L, T } = alongX(g, b), n = Math.max(3, Math.round(b.h / 0.6));
  for (let i = 0; i < n; i++) { K.add(g, K.box(L, b.h / n - 0.08, T, 0.06), m.wafer, 0, (i + 0.5) * (b.h / n), 0); if (i) K.add(g, K.box(L - 0.02, 0.08, T - 0.04, 0.02), m.waferC, 0, (i * b.h) / n, 0, 0, 0, 0, 1, NO); }
  K.add(g, K.box(L + 0.04, 0.26, T + 0.04, 0.1), m.chocL, 0, b.h - 0.13, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) for (const x of spread(Math.max(2, Math.round(L / 0.6)), L - 0.3)) {
    K.add(g, K.sphere(0.1, 6, 5), m.chocL, x, b.h - 0.32 - K.rnd() * 0.1, s * (T / 2 + 0.04), 0, 0, 0, [1, 1.6, 0.7], NO);
    K.add(g, K.box(0.3, 0.04, 0.03, P), m.cream, x, b.h - 0.13, s * (T / 2 + 0.07), 0, 0, 0.5 * (Math.round(x * 3) % 2 ? 1 : -1), 1, NO);
  }
}
function cane(K, g, b) { // candy cane: striped shaft to the ceiling, chocolate foot, a pink bow with holly (the hook is hidden up top)
  const m = M(K), R = (b.r ?? b.w / 2) * 0.8, y = Math.min(b.h * 0.3, 2.2);
  K.add(g, K.cyl(R, R, b.h, 0.1, 16), m.cane, 0, b.h / 2, 0); K.add(g, K.cyl(R * 1.5, R * 1.7, 0.3, 0.1, 16), m.chocL, 0, 0.15, 0, 0, 0, 0, 1, NC);
  const d = K.sub(g, 0, y, 0, K.rnd() * 6.28);
  K.add(d, K.torus(R * 1.02, 0.07, 4, 16), m.pop[0], 0, 0, 0, Math.PI / 2, 0, 0, 1, NO);
  for (const s of [-1, 1]) { K.add(d, K.sphere(R * 0.7, 8, 6), m.pop[0], s * R * 0.75, 0.05, R * 1.1, 0, s * 0.5, 0, [1.2, 0.8, 0.5], NC); K.add(d, K.box(R * 0.4, R * 1.4, 0.05, P), m.pop[0], s * R * 0.35, -R * 0.8, R * 1.1, 0, 0, s * 0.25, 1, NO); K.add(d, K.sphere(R * 0.4, 6, 5), m.pop[1], s * R * 0.5, 0.45 * R, R * 1.2, 0, 0, s * 0.8, [1.6, 0.6, 0.3], NO); }
  K.add(d, K.sphere(R * 0.28, 6, 5), m.pop[0], 0, 0.02, R * 1.2, 0, 0, 0, 1, NC);
  for (const s of [-1, 0, 1]) K.add(d, K.sphere(R * 0.14, 6, 5), m.jelly, s * R * 0.22, 0.4 * R, R * 1.35, 0, 0, 0, 1, NO);
}
function macarons(K, g, b) { // tower of macarons: two frilly shells and a cream filling each
  const m = M(K), n = Math.max(2, Math.round(b.h / 1.5)), s = b.h / n, R = Math.min(b.w, b.d) / 2;
  for (let i = 0; i < n; i++) {
    const c = m.pop[i % 6], y = i * s;
    K.add(g, K.cyl(R * 0.95, R, s * 0.42, 0.12, 16), c, 0, y + s * 0.21, 0); K.add(g, K.cyl(R * 0.85, R * 0.85, s * 0.16, 0, 16), m.cream, 0, y + s * 0.5, 0, 0, 0, 0, 1, NO); K.add(g, K.cyl(R, R * 0.95, s * 0.42, 0.12, 16), c, 0, y + s * 0.79, 0);
    for (const fy of [0.07, 0.65]) K.add(g, K.torus(R * 1.0, 0.05, 3, 16), c, 0, y + s * fy, 0, Math.PI / 2, 0, 0, 1, NO); // frill ("feet")
  }
}
function cookie(K, g, b) { // cookie: scalloped edge, chocolate chips of two sizes and pastel sprinkles
  const m = M(K), R = Math.min(b.w, b.d) / 2 - 0.02; K.add(g, K.cyl(R, R, b.h, 0.14, 24), m.cookie, 0, b.h / 2, 0);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; K.add(g, K.sphere(0.17, 6, 5), m.cookie, Math.cos(a) * (R - 0.05), b.h * 0.55, Math.sin(a) * (R - 0.05), 0, 0, 0, [1, 0.7, 1], NO); }
  for (let i = 0; i < 8; i++) { const a = i * 0.9, r = R * (0.25 + (i % 3) * 0.22); K.add(g, K.sphere(i % 2 ? 0.13 : 0.18, 8, 6), m.chip, Math.cos(a) * r, b.h, Math.sin(a) * r, 0, 0, 0, [1, 0.4, 1], NO); }
  for (let i = 0; i < 5; i++) { const a = i * 1.7 + 0.4, r = R * (0.3 + (i % 2) * 0.3); sprinkle(K, g, m, Math.cos(a) * r, b.h + 0.02, Math.sin(a) * r, a, i); }
}
function chocRamp(K, g, b) { const m = M(K); railed(K, g, b, m.chocL, m.choc, 0.16); K.add(g, K.rampGeo(b.w + 0.04, b.h * 0.25, b.d + 0.02, b.ramp), m.cream, 0, b.h * 0.125, 0, 0, 0, 0, 1, NO); } // chocolate ramp with dark rails and a cream base

export default {
  bas: [{ make: gumdrops }, { make: cake }, { make: chocolate }],
  haut: [{ make: waferWall }, { make: chocolate }],
  pilier: [{ make: cane }],
  coin: [{ make: macarons }],
  plateforme: [{ make: cookie }],
  rampe: [{ make: chocRamp }],
  parkour: [parkour((K, g, b) => macarons(K, g, b)), parkour(cookie)],
  solCount: [5, 3], // floor decals per room: [at least, up to this many more]
  ambient: { n: 80, color: '#FFFFFF', size: 0.14, rise: 0.12, sway: 0.5, glow: true }, // sugar sparkles drifting up (Ambient.js)
  mural: [
    { make(K, g) { const m = M(K); for (const [x, y, r] of [[-1.2, 2.6, 0.7], [0.4, 3.2, 0.9], [1.6, 2.4, 0.6]]) { K.add(g, K.cyl(0.06, 0.06, y, 0.02, 8), m.stick, x, y / 2, 0.4, 0, 0, 0, 1, NC); K.add(g, K.cyl(r, r, 0.16, 0.06, 24), m.pop[Math.floor(K.rnd() * 6)], x, y + r * 0.9, 0.4, Math.PI / 2, 0, 0, 1, NC); for (const k of [0.3, 0.62]) K.add(g, K.torus(r * k, 0.05, 4, 20), m.cream, x, y + r * 0.9, 0.49, 0, 0, 0, 1, NO); } } }, // lollipops with swirls
    { make(K, g) { const m = M(K); for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 1.1, y = 1.5 + (i % 2) * 1.2, c = m.pop[i + 1]; K.add(g, K.sphere(0.3, 12, 8), c, x, y, 0.3, 0, 0, 0, [1.4, 1, 1], NC); K.add(g, K.torus(0.3, 0.04, 4, 12), m.cream, x, y, 0.3, 0, Math.PI / 2, 0, [1, 1, 1.2], NO); for (const s of [-1, 1]) K.add(g, K.cone(0.22, 0.35, 6), c, x + s * 0.55, y, 0.3, 0, 0, s * Math.PI / 2, 1, NO); } } }, // wrapped sweets
    { make(K, g) { const m = M(K); for (let i = 0; i < 20; i++) sprinkleW(K, g, m, (K.rnd() - 0.5) * 3.6, 0.5 + K.rnd() * 3.5, 0.05, K.rnd() * 3, i); } }, // sprinkles (all along the wall, tilted)
    { make(K, g) { // ice-cream cone: waffle cone, two scoops, a drip skirt and a cherry
      const m = M(K); K.add(g, K.cone(0.6, 1.5, 8), m.wafer, 0, 2.25, 0.45, 0, 0, Math.PI, 1, NC);
      K.add(g, K.sphere(0.62, 12, 8), m.pop[2], 0, 3.15, 0.45, 0, 0, 0, 1, NC); K.add(g, K.torus(0.58, 0.13, 5, 14), m.cream, 0, 3.0, 0.45, Math.PI / 2, 0, 0, [1, 1, 0.8], NO);
      K.add(g, K.sphere(0.5, 12, 8), m.pop[3], 0, 3.85, 0.45, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.15, 8, 6), m.jelly, 0, 4.4, 0.45, 0, 0, 0, 1, NC);
      for (let i = 0; i < 4; i++) sprinkleW(K, g, m, (i - 1.5) * 0.28, 3.55 + (i % 2) * 0.3, 0.95, i, i + 2);
    } },
    { make(K, g) { // cupcake: striped liner, three frosting swirls, a cherry
      const m = M(K); K.add(g, K.cyl(0.75, 0.55, 0.8, 0.1, 16), m.cane, 0, 2.4, 0.45, 0, 0, 0, 1, NC);
      K.add(g, K.sphere(0.78, 12, 8), m.pop[1], 0, 3.0, 0.45, 0, 0, 0, [1, 0.6, 1], NC); K.add(g, K.sphere(0.55, 10, 8), m.pop[1], 0, 3.4, 0.45, 0, 0, 0, [1, 0.7, 1], NC); K.add(g, K.sphere(0.34, 8, 6), m.pop[1], 0, 3.7, 0.45, 0, 0, 0, 1, NC);
      K.add(g, K.sphere(0.17, 8, 6), m.jelly, 0, 4.0, 0.45, 0, 0, 0, 1, NC);
      for (let i = 0; i < 6; i++) sprinkleW(K, g, m, (i - 2.5) * 0.2, 2.95 + (i % 3) * 0.2, 1.05, i * 0.5, i + 2);
    } },
  ],
  sol: [
    { r: 1.2, make(K, g) { const m = M(K); for (let i = 0; i < 18; i++) sprinkle(K, g, m, (K.rnd() - 0.5) * 2, 0.03, (K.rnd() - 0.5) * 2, K.rnd() * 3, i); } }, // sprinkles
    { r: 1.3, make(K, g) { const m = M(K); K.add(g, K.sphere(1, 18, 4), m.pop[0], 0, 0.02, 0, 0, 0, 0, [1.1, 0.025, 0.8], NO); K.add(g, K.sphere(1, 10, 4), m.cream, -0.3, 0.04, -0.1, 0, 0.3, 0, [0.4, 0.008, 0.1], NO); } }, // syrup puddle with a glint
    { r: 0.7, make(K, g) { const m = M(K), c = m.pop[Math.floor(K.rnd() * 6)]; K.add(g, K.sphere(0.3, 12, 8), c, 0, 0.3, 0, 0, 0, 0, [1, 1.2, 0.8]); K.add(g, K.sphere(0.22, 12, 8), c, 0, 0.8, 0, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.12, 8, 6), m.cream, -0.08, 0.38, 0.22, 0, 0, 0, [1, 1.3, 0.5], NO); for (const s of [-1, 1]) { K.add(g, K.sphere(0.08, 8, 6), c, s * 0.15, 1.0, 0, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.1, 8, 6), c, s * 0.28, 0.4, 0.05, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.035, 5, 4), m.chip, s * 0.08, 0.84, 0.2, 0, 0, 0, 1, NO); } K.add(g, K.sphere(0.05, 5, 4), m.chip, 0, 0.77, 0.2, 0, 0, 0, 1, NO); } }, // gummy bear
    { r: 0.9, make(K, g) { const m = M(K); K.add(g, K.torus(0.45, 0.2, 8, 18), m.cookie, 0, 0.2, 0, Math.PI / 2); K.add(g, K.torus(0.45, 0.17, 8, 18), m.pop[0], 0, 0.3, 0, Math.PI / 2, 0, 0, [1, 1, 0.7], NC); for (let i = 0; i < 7; i++) { const a = i * 0.9; sprinkle(K, g, m, Math.cos(a) * 0.45, 0.42, Math.sin(a) * 0.45, a, i + 2); } } }, // donut
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.cyl(0.4, 0.4, 0.08, 0.03, 16), m.pop[3], 0, 0.04, 0, 0, 0, 0, 1, NC); for (const k of [0.15, 0.28]) K.add(g, K.torus(k, 0.025, 3, 14), m.cream, 0, 0.09, 0, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.box(0.9, 0.05, 0.05, P), m.stick, 0.85, 0.03, 0, 0, 0, 0, 1, NC); } }, // dropped lollipop
    { r: 0.8, make(K, g) { const m = M(K); for (let i = 0; i < 6; i++) K.add(g, K.sphere(0.13, 8, 6), m.pop[(i * 2) % 6], (i - 2.5) * 0.2, 0.12, Math.sin(i * 0.9) * 0.18, 0, 0, 0, 1, i % 5 ? NC : NO); } }, // gummy worm
  ],
};
