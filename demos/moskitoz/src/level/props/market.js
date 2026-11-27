// Supermarché: produce stands of fruit with chalk signs, pyramids of cans on a pallet, cereal boxes with a mascot bowl, aisle
// shelving with price rails, columns with a starburst sign, chiller cabinets in the corners, floating price tags, crate ramps,
// cereal boxes as parkour; freezers, sale banners, a clock, an apple poster and a chalkboard on the walls; "wet floor" signs,
// dropped fruit, a basket, a shopping cart and a doormat on the floor.
import * as THREE from 'three';
import { roundedBox } from '../../render/Style.js';
import { NC, NO, alongX, parkour, spread, square } from './common.js';
const bx = (K, w, h, d, r) => { const m = Math.min(w, h, d); return r <= 0.02 || m < 0.18 ? K.box(w, h, d, 0.02) : roundedBox(w, h, d, r, m < 0.3 ? 1 : 2); }; // bevel by size: thin trims plain, small parts chamfered, big volumes rounded
const cy = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg); // plain cylinder for small parts (a rounded one costs 6x the triangles)

const LABELS = ['#E84A4A', '#4A9AE0', '#FFC62E', '#48C870', '#FF8A3A', '#B06AE0'];
const M = (K) => ({
  crate: K.m('#E0B070', { pattern: 'planks', scale: 0.25 }), crateD: K.m('#B98A4C'), metal: K.m('#E6EEF6', { rim: 0.3 }), metalD: K.m('#A8B6C6'), red: K.m('#E84A4A', { rim: 0.2 }), white: K.m('#FFFFFF', { rim: 0.1 }),
  label: LABELS.map((c) => K.m(c, { rim: 0.15 })), fruit: [K.m('#FF5B4A', { rim: 0.4 }), K.m('#FFC62E', { rim: 0.4 }), K.m('#8AE05A', { rim: 0.4 }), K.m('#FF9A3A', { rim: 0.4 })],
  glass: K.m('#BEE8FF', { rim: 0.6 }), glow: K.glow('#E8F8FF', 1.3), yel: K.m('#FFD23F', { rim: 0.2 }), dark: K.f('#1A2A40'), tag: K.m('#FFE45A', { rim: 0.2 }),
  blue: K.m('#4A9AE0', { rim: 0.15 }),
});

// blocky letters in a 1 x 1.4 cell: [centre x, centre y, width, height] bars
const GLYPH = {
  S: [[0.5, 1.3, 1, 0.2], [0.5, 0.7, 1, 0.2], [0.5, 0.1, 1, 0.2], [0.1, 1.0, 0.2, 0.6], [0.9, 0.4, 0.2, 0.6]], A: [[0.1, 0.7, 0.2, 1.4], [0.9, 0.7, 0.2, 1.4], [0.5, 1.3, 1, 0.2], [0.5, 0.6, 1, 0.2]],
  L: [[0.1, 0.7, 0.2, 1.4], [0.5, 0.1, 1, 0.2]], E: [[0.1, 0.7, 0.2, 1.4], [0.55, 1.3, 0.9, 0.2], [0.5, 0.7, 0.8, 0.2], [0.55, 0.1, 0.9, 0.2]],
};
function word(K, g, mat, txt, x, y, s, z) { // a word in blocky letters, centred on x
  [...txt].forEach((ch, i) => { for (const [cx, cy, w, h] of GLYPH[ch]) K.add(g, bx(K, w * s, h * s, 0.02, 0.005), mat, x + (i - (txt.length - 1) / 2) * 1.3 * s + (cx - 0.5) * s, y + (cy - 0.7) * s, z, 0, 0, 0, 1, NO); });
}
function burst(K, g, m, x, y, z, r, c = m.red) { // 8-point starburst sign: two turned squares and a white price bar
  for (const a of [0, Math.PI / 4]) K.add(g, bx(K, r * 1.5, r * 1.5, 0.03, 0.01), c, x, y, z, 0, 0, a, 1, NC);
  K.add(g, bx(K, r * 0.8, r * 0.2, 0.02, 0.005), m.white, x, y + r * 0.1, z + 0.02, 0, 0, 0, 1, NO); K.add(g, bx(K, r * 0.5, r * 0.14, 0.02, 0.005), m.tag, x, y - r * 0.2, z + 0.02, 0, 0, 0, 1, NO);
}
const inward = (g) => [g.position.z > 0 ? Math.PI : 0, g.position.x > 0 ? -Math.PI / 2 : Math.PI / 2]; // yaw of the two faces that look into the room (corner props)

