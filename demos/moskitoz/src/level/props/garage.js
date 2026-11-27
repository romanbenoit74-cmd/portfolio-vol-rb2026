// Garage: red tool chests with chrome pulls, white-wall tyre stacks, amber-beam metal shelving with paint cans, pegboards with
// tools, steel I-beams, concrete corner columns with hazard stripes and a fuse box, wooden pallets, toolboxes and diamond-plate
// ramps; pegboards, a roller door, a hose reel and an extinguisher on the walls; oil stains, parking bays, drain grates, rubber
// mats and a spilled paint can on the floor.
import * as THREE from 'three';
import { roundedBox } from '../../render/Style.js';
import { NC, NO, alongX, long, parkour, spread, square } from './common.js';
const bx = (K, w, h, d, r) => { const m = Math.min(w, h, d); return r <= 0.02 || m < 0.18 ? K.box(w, h, d, 0.02) : roundedBox(w, h, d, r, m < 0.3 ? 1 : 2); }; // bevel by size: thin trims plain, small parts chamfered, big volumes rounded
const cy = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg); // plain cylinder for small parts (a rounded one costs 6x the triangles)

const M = (K) => ({
  red: K.m('#EF5A4A', { rim: 0.15 }), redD: K.m('#C8433A'), steel: K.m('#C9D3DE', { rim: 0.25 }), steelD: K.m('#8E9AAA'), dark: K.m('#2E3440'),
  tyre: K.m('#3A3D46', { rim: 0.1 }), hub: K.m('#B8C2CE'), wood: K.m('#E0A860', { pattern: 'planks', scale: 0.3 }), woodD: K.m('#B98049'),
  peg: K.m('#D9B27A', { pattern: 'dots', color2: '#8C6A3E', scale: 0.14 }), yel: K.m('#FFB21F', { pattern: 'stripes', color2: '#2E3440', scale: 0.35 }),
  conc: K.m('#B5C1D1'), blue: K.m('#5AA0E8'), paint: [K.m('#5AA0E8'), K.m('#FFB21F'), K.m('#7BD86A'), K.m('#EF5A4A')], plate: K.m('#AEB9C6', { pattern: 'grid', color2: '#8E9AAA', scale: 0.25 }),
  oil: K.f('#454C5C'), line: K.f('#FFD23F'), door: K.m('#D6DEE8', { pattern: 'stripes', color2: '#BCC7D4', scale: 0.4 }),
});

