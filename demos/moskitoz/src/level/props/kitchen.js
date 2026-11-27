// Cuisine (concept/js/biome-kitchen.js): mint counter runs (sink / hob / fruit bowl), cookie jars, red toasters, giant
// cartoon cereal boxes, tin-can columns, retro fridge corners, cutting boards (platforms / ramps), toast parkour; window with
// curtains, upper cabinets, wall clock, jar shelf, pan rack and a framed apple on the walls; checker runner, fruit, loaf and
// spilled cereal on the floor; flour dust in the air. Plus the named objects of the hand-made first kitchen (counter, stove,
// fridge, table, chairs, pot…). Local origin at the bottom centre of the box. Flat panels / tiny bars use bevel 0.02 (plain
// 12-triangle box): cheap in triangles.
import { alongX } from './kit.js';
import { band, NO, NC } from './common.js';

const P = 0.02; // bevel <= 2 cm = plain box
const M = (K) => ({
  counter: K.m('#FFFBF2', { rim: 0.08 }), mint: K.m(K.pal.accent), mintL: K.m('#A6EBD6'), chrome: K.m('#D8E4EA', { shadow: 0.7, rim: 0.15 }), burner: K.f('#3A2A36'),
  red: K.m('#F26B5B'), redD: K.m('#D94A3C'), wood: K.m('#EDB57A', { pattern: 'planks', scale: 0.3 }), woodD: K.m('#C98A52'),
  bread: K.m('#F8D596'), crust: K.m('#C98A4A'), butter: K.m('#FFE27A'), glass: K.f('#A9E6FF'), white: K.f('#FFFFFF'), dark: K.f('#4A3A44'),
  apple: K.m('#F2453A'), banana: K.m('#FFD84A'), orange: K.m('#FF9A2E'), grape: K.m('#9B6BFF'), leaf: K.m('#46C27A'),
  curtain: K.m('#F26B5B', { pattern: 'dots', color2: '#FFB0A4', scale: 0.32 }), cloth: K.m('#F26B5B', { pattern: 'checker', color2: '#FFFFFF', scale: 0.35, ao: 1 }),
  gold: K.m('#FFC62E'), violet: K.m('#9B6BFF'), sky: K.m('#4FC3FF'), cereal: K.m('#FFC62E', { pattern: 'dots', color2: '#FFE08A', scale: 0.5 }), label: K.m('#F26B5B', { pattern: 'stripes', color2: '#FFFFFF', scale: 0.6 }),
});

/** ramp with two edge rails (same top surface as the ramp): the slope stays the gameplay surface */
function railed(K, g, b, main, rail, w = 0.16) {
  const z = b.ramp.axis === 'z';
  K.add(g, K.rampGeo(z ? b.w - 2 * w : b.w, b.h, z ? b.d : b.d - 2 * w, b.ramp), main, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(z ? w : b.w, b.h, z ? b.d : w, b.ramp), rail, z ? s * (b.w / 2 - w / 2) : 0, b.h / 2, z ? 0 : s * (b.d / 2 - w / 2));
}
const GLYPH = { // block letters as strokes [x0, y0, x1, y1] on a unit square
  C: [[0, 0, 0, 1], [0, 1, 1, 1], [0, 0, 1, 0]], R: [[0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 1, 0.5], [0, 0.5, 1, 0.5], [0.3, 0.5, 1, 0]],
  U: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0, 1, 0]], N: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 1, 1, 0]], H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0.5, 1, 0.5]],
};
function word(K, g, mat, txt, cx, cy, u, h, th, z) { // letters as thin bars, centred on (cx, cy): u = letter width, h = height
  const adv = u * 1.45, x0 = cx - ((txt.length - 1) * adv) / 2;
  [...txt].forEach((ch, i) => {
    for (const [ax, ay, bx, by] of GLYPH[ch]) {
      const x1 = x0 + i * adv + (ax - 0.5) * u, y1 = cy + (ay - 0.5) * h, x2 = x0 + i * adv + (bx - 0.5) * u, y2 = cy + (by - 0.5) * h;
      K.add(g, K.box(Math.hypot(x2 - x1, y2 - y1) + th, th, 0.04, P), mat, (x1 + x2) / 2, (y1 + y2) / 2, z, 0, 0, Math.atan2(y2 - y1, x2 - x1), 1, NO);
    }
  });
}
function star(K, g, mat, x, y, z, S, rot = 0) { for (const a of [0, Math.PI / 4]) K.add(g, K.box(S, S, 0.05, P), mat, x, y, z, 0, 0, rot + a, 1, NC); } // 8-point burst from two squares
function cerealFace(K, g, m, L, H) { // front panel: name banner, burst, smiling bowl with floating rings, sticker, barcode
  const bw = L * 0.9, u = Math.min(H * 0.1, (bw * 0.9) / 7.6), hh = u * 1.6, th = u * 0.3, by = H - hh * 1.2 - H * 0.07;
  K.add(g, K.box(bw, hh * 1.7, 0.08, P), m.red, 0, by, 0.04, 0, 0, 0, 1, NC); // name banner
  word(K, g, m.white, 'CRUNCH', 0, by, u, hh, th, 0.1);
  const Rh = Math.min(L * 0.34, H * 0.19), hy = H * 0.43; // hero: burst + bowl
  star(K, g, m.orange, 0, hy, 0.03, Rh * 2.3);
  K.add(g, K.sphere(1, 14, 6), m.sky, 0, hy - Rh * 0.25, 0.1, 0, 0, 0, [Rh * 0.9, Rh * 0.55, 0.12], NC);
  K.add(g, K.sphere(1, 14, 4), m.white, 0, hy + Rh * 0.12, 0.14, 0, 0, 0, [Rh * 0.8, Rh * 0.14, 0.13], NO);
  for (let i = 0; i < 5; i++) { const a = 0.4 + i * 0.58; K.add(g, K.torus(Rh * 0.2, Rh * 0.08, 5, 10), i % 2 ? m.crust : m.gold, Math.cos(a) * Rh * 0.72, hy + Rh * 0.28 + Math.sin(a) * Rh * 0.5, 0.2, 0.3 * (i - 2), 0, 0, 1, NO); }
  for (const s of [-1, 1]) K.add(g, K.sphere(Rh * 0.07, 6, 5), m.dark, s * Rh * 0.28, hy - Rh * 0.2, 0.23, 0, 0, 0, 1, NO);
  K.add(g, K.torus(Rh * 0.2, Rh * 0.045, 4, 10, Math.PI), m.dark, 0, hy - Rh * 0.2, 0.23, 0, 0, Math.PI, 1, NO); // smile
  const S2 = Math.min(L * 0.22, H * 0.13); // sticker with an exclamation mark
  star(K, g, m.sky, L * 0.27, H * 0.17, 0.04, S2, 0.2);
  K.add(g, K.box(S2 * 0.14, S2 * 0.42, 0.04, P), m.white, L * 0.27, H * 0.17 + S2 * 0.08, 0.1, 0, 0, 0, 1, NO); K.add(g, K.box(S2 * 0.14, S2 * 0.14, 0.04, P), m.white, L * 0.27, H * 0.17 - S2 * 0.26, 0.1, 0, 0, 0, 1, NO);
  const bx = -L * 0.27, bwid = Math.min(L * 0.3, 1.6), bhh = Math.min(H * 0.1, 0.9); // barcode
  K.add(g, K.box(bwid, bhh, 0.04, P), m.white, bx, H * 0.15, 0.04, 0, 0, 0, 1, NC);
  for (let i = 0; i < 9; i++) K.add(g, K.box(bwid * (i % 3 ? 0.04 : 0.07), bhh * 0.7, 0.02, P), m.dark, bx + (i - 4) * bwid * 0.09, H * 0.15, 0.07, 0, 0, 0, 1, NO);
}

