// Bureau: giant desks with a monitor, keyboard, lamp, papers and a mug, grey filing cabinets with label holders, photocopiers,
// fabric cubicle partitions with corkboards and sticky notes, binder bookcases, round columns with a notice board, floating
// desk tops, carpet ramps with orange binding, printers as parkour; whiteboards, clocks, blinds, posters and a water cooler
// on the walls; rolling chairs, loose sheets, rugs, bins and boxes on the floor.
import * as THREE from 'three';
import { roundedBox } from '../../render/Style.js';
import { NC, NO, alongX, long, parkour, spread, square } from './common.js';
const bx = (K, w, h, d, r) => { const m = Math.min(w, h, d); return r <= 0.02 || m < 0.18 ? K.box(w, h, d, 0.02) : roundedBox(w, h, d, r, m < 0.3 ? 1 : 2); }; // bevel by size: thin trims plain, small parts chamfered, big volumes rounded
const cy = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg); // plain cylinder for small parts (a rounded one costs 6x the triangles)

const M = (K) => ({
  wood: K.m('#B98052', { pattern: 'planks', scale: 0.35 }), woodD: K.m('#8E5E38'), grey: K.m('#B8C4D8', { rim: 0.2 }), greyD: K.m('#8894AA'), dark: K.m('#2A3050'),
  fabric: K.m('#48C0A0', { pattern: 'dots', color2: '#3AAA8C', scale: 0.12 }), trim: K.m('#DDE3F2'), white: K.m('#FFFFFF', { rim: 0.1 }), paper: K.f('#FFFFFF'),
  note: [K.f('#FFE45A'), K.f('#FF8A5B'), K.f('#7FD8FF')], binder: [K.m('#FF8A5B'), K.m('#5B7CFA'), K.m('#48C0A0'), K.m('#FFD04A'), K.m('#E85A8A')],
  carpet: K.m('#6F82D8', { pattern: 'dots', color2: '#6275CC', scale: 0.2 }), mug: K.m('#FF5B4A'), rug: K.m('#FF8A5B', { pattern: 'stripes', color2: '#FFB08A', scale: 0.3 }),
});