function chest(K, g, b) { // rolling tool chest: lid, raised drawer fronts with chrome pulls, end handles, casters, amber badge
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(2, Math.floor(H / 0.42)), by = 0.16, bh = H - by - 0.12, dh = bh / n, Lb = L - 0.1, Tb = T - 0.08;
  K.add(g, bx(K, Lb, bh, Tb, 0.1), m.red, 0, by + bh / 2, 0);
  K.add(g, bx(K, L, 0.14, T, 0.06), m.redD, 0, H - 0.07, 0, 0, 0, 0, 1, NC); // lid
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
    const y = by + (i + 0.5) * dh, z = s * (Tb / 2 + 0.012);
    K.add(g, bx(K, Lb * 0.9, dh - 0.07, 0.03, 0.01), m.redD, 0, y, z, 0, 0, 0, 1, NO); // raised drawer front
    K.add(g, bx(K, Lb * 0.92, 0.025, 0.035, 0.01), m.dark, 0, y - dh / 2 + 0.03, z, 0, 0, 0, 1, NO); // gap under it
    K.add(g, bx(K, Lb * 0.3, 0.06, 0.05, 0.02), m.steel, 0, y + dh * 0.12, z + s * 0.03, 0, 0, 0, 1, NO); // chrome pull
    if (i === n - 1) { K.add(g, bx(K, 0.36, 0.1, 0.04, 0.01), m.paint[1], -Lb * 0.3, y - dh * 0.12, z + s * 0.01, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.22, 0.025, 0.045, 0.01), m.dark, -Lb * 0.3, y - dh * 0.12, z + s * 0.01, 0, 0, 0, 1, NO); } // badge
  }
  for (const e of [-1, 1]) K.add(g, K.capsule(0.035,  T * 0.4, 3, 6), m.steel, e * (L / 2 - 0.03), by + bh * 0.62, 0, Math.PI / 2, 0, 0, 1, NC); // end handle
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add(g, K.sphere(0.08, 8, 6), m.dark, x * (Lb / 2 - 0.12), 0.08, z * (Tb / 2 - 0.12), 0, 0, 0, [0.6, 1, 1], NO); // casters
}
function tyres(K, g, b) { // stack of white-wall tyres around a hidden core, hubcap with bolts on top
  const m = M(K), S = Math.min(b.w, b.d), R = S / 2 / 1.4, r = R * 0.4, n = Math.max(1, Math.floor(b.h / (2 * r))), k = (b.h / n / (2 * r)) * 0.98;
  K.add(g, cy(R * 0.75, R * 0.75, b.h, 14), m.hub, 0, b.h / 2, 0, 0, 0, 0, 1, { ink: false });
  for (let i = 0; i < n; i++) {
    const y = ((i + 0.5) * b.h) / n;
    K.add(g, K.torus(R, r, 10, 28), m.tyre, 0, y, 0, Math.PI / 2, 0, 0, [1, 1, k]);
    K.add(g, K.torus(R + r - 0.035, 0.035, 4, 28), m.hub, 0, y, 0, Math.PI / 2, 0, 0, 1, NO); // white wall stripe
  }
  K.add(g, K.sphere(R * 0.56, 10, 6), m.steelD, 0, b.h - 0.02, 0, 0, 0, 0, [1, 0.14, 1], NO);
  K.add(g, K.sphere(0.09, 8, 6), m.dark, 0, b.h + 0.03, 0, 0, 0, 0, [1, 0.6, 1], NO);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; K.add(g, K.sphere(0.045, 6, 4), m.steel, Math.cos(a) * R * 0.34, b.h + 0.01, Math.sin(a) * R * 0.34, 0, 0, 0, 1, NO); }
}
function shelving(K, g, b) { // metal rack: uprights with feet and braced ends, amber beams, shelves loaded with paint cans and cardboard boxes
  const m = M(K), { L, T } = alongX(g, b), H = b.h, lv = Math.max(2, Math.floor(H / 1.1)), hb = Math.min(H * 0.4, 1.6);
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) { K.add(g, bx(K, 0.08, H, 0.08, 0.02), m.steelD, x * (L / 2 - 0.04), H / 2, z * (T / 2 - 0.04)); K.add(g, bx(K, 0.16, 0.06, 0.16, 0.02), m.dark, x * (L / 2 - 0.04), 0.03, z * (T / 2 - 0.04), 0, 0, 0, 1, NC); }
    K.add(g, bx(K, 0.03, Math.hypot(T - 0.1, hb), 0.03, 0.01), m.steelD, x * (L / 2 - 0.04), 0.3 + hb / 2, 0, Math.atan2(T - 0.1, hb), 0, 0, 1, NO); // end brace
  }
  for (let i = 0; i < lv; i++) {
    const y = 0.25 + (i * (H - 0.35)) / (lv - 1);
    K.add(g, bx(K, L, 0.06, T, 0.02), m.steel, 0, y, 0, 0, 0, 0, 1, NC);
    for (const s of [-1, 1]) K.add(g, bx(K, L, 0.12, 0.05, 0.015), m.paint[1], 0, y - 0.04, s * (T / 2 - 0.01), 0, 0, 0, 1, NC); // amber beam
    if (i === lv - 1 || y + 0.5 > H) continue;
    for (const x of spread(Math.max(2, Math.round(L / 0.9)), L - 0.4)) {
      if (K.rnd() < 0.55) { const h = 0.28 + K.rnd() * 0.2; K.add(g, cy(0.16, 0.16, h, 12), m.paint[Math.floor(K.rnd() * 4)], x, y + 0.03 + h / 2, 0, 0, 0, 0, 1, NC); K.add(g, K.cone(0.17, 0.06, 10), m.steel, x, y + 0.06 + h, 0, 0, 0, 0, 1, NO); } // paint can + lid
      else { K.add(g, bx(K, 0.5, 0.34, T * 0.7, 0.04), m.wood, x, y + 0.2, 0, 0, K.rnd() * 0.3, 0, 1, NC); K.add(g, bx(K, 0.12, 0.02, T * 0.7 + 0.01, 0.005), m.steel, x, y + 0.375, 0, 0, 0, 0, 1, NO); } // cardboard box + tape
    }
  }
}
function tools(K, g, m, x, y, z, v = 0) { // hanging tool silhouettes on a board face: wrench + hammer, or screwdriver + tape measure + saw
  if (v % 2 === 0) {
    K.add(g, K.capsule(0.05,  0.6, 3, 6), m.steel, x - 0.3, y, z, 0, 0, 0.3, 1, NO); K.add(g, K.torus(0.1, 0.04, 6, 14), m.steel, x - 0.2, y + 0.36, z, 0, 0, 0, 1, NO);
    K.add(g, bx(K, 0.07, 0.7, 0.05, 0.02), m.woodD, x + 0.35, y, z, 0, 0, -0.2, 1, NO); K.add(g, bx(K, 0.34, 0.14, 0.08, 0.03), m.dark, x + 0.42, y + 0.34, z, 0, 0, -0.2, 1, NO);
  } else {
    K.add(g, bx(K, 0.03, 0.5, 0.03, 0.01), m.steel, x - 0.35, y + 0.2, z, 0, 0, 0.1, 1, NO); K.add(g, K.capsule(0.05,  0.2, 3, 6), m.red, x - 0.38, y - 0.18, z, 0, 0, 0.1, 1, NO);
    K.add(g, K.torus(0.13, 0.05, 6, 14), m.paint[1], x + 0.05, y + 0.05, z, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.1, 0.06, 0.06, 0.02), m.dark, x + 0.05, y - 0.12, z, 0, 0, 0, 1, NO);
    K.add(g, bx(K, 0.42, 0.16, 0.02, 0.01), m.steel, x + 0.5, y + 0.15, z, 0, 0, 0.5, 1, NO); K.add(g, bx(K, 0.12, 0.1, 0.05, 0.02), m.woodD, x + 0.36, y - 0.06, z, 0, 0, 0.5, 1, NO);
  }
}
function pegboard(K, g, b) { // pegboard partition on a metal frame, tools on both faces, shelf ledge with jars
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, bx(K, L, H, T * 0.6, 0.06), m.peg, 0, H / 2, 0);
  K.add(g, bx(K, L + 0.02, 0.12, T, 0.04), m.steelD, 0, H - 0.06, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, L + 0.02, 0.12, T, 0.04), m.steelD, 0, 0.06, 0, 0, 0, 0, 1, NC);
  for (const e of [-1, 1]) K.add(g, bx(K, 0.12, H, T, 0.04), m.steelD, e * (L / 2 - 0.06), H / 2, 0, 0, 0, 0, 1, NC); // end posts
  for (const [i, x] of spread(Math.max(1, Math.floor(L / 1.6)), L - 0.8).entries()) for (const s of [-1, 1]) tools(K, g, m, x, Math.min(H - 0.7, 1.9), s * (T * 0.3 + 0.03), i);
  for (const s of [-1, 1]) { K.add(g, bx(K, L - 0.4, 0.06, 0.18, 0.02), m.steel, 0, 0.8, s * (T * 0.3 + 0.1), 0, 0, 0, 1, NC); for (const x of spread(Math.max(2, Math.floor(L / 0.9)), L - 0.9)) K.add(g, bx(K, 0.14, 0.2, 0.14, 0.02), m.paint[Math.floor(K.rnd() * 4)], x, 0.93, s * (T * 0.3 + 0.1), 0, 0, 0, 1, NO); }
}
function ibeam(K, g, b) { // steel I-beam to the ceiling: flanges and web, base and cap plates, rivet rows, hazard band at the foot
  const m = M(K), R = b.r, H = b.h;
  K.add(g, bx(K, 2 * R, H, 0.22, 0.04), m.steel, 0, H / 2, R - 0.11); K.add(g, bx(K, 2 * R, H, 0.22, 0.04), m.steel, 0, H / 2, -R + 0.11);
  K.add(g, bx(K, 0.2, H, 2 * R - 0.3, 0.03), m.steelD, 0, H / 2, 0, 0, 0, 0, 1, { ink: false });
  K.add(g, bx(K, 2 * R + 0.08, 0.16, 2 * R + 0.08, 0.05), m.steelD, 0, 0.08, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, 2 * R + 0.08, 0.16, 2 * R + 0.08, 0.05), m.steelD, 0, H - 0.08, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(K, 2 * R + 0.04, 1.0, 2 * R + 0.04, 0.05), m.yel, 0, 0.66, 0, 0, 0, 0, 1, NC);
  for (let y = 1.7; y < H - 0.4; y += 0.7) for (const s of [-1, 1]) for (const x of [-0.55, 0.55]) K.add(g, bx(K, 0.07, 0.07, 0.04, 0.01), m.steelD, x * R, y, s * (R + 0.005), 0, 0, 0, 1, NO);
}
function column(K, g, b) { // concrete corner column: plinth and crown, formwork seams, hazard stripes, fuse box with warning sticker and conduit
  const m = M(K), H = b.h, f = g.position.z > 0 ? -1 : 1, z = f * (b.d / 2 + 0.05);
  K.add(g, bx(K, b.w, H, b.d, 0.1), m.conc, 0, H / 2, 0);
  K.add(g, bx(K, b.w + 0.03, 0.22, b.d + 0.03, 0.06), m.steelD, 0, 0.11, 0, 0, 0, 0, 1, NC); K.add(g, bx(K, b.w + 0.03, 0.2, b.d + 0.03, 0.06), m.steelD, 0, H - 0.1, 0, 0, 0, 0, 1, NC);
  K.add(g, bx(K, b.w + 0.03, 1.2, b.d + 0.03, 0.05), m.yel, 0, 0.82, 0, 0, 0, 0, 1, NC);
  for (let y = 2.8; y < H - 0.5; y += 1.4) K.add(g, bx(K, b.w + 0.01, 0.04, b.d + 0.01, 0.01), m.steelD, 0, y, 0, 0, 0, 0, 1, NO);
  K.add(g, bx(K, 0.6, 0.8, 0.14, 0.05), m.steelD, 0, 2.2, z, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.5, 0.68, 0.03, 0.01), m.steel, 0, 2.2, z + f * 0.08, 0, 0, 0, 1, NO); // fuse box + door
  K.add(g, bx(K, 0.05, 0.22, 0.05, 0.02), m.dark, 0.18, 2.2, z + f * 0.1, 0, 0, 0, 1, NO); K.add(g, K.cone(0.12, 0.03, 3), m.paint[1], -0.08, 2.35, z + f * 0.1, f * Math.PI / 2, f > 0 ? Math.PI : 0, 0, 1, NO); // handle, warning triangle
  K.add(g, cy(0.05, 0.05, H - 2.6, 8), m.steelD, 0, 2.6 + (H - 2.6) / 2, z - f * 0.01, 0, 0, 0, 1, NO); // conduit to the ceiling
}
function pallet(K, g, b) { // wooden pallet: slats with nail heads on blocks and bottom runners
  const m = M(K), H = b.h, n = 5;
  for (const z of spread(n, b.d)) { K.add(g, bx(K, b.w, H * 0.3, (b.d / n) * 0.8, 0.03), m.wood, 0, H * 0.85, z); for (const x of [-1, 0, 1]) K.add(g, bx(K, 0.05, 0.012, 0.05, 0.005), m.woodD, x * (b.w / 2 - 0.15), H + 0.003, z, 0, 0, 0, 1, NO); }
  for (const x of [-1, 0, 1]) for (const z of [-1, 0, 1]) K.add(g, bx(K, 0.3, H * 0.55, 0.3, 0.04), m.woodD, x * (b.w / 2 - 0.2), H * 0.35, z * (b.d / 2 - 0.2), 0, 0, 0, 1, NO);
  for (const z of spread(3, b.d - 0.2)) K.add(g, bx(K, b.w, H * 0.12, b.d * 0.22, 0.02), m.woodD, 0, H * 0.06, z, 0, 0, 0, 1, NO);
}
function toolbox(K, g, b) { // red toolbox: darker lid, steel latches, label plate and carry handle (3 materials: it is rebuilt per moving platform)
  const m = M(K), W = b.w, D = b.d, H = b.h;
  K.add(g, bx(K, W, H * 0.72, D, 0.1), m.red, 0, H * 0.36, 0); K.add(g, bx(K, W, H * 0.32, D, 0.1), m.redD, 0, H * 0.84, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) { for (const x of [-0.28, 0.28]) K.add(g, bx(K, 0.2, H * 0.24, 0.05, 0.02), m.steel, x * W, H * 0.71, s * (D / 2 + 0.01), 0, 0, 0, 1, NC); K.add(g, bx(K, 0.5, 0.14, 0.03, 0.01), m.steel, 0, H * 0.35, s * (D / 2 + 0.01), 0, 0, 0, 1, NO); }
  for (const x of [-1, 1]) K.add(g, bx(K, 0.08, 0.14, 0.08, 0.02), m.steel, x * W * 0.22, H + 0.04, 0, 0, 0, 0, 1, NO);
  K.add(g, K.capsule(0.045, W * 0.44 - 0.1, 3, 6), m.steel, 0, H + 0.1, 0, 0, 0, Math.PI / 2, 1, NC);
}
function plateRamp(K, g, b) { // diamond-plate ramp with amber hazard edges
  const m = M(K), ax = b.ramp.axis === 'z', e = 0.14;
  K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.plate, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, ax ? K.rampGeo(e + 0.02, b.h, b.d + 0.02, b.ramp) : K.rampGeo(b.w + 0.02, b.h, e + 0.02, b.ramp), m.yel, ax ? s * (b.w / 2 - e / 2) : 0, b.h / 2 + 0.02, ax ? 0 : s * (b.d / 2 - e / 2), 0, 0, 0, 1, NC);
}
const blob = (K, g, m, x, z, r, sz = 0.7) => K.add(g, K.cone(r, 0.014, 14), m, x, 0.007, z, 0, 0, 0, [1, 1, sz], NO); // flat puddle disc