function counter(K, g, b) { // mint cabinet run: kick plate, top with a bead, drawer row and panelled doors on both sides, sink / hob / fruit bowl
  const m = M(K), { L, T } = alongX(g, b), H = b.h, top = Math.min(0.3, H * 0.18), kick = Math.min(0.2, H * 0.12), bh = H - top - kick, n = Math.max(1, Math.round(L / 2.1)), dw = (L - 0.3) / n;
  K.add(g, K.box(L - 0.3, kick, T - 0.3, P), m.chrome, 0, kick / 2, 0, 0, 0, 0, 1, NC);
  K.add(g, K.box(L - 0.08, bh, T - 0.12, 0.2), m.mint, 0, kick + bh / 2, 0);
  K.add(g, K.box(L, top, T, 0.1), m.counter, 0, H - top / 2, 0);
  K.add(g, K.box(L + 0.02, 0.05, T + 0.02, P), m.mintL, 0, H - top - 0.025, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) {
    const z = s * (T / 2 - 0.06);
    K.add(g, K.box(L - 0.5, bh * 0.2, 0.08, P), m.mintL, 0, kick + bh * 0.86, z, 0, 0, 0, 1, NC); // drawer row
    K.add(g, K.box(0.7, 0.07, 0.07, P), m.chrome, 0, kick + bh * 0.86, z + s * 0.07, 0, 0, 0, 1, NO);
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + 0.15 + dw * (i + 0.5);
      K.add(g, K.box(dw - 0.2, bh * 0.62, 0.08, P), m.mintL, x, kick + bh * 0.4, z, 0, 0, 0, 1, NC);
      K.add(g, K.box(dw - 0.5, bh * 0.46, 0.04, P), m.mint, x, kick + bh * 0.4, z + s * 0.05, 0, 0, 0, 1, NO); // raised panel
      K.add(g, K.sphere(0.08, 6, 5), m.chrome, x + dw * 0.3, kick + bh * 0.6, z + s * 0.1, 0, 0, 0, 1, NO);
    }
  }
  const r = K.rnd(), x = L * 0.15;
  if (r < 0.34) { // sink: steel basin, drain, gooseneck tap
    K.add(g, K.sphere(1, 14, 5), m.chrome, x, H + 0.012, 0, 0, 0, 0, [Math.min(L * 0.2, 0.9), 0.012, T * 0.28], NO); K.add(g, K.sphere(0.06, 6, 4), m.dark, x, H + 0.03, 0, 0, 0, 0, [1, 0.3, 1], NO);
    K.add(g, K.capsule(0.06, 0.5, 3, 8), m.chrome, x, H + 0.3, -T * 0.32, 0, 0, 0, 1, NC); K.add(g, K.capsule(0.05, 0.4, 3, 8), m.chrome, x, H + 0.55, -T * 0.32 + 0.18, Math.PI / 2, 0, 0, 1, NC);
  } else if (r < 0.67) { // hob: two burners on a dark plate, front knobs
    K.add(g, K.box(Math.min(L * 0.45, 2.4), 0.03, T * 0.7, P), m.burner, x, H + 0.015, 0, 0, 0, 0, 1, NO);
    for (const s of [-1, 1]) { K.add(g, K.sphere(1, 12, 4), m.chrome, x + s * Math.min(L * 0.1, 0.55), H + 0.045, 0, 0, 0, 0, [0.4, 0.02, 0.4], NO); K.add(g, K.sphere(0.07, 6, 5), m.red, x + s * 0.3, H + 0.05, T * 0.28, 0, 0, 0, 1, NO); }
  } else { // fruit bowl
    K.add(g, K.sphere(1, 12, 6), m.red, x, H + 0.1, 0, 0, 0, 0, [0.5, 0.22, 0.5], NC);
    [[m.apple, -0.15, 0.1], [m.orange, 0.15, 0.1], [m.banana, 0, -0.12]].forEach(([c, dx, dz], i) => K.add(g, K.sphere(0.17, 8, 6), c, x + dx, H + 0.28, dz, 0, 0, 0, i === 2 ? [1.6, 0.7, 0.8] : 1, NC));
  }
}
function jar(K, g, b) { // cookie jar: white body, coloured lid with a knob, a cookie badge and a striped ribbon on both sides
  const m = M(K), R = Math.min(b.w, b.d) / 2 * 0.95, H = b.h, lid = [m.violet, m.gold, m.mint, m.sky][Math.floor(K.rnd() * 4)];
  K.add(g, K.cyl(R, R * 0.94, H - 0.3, 0.2, 24), m.counter, 0, (H - 0.3) / 2, 0);
  K.add(g, K.cyl(R * 1.03, R * 1.03, 0.3, 0.1, 24), lid, 0, H - 0.15, 0);
  K.add(g, K.sphere(R * 0.22, 8, 6), lid, 0, H + 0.02, 0, 0, 0, 0, [1, 0.8, 1], NC);
  for (const s of [-1, 1]) {
    const d = K.sub(g, 0, 0, 0, s > 0 ? 0 : Math.PI);
    K.add(d, K.box(R * 1.4, 0.16, 0.05, P), m.label, 0, H * 0.78, R * 0.94, 0, 0, 0, 1, NO);
    K.add(d, K.sphere(1, 12, 4), m.crust, 0, H * 0.42, R * 0.95, 0, 0, 0, [R * 0.38, R * 0.38, 0.04], NO);
    for (const [x, y] of [[-0.1, 0.08], [0.12, 0.02], [0, -0.14]]) K.add(d, K.sphere(R * 0.05, 6, 4), m.dark, x * R, H * 0.42 + y * R, R * 0.99, 0, 0, 0, 1, NO);
  }
}
function toaster(K, g, b) { // red toaster: chrome belt, two slots with toast, dials and a lever on both sides
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H * 0.86, T, Math.min(0.5, T * 0.3, H * 0.3)), m.red, 0, H * 0.43, 0);
  K.add(g, K.box(L + 0.03, H * 0.12, T + 0.03, 0.05), m.chrome, 0, H * 0.3, 0, 0, 0, 0, 1, NC);
  for (const x of [-0.22, 0.22]) {
    K.add(g, K.box(L * 0.3, 0.04, T * 0.18, P), m.dark, x * L, H * 0.86 + 0.005, 0, 0, 0, 0, 1, NO); // slot
    K.add(g, K.box(L * 0.28, H * 0.22, T * 0.12, 0.06), m.crust, x * L, H * 0.86 + H * 0.03, 0);
    for (const s of [-1, 1]) K.add(g, K.box(L * 0.22, H * 0.17, 0.02, P), m.bread, x * L, H * 0.86 + H * 0.03, s * (T * 0.06 + 0.01), 0, 0, 0, 1, NO);
  }
  for (const s of [-1, 1]) {
    K.add(g, K.box(0.1, H * 0.34, 0.06, P), m.dark, L * 0.36, H * 0.55, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); // lever slot
    K.add(g, K.sphere(0.1, 6, 5), m.chrome, L * 0.36, H * 0.6, s * (T / 2 + 0.07), 0, 0, 0, 1, NC);
    for (const x of [-0.3, -0.1]) K.add(g, K.sphere(0.09, 6, 5), m.counter, x * L, H * 0.62, s * (T / 2 + 0.05), 0, 0, 0, 1, NC);
  }
}
function cereal(K, g, b) { // giant cartoon cereal box lying on its edge (tall thin wall): flap, name banner, bowl mascot, burst, barcode on both faces
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, Math.min(0.12, T * 0.3)), m.cereal, 0, H / 2, 0);
  K.add(g, K.box(L + 0.04, H * 0.035, T + 0.04, P), m.redD, 0, H - H * 0.0175, 0, 0, 0, 0, 1, NC); // top flap
  K.add(g, K.box(L + 0.04, H * 0.025, T + 0.04, P), m.redD, 0, H * 0.0125, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) cerealFace(K, K.sub(g, 0, 0, s * (T / 2 + 0.01), s > 0 ? 0 : Math.PI), m, L, H);
}
function canColumn(K, g, b) { // tin cans stacked to the ceiling: ridged steel, labels with a fruit badge
  const m = M(K), R = b.r ?? Math.min(b.w, b.d) / 2, H = b.h, n = Math.max(1, Math.round(H / 1.6)), ch = H / n, labels = [m.label, K.m('#46C27A', { pattern: 'stripes', color2: '#FFFFFF', scale: 0.6 }), K.m('#4FC3FF', { pattern: 'stripes', color2: '#FFFFFF', scale: 0.6 })], fruit = [m.apple, m.orange, m.banana];
  for (let i = 0; i < n; i++) {
    const y = ch * i + ch / 2;
    K.add(g, K.cyl(R, R, ch - 0.06, 0.08, 20), m.chrome, 0, y, 0);
    K.add(g, K.cyl(R + 0.02, R + 0.02, ch * 0.56, 0.02, 20), labels[i % 3], 0, y, 0, 0, i, 0, 1, NO);
    K.add(g, K.torus(R * 0.97, 0.03, 3, 20), m.chrome, 0, ch * i + 0.1, 0, Math.PI / 2, 0, 0, 1, NO); // ridge
    const d = K.sub(g, 0, y, 0, i * 2.1);
    K.add(d, K.sphere(1, 10, 4), m.white, 0, 0, R + 0.04, 0, 0, 0, [R * 0.34, ch * 0.2, 0.03], NO); K.add(d, K.sphere(ch * 0.09, 6, 5), fruit[i % 3], 0, 0, R + 0.07, 0, 0, 0, 1, NO);
  }
}
function fridgeColumn(K, g, b) { // retro fridge, stacked as tall as the room (corner): freezer seam, handles, badge, magnets
  const m = M(K), H = b.h, n = Math.max(1, Math.round(H / 5.5)), fh = H / n;
  for (let i = 0; i < n; i++) {
    const y0 = fh * i;
    K.add(g, K.box(b.w, fh - 0.08, b.d, 0.4), m.mint, 0, y0 + fh / 2, 0);
    for (let f = 0; f < 4; f++) {
      const w = f % 2 ? b.d : b.w, z = f % 2 ? b.w : b.d, d = K.sub(g, 0, y0, 0, (f * Math.PI) / 2);
      K.add(d, K.box(w * 0.9, 0.05, 0.06, P), m.dark, 0, fh * 0.7, z / 2 + 0.005, 0, 0, 0, 1, NO); // freezer seam
      K.add(d, K.box(0.12, fh * 0.12, 0.12, P), m.chrome, w * 0.3, fh * 0.82, z / 2 + 0.1, 0, 0, 0, 1, NC);
      K.add(d, K.box(0.12, fh * 0.3, 0.12, P), m.chrome, w * 0.3, fh * 0.45, z / 2 + 0.1, 0, 0, 0, 1, NC);
      if (f < 2) { K.add(d, K.box(w * 0.18, 0.12, 0.04, P), m.chrome, -w * 0.2, fh * 0.9, z / 2 + 0.01, 0, 0, 0, 1, NO); K.add(d, K.box(0.3, 0.38, 0.03, P), m.white, -w * 0.15, fh * 0.52, z / 2 + 0.01, 0, 0, 0.08, 1, NO); K.add(d, K.sphere(0.07, 6, 5), m.red, -w * 0.15, fh * 0.6, z / 2 + 0.04, 0, 0, 0, 1, NO); }
    }
  }
}
function board(K, g, b, parkour = false) { // cutting board: wood slab, border groove, handle slot, tomato slices and a leaf (platform / parkour)
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H, b.d, Math.min(0.2, H * 0.45)), m.wood, 0, H / 2, 0);
  K.add(g, K.box(b.w - 0.5, 0.02, b.d - 0.5, P), m.woodD, 0, H + 0.005, 0, 0, 0, 0, 1, NO);
  K.add(g, K.sphere(1, 12, 4), m.dark, b.w / 2 - 0.5, H + 0.02, 0, 0, 0, 0, [0.28, 0.012, 0.11], NO);
  for (const [x, z] of [[-0.3, 0.2], [0.1, -0.15]]) { K.add(g, K.sphere(1, 10, 4), m.apple, x * b.w * 0.5, H + 0.03, z * b.d * 0.5, 0, 0, 0, [0.26, 0.035, 0.26], NO); K.add(g, K.sphere(1, 8, 4), m.orange, x * b.w * 0.5, H + 0.055, z * b.d * 0.5, 0, 0, 0, [0.16, 0.012, 0.16], NO); }
  K.add(g, K.sphere(0.12, 6, 5), m.leaf, -b.w * 0.1, H + 0.04, b.d * 0.2, 0, 0.5, 0, [1.5, 0.3, 0.8], NO);
  if (parkour) band(K, g, b);
}
function toast(K, g, b) { // parkour: toast slice: crust, golden face with grill marks, a melting butter pat
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H, b.d, 0.34), m.crust, 0, H / 2, 0);
  K.add(g, K.box(b.w - 0.45, 0.1, b.d - 0.45, 0.06), m.bread, 0, H, 0, 0, 0, 0, 1, NC);
  for (let i = -1; i <= 1; i++) K.add(g, K.box(b.w * 0.5, 0.025, 0.1, P), m.crust, i * 0.06 * b.w - b.w * 0.05, H + 0.06, i * b.d * 0.22, 0, 0.5, 0, 1, NO); // grill marks
  K.add(g, K.box(0.8, 0.2, 0.6, 0.08), m.butter, 0.3, H + 0.1, -0.2, 0, 0.4, 0, 1, NC);
  K.add(g, K.sphere(0.2, 8, 5), m.butter, 0.75, H + 0.07, -0.05, 0, 0, 0, [1.2, 0.35, 1], NO);
  band(K, g, b);
}
function woodRamp(K, g, b) { const m = M(K); railed(K, g, b, m.wood, m.woodD, 0.18); } // wooden ramp with darker side rails
// ---- hand-made kitchen objects ----
function counterTop(K, g, b) { const m = M(K), { L, T } = alongX(g, b); K.add(g, K.box(L, b.h, T, 0.06), m.counter, 0, b.h / 2, 0); if (b.h > 0.15) K.add(g, K.box(L + 0.02, 0.05, T + 0.02, P), m.mintL, 0, 0.03, 0, 0, 0, 0, 1, NO); }
function upperCab(K, g, b) { // upper cabinet: crown, panelled doors with knobs
  const m = M(K), { L, T } = alongX(g, b), n = Math.max(1, Math.round(L / 2.2)), dw = L / n;
  K.add(g, K.box(L, b.h, T, 0.18), m.mint, 0, b.h / 2, 0);
  K.add(g, K.box(L + 0.06, 0.1, T + 0.06, P), m.mintL, 0, b.h - 0.05, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + dw * (i + 0.5);
    K.add(g, K.box(dw - 0.2, b.h - 0.3, 0.08, P), m.mintL, x, b.h / 2, T / 2 + 0.02, 0, 0, 0, 1, NC);
    K.add(g, K.box(dw - 0.5, b.h - 0.6, 0.04, P), m.mint, x, b.h / 2, T / 2 + 0.07, 0, 0, 0, 1, NO);
    K.add(g, K.sphere(0.07, 6, 5), m.chrome, x + (dw - 0.2) * 0.38, b.h * 0.3, T / 2 + 0.1, 0, 0, 0, 1, NO);
  }
}
function fridge(K, g, b) { // retro fridge: two doors with a dark seam, long handles, a badge and magnets
  const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.5), m.mint, 0, b.h / 2, 0);
  K.add(g, K.box(b.w * 0.9, b.h * 0.3, 0.1, P), m.mintL, 0, b.h * 0.82, b.d / 2, 0, 0, 0, 1, NC);
  K.add(g, K.box(b.w * 0.9, b.h * 0.58, 0.1, P), m.mintL, 0, b.h * 0.34, b.d / 2, 0, 0, 0, 1, NC);
  K.add(g, K.capsule(0.1, b.h * 0.3, 3, 8), m.chrome, -b.w * 0.38, b.h * 0.45, b.d / 2 + 0.14, 0, 0, 0, 1, NC);
  K.add(g, K.capsule(0.08, b.h * 0.14, 3, 8), m.chrome, -b.w * 0.38, b.h * 0.84, b.d / 2 + 0.12, 0, 0, 0, 1, NC);
  K.add(g, K.box(b.w * 0.2, 0.14, 0.04, P), m.chrome, b.w * 0.2, b.h * 0.93, b.d / 2 + 0.07, 0, 0, 0, 1, NO);
  K.add(g, K.box(0.5, 0.65, 0.03, P), m.white, b.w * 0.15, b.h * 0.6, b.d / 2 + 0.07, 0, 0, 0.06, 1, NO);
  for (const [x, y, c] of [[0.1, 0.72, m.red], [-0.1, 0.5, m.sky], [0.28, 0.45, m.gold]]) K.add(g, K.sphere(0.09, 6, 5), c, b.w * x, b.h * y, b.d / 2 + 0.1, 0, 0, 0, 1, NO);
}
function stove(K, g, b) { // stove: four burners with steel rings, front knobs, oven door with a window and a handle
  const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.25), m.counter, 0, b.h / 2, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { K.add(g, K.sphere(1, 14, 4), m.chrome, x * b.w * 0.24, b.h + 0.012, z * b.d * 0.24, 0, 0, 0, [0.62, 0.015, 0.62], NO); K.add(g, K.cyl(0.5, 0.5, 0.06, 0.02, 16), m.burner, x * b.w * 0.24, b.h + 0.03, z * b.d * 0.24, 0, 0, 0, 1, NO); }
  K.add(g, K.box(b.w * 0.7, b.h * 0.45, 0.1, 0.1), m.dark, 0, b.h * 0.42, b.d / 2, 0, 0, 0, 1, NC);
  K.add(g, K.box(b.w * 0.5, b.h * 0.26, 0.04, P), m.glass, 0, b.h * 0.44, b.d / 2 + 0.07, 0, 0, 0, 1, NO);
  K.add(g, K.box(b.w * 0.6, 0.08, 0.08, P), m.chrome, 0, b.h * 0.68, b.d / 2 + 0.1, 0, 0, 0, 1, NC);
  for (let i = 0; i < 4; i++) K.add(g, K.sphere(0.1, 6, 5), m.red, (i - 1.5) * b.w * 0.2, b.h * 0.86, b.d / 2 + 0.02, 0, 0, 0, 1, NO);
}
function tableTop(K, g, b) { // table top with a checker runner, two plates with cutlery and fruit
  const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.14), m.wood, 0, b.h / 2, 0); K.add(g, K.box(1.6, 0.04, b.d + 0.06, P), m.cloth, 0, b.h + 0.01, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) { K.add(g, K.sphere(1, 14, 4), m.counter, s * b.w * 0.3, b.h + 0.05, 0, 0, 0, 0, [0.5, 0.03, 0.5], NC); K.add(g, K.box(0.06, 0.02, 0.5, P), m.chrome, s * b.w * 0.3 + 0.62, b.h + 0.05, 0, 0, 0, 0, 1, NO); }
  K.add(g, K.sphere(0.32, 12, 8), m.apple, -0.4, b.h + 0.3, 0.2, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.3, 12, 8), m.orange, 0.3, b.h + 0.28, -0.2, 0, 0, 0, 1, NC);
}
function leg(K, g, b) { const m = M(K), r = Math.min(b.w, b.d) / 2; K.add(g, K.cyl(r * 0.7, r * 0.55, b.h, 0.05, 14), m.woodD, 0, b.h / 2, 0); K.add(g, K.torus(r * 0.66, 0.04, 3, 12), m.wood, 0, b.h * 0.86, 0, Math.PI / 2, 0, 0, 1, NO); }
function chair(K, g, b) { // chair seat: cushion with checker, four legs
  const m = M(K); K.add(g, K.box(b.w, 0.26, b.d, 0.1), m.counter, 0, b.h - 0.13, 0); K.add(g, K.box(b.w - 0.2, 0.05, b.d - 0.2, P), m.cloth, 0, b.h + 0.01, 0, 0, 0, 0, 1, NO);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add(g, K.cyl(0.11, 0.09, b.h - 0.26, 0.04, 10), m.woodD, x * (b.w / 2 - 0.25), (b.h - 0.26) / 2, z * (b.d / 2 - 0.25));
}
function chairBack(K, g, b) { // chair back: red panel with three slots and a darker top rail
  const m = M(K), { L, T } = alongX(g, b); K.add(g, K.box(L, b.h, T, Math.min(0.3, T * 0.45)), m.red, 0, b.h / 2, 0);
  K.add(g, K.box(L + 0.04, 0.2, T + 0.04, P), m.redD, 0, b.h - 0.1, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) K.add(g, K.box(L * 0.14, b.h * 0.5, 0.04, P), m.dark, i * L * 0.25, b.h * 0.48, s * (T / 2 + 0.005), 0, 0, 0, 1, NO);
}
function rollingPin(K, g, b) { const m = M(K); K.add(g, K.cyl(b.r, b.r, b.h, 0.3, 20), m.wood, 0, b.h / 2, 0); K.add(g, K.cyl(b.r * 0.3, b.r * 0.3, 0.8, 0.1, 12), m.woodD, 0, b.h + 0.4, 0); K.add(g, K.sphere(b.r * 0.4, 8, 6), m.woodD, 0, b.h + 0.85, 0, 0, 0, 0, 1, NC); for (const y of [0.25, b.h - 0.25]) K.add(g, K.torus(b.r * 1.0, 0.04, 3, 18), m.woodD, 0, y, 0, Math.PI / 2, 0, 0, 1, NO); }
function pot(K, g, b) { // red pot: white band, lid rim and knob, two side handles
  const m = M(K); K.add(g, K.cyl(b.r, b.r * 0.92, b.h, 0.14, 24), m.red, 0, b.h / 2, 0); K.add(g, K.cyl(b.r * 1.04, b.r * 1.04, 0.14, 0.06, 24), m.redD, 0, b.h, 0); K.add(g, K.sphere(0.2, 8, 6), m.redD, 0, b.h + 0.14, 0, 0, 0, 0, 1, NC);
  K.add(g, K.torus(b.r * 0.98, 0.05, 3, 24), m.white, 0, b.h * 0.6, 0, Math.PI / 2, 0, 0, 1, NO);
  for (const s of [-1, 1]) K.add(g, K.capsule(0.09, b.r * 0.4, 3, 8), m.dark, s * (b.r + 0.12), b.h * 0.78, 0, 0, 0, Math.PI / 2, 1, NC);
}
function pan(K, g, b) { // frying pan from above: dark body, long handle, a fried egg
  const m = M(K), w = Math.max(b.w - 1.1, b.w * 0.6); K.add(g, K.box(w, b.h, b.d, 0.2), m.dark, -(b.w - w) / 2, b.h / 2, 0);
  K.add(g, K.box(b.w - w, 0.14, 0.24, 0.05), m.dark, w / 2 - (b.w - w) / 2 + (b.w - w) / 2, b.h * 0.7, 0, 0, 0, 0, 1, NC);
  K.add(g, K.sphere(0.62, 14, 8), m.counter, -(b.w - w) / 2 - 0.2, b.h, 0.1, 0, 0, 0, [1.25, 0.16, 1], NC); K.add(g, K.sphere(0.26, 10, 6), m.butter, -(b.w - w) / 2 - 0.1, b.h + 0.08, 0.05, 0, 0, 0, [1, 0.7, 1], NC);
}