function produce(K, g, b) { // slanted produce stand: crate frame with slats, tray rims, heaped fruit with stalks and leaves, chalk price sign
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(1, Math.round(L / 1.2)), bh = H - 0.25;
  K.add(g, bx(K, L, bh, T, 0.08), m.crate, 0, bh / 2, 0);
  for (const x of [-1, 1]) for (const z of [-1, 1]) K.add(g, bx(K, 0.14, bh + 0.02, 0.14, 0.04), m.crateD, x * (L / 2 - 0.07), bh / 2, z * (T / 2 - 0.07), 0, 0, 0, 1, NC); // corner posts
  for (const s of [-1, 1]) { K.add(g, bx(K, L, 0.1, 0.08, 0.03), m.crateD, 0, bh + 0.05, s * (T / 2 - 0.04), 0, 0, 0, 1, NC); for (const y of [bh * 0.33, bh * 0.66]) K.add(g, bx(K, L - 0.3, 0.025, 0.03, 0.01), m.dark, 0, y, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); } // rims + slat gaps
  for (const e of [-1, 1]) K.add(g, bx(K, 0.08, 0.1, T - 0.2, 0.03), m.crateD, e * (L / 2 - 0.04), bh + 0.05, 0, 0, 0, 0, 1, NC);
  for (const [i, x] of spread(n, L).entries()) {
    const f = m.fruit[i % 4], lemon = i % 4 === 1;
    for (const u of spread(3, L / n - 0.4)) for (const z of spread(Math.max(2, Math.round(T / 0.45)), T - 0.4)) {
      K.add(g, K.sphere(0.2, 10, 7), f, x + u, H - 0.16, z, 0, 0, 0, lemon ? [1.15, 0.95, 0.95] : 1, NO);
      if (K.rnd() < 0.5) { K.add(g, bx(K, 0.02, 0.07, 0.02, 0.005), m.crateD, x + u, H + 0.04, z, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.06, 5, 4), m.label[3], x + u + 0.05, H + 0.07, z, 0, 0, 0, [1, 0.3, 0.6], NO); }
    }
    for (const s of [-1, 1]) { K.add(g, bx(K, 0.5, 0.3, 0.04, 0.01), m.tag, x, H * 0.55, s * (T / 2 + 0.02), 0, 0, 0, 1, NO); K.add(g, bx(K, 0.34, 0.07, 0.03, 0.01), m.red, x, H * 0.55 + 0.06, s * (T / 2 + 0.035), 0, 0, 0, 1, NO); K.add(g, bx(K, 0.34, 0.04, 0.03, 0.01), m.dark, x, H * 0.55 - 0.07, s * (T / 2 + 0.035), 0, 0, 0, 1, NO); } // price tag
  }
  K.add(g, bx(K, 0.05, 0.5, 0.05, 0.01), m.crateD, L / 2 - 0.3, H + 0.2, 0, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.5, 0.36, 0.05, 0.015), m.dark, L / 2 - 0.3, H + 0.55, 0, 0, 0, 0.1, 1, NC); // chalk sign
  for (const s of [-1, 1]) { K.add(g, bx(K, 0.34, 0.04, 0.02, 0.005), m.white, L / 2 - 0.3, H + 0.62, s * 0.03, 0, 0, 0.1, 1, NO); K.add(g, bx(K, 0.2, 0.04, 0.02, 0.005), m.white, L / 2 - 0.34, H + 0.52, s * 0.03, 0, 0, 0.1, 1, NO); K.add(g, K.sphere(0.07, 6, 4), m.red, L / 2 - 0.18, H + 0.5, s * 0.03, 0, 0, 0, [1, 1, 0.3], NO); }
}
function cans(K, g, b) { // pyramid-ish stack of cans on a pallet (narrow core keeps the stack solid), lids, a sale starburst on top
  const m = M(K), S = Math.min(b.w, b.d), H = b.h, rows = Math.max(2, Math.round(H / 0.5)), c = m.label[Math.floor(K.rnd() * 6)];
  K.add(g, bx(K, S * 0.45, H * 0.95, S * 0.45, 0.05), m.metalD, 0, H * 0.475, 0, 0, 0, 0, 1, { ink: false });
  K.add(g, bx(K, S, 0.1, S, 0.03), m.crate, 0, 0.05, 0, 0, 0, 0, 1, NC); // pallet
  for (let j = 0; j < rows; j++) {
    const k = rows - j, span = S * (0.4 + (0.6 * k) / rows), n = Math.max(1, Math.round(span / 0.55)), ch = H / rows - 0.03;
    for (const x of spread(n, span)) for (const z of spread(n, span)) { K.add(g, cy(0.25, 0.25, ch, 12), c, x, ((j + 0.5) * H) / rows, z, 0, 0, 0, 1, { ink: j === rows - 1 }); K.add(g, K.cone(0.235, 0.05, 12), m.metal, x, ((j + 0.5) * H) / rows + ch / 2, z, 0, 0, 0, 1, NO); } // can + lid
  }
  K.add(g, bx(K, 0.04, 0.4, 0.04, 0.01), m.dark, 0, H + 0.1, 0, 0, 0, 0, 1, NO); burst(K, g, m, 0, H + 0.4, 0, 0.3);
}
function cereal(K, g, b, lite = false) { // lite = parkour version (fewer materials: it is rebuilt per moving platform); big cereal boxes side by side: top flap, mascot bowl with floating pieces, title bars, starburst, base stripe
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(1, Math.round(L / 1.3));
  for (const [i, x] of spread(n, L).entries()) {
    const c = (i * 2 + Math.floor(K.rnd() * 6)) % 6, w = L / n - 0.08;
    K.add(g, bx(K, w, H, T, 0.06), m.label[c], x, H / 2, 0);
    K.add(g, bx(K, w - 0.06, 0.07, T + 0.02, 0.02), m.white, x, H - 0.06, 0, 0, 0, 0, 1, NO); K.add(g, bx(K, w - 0.06, 0.14, T + 0.02, 0.02), m.dark, x, 0.1, 0, 0, 0, 0, 1, NO); // top flap, base stripe
    for (const s of [-1, 1]) {
      const z = s * (T / 2 + 0.01);
      K.add(g, bx(K, w - 0.3, H * 0.25, 0.02, 0.01), m.white, x, H * 0.72, z, 0, 0, 0, 1, NO); K.add(g, bx(K, w - 0.5, 0.07, 0.025, 0.01), m.dark, x, H * 0.76, z + s * 0.005, 0, 0, 0, 1, NO); K.add(g, bx(K, (w - 0.5) * 0.6, 0.06, 0.025, 0.01), lite ? m.dark : m.label[(c + 3) % 6], x, H * 0.68, z + s * 0.005, 0, 0, 0, 1, NO); // title
      K.add(g, K.sphere(0.28, 10, 7), m.fruit[1], x, H * 0.35, z + s * 0.01, 0, 0, 0, [1.3, 0.8, 0.12], NO); K.add(g, K.sphere(0.2, 10, 7), m.white, x, H * 0.4, z + s * 0.02, 0, 0, 0, [1.2, 0.55, 0.1], NO); // bowl + milk
      for (const [j, [dx, dy]] of [[-0.2, 0.17], [0.05, 0.22], [0.22, 0.15]].entries()) K.add(g, K.sphere(0.06, 6, 5), lite ? m.fruit[1] : m.fruit[(c + j) % 4], x + dx, H * 0.35 + dy + 0.08, z + s * 0.02, 0, 0, 0, 1, NO); // floating pieces
    }
    if (!lite) K.add(g, bx(K, 0.04, 0.35, 0.04, 0.01), m.metalD, x, H + 0.01, 0, 0, 0, 0, 1, NO);
  }
}
function aisle(K, g, b) { // shop shelving: metal gondola, kickboard, price rails with tags, boxes / bottles / jars, red header with a sign
  const m = M(K), { L, T } = alongX(g, b), H = b.h, lv = Math.max(2, Math.floor(H / 1.0));
  K.add(g, bx(K, L, H, T * 0.3, 0.04), m.metal, 0, H / 2, 0);
  K.add(g, bx(K, L + 0.02, 0.2, T, 0.04), m.blue, 0, 0.1, 0, 0, 0, 0, 1, NC); // kickboard
  for (let i = 0; i < lv; i++) {
    const y = 0.25 + (i * (H - 0.35)) / lv, ph = (H - 0.35) / lv - 0.25;
    K.add(g, bx(K, L, 0.06, T, 0.02), m.metalD, 0, y, 0, 0, 0, 0, 1, NO);
    for (const s of [-1, 1]) {
      K.add(g, bx(K, L, 0.08, 0.02, 0.005), m.white, 0, y - 0.01, s * (T / 2 + 0.005), 0, 0, 0, 1, NO);
      for (const x of spread(Math.max(2, Math.round(L / 0.5)), L - 0.2)) {
        const c = m.label[Math.floor(K.rnd() * 6)], k = Math.floor(K.rnd() * 3), h = ph * (0.7 + K.rnd() * 0.3);
        if (k === 0) K.add(g, bx(K, 0.4, h, T * 0.3, 0.02), c, x, y + 0.03 + h / 2, s * T * 0.3, 0, 0, 0, 1, NO); // box
        else if (k === 1) { K.add(g, K.capsule(0.09,  h * 0.6, 2, 6), c, x, y + 0.03 + h * 0.4, s * T * 0.3, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.07, 0.08, 0.07, 0.01), m.white, x, y + 0.03 + h * 0.85, s * T * 0.3, 0, 0, 0, 1, NO); } // bottle
        else { K.add(g, K.sphere(0.15, 8, 6), c, x, y + 0.15, s * T * 0.3, 0, 0, 0, [1, 0.9, 0.9], NO); K.add(g, bx(K, 0.18, 0.05, 0.18, 0.01), m.metalD, x, y + 0.31, s * T * 0.3, 0, 0, 0, 1, NO); } // jar
        if (K.rnd() < 0.5) K.add(g, bx(K, 0.14, 0.07, 0.02, 0.005), m.tag, x, y - 0.015, s * (T / 2 + 0.018), 0, 0, 0, 1, NO); // price tag
      }
    }
  }
  K.add(g, bx(K, L + 0.04, 0.3, T + 0.04, 0.06), m.red, 0, H - 0.15, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) { K.add(g, bx(K, 0.7, 0.2, 0.02, 0.01), m.white, 0, H - 0.15, s * (T / 2 + 0.03), 0, 0, 0, 1, NO); K.add(g, bx(K, 0.08, 0.14, 0.02, 0.005), m.red, -0.2, H - 0.15, s * (T / 2 + 0.045), 0, 0, 0, 1, NO); K.add(g, bx(K, 0.3, 0.06, 0.02, 0.005), m.dark, 0.08, H - 0.15, s * (T / 2 + 0.045), 0, 0, 0, 1, NO); } // aisle sign
}
function column(K, g, b) { // square column: plinth, yellow bumper, red price band with tags, crown, starburst on the inner face
  const m = M(K), R = b.r ?? b.w / 2, W = R * 1.7, f = g.position.z > 0 ? -1 : 1;
  K.add(g, bx(K, W, b.h, W, 0.06), m.white, 0, b.h / 2, 0); K.add(g, bx(K, R * 1.9, 0.25, R * 1.9, 0.06), m.metalD, 0, 0.125, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(K, R * 1.82, 0.8, R * 1.82, 0.06), m.yel, 0, 0.65, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, R * 1.84, 0.06, R * 1.84, 0.02), m.dark, 0, 0.8, 0, 0, 0, 0, 1, NO);
  K.add(g, bx(K, R * 1.9, 1.0, R * 1.9, 0.06), m.red, 0, 3.2, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, R * 1.9, 0.14, R * 1.9, 0.04), m.metalD, 0, b.h - 0.07, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < 4; i++) K.add(g, bx(K, R * 1.2, 0.5, 0.02, 0.01), m.white, Math.sin((i * Math.PI) / 2) * (R * 0.96), 3.2, Math.cos((i * Math.PI) / 2) * (R * 0.96), 0, (i * Math.PI) / 2, 0, 1, NO);
  burst(K, g, m, 0, 1.9, f * (R * 0.85 + 0.02), 0.42, m.yel);
}
function chiller(K, g, b) { // chiller cabinet: white body, red canopy, lit glass doors with shelves of bottles, frames and handles on the inner faces
  const m = M(K), dh = Math.min(2.6, b.h - 0.6), y0 = 1.6 - dh / 2;
  K.add(g, bx(K, b.w, b.h, b.d, 0.08), m.white, 0, b.h / 2, 0); K.add(g, bx(K, b.w + 0.04, 0.5, b.d + 0.04, 0.08), m.red, 0, y0 + dh + 0.35, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, b.w + 0.04, 0.2, b.d + 0.04, 0.05), m.metalD, 0, 0.1, 0, 0, 0, 0, 1, NC);
  inward(g).forEach((ry) => {
    const s = K.sub(g, 0, 0, 0, ry), z = b.d / 2 + 0.012;
    K.add(s, bx(K, b.w * 0.82, dh, 0.03, 0.01), m.glow, 0, 1.6, z, 0, 0, 0, 1, NO);
    for (let i = 1; i < 4; i++) { const y = y0 + (i * dh) / 4; K.add(s, bx(K, b.w * 0.8, 0.03, 0.04, 0.01), m.metalD, 0, y, z + 0.015, 0, 0, 0, 1, NO); for (const u of spread(5, b.w * 0.66)) K.add(s, bx(K, 0.1, 0.3, 0.04, 0.01), m.label[Math.floor(K.rnd() * 6)], u, y + 0.2, z + 0.02, 0, 0, 0, 1, NO); } // shelves + bottles
    for (const u of [-b.w * 0.41, 0, b.w * 0.41]) K.add(s, bx(K, 0.05, dh + 0.06, 0.05, 0.015), m.metalD, u, 1.6, z + 0.02, 0, 0, 0, 1, NC); // door frames
    for (const u of [-0.08, 0.08]) K.add(s, bx(K, 0.04, 0.5, 0.05, 0.015), m.metal, u + b.w * 0.2, 1.6, z + 0.05, 0, 0, 0, 1, NO);
    K.add(s, bx(K, b.w * 0.5, 0.18, 0.03, 0.01), m.white, 0, y0 + dh + 0.35, z + 0.025, 0, 0, 0, 1, NO); K.add(s, bx(K, b.w * 0.34, 0.06, 0.03, 0.01), m.red, 0, y0 + dh + 0.35, z + 0.045, 0, 0, 0, 1, NO); // canopy sign
  });
}
function priceTag(K, g, b) { // price tag: tag board with red banner, white digits, barcode and a punched hole (4 materials: it is rebuilt per moving platform)
  const m = M(K), W = b.w, D = b.d, y = b.h + 0.012;
  K.add(g, bx(K, W, b.h, D, 0.12), m.tag, 0, b.h / 2, 0);
  K.add(g, bx(K, W * 0.5, 0.02, D * 0.25, 0.01), m.red, -W * 0.1, y, -D * 0.22, 0, 0, 0, 1, NO); for (const u of [-0.2, 0, 0.2]) K.add(g, bx(K, W * 0.1, 0.022, D * 0.12, 0.005), m.white, -W * 0.1 + u * W * 0.5, y + 0.002, -D * 0.22, 0, 0, 0, 1, NO); // banner + digits
  for (let i = 0; i < 9; i++) K.add(g, bx(K, i % 3 === 0 ? 0.07 : 0.035, 0.02, D * 0.2, 0.005), m.dark, -W * 0.38 + i * (W * 0.5) / 9, y, D * 0.28, 0, 0, 0, 1, NO); // barcode
  K.add(g, cy(0.16, 0.16, 0.03, 12), m.dark, W * 0.35, y, 0, 0, 0, 0, 1, NO);
}
function crateRamp(K, g, b) { // crate ramp with red edge rails
  const m = M(K), ax = b.ramp.axis === 'z', e = 0.12;
  K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.crate, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, ax ? K.rampGeo(e + 0.02, b.h, b.d + 0.02, b.ramp) : K.rampGeo(b.w + 0.02, b.h, e + 0.02, b.ramp), m.red, ax ? s * (b.w / 2 - e / 2) : 0, b.h / 2 + 0.02, ax ? 0 : s * (b.d / 2 - e / 2), 0, 0, 0, 1, NC);
}
const disc = (K, g, m, x, z, r, sz = 1) => K.add(g, K.cone(r, 0.014, 14), m, x, 0.007, z, 0, 0, 0, [1, 1, sz], NO); // flat puddle