function plant(K, g, m, x, y, z, s = 1) { // potted plant: pot and a cluster of leaf balls
  K.add(g, cy(0.13 * s, 0.1 * s, 0.2 * s, 10), m.binder[0], x, y + 0.1 * s, z, 0, 0, 0, 1, NC);
  for (const [dx, dy, r] of [[0, 0.34, 0.17], [-0.12, 0.26, 0.12], [0.12, 0.28, 0.13]]) K.add(g, K.sphere(r * s, 10, 7), m.fabric, x + dx * s, y + dy * s, z, 0, 0, 0, 1, NC);
}
function desk(K, g, b) { // oversized desk: top, drawer pedestals with fronts and pulls, monitor, keyboard, lamp, papers and a mug on top
  const m = M(K), { L, T } = alongX(g, b), H = b.h, pw = Math.min(0.9, L * 0.28), ph = H - 0.16, dh = ph / 3, mx = -L * 0.15, mz = -T * 0.1;
  K.add(g, bx(K, L, 0.16, T, 0.05), m.wood, 0, H - 0.08, 0);
  for (const s of [-1, 1]) {
    const px = s * (L / 2 - pw / 2 - 0.05);
    K.add(g, bx(K, pw, ph, T * 0.92, 0.06), m.woodD, px, ph / 2, 0);
    for (let i = 0; i < 3; i++) for (const f of [-1, 1]) {
      const y = (i + 0.5) * dh, z = f * (T * 0.46 + 0.012);
      K.add(g, bx(K, pw * 0.84, dh - 0.07, 0.03, 0.01), m.wood, px, y, z, 0, 0, 0, 1, NO); // drawer front
      K.add(g, bx(K, pw * 0.3, 0.05, 0.04, 0.01), m.trim, px, y + dh * 0.12, z + f * 0.025, 0, 0, 0, 1, NO); // pull
    }
  }
  K.add(g, bx(K, L - 2 * pw - 0.2, ph * 0.6, 0.08, 0.03), m.woodD, 0, H - 0.16 - ph * 0.3, 0, 0, 0, 0, 1, { ink: false });
  K.add(g, bx(K, 0.34, 0.04, 0.22, 0.01), m.greyD, mx, H + 0.02, mz, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.08, 0.26, 0.05, 0.02), m.greyD, mx, H + 0.17, mz, 0, 0, 0, 1, NO); // monitor stand
  K.add(g, bx(K, 0.95, 0.6, 0.08, 0.03), m.dark, mx, H + 0.6, mz, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.84, 0.48, 0.02, 0.01), m.note[2], mx, H + 0.6, mz + 0.045, 0, 0, 0, 1, NO);
  [0.16, 0.3, 0.22].forEach((h, i) => K.add(g, bx(K, 0.1, h, 0.02, 0.005), m.note[(i + 1) % 3], mx - 0.2 + i * 0.2, H + 0.4 + h / 2, mz + 0.056, 0, 0, 0, 1, NO)); // chart on screen
  K.add(g, bx(K, 0.62, 0.04, 0.2, 0.01), m.white, mx, H + 0.02, mz + 0.42, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.54, 0.012, 0.12, 0.005), m.greyD, mx, H + 0.045, mz + 0.42, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.05, 8, 6), m.white, mx + 0.5, H + 0.03, mz + 0.42, 0, 0, 0, [1, 0.6, 1.4], NO); // keyboard + mouse
  K.add(g, bx(K, 0.9, 0.02, 0.65, 0.005), m.paper, L * 0.12, H + 0.01, T * 0.12, 0, 0.2, 0, 1, NO); K.add(g, bx(K, 0.9, 0.02, 0.65, 0.005), m.paper, L * 0.12 + 0.05, H + 0.03, T * 0.12 + 0.03, 0, -0.1, 0, 1, NO);
  K.add(g, cy(0.14, 0.12, 0.26, 12), m.mug, L * 0.26, H + 0.13, -T * 0.2, 0, 0, 0, 1, NC); K.add(g, K.torus(0.07, 0.025, 5, 10), m.mug, L * 0.26 + 0.17, H + 0.13, -T * 0.2, 0, 0, 0, 1, NO); // mug + handle
  K.add(g, bx(K, 0.24, 0.04, 0.24, 0.01), m.dark, L * 0.4, H + 0.02, -T * 0.25, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.04, 0.5, 0.04, 0.01), m.dark, L * 0.4, H + 0.27, -T * 0.25, 0, 0, 0, 1, NO); K.add(g, K.cone(0.17, 0.22, 10), m.binder[0], L * 0.4 - 0.1, H + 0.55, -T * 0.25, 0, 0, 0.4, 1, NC); // desk lamp
}
function cabinet(K, g, b) { // filing cabinet: plinth and crown, drawer fronts with label holders and pulls, sometimes a plant on top
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(2, Math.round(H / 0.6)), cols = Math.max(1, Math.round(L / 1.2)), dh = (H - 0.3) / n;
  K.add(g, bx(K, L, H - 0.1, T, 0.08), m.grey, 0, 0.1 + (H - 0.1) / 2, 0);
  K.add(g, bx(K, L - 0.1, 0.1, T - 0.1, 0.02), m.dark, 0, 0.05, 0, 0, 0, 0, 1, NO); K.add(g, bx(K, L + 0.04, 0.08, T + 0.04, 0.03), m.greyD, 0, H - 0.04, 0, 0, 0, 0, 1, NC);
  for (const x of spread(cols, L)) for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
    const y = 0.18 + (i + 0.5) * dh, z = s * (T / 2 + 0.012);
    K.add(g, bx(K, L / cols - 0.14, dh - 0.1, 0.03, 0.01), m.trim, x, y, z, 0, 0, 0, 1, NO);
    K.add(g, bx(K, 0.24, 0.08, 0.035, 0.01), m.paper, x, y + dh * 0.16, z + s * 0.012, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.2, 0.02, 0.04, 0.005), m.note[(i + 1) % 3], x, y + dh * 0.16, z + s * 0.013, 0, 0, 0, 1, NO); // label holder
    K.add(g, bx(K, 0.34, 0.05, 0.05, 0.02), m.greyD, x, y - dh * 0.14, z + s * 0.03, 0, 0, 0, 1, NO); // pull
  }
  if (K.rnd() < 0.6) plant(K, g, m, L * 0.28, H, 0);
}
function copier(K, g, b) { // photocopier: body, scanner lid, control panel with screen and buttons, paper trays, orange stripe
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, bx(K, L, H - 0.14, T, 0.12), m.white, 0, (H - 0.14) / 2, 0);
  K.add(g, bx(K, L * 0.9, 0.14, T * 0.85, 0.05), m.greyD, 0, H - 0.07, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(K, L * 0.4, 0.02, T * 0.5, 0.005), m.paper, -L * 0.2, H + 0.01, 0, 0, 0.15, 0, 1, NO); // sheets on the lid
  for (const s of [-1, 1]) {
    K.add(g, bx(K, L - 0.1, 0.05, 0.03, 0.01), m.binder[0], 0, H - 0.2, s * (T / 2 + 0.012), 0, 0, 0, 1, NO); // orange stripe
    for (let i = 0; i < 2; i++) { K.add(g, bx(K, L * 0.76, 0.28, 0.04, 0.02), m.trim, 0, 0.25 + i * 0.4, s * (T / 2 + 0.015), 0, 0, 0, 1, NO); K.add(g, bx(K, 0.3, 0.05, 0.05, 0.02), m.greyD, 0, 0.3 + i * 0.4, s * (T / 2 + 0.04), 0, 0, 0, 1, NO); } // paper tray + pull
  }
  K.add(g, bx(K, 0.7, 0.34, 0.04, 0.02), m.dark, L * 0.28, H - 0.42, T / 2 + 0.015, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.4, 0.2, 0.02, 0.01), m.note[2], L * 0.28 - 0.1, H - 0.38, T / 2 + 0.04, 0, 0, 0, 1, NO); // control panel + screen
  for (let i = 0; i < 3; i++) K.add(g, bx(K, 0.07, 0.07, 0.03, 0.01), [m.binder[0], m.fabric, m.mug][i], L * 0.28 - 0.2 + i * 0.12, H - 0.54, T / 2 + 0.04, 0, 0, 0, 1, NO);
}
function cubicle(K, g, b) { // fabric partition: metal trim and end posts, a corkboard with pinned notes and a calendar on both faces
  const m = M(K), { L, T } = alongX(g, b), H = b.h, cy = Math.min(H - 1.0, 1.9), cw = Math.min(1.5, L * 0.4);
  K.add(g, bx(K, L, H - 0.1, T * 0.7, 0.08), m.fabric, 0, (H - 0.1) / 2, 0);
  K.add(g, bx(K, L + 0.04, 0.12, T, 0.05), m.trim, 0, H - 0.06, 0, 0, 0, 0, 1, NC);
  for (const e of [-1, 1]) K.add(g, bx(K, 0.14, H - 0.06, T, 0.04), m.trim, e * (L / 2 - 0.07), (H - 0.06) / 2, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) {
    const z = s * (T * 0.35 + 0.01), cx = -L * 0.2;
    K.add(g, bx(K, cw + 0.1, 0.9, 0.03, 0.01), m.woodD, cx, cy, z, 0, 0, 0, 1, NO); K.add(g, bx(K, cw, 0.8, 0.035, 0.01), m.wood, cx, cy, z + s * 0.004, 0, 0, 0, 1, NO); // corkboard
    for (let i = 0; i < 3; i++) { const nx = cx + (i - 1) * cw * 0.3, ny = cy + (i % 2 ? 0.12 : -0.1); K.add(g, bx(K, 0.3, 0.3, 0.02, 0.01), m.note[i % 3], nx, ny, z + s * 0.025, 0, 0, (K.rnd() - 0.5) * 0.3, 1, NO); K.add(g, K.sphere(0.035, 6, 4), m.mug, nx, ny + 0.1, z + s * 0.04, 0, 0, 0, 1, NO); }
    K.add(g, bx(K, 0.45, 0.55, 0.02, 0.01), m.paper, L * 0.25, cy, z, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.45, 0.12, 0.025, 0.01), m.note[1], L * 0.25, cy + 0.215, z + s * 0.004, 0, 0, 0, 1, NO); // calendar
    for (let r = 0; r < 2; r++) K.add(g, bx(K, 0.34, 0.03, 0.025, 0.005), m.greyD, L * 0.25, cy - 0.04 - r * 0.14, z + s * 0.004, 0, 0, 0, 1, NO);
    K.add(g, bx(K, 0.3, 0.3, 0.02, 0.01), m.note[Math.floor(K.rnd() * 3)], (K.rnd() - 0.5) * (L - 1.2), 1.1 + K.rnd() * 0.2, z, 0, 0, (K.rnd() - 0.5) * 0.3, 1, NO);
  }
}
function binders(K, g, b) { // bookcase: wooden frame with shelf boards, binders with spine labels, a lying stack
  const m = M(K), { L, T } = alongX(g, b), H = b.h, lv = Math.max(2, Math.floor(H / 1.0));
  K.add(g, bx(K, L, H, T, 0.05), m.woodD, 0, H / 2, 0);
  K.add(g, bx(K, L + 0.06, 0.12, T + 0.06, 0.04), m.wood, 0, H - 0.06, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, L + 0.02, 0.14, T + 0.02, 0.04), m.wood, 0, 0.07, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < lv; i++) {
    const y = 0.1 + (i * H) / lv, bh = H / lv - 0.2;
    if (i > 0) K.add(g, bx(K, L + 0.02, 0.07, T + 0.04, 0.02), m.wood, 0, y - 0.05, 0, 0, 0, 0, 1, NC);
    for (const s of [-1, 1]) for (const [j, x] of spread(Math.max(3, Math.round(L / 0.3)), L - 0.2).entries()) {
      const h = bh * (0.8 + K.rnd() * 0.15), z = s * (T / 2 - 0.02);
      K.add(g, bx(K, 0.24, h, 0.08, 0.02), m.binder[Math.floor(K.rnd() * 5)], x, y + h / 2 + 0.05, z, 0, 0, 0, 1, NO);
      if (j % 2 === 0) K.add(g, bx(K, 0.1, 0.12, 0.01, 0.005), m.paper, x, y + h * 0.6, z + s * 0.041, 0, 0, 0, 1, NO); // spine label
    }
  }
}
function column(K, g, b) { // round column: moulding rings, orange band, notice board with pins
  const m = M(K), R = b.r ?? b.w / 2, H = b.h;
  K.add(g, K.cyl(R, R, H, 0.05, 20), m.trim, 0, H / 2, 0);
  K.add(g, cy(R * 1.04, R * 1.04, 0.3, 14), m.woodD, 0, 0.15, 0, 0, 0, 0, 1, NC);
  K.add(g, K.torus(R * 1.02, 0.07, 5, 24), m.wood, 0, 0.34, 0, Math.PI / 2, 0, 0, 1, NC); K.add(g, K.torus(R * 1.02, 0.07, 5, 24), m.wood, 0, H - 0.1, 0, Math.PI / 2, 0, 0, 1, NC); K.add(g, K.torus(R * 1.02, 0.05, 5, 24), m.binder[0], 0, 1.1, 0, Math.PI / 2, 0, 0, 1, NC);
  K.add(g, bx(K, R * 1.3 + 0.1, 1.0, 0.05, 0.02), m.woodD, 0, 1.9, R + 0.01, 0, 0, 0, 1, NC); K.add(g, bx(K, R * 1.3, 0.9, 0.06, 0.02), m.wood, 0, 1.9, R + 0.025, 0, 0, 0, 1, NO);
  for (let i = 0; i < 3; i++) { K.add(g, bx(K, 0.25, 0.3, 0.02, 0.01), m.note[i], (i - 1) * 0.35 * R, 1.9 + (i % 2 ? 0.08 : -0.06), R + 0.07, 0, 0, (i - 1) * 0.1, 1, NO); K.add(g, K.sphere(0.03, 6, 4), m.mug, (i - 1) * 0.35 * R, 2.02 + (i % 2 ? 0.08 : -0.06), R + 0.09, 0, 0, 0, 1, NO); }
}
function pillar(K, g, b) { // corner pillar: crown, wooden plinth, exit sign and a thermostat on the inner faces
  const m = M(K), fz = g.position.z > 0 ? -1 : 1, fx = g.position.x > 0 ? -1 : 1;
  K.add(g, bx(K, b.w, b.h, b.d, 0.08), m.trim, 0, b.h / 2, 0); K.add(g, bx(K, b.w + 0.04, 1.1, b.d + 0.04, 0.04), m.wood, 0, 0.55, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(K, b.w + 0.04, 0.18, b.d + 0.04, 0.04), m.woodD, 0, 1.16, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, b.w + 0.04, 0.2, b.d + 0.04, 0.05), m.trim, 0, b.h - 0.1, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(K, 0.6, 0.26, 0.05, 0.02), m.fabric, 0, b.h - 0.6, fz * (b.d / 2 + 0.025), 0, 0, 0, 1, NC); K.add(g, bx(K, 0.4, 0.05, 0.03, 0.01), m.paper, 0, b.h - 0.6, fz * (b.d / 2 + 0.05), 0, 0, 0, 1, NO); K.add(g, bx(K, 0.05, 0.12, 0.03, 0.01), m.paper, -0.2 * fz, b.h - 0.6, fz * (b.d / 2 + 0.05), 0, 0, 0, 1, NO);
  K.add(g, bx(K, 0.16, 0.2, 0.05, 0.02), m.white, fx * (b.w / 2 + 0.025), 1.9, 0.2, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.04, 6, 4), m.binder[0], fx * (b.w / 2 + 0.055), 1.93, 0.2, 0, 0, 0, 1, NO);
}
function deskTop(K, g, b) { // floating desk top: wooden edge, laptop and papers (3 materials + screen: it is rebuilt per moving platform)
  const m = M(K); K.add(g, bx(K, b.w, b.h, b.d, 0.08), m.wood, 0, b.h / 2, 0); K.add(g, bx(K, b.w - 0.1, 0.1, b.d - 0.1, 0.03), m.wood, 0, 0.06, 0, 0, 0, 0, 1, NO);
  const x = b.w * 0.1, z = -b.d * 0.15; K.add(g, bx(K, 0.7, 0.04, 0.5, 0.01), m.paper, x, b.h + 0.02, z, 0, 0.2, 0, 1, NO); K.add(g, bx(K, 0.7, 0.45, 0.03, 0.01), m.note[2], x - 0.05, b.h + 0.27, z - 0.22, -0.2, 0.2, 0, 1, NO); // laptop
  K.add(g, bx(K, 0.8, 0.02, 0.6, 0.005), m.paper, -b.w * 0.25, b.h + 0.01, b.d * 0.15, 0, 0.5, 0, 1, NO); K.add(g, bx(K, 0.7, 0.02, 0.5, 0.005), m.paper, -b.w * 0.2, b.h + 0.03, b.d * 0.2, 0, 0.2, 0, 1, NO);
}
function printer(K, g, b) { // printer: body, lid, paper tray, screen and out-feed (white, paper, screen only: it is rebuilt per moving platform)
  const m = M(K); K.add(g, bx(K, b.w, b.h, b.d, 0.12), m.white, 0, b.h / 2, 0); K.add(g, bx(K, b.w * 0.9, 0.08, b.d * 0.9, 0.03), m.white, 0, b.h - 0.04, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(K, b.w * 0.6, 0.03, b.d * 0.5, 0.01), m.paper, 0, b.h + 0.02, 0.2, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) { K.add(g, bx(K, b.w * 0.7, b.h * 0.22, 0.04, 0.02), m.white, 0, b.h * 0.2, s * (b.d / 2 + 0.01), 0, 0, 0, 1, NC); K.add(g, bx(K, b.w * 0.8, 0.05, 0.03, 0.01), m.note[2], 0, b.h * 0.72, s * (b.d / 2 + 0.01), 0, 0, 0, 1, NO); }
  K.add(g, bx(K, b.w * 0.3, b.h * 0.16, 0.03, 0.01), m.note[2], b.w * 0.2, b.h * 0.5, b.d / 2 + 0.015, 0, 0, 0, 1, NO);
}
function carpetRamp(K, g, b) { // carpet ramp with orange binding along the edges
  const m = M(K), ax = b.ramp.axis === 'z', e = 0.12;
  K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.carpet, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, ax ? K.rampGeo(e + 0.02, b.h, b.d + 0.02, b.ramp) : K.rampGeo(b.w + 0.02, b.h, e + 0.02, b.ramp), m.rug, ax ? s * (b.w / 2 - e / 2) : 0, b.h / 2 + 0.015, ax ? 0 : s * (b.d / 2 - e / 2), 0, 0, 0, 1, NC);
}