export default {
  bas: [
    { fits: (b) => Math.max(b.w, b.d) / Math.min(b.w, b.d) >= 1.25, make: counter },
    { fits: (b) => Math.max(b.w, b.d) / Math.min(b.w, b.d) < 1.25, make: jar },
    { fits: (b) => b.h <= 1.9, make: toaster },
  ],
  haut: [{ make: cereal }],
  pilier: [{ make: canColumn }],
  coin: [{ make: fridgeColumn }],
  plateforme: [{ make: (K, g, b) => board(K, g, b) }],
  rampe: [{ make: woodRamp }],
  parkour: [{ make: (K, g, b) => toast(K, g, b) }],
  looks: { counter, counterTop, upperCab, fridge, stove, tableTop, leg, chair, chairBack, rollingPin, pot, pan, board: (K, g, b) => board(K, g, b), woodRamp, skip: () => {} },
  solCount: [5, 3], // floor decals per room: [at least, up to this many more]
  ambient: { n: 50, color: '#FFFFFF', size: 0.12, rise: 0.22, sway: 0.4, glow: false }, // flour dust and steam drifting up (Ambient.js)
  mural: [
    { make(K, g) { // window with curtains, tie-backs, a sill and a pot
      const m = M(K); K.add(g, K.box(3.6, 2.6, 0.3, 0.2), m.counter, 0, 4.8, 0.1, 0, 0, 0, 1, NC);
      K.add(g, K.box(3.1, 2.1, 0.1, P), m.glass, 0, 4.8, 0.22, 0, 0, 0, 1, NO);
      K.add(g, K.box(0.1, 2.1, 0.1, P), m.counter, 0, 4.8, 0.28, 0, 0, 0, 1, NC); K.add(g, K.box(3.1, 0.1, 0.1, P), m.counter, 0, 4.8, 0.28, 0, 0, 0, 1, NC);
      K.add(g, K.sphere(0.34, 10, 6), m.white, 0.7, 5.2, 0.24, 0, 0, 0, [1.8, 0.6, 0.2], NO);
      for (const s of [-1, 1]) { K.add(g, K.box(1.0, 2.9, 0.18, P), m.curtain, s * 2.05, 4.75, 0.4, 0, 0, s * 0.04, 1, NC); K.add(g, K.box(1.04, 0.14, 0.22, P), m.red, s * 2.05, 4.1, 0.42, 0, 0, 0, 1, NO); }
      K.add(g, K.capsule(0.06, 4.8, 3, 8), m.woodD, 0, 6.25, 0.45, 0, 0, Math.PI / 2, 1, NC);
      K.add(g, K.box(3.9, 0.14, 0.6, P), m.wood, 0, 3.4, 0.35, 0, 0, 0, 1, NC); K.add(g, K.cyl(0.2, 0.15, 0.28, 0.05, 10), m.red, -1.0, 3.62, 0.35, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.22, 8, 6), m.leaf, -1.0, 3.95, 0.35, 0, 0, 0, [1, 0.9, 1], NC);
    } },
    { make(K, g) { // wall clock: red rim, white face with ticks, hands, a bell on top
      const m = M(K); K.add(g, K.cyl(0.95, 0.95, 0.2, 0.08, 32), m.red, 0, 4.9, 0.12, Math.PI / 2, 0, 0, 1, NC);
      K.add(g, K.cyl(0.78, 0.78, 0.06, 0.02, 32), m.counter, 0, 4.9, 0.24, Math.PI / 2, 0, 0, 1, NO);
      for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; K.add(g, K.box(0.07, 0.16, 0.03, P), m.dark, Math.sin(a) * 0.62, 4.9 + Math.cos(a) * 0.62, 0.28, 0, 0, -a, 1, NO); }
      K.add(g, K.box(0.08, 0.55, 0.03, P), K.f(K.ink), 0, 5.12, 0.3, 0, 0, 0, 1, NO); K.add(g, K.box(0.07, 0.4, 0.03, P), K.f(K.ink), 0.15, 4.85, 0.3, 0, 0, -1.9, 1, NO); K.add(g, K.sphere(0.07, 6, 5), m.red, 0, 4.9, 0.31, 0, 0, 0, 1, NO);
      for (const s of [-1, 1]) K.add(g, K.sphere(0.2, 8, 6), m.redD, s * 0.55, 5.85, 0.12, 0, 0, 0, [1, 0.8, 0.6], NC);
    } },
    { make(K, g) { // jar shelf: brackets, lidded jars with little labels
      const m = M(K); K.add(g, K.box(4.6, 0.18, 0.9, 0.06), m.wood, 0, 4.0, 0.45, 0, 0, 0, 1, NC);
      for (const s of [-1, 1]) K.add(g, K.box(0.12, 0.45, 0.7, P), m.woodD, s * 2.0, 3.72, 0.4, 0, 0, 0, 1, NC);
      [[-1.6, m.apple, 0.4, 0.95], [-0.6, m.mint, 0.34, 0.7], [0.4, m.gold, 0.42, 1.1], [1.5, m.violet, 0.32, 0.8]].forEach(([x, lid, r, h]) => {
        K.add(g, K.cyl(r, r, h, 0.1, 16), m.counter, x, 4.1 + h / 2, 0.5, 0, 0, 0, 1, NC); K.add(g, K.sphere(r * 0.7, 10, 6), lid, x, 4.12 + h, 0.5, 0, 0, 0, [1, 0.35, 1], NC);
        K.add(g, K.box(r * 1.1, h * 0.3, 0.03, P), lid, x, 4.1 + h * 0.5, 0.5 + r + 0.01, 0, 0, 0, 1, NO);
      });
    } },
    { make(K, g) { upperCab(K, K.sub(g, 0, 4.2, 0.65), { w: 4.4, d: 1.3, h: 1.9 }); } },
    { make(K, g) { // pan rack: steel rail with a ladle, spatula, whisk and a frying pan hanging
      const m = M(K); K.add(g, K.capsule(0.06, 4.2, 3, 8), m.chrome, 0, 5.2, 0.35, 0, 0, Math.PI / 2, 1, NC);
      for (const s of [-1, 1]) K.add(g, K.box(0.14, 0.14, 0.4, P), m.chrome, s * 2.1, 5.2, 0.18, 0, 0, 0, 1, NC);
      K.add(g, K.capsule(0.05, 0.9, 3, 8), m.chrome, -1.5, 4.5, 0.35, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.24, 8, 6), m.chrome, -1.5, 3.85, 0.35, 0, 0, 0, [1, 0.8, 0.6], NC);
      K.add(g, K.capsule(0.05, 0.8, 3, 8), m.woodD, -0.6, 4.55, 0.35, 0, 0, 0, 1, NC); K.add(g, K.box(0.34, 0.5, 0.05, P), m.woodD, -0.6, 3.95, 0.35, 0, 0, 0, 1, NC);
      K.add(g, K.capsule(0.05, 0.7, 3, 8), m.chrome, 0.35, 4.6, 0.35, 0, 0, 0, 1, NC); for (let i = -1; i <= 1; i++) K.add(g, K.torus(0.2, 0.025, 3, 10), m.chrome, 0.35, 3.95, 0.35, 0, i * 0.7, 0, [0.5, 1.3, 1], NO);
      K.add(g, K.cyl(0.62, 0.6, 0.14, 0.05, 16), m.dark, 1.5, 4.1, 0.4, Math.PI / 2, 0, 0, 1, NC); K.add(g, K.capsule(0.07, 0.8, 3, 8), m.dark, 1.5, 4.9, 0.4, 0, 0, 0, 1, NC);
    } },
    { make(K, g) { // framed still life: wooden frame, an apple and a pear on a checker cloth
      const m = M(K); K.add(g, K.box(2.6, 2.0, 0.12, 0.05), m.wood, 0, 4.4, 0.06, 0, 0, 0, 1, NC); K.add(g, K.box(2.2, 1.6, 0.06, P), m.bread, 0, 4.4, 0.13, 0, 0, 0, 1, NO);
      K.add(g, K.box(2.2, 0.5, 0.05, P), m.cloth, 0, 3.8, 0.16, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.4, 10, 8), m.apple, -0.3, 4.4, 0.24, 0, 0, 0, [1, 1, 0.4], NO); K.add(g, K.sphere(0.12, 6, 5), m.leaf, -0.2, 4.85, 0.26, 0, 0, 0.5, [1.4, 0.5, 0.5], NO);
      K.add(g, K.sphere(0.32, 10, 8), m.banana, 0.55, 4.3, 0.24, 0, 0, 0.3, [0.8, 1.2, 0.4], NO);
    } },
  ],
  sol: [
    { r: 2.4, make(K, g) { const m = M(K); K.add(g, K.box(4.6, 0.06, 1.8, 0.03), m.cloth, 0, 0.03, 0, 0, 0, 0, 1, NC); for (const s of [-1, 1]) K.add(g, K.box(4.6, 0.065, 0.1, P), m.red, 0, 0.032, s * 0.95, 0, 0, 0, 1, NO); } }, // checker runner with red edging
    { r: 1.2, make(K, g) { const m = M(K); K.add(g, K.sphere(0.34, 12, 8), m.apple, 0, 0.3, 0); K.add(g, K.sphere(0.14, 8, 6), m.leaf, 0.1, 0.66, 0, 0, 0, 0.6, [1.4, 0.5, 0.8], NO); K.add(g, K.sphere(0.3, 12, 8), m.orange, 0.7, 0.28, 0.3); K.add(g, K.capsule(0.12, 0.5, 3, 8), m.banana, -0.5, 0.12, 0.5, 0, 0.6, Math.PI / 2, 1, NC); } }, // fruit
    { r: 1.2, make(K, g) { K.add(g, K.sphere(1, 16, 4), K.f('#FFFFFF'), 0, 0.012, 0, 0, 0, 0, [1.1, 0.004, 0.8], NO); K.add(g, K.sphere(1, 10, 4), K.f('#FFFFFF'), 0.9, 0.013, 0.3, 0, 0, 0, [0.4, 0.004, 0.3], NO); } }, // flour spill
    { r: 1.2, make(K, g) { const m = M(K); K.add(g, K.sphere(1, 14, 4), m.white, 0, 0.012, 0, 0, 0, 0, [1.0, 0.004, 0.7], NO); for (let i = 0; i < 6; i++) K.add(g, K.torus(0.14, 0.055, 4, 10), i % 2 ? m.crust : m.gold, (K.rnd() - 0.5) * 2.0, 0.06, (K.rnd() - 0.5) * 1.4, Math.PI / 2, 0, K.rnd() * 3, 1, NO); } }, // spilled milk and cereal rings
    { r: 1.1, make(K, g) { const m = M(K); K.add(g, K.sphere(0.7, 12, 8), m.crust, 0, 0.3, 0, 0, 0.3, 0, [1.3, 0.55, 0.7]); for (let i = -1; i <= 1; i++) K.add(g, K.box(0.05, 0.05, 0.5, P), m.bread, i * 0.38, 0.55, 0, 0, 0.3, 0.5, 1, NO); } }, // bread loaf
  ],
};