export default {
  bas: [{ make: chest }, square(tyres), long(chest, 1.4)],
  haut: [{ make: shelving }, { make: pegboard }],
  pilier: [{ make: ibeam }],
  coin: [{ make: column }],
  plateforme: [{ make: pallet }],
  rampe: [{ make: plateRamp }],
  parkour: [parkour(pallet), parkour(toolbox)],
  solCount: [8, 4], // floor decals per room: [at least, up to this many more]
  mural: [
    { make(K, g) { // pegboard in a steel frame: tools, a jar shelf and an amber sign
      const m = M(K); K.add(g, bx(K, 4.3, 2.7, 0.1, 0.05), m.steelD, 0, 2.4, 0.05, 0, 0, 0, 1, NC); K.add(g, bx(K, 4, 2.4, 0.12, 0.05), m.peg, 0, 2.4, 0.1, 0, 0, 0, 1, NC);
      tools(K, g, m, -1.2, 2.65, 0.2, 0); tools(K, g, m, 0, 2.65, 0.2, 1); tools(K, g, m, 1.2, 2.65, 0.2, 0);
      K.add(g, bx(K, 3.6, 0.08, 0.3, 0.02), m.steel, 0, 1.75, 0.3, 0, 0, 0, 1, NC); for (const x of spread(6, 3.2)) K.add(g, bx(K, 0.16, 0.22, 0.16, 0.02), m.paint[Math.floor(K.rnd() * 4)], x, 1.9, 0.3, 0, 0, 0, 1, NO);
      K.add(g, bx(K, 1.5, 0.34, 0.1, 0.03), m.paint[1], 0, 3.95, 0.1, 0, 0, 0, 1, NC); K.add(g, bx(K, 1.0, 0.07, 0.04, 0.01), m.dark, 0, 3.95, 0.17, 0, 0, 0, 1, NO);
    } },
    { make(K, g, o) { // roller door: ribs, window row, guide rails, warning lamp, handle and a yellow bump strip
      const m = M(K), H = Math.min(o.h - 1, 3.6); K.add(g, bx(K, 5.2, H, 0.12, 0.05), m.door, 0, H / 2, 0.06, 0, 0, 0, 1, NC);
      for (let y = 0.4; y < H - 0.6; y += 0.36) K.add(g, bx(K, 5.2, 0.03, 0.02, 0.01), m.steelD, 0, y, 0.13, 0, 0, 0, 1, NO);
      for (const x of spread(4, 4.4)) K.add(g, bx(K, 0.9, 0.32, 0.02, 0.01), m.steel, x, H - 0.5, 0.13, 0, 0, 0, 1, NO);
      for (const e of [-1, 1]) K.add(g, bx(K, 0.2, H + 0.3, 0.22, 0.05), m.steelD, e * 2.7, (H + 0.3) / 2, 0.12, 0, 0, 0, 1, NC);
      K.add(g, bx(K, 5.6, 0.3, 0.3, 0.08), m.steelD, 0, H + 0.15, 0.16, 0, 0, 0, 1, NC); K.add(g, K.capsule(0.05,  0.5, 3, 6), m.dark, 0, 0.5, 0.16, 0, 0, Math.PI / 2, 1, NO);
      K.add(g, bx(K, 5.2, 0.25, 0.2, 0.05), m.yel, 0, 0.13, 0.2, 0, 0, 0, 1, NC);
      K.add(g, bx(K, 0.1, 0.18, 0.1, 0.02), m.dark, 3.1, H + 0.3, 0.14, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.13, 8, 6), m.paint[1], 3.1, H + 0.5, 0.14, 0, 0, 0, 1, NO); // warning lamp
    } },
    { make(K, g) { // tyres hung on a wall rack, rims showing
      const m = M(K); K.add(g, bx(K, 3.2, 0.2, 0.14, 0.05), m.woodD, 0, 3.7, 0.07, 0, 0, 0, 1, NC);
      for (const [x, y] of [[-0.6, 2.8], [0.7, 3.2]]) { K.add(g, K.torus(0.55, 0.22, 10, 24), m.tyre, x, y, 0.3, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.36, 10, 6), m.hub, x, y, 0.3, 0, 0, 0, [1, 1, 0.3], NO); K.add(g, K.sphere(0.07, 6, 4), m.dark, x, y, 0.36, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.08, 0.5, 0.08, 0.02), m.steelD, x, y + 0.5, 0.12, 0, 0, 0, 1, NO); }
    } },
    { make(K, g) { // hose reel: amber drum with a wound hose, crank and a dangling nozzle
      const m = M(K); K.add(g, bx(K, 1.1, 1.1, 0.1, 0.04), m.steelD, 0, 2.6, 0.05, 0, 0, 0, 1, NC); K.add(g, cy(0.52, 0.52, 0.22, 24), m.paint[1], 0, 2.6, 0.22, Math.PI / 2, 0, 0, 1, NC);
      K.add(g, K.torus(0.34, 0.1, 6, 16), m.dark, 0, 2.6, 0.34, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.12, 8, 6), m.steel, 0, 2.6, 0.4, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.5, 0.06, 0.06, 0.02), m.steel, 0.25, 2.6, 0.44, 0, 0, 0.5, 1, NO);
      K.add(g, K.capsule(0.06,  0.9, 3, 6), m.dark, 0.2, 1.75, 0.34, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.14, 0.2, 0.12, 0.03), m.red, 0.2, 1.15, 0.34, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // fire extinguisher on a red wall plate with an amber sign
      const m = M(K); K.add(g, bx(K, 0.9, 1.5, 0.08, 0.04), m.redD, 0, 2.1, 0.04, 0, 0, 0, 1, NC); K.add(g, cy(0.19, 0.19, 0.8, 12), m.red, 0, 1.95, 0.24, 0, 0, 0, 1, NC);
      K.add(g, cy(0.07, 0.07, 0.14, 8), m.dark, 0, 2.43, 0.24, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.3, 0.06, 0.06, 0.02), m.dark, 0.1, 2.5, 0.24, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.38, 0.14, 0.02, 0.01), m.steel, 0, 1.95, 0.44, 0, 0, 0, 1, NO);
      K.add(g, bx(K, 0.7, 0.4, 0.06, 0.03), m.paint[1], 0, 3.3, 0.04, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.1, 0.22, 0.02, 0.005), m.dark, 0, 3.32, 0.08, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 1.6, make(K, g) { const m = M(K); blob(K, g, m.oil, 0, 0, 1.1); blob(K, g, m.oil, 0.9, 0.4, 0.5, 1); blob(K, g, m.oil, -0.8, -0.5, 0.45, 0.8); for (const [x, z, s] of [[1.5, -0.2, 0.1], [-0.2, 0.9, 0.13], [1.3, 0.9, 0.08]]) blob(K, g, m.oil, x, z, s, 1); } }, // oil stain with splashes
    { r: 3.2, make(K, g) { const m = M(K); for (const z of [-1, 1]) K.add(g, bx(K, 5, 0.02, 0.16, 0.01), m.line, 0, 0.012, z * 1.3, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.16, 0.02, 2.76, 0.01), m.line, -2.5, 0.012, 0, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.3, 0.16, 2.0, 0.06), m.steelD, -2.0, 0.08, 0, 0, 0, 0, 1, NC); } }, // parking bay with wheel stop
    { r: 1.2, make(K, g) { const m = M(K), c = m.paint[Math.floor(K.rnd() * 4)]; K.add(g, cy(0.18, 0.18, 0.4, 12), c, 0, 0.18, 0, 0, 0, Math.PI / 2, 1, NC); K.add(g, K.cone(0.7, 0.02, 16), c, 0.6, 0.01, 0, 0, 0, 0, [1, 1, 0.6], NO); for (const [x, z, s] of [[1.4, 0.2, 0.12], [1.1, -0.4, 0.09]]) K.add(g, K.cone(s, 0.02, 10), c, x, 0.01, z, 0, 0, 0, 1, NO); } }, // spilled paint can
    { r: 1.0, make(K, g) { const m = M(K); K.add(g, bx(K, 1.0, 0.03, 1.0, 0.02), m.steelD, 0, 0.015, 0, 0, 0, 0, 1, NC); for (const x of spread(5, 0.7)) K.add(g, bx(K, 0.08, 0.035, 0.8, 0.01), m.dark, x, 0.017, 0, 0, 0, 0, 1, NO); } }, // drain grate
    { r: 1.5, make(K, g) { const m = M(K); K.add(g, bx(K, 2.4, 0.03, 1.4, 0.03), m.tyre, 0, 0.015, 0, 0, 0, 0, 1, NC); for (const z of [-1, 1]) K.add(g, bx(K, 2.4, 0.034, 0.12, 0.01), m.yel, 0, 0.017, z * 0.64, 0, 0, 0, 1, NO); } }, // rubber mat with hazard edges
    { r: 3.0, make(K, g) { const m = M(K); for (const z of [-0.55, 0.55]) for (let i = 0; i < 8; i++) { K.add(g, bx(K, 0.4, 0.01, 0.1, 0.005), m.steelD, -2.6 + i * 0.7, 0.006, z, 0, i % 2 ? 0.5 : -0.5, 0, 1, NO); K.add(g, bx(K, 0.4, 0.01, 0.1, 0.005), m.steelD, -2.6 + i * 0.7, 0.006, z + (z > 0 ? 0.18 : -0.18), 0, i % 2 ? -0.5 : 0.5, 0, 1, NO); } } }, // tyre tread marks
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.capsule(0.05,  0.6, 3, 6), m.steel, 0, 0.05, 0, 0, 0, Math.PI / 2, 1, NC); K.add(g, K.torus(0.1, 0.045, 6, 14), m.steel, 0.42, 0.05, 0, Math.PI / 2, 0, 0, 1, NC); } }, // dropped wrench
  ],
};