export default {
  bas: [{ make: produce }, square(cans), { make: cereal }],
  haut: [{ make: aisle }],
  pilier: [{ make: column }],
  coin: [{ make: chiller }],
  plateforme: [{ make: priceTag }],
  rampe: [{ make: crateRamp }],
  parkour: [parkour(priceTag), parkour((K, g, b) => cereal(K, g, b, true))],
  solCount: [8, 4], // floor decals per room: [at least, up to this many more]
  mural: [
    { make(K, g) { // freezer: white body, red cap, three lit doors with frames, handles, shelves of products
      const m = M(K); K.add(g, bx(K, 4, 2.4, 0.9, 0.1), m.white, 0, 1.2, 0.45, 0, 0, 0, 1, NC); K.add(g, bx(K, 4.1, 0.3, 0.95, 0.06), m.red, 0, 2.5, 0.47, 0, 0, 0, 1, NC); K.add(g, bx(K, 4.04, 0.2, 0.92, 0.05), m.metalD, 0, 0.1, 0.46, 0, 0, 0, 1, NC);
      for (const x of [-1, 0, 1]) { K.add(g, bx(K, 1.2, 1.7, 0.03, 0.01), m.glow, x * 1.28, 1.35, 0.91, 0, 0, 0, 1, NO); K.add(g, bx(K, 1.3, 1.8, 0.04, 0.02), m.metalD, x * 1.28, 1.35, 0.9, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.05, 0.6, 0.06, 0.02), m.metal, x * 1.28 + 0.5, 1.35, 0.95, 0, 0, 0, 1, NC);
        for (let r = 1; r < 3; r++) { K.add(g, bx(K, 1.1, 0.03, 0.04, 0.01), m.metalD, x * 1.28, 0.8 + r * 0.55, 0.93, 0, 0, 0, 1, NO); for (const u of spread(4, 0.9)) K.add(g, bx(K, 0.18, 0.28, 0.04, 0.01), m.label[Math.floor(K.rnd() * 6)], x * 1.28 + u, 0.8 + r * 0.55 + 0.17, 0.94, 0, 0, 0, 1, NO); } }
      K.add(g, bx(K, 2.2, 0.14, 0.03, 0.01), m.white, 0, 2.5, 0.96, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // sale banner: red board, yellow plate with the word SALE in blocky letters, starbursts at both ends
      const m = M(K); K.add(g, bx(K, 4.2, 1.0, 0.08, 0.04), m.red, 0, 3.8, 0.1, 0, 0, 0, 1, NC); K.add(g, bx(K, 2.9, 0.62, 0.02, 0.01), m.yel, 0, 3.8, 0.15, 0, 0, 0, 1, NO); word(K, g, m.red, 'SALE', 0, 3.8, 0.34, 0.17);
      for (const x of [-1.7, 1.7]) burst(K, g, m, x, 3.8, 0.17, 0.4, m.yel);
    } },
    { make(K, g) { // wall clock: red rim, white face, tick marks, hands
      const m = M(K); K.add(g, cy(0.62, 0.62, 0.12, 24), m.red, 0, 4.4, 0.08, Math.PI / 2, 0, 0, 1, NC); K.add(g, cy(0.52, 0.52, 0.05, 24), m.white, 0, 4.4, 0.14, Math.PI / 2, 0, 0, 1, NO);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; K.add(g, bx(K, 0.04, i % 3 ? 0.06 : 0.1, 0.02, 0.005), m.dark, Math.sin(a) * 0.43, 4.4 + Math.cos(a) * 0.43, 0.17, 0, 0, -a, 1, NO); }
      K.add(g, bx(K, 0.06, 0.42, 0.02, 0.01), m.dark, 0, 4.55, 0.18, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.32, 0.05, 0.02, 0.01), m.dark, 0.13, 4.4, 0.19, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // fresh-fruit poster: framed giant apple with stalk, leaf and a shine, caption bars
      const m = M(K); K.add(g, bx(K, 2.0, 2.4, 0.08, 0.04), m.crateD, 0, 3.0, 0.05, 0, 0, 0, 1, NC); K.add(g, bx(K, 1.76, 2.16, 0.04, 0.01), m.tag, 0, 3.0, 0.1, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.65, 10, 7), m.fruit[0], 0, 3.1, 0.2, 0, 0, 0, [1, 0.95, 0.25], NC); K.add(g, bx(K, 0.07, 0.3, 0.05, 0.02), m.crateD, 0, 3.85, 0.22, 0, 0, 0.2, 1, NO); K.add(g, K.sphere(0.2, 8, 6), m.label[3], 0.2, 3.9, 0.22, 0, 0, 0.5, [1.4, 0.7, 0.2], NO);
      K.add(g, K.sphere(0.12, 8, 6), m.white, -0.3, 3.35, 0.3, 0, 0, 0.5, [0.6, 1.2, 0.2], NO); K.add(g, bx(K, 1.2, 0.1, 0.02, 0.005), m.dark, 0, 2.2, 0.13, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.8, 0.07, 0.02, 0.005), m.red, 0, 2.05, 0.13, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // special-offer chalkboard on an easel look: dark board, scribbles and a red price circle
      const m = M(K); K.add(g, bx(K, 2.4, 1.6, 0.1, 0.05), m.crateD, 0, 2.6, 0.06, 0, 0, 0, 1, NC); K.add(g, bx(K, 2.2, 1.4, 0.04, 0.01), m.dark, 0, 2.6, 0.12, 0, 0, 0, 1, NO);
      for (const [y, w] of [[3.12, 1.2], [2.85, 0.9], [2.6, 1.1]]) K.add(g, bx(K, w, 0.07, 0.02, 0.005), m.white, -0.4 + (w - 1.2) / 2, y, 0.15, 0, 0, 0, 1, NO);
      K.add(g, K.cone(0.38, 0.03, 12), m.red, 0.7, 2.5, 0.15, Math.PI / 2, 0, 0, 1, NO); K.add(g, bx(K, 0.34, 0.08, 0.02, 0.005), m.white, 0.7, 2.5, 0.19, 0, 0, 0, 1, NO); K.add(g, bx(K, 1.4, 0.05, 0.02, 0.005), m.tag, -0.2, 2.2, 0.15, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 1.0, make(K, g) { const m = M(K); disc(K, g, m.glass, 0.1, 0.5, 0.7, 0.6); for (const s of [-1, 1]) K.add(g, bx(K, 0.7, 1.1, 0.06, 0.02), m.yel, 0, 0.5, s * 0.22, s * 0.2, 0, 0, 1, NC); K.add(g, bx(K, 0.5, 0.04, 0.02, 0.005), m.dark, 0, 0.7, 0.28, 0.2, 0, 0, 1, NO); K.add(g, K.sphere(0.1, 8, 6), m.blue, 0, 0.5, 0.27, 0.2, 0, 0, [0.8, 1.2, 0.3], NO); } }, // wet-floor sign + puddle
    { r: 1.0, make(K, g) { const m = M(K); for (let i = 0; i < 4; i++) { const x = (K.rnd() - 0.5) * 1.4, z = (K.rnd() - 0.5) * 1.4; K.add(g, K.sphere(0.2, 10, 7), m.fruit[i], x, 0.2, z); K.add(g, bx(K, 0.02, 0.07, 0.02, 0.005), m.crateD, x, 0.42, z, 0, 0, 0, 1, NO); if (i % 2) K.add(g, K.sphere(0.06, 5, 4), m.label[3], x + 0.05, 0.45, z, 0, 0, 0, [1, 0.3, 0.6], NO); } } }, // dropped fruit
    { r: 1.0, make(K, g) { const m = M(K); K.add(g, bx(K, 1.0, 0.5, 0.7, 0.06), m.red, 0, 0.25, 0); K.add(g, K.torus(0.35, 0.04, 6, 14, Math.PI), m.metalD, 0, 0.5, 0, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.18, 10, 7), m.fruit[2], 0.2, 0.52, 0.1, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.16, 10, 7), m.fruit[0], -0.2, 0.5, -0.05, 0, 0, 0, 1, NO); K.add(g, bx(K, 1.02, 0.04, 0.72, 0.01), m.metalD, 0, 0.47, 0, 0, 0, 0, 1, NO); } }, // basket
    { r: 1.3, make(K, g) { // shopping cart: wire basket, frame, handle, four casters
      const m = M(K); K.add(g, bx(K, 1.1, 0.06, 0.65, 0.02), m.metalD, 0, 0.35, 0, 0, 0, 0, 1, NC);
      for (const s of [-1, 1]) { K.add(g, bx(K, 1.1, 0.04, 0.04, 0.01), m.metal, 0, 0.9, s * 0.32, 0, 0, 0, 1, NC); K.add(g, bx(K, 1.1, 0.04, 0.04, 0.01), m.metal, 0, 0.62, s * 0.32, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.04, 0.04, 0.65, 0.01), m.metal, s * 0.55, 0.9, 0, 0, 0, 0, 1, NC); for (const x of spread(6, 1.0)) K.add(g, bx(K, 0.02, 0.55, 0.02, 0.005), m.metalD, x, 0.62, s * 0.32, 0, 0, 0, 1, NO); }
      K.add(g, bx(K, 0.05, 0.5, 0.65, 0.015), m.red, -0.62, 0.9, 0, 0, 0, -0.2, 1, NC); K.add(g, bx(K, 0.04, 0.35, 0.04, 0.01), m.metal, -0.55, 0.2, 0, 0, 0, 0, 1, NO);
      for (const x of [-1, 1]) for (const z of [-1, 1]) K.add(g, K.sphere(0.07, 6, 5), m.dark, x * 0.45, 0.07, z * 0.25, 0, 0, 0, 1, NO);
    } },
    { r: 1.4, make(K, g) { const m = M(K); K.add(g, bx(K, 2.0, 0.03, 1.2, 0.03), m.red, 0, 0.015, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, 1.8, 0.034, 1.0, 0.02), m.dark, 0, 0.017, 0, 0, 0, 0, 1, NO); for (const x of spread(5, 1.2)) K.add(g, bx(K, 0.1, 0.036, 0.7, 0.005), m.red, x, 0.019, 0, 0, 0, 0, 1, NO); } }, // doormat
    { r: 2.6, make(K, g) { const m = M(K); for (const z of [-0.5, 0.5]) K.add(g, bx(K, 5, 0.012, 0.1, 0.004), m.tag, 0, 0.008, z, 0, 0, 0, 1, NO); for (let i = 0; i < 7; i++) K.add(g, bx(K, 0.5, 0.012, 0.08, 0.004), m.tag, -2.1 + i * 0.7, 0.008, 0, 0, (i % 2 ? 1 : -1) * 0.7, 0, 1, NO); } }, // queue line marking
  ],
};