export default {
  bas: [{ make: desk }, { make: cabinet }, square(copier)],
  haut: [{ make: cubicle }, { make: binders }],
  pilier: [{ make: column }],
  coin: [{ make: pillar }],
  plateforme: [{ make: deskTop }],
  rampe: [{ make: carpetRamp }],
  parkour: [parkour(printer), parkour(deskTop)],
  solCount: [8, 4], // floor decals per room: [at least, up to this many more]
  mural: [
    { make(K, g) { // whiteboard with a title, a bar chart, a line chart and a marker tray
      const m = M(K); K.add(g, bx(K, 3.8, 2.2, 0.1, 0.04), m.greyD, 0, 2.6, 0.06, 0, 0, 0, 1, NC); K.add(g, bx(K, 3.5, 1.9, 0.04, 0.01), m.paper, 0, 2.6, 0.12, 0, 0, 0, 1, NO);
      K.add(g, bx(K, 1.4, 0.14, 0.02, 0.005), m.dark, -1.0, 3.38, 0.15, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.5, 0.14, 0.02, 0.005), m.binder[0], -0.1, 3.38, 0.15, 0, 0, 0, 1, NO); // title
      [0.5, 0.9, 0.7, 1.3].forEach((h, i) => K.add(g, bx(K, 0.4, h, 0.02, 0.01), [m.note[1], m.note[2], m.note[0], m.note[1]][i], -1.2 + i * 0.6, 1.9 + h / 2, 0.15, 0, 0, 0, 1, NO));
      K.add(g, bx(K, 1.3, 0.03, 0.02, 0.005), m.greyD, -0.05, 1.86, 0.15, 0, 0, 0, 1, NO); let px = 0.9, py = 2.0; for (let i = 0; i < 4; i++) { const nx = px + 0.3, ny = py + [0.3, -0.1, 0.5, 0.25][i]; K.add(g, bx(K, Math.hypot(0.3, ny - py) + 0.04, 0.05, 0.02, 0.01), m.mug, (px + nx) / 2, (py + ny) / 2, 0.15, 0, 0, Math.atan2(ny - py, 0.3), 1, NO); px = nx; py = ny; }
      K.add(g, bx(K, 3.2, 0.06, 0.16, 0.02), m.greyD, 0, 1.45, 0.16, 0, 0, 0, 1, NC); for (let i = 0; i < 3; i++) K.add(g, cy(0.03, 0.03, 0.3, 6), [m.mug, m.dark, m.fabric][i], -0.6 + i * 0.35, 1.52, 0.16, 0, 0, Math.PI / 2, 1, NO);
    } },
    { make(K, g) { // wall clock: thick orange rim, tick marks, hands and a red second hand
      const m = M(K); K.add(g, cy(0.6, 0.6, 0.12, 24), m.binder[0], 0, 3.6, 0.08, Math.PI / 2, 0, 0, 1, NC); K.add(g, cy(0.5, 0.5, 0.05, 24), m.white, 0, 3.6, 0.14, Math.PI / 2, 0, 0, 1, NO);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; K.add(g, bx(K, 0.04, i % 3 ? 0.06 : 0.1, 0.02, 0.005), m.dark, Math.sin(a) * 0.42, 3.6 + Math.cos(a) * 0.42, 0.17, 0, 0, -a, 1, NO); }
      K.add(g, bx(K, 0.06, 0.4, 0.02, 0.01), m.dark, 0, 3.78, 0.18, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.3, 0.05, 0.02, 0.01), m.dark, 0.12, 3.6, 0.19, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.02, 0.42, 0.02, 0.005), m.mug, -0.1, 3.5, 0.2, 0, 0, 0.5, 1, NO);
    } },
    { make(K, g) { // window with blinds: sky, frame, valance, slats, pull cord
      const m = M(K); K.add(g, bx(K, 3.6, 2.8, 0.1, 0.04), m.trim, 0, 2.7, 0.05, 0, 0, 0, 1, NC); K.add(g, bx(K, 3.3, 2.5, 0.04, 0.01), m.note[2], 0, 2.7, 0.1, 0, 0, 0, 1, NO);
      K.add(g, bx(K, 3.5, 0.18, 0.22, 0.05), m.grey, 0, 4.0, 0.14, 0, 0, 0, 1, NC);
      for (let i = 0; i < 9; i++) K.add(g, bx(K, 3.2, 0.16, 0.06, 0.02), m.trim, 0, 1.6 + i * 0.26 + 0.35, 0.16, 0.25, 0, 0, 1, NC);
      K.add(g, bx(K, 0.02, 1.0, 0.02, 0.005), m.greyD, 1.5, 3.2, 0.2, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.06, 6, 4), m.binder[0], 1.5, 2.65, 0.2, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // framed motivational poster: sun over mountains and caption bars
      const m = M(K); K.add(g, bx(K, 1.9, 2.5, 0.1, 0.04), m.woodD, 0, 2.7, 0.05, 0, 0, 0, 1, NC); K.add(g, bx(K, 1.6, 2.2, 0.04, 0.01), m.note[2], 0, 2.7, 0.1, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.28, 10, 7), m.note[0], 0.3, 3.15, 0.13, 0, 0, 0, [1, 1, 0.2], NO); K.add(g, K.cone(0.7, 0.9, 4), m.fabric, -0.3, 2.55, 0.14, 0, Math.PI / 4, 0, [1, 1, 0.2], NO); K.add(g, K.cone(0.55, 0.7, 4), m.fabric, 0.35, 2.45, 0.15, 0, Math.PI / 4, 0, [1, 1, 0.2], NO);
      K.add(g, bx(K, 1.2, 0.1, 0.02, 0.005), m.dark, 0, 1.95, 0.13, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.8, 0.07, 0.02, 0.005), m.binder[0], 0, 1.78, 0.13, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // water cooler: white body, blue jug, taps and a cup stack
      const m = M(K); K.add(g, bx(K, 0.9, 1.3, 0.7, 0.1), m.white, 0, 0.65, 0.4); K.add(g, bx(K, 0.6, 0.22, 0.05, 0.02), m.greyD, 0, 0.85, 0.76, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.07, 6, 4), m.mug, -0.12, 1.0, 0.77, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.07, 6, 4), m.note[2], 0.12, 1.0, 0.77, 0, 0, 0, 1, NO);
      K.add(g, cy(0.28, 0.3, 0.8, 14), m.note[2], 0, 1.7, 0.4, 0, 0, 0, 1, NC); K.add(g, cy(0.1, 0.1, 0.14, 10), m.white, 0, 2.15, 0.4, 0, 0, 0, 1, NC);
      K.add(g, cy(0.08, 0.06, 0.2, 8), m.paper, 0.65, 0.7, 0.4, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 1.2, make(K, g) { // rolling office chair: star base with casters, gas lift, cushion, backrest, armrests
      const m = M(K); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; K.add(g, bx(K, 0.6, 0.06, 0.1, 0.02), m.dark, Math.cos(a) * 0.3, 0.1, Math.sin(a) * 0.3, 0, -a, 0, 1, NO); K.add(g, K.sphere(0.07, 6, 5), m.dark, Math.cos(a) * 0.58, 0.07, Math.sin(a) * 0.58, 0, 0, 0, 1, NO); }
      K.add(g, cy(0.05, 0.05, 0.5, 8), m.greyD, 0, 0.35, 0, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.9, 0.16, 0.9, 0.07), m.fabric, 0, 0.66, 0); K.add(g, bx(K, 0.9, 0.9, 0.14, 0.07), m.fabric, 0, 1.15, -0.4);
      for (const s of [-1, 1]) { K.add(g, bx(K, 0.08, 0.3, 0.08, 0.02), m.dark, s * 0.5, 0.82, 0, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.1, 0.07, 0.5, 0.03), m.dark, s * 0.5, 0.98, 0, 0, 0, 0, 1, NO); }
    } },
    { r: 1.6, make(K, g) { const m = M(K); for (let i = 0; i < 6; i++) K.add(g, bx(K, 0.6, 0.01, 0.8, 0.003), m.paper, (K.rnd() - 0.5) * 2, 0.006 + i * 0.002, (K.rnd() - 0.5) * 2, 0, K.rnd() * 3, 0, 1, NO); K.add(g, K.cone(0.16, 0.5, 3), m.note[2], 0.3, 0.03, 0.2, Math.PI / 2, 0, 0, [1, 1, 0.3], NO); } }, // loose sheets and a paper plane
    { r: 2.0, make(K, g) { const m = M(K); K.add(g, cy(1.8, 1.8, 0.03, 32), m.rug, 0, 0.015, 0, 0, 0, 0, 1, NO); K.add(g, cy(1.35, 1.35, 0.034, 32), m.trim, 0, 0.017, 0, 0, 0, 0, 1, NO); K.add(g, cy(0.85, 0.85, 0.038, 24), m.binder[0], 0, 0.019, 0, 0, 0, 0, 1, NO); } }, // round rug with rings
    { r: 0.9, make(K, g) { const m = M(K); K.add(g, cy(0.3, 0.24, 0.55, 14), m.greyD, 0, 0.275, 0, 0, 0, 0, 1, NC); for (const [x, z, y] of [[0.4, 0.2, 0.1], [0.55, -0.1, 0.1], [-0.4, 0.45, 0.1]]) K.add(g, K.sphere(0.12, 7, 5), m.paper, x, y, z, 0, 0, 0, 1, NC); } }, // wastebasket with crumpled paper
    { r: 1.1, make(K, g) { const m = M(K); K.add(g, bx(K, 0.9, 0.55, 0.7, 0.06), m.wood, 0, 0.275, 0, 0, 0.2, 0, 1, NC); K.add(g, bx(K, 0.5, 0.45, 0.5, 0.05), m.wood, 0.15, 0.775, 0.05, 0, -0.3, 0, 1, NC); K.add(g, bx(K, 0.14, 0.02, 0.72, 0.005), m.paper, 0, 0.56, 0, 0, 0.2, 0, 1, NO); } }, // moving boxes
    { r: 2.0, make(K, g) { const m = M(K); for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) if (x * z > 0) K.add(g, bx(K, 0.96, 0.012, 0.96, 0.004), m.carpet, x, 0.006, z, 0, 0, 0, 1, NO); } }, // carpet tiles
  ],
};
