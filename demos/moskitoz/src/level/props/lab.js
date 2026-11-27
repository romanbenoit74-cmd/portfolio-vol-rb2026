// Laboratoire: lab benches with flasks, test-tube racks and burners, glowing specimen tanks, glass-front cabinets of bottles,
// glowing liquid columns with bubbles, server racks in the corners, floating petri dishes, steel ramps, microscope benches
// as parkour; periodic tables, pipes, hazard signs, molecule boards and a wall monitor; hazard stripes, safety rings, glowing
// spills, tubes and cable coils on the floor. Green bubbles rise in the air.
import * as THREE from 'three';
import { roundedBox } from '../../render/Style.js';
import { NC, NO, alongX, parkour, spread, square } from './common.js';
const bx = (K, w, h, d, r) => { const m = Math.min(w, h, d); return r <= 0.02 || m < 0.18 ? K.box(w, h, d, 0.02) : roundedBox(w, h, d, r, m < 0.3 ? 1 : 2); }; // bevel by size: thin trims plain, small parts chamfered, big volumes rounded
const cy = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg); // plain cylinder for small parts (a rounded one costs 6x the triangles)

const M = (K) => ({
  bench: K.m('#4FB89C', { rim: 0.2 }), benchL: K.m('#E6F6F0', { rim: 0.15 }), top: K.m('#2E4A44', { rim: 0.2 }), steel: K.m('#C0DCD8', { rim: 0.4 }), steelD: K.m('#88A8A0'), glass: K.m('#DFF8F2', { rim: 0.7, rimColor: '#FFFFFF' }),
  liquid: [K.glow('#7CFF6B', 1.5), K.glow('#6BE0FF', 1.5), K.glow('#FF8AD0', 1.5), K.glow('#FFE06B', 1.5)], tube: K.glow('#7CFF6B', 1.2), bubble: K.m('#E8FFE0', { rim: 0.6 }),
  rack: K.m('#2A3A36', { rim: 0.2 }), led: K.glow('#7CFF6B', 2), ledR: K.glow('#FF5B4A', 2), hazard: K.m('#FFD23F', { pattern: 'stripes', color2: '#1E2A28', scale: 0.3 }), poster: K.f('#FFFFFF'),
  cell: [K.f('#7CFF6B'), K.f('#6BE0FF'), K.f('#FFB08A'), K.f('#F0A0F0'), K.f('#FFE06B')], pipe: K.m('#F0A0A0', { rim: 0.35 }), cable: K.m('#2A3A36'),
});

function flask(K, g, m, x, y, z, s = 1) { // round flask: glass belly, glowing liquid, neck and a dark stopper
  const c = m.liquid[Math.floor(K.rnd() * 4)];
  K.add(g, K.sphere(0.18 * s, 10, 7), m.glass, x, y + 0.18 * s, z, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.13 * s, 10, 7), c, x, y + 0.14 * s, z, 0, 0, 0, [1, 0.7, 1], NO);
  K.add(g, cy(0.05 * s, 0.05 * s, 0.22 * s, 8), m.glass, x, y + 0.42 * s, z, 0, 0, 0, 1, NO); K.add(g, K.cone(0.06 * s, 0.1 * s, 6), m.rack, x, y + 0.58 * s, z, 0, 0, 0, 1, NO);
}
function tubeRack(K, g, m, x, y, z) { // test-tube rack with four glowing tubes
  K.add(g, bx(K, 0.52, 0.05, 0.22, 0.02), m.steel, x, y + 0.025, z, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.52, 0.04, 0.22, 0.02), m.steel, x, y + 0.3, z, 0, 0, 0, 1, NC);
  for (const e of [-1, 1]) K.add(g, bx(K, 0.04, 0.3, 0.2, 0.01), m.steelD, x + e * 0.24, y + 0.15, z, 0, 0, 0, 1, NO);
  for (const u of spread(4, 0.36)) K.add(g, K.capsule(0.04,  0.2, 2, 5), m.liquid[Math.floor(K.rnd() * 4)], x + u, y + 0.2, z, 0, 0, 0, 1, NO);
}
function burner(K, g, m, x, y, z) { // bunsen burner with a flame and a clamp stand
  K.add(g, K.sphere(0.13, 8, 6), m.steelD, x, y + 0.03, z, 0, 0, 0, [1, 0.4, 1], NC); K.add(g, bx(K, 0.06, 0.3, 0.06, 0.02), m.rack, x, y + 0.18, z, 0, 0, 0, 1, NC); K.add(g, K.cone(0.07, 0.22, 6), m.liquid[3], x, y + 0.45, z, 0, 0, 0, 1, NO);
  K.add(g, bx(K, 0.3, 0.04, 0.2, 0.01), m.steel, x + 0.4, y + 0.02, z, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.04, 0.8, 0.04, 0.01), m.steel, x + 0.5, y + 0.4, z, 0, 0, 0, 1, NO);
  K.add(g, bx(K, 0.3, 0.04, 0.05, 0.01), m.steelD, x + 0.35, y + 0.7, z, 0, 0, 0, 1, NO); K.add(g, K.torus(0.1, 0.02, 4, 10), m.steel, x + 0.2, y + 0.7, z, Math.PI / 2, 0, 0, 1, NO);
}
function bench(K, g, b) { // lab bench: plinth, cabinet doors with pulls, dark worktop, flasks, tube racks, burner
  const m = M(K), { L, T } = alongX(g, b), H = b.h, nd = Math.max(2, Math.round(L / 0.9)), bh = H - 0.22;
  K.add(g, bx(K, L, bh, T * 0.9, 0.06), m.bench, 0, 0.1 + bh / 2, 0);
  K.add(g, bx(K, L - 0.12, 0.1, T * 0.9 - 0.12, 0.02), m.rack, 0, 0.05, 0, 0, 0, 0, 1, NO);
  K.add(g, bx(K, L + 0.06, 0.12, T + 0.04, 0.04), m.top, 0, H - 0.06, 0);
  for (const x of spread(nd, L)) for (const s of [-1, 1]) {
    const z = s * (T * 0.45 + 0.012), w = L / nd - 0.14;
    K.add(g, bx(K, w, bh - 0.16, 0.03, 0.01), m.benchL, x, 0.1 + bh / 2, z, 0, 0, 0, 1, NO); // door
    K.add(g, bx(K, 0.05, 0.24, 0.05, 0.02), m.steel, x + w / 2 - 0.1, 0.1 + bh * 0.62, z + s * 0.03, 0, 0, 0, 1, NO); // pull
  }
  for (const x of spread(Math.max(2, Math.round(L / 1.3)), L - 1.0)) {
    const z = (K.rnd() - 0.5) * (T - 0.8), k = Math.floor(K.rnd() * 4);
    if (k === 0) { flask(K, g, m, x - 0.2, H, z); flask(K, g, m, x + 0.2, H, z + 0.1, 0.8); } else if (k === 1) tubeRack(K, g, m, x, H, z); else if (k === 2) burner(K, g, m, x - 0.2, H, z); else flask(K, g, m, x, H, z, 1.2);
  }
}
function tank(K, g, b) { // specimen tank: steel base and lid with posts, glowing liquid, a dark specimen, bubbles, LED plate
  const m = M(K), S = Math.min(b.w, b.d), H = b.h, c = m.liquid[Math.floor(K.rnd() * 4)], hh = H - 0.5;
  K.add(g, bx(K, S, 0.3, S, 0.06), m.steel, 0, 0.15, 0); K.add(g, bx(K, S, 0.2, S, 0.06), m.steel, 0, H - 0.1, 0);
  K.add(g, bx(K, S - 0.16, hh, S - 0.16, 0.05), c, 0, 0.3 + hh / 2, 0, 0, 0, 0, 1, NC); // liquid (glowing, outlined like glass)
  K.add(g, bx(K, S - 0.16, 0.12, S - 0.16, 0.03), m.benchL, 0, 0.36, 0, 0, 0, 0, 1, NO); // sand
  for (const x of [-1, 1]) for (const z of [-1, 1]) K.add(g, bx(K, 0.1, hh + 0.04, 0.1, 0.03), m.steelD, x * (S / 2 - 0.07), 0.3 + hh / 2, z * (S / 2 - 0.07), 0, 0, 0, 1, NC); // corner posts
  const y = 0.3 + hh * 0.55;
  for (let k = 0; k < 4; k++) { // specimen drawn on the four faces of the liquid: body, tail, eye, bubbles
    const sg = K.sub(g, 0, 0, 0, (k * Math.PI) / 2), z = S / 2 - 0.07;
    K.add(sg, K.sphere(0.32, 10, 7), m.top, 0, y, z, 0, 0, 0, [1.2, 0.8, 0.25], NO); K.add(sg, K.cone(0.22, 0.45, 6), m.top, -0.45, y, z, 0, 0, -Math.PI / 2, [1, 1, 0.25], NO);
    K.add(sg, K.sphere(0.07, 6, 5), m.bubble, 0.18, y + 0.07, z + 0.03, 0, 0, 0, [1, 1, 0.4], NO); K.add(sg, K.sphere(0.03, 5, 4), m.rack, 0.2, y + 0.07, z + 0.045, 0, 0, 0, 1, NO);
    for (let i = 0; i < 3; i++) K.add(sg, K.sphere(0.05 + K.rnd() * 0.06, 6, 5), m.bubble, (K.rnd() - 0.5) * (S - 0.5), 0.6 + K.rnd() * (hh - 0.5), z + 0.01, 0, 0, 0, 1, NO);
    if (k % 2 === 0) { K.add(sg, bx(K, S * 0.5, 0.12, 0.03, 0.01), m.rack, 0, 0.15, S / 2 + 0.012, 0, 0, 0, 1, NO); K.add(sg, bx(K, 0.1, 0.05, 0.03, 0.01), m.led, -S * 0.2, 0.15, S / 2 + 0.03, 0, 0, 0, 1, NO); } // LED plate
  }
  K.add(g, K.capsule(0.05,  0.3, 2, 6), m.steelD, S * 0.25, H + 0.05, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(0.12, 0.03, 5, 12), m.ledR, S * 0.25, H + 0.2, 0, Math.PI / 2, 0, 0, 1, NO); // valve on the lid
}
function bottle(K, g, m, x, y, z, k) { // bottle / jar / flask on a shelf
  const c = m.liquid[Math.floor(K.rnd() * 4)];
  if (k === 0) { K.add(g, K.capsule(0.065,  0.16, 2, 6), c, x, y + 0.15, z, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.045, 0.1, 0.045, 0.01), m.glass, x, y + 0.33, z, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.06, 0.03, 0.06, 0.01), m.cable, x, y + 0.4, z, 0, 0, 0, 1, NO); }
  else if (k === 1) { K.add(g, K.sphere(0.1, 8, 6), c, x, y + 0.1, z, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.12, 0.04, 0.12, 0.01), m.steelD, x, y + 0.21, z, 0, 0, 0, 1, NO); }
  else { K.add(g, K.capsule(0.055,  0.3, 2, 6), c, x, y + 0.2, z, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.05, 0.03, 0.05, 0.01), m.steelD, x, y + 0.42, z, 0, 0, 0, 1, NO); }
}
function cabinet(K, g, b) { // glass-front cabinet: dark recess in a frame, shelves with bottles and jars, steel mullions, both faces
  const m = M(K), { L, T } = alongX(g, b), H = b.h, lv = Math.max(2, Math.floor(H / 1.1)), sp = (H - 0.3) / lv, zb = T * 0.25;
  K.add(g, bx(K, L, H, T * 0.5, 0.05), m.bench, 0, H / 2, 0);
  for (const s of [-1, 1]) {
    K.add(g, bx(K, L - 0.3, H - 0.4, 0.03, 0.01), m.rack, 0, H / 2, s * (zb + 0.012), 0, 0, 0, 1, NO);
    for (let i = 0; i < lv; i++) {
      const y = 0.25 + i * sp;
      K.add(g, bx(K, L - 0.3, 0.05, 0.13, 0.01), m.benchL, 0, y, s * (zb + 0.075), 0, 0, 0, 1, NO);
      for (const x of spread(Math.max(2, Math.round(L / 0.55)), L - 0.7)) bottle(K, g, m, x, y + 0.025, s * (zb + 0.075), Math.floor(K.rnd() * 3));
    }
    for (let i = 0, nm = Math.max(1, Math.round(L / 1.6)); i <= nm; i++) K.add(g, bx(K, 0.05, H - 0.4, 0.03, 0.015), m.steel, -(L - 0.3) / 2 + (i * (L - 0.3)) / nm, H / 2, s * (T / 2 - 0.015), 0, 0, 0, 1, NC); // mullions
    for (const y of [0.2, H - 0.2]) K.add(g, bx(K, L - 0.25, 0.05, 0.03, 0.015), m.steel, 0, y, s * (T / 2 - 0.015), 0, 0, 0, 1, NC);
  }
}
function tubeCol(K, g, b) { // glowing liquid column: steel caps and rings, cage rods, bubbles clinging to the liquid, LED plate
  const m = M(K), R = (b.r ?? b.w / 2) * 0.9, H = b.h;
  K.add(g, K.cyl(R, R, 0.8, 0.08, 16), m.steel, 0, 0.4, 0); K.add(g, K.cyl(R, R, 0.8, 0.08, 16), m.steel, 0, H - 0.4, 0);
  K.add(g, cy(R * 0.76, R * 0.76, H - 1.6, 14), m.tube, 0, H / 2, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; K.add(g, bx(K, 0.05, H - 1.6, 0.05, 0.015), m.steelD, Math.cos(a) * R * 0.92, H / 2, Math.sin(a) * R * 0.92, 0, 0, 0, 1, NC); }
  for (let y = 1.6; y < H - 1.5; y += 1.8) K.add(g, K.torus(R * 0.92, 0.05, 5, 20), m.steel, 0, y, 0, Math.PI / 2, 0, 0, 1, NC);
  for (const y of [0.82, H - 0.82]) K.add(g, K.torus(R, 0.05, 4, 20), m.steelD, 0, y, 0, Math.PI / 2, 0, 0, 1, NO);
  for (let i = 0; i < 10; i++) { const a = K.rnd() * 6.28; K.add(g, K.sphere(0.06 + K.rnd() * 0.06, 8, 6), m.bubble, Math.cos(a) * R * 0.74, 1 + K.rnd() * (H - 2), Math.sin(a) * R * 0.74, 0, 0, 0, 1, NO); }
  K.add(g, bx(K, 0.34, 0.14, 0.04, 0.01), m.rack, 0, 0.4, R + 0.01, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.08, 0.06, 0.03, 0.01), m.led, -0.08, 0.4, R + 0.035, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.08, 0.06, 0.03, 0.01), m.ledR, 0.08, 0.4, R + 0.035, 0, 0, 0, 1, NO);
}
function server(K, g, b) { // server rack: dark cabinet, unit faceplates with vents and LEDs on the inner faces, status screen, crown
  const m = M(K), top = Math.min(b.h - 0.6, 4.6), fz = g.position.z > 0 ? Math.PI : 0, fx = g.position.x > 0 ? -Math.PI / 2 : Math.PI / 2;
  K.add(g, bx(K, b.w, b.h, b.d, 0.06), m.rack, 0, b.h / 2, 0); K.add(g, bx(K, b.w + 0.04, 0.12, b.d + 0.04, 0.04), m.steelD, 0, b.h - 0.06, 0, 0, 0, 0, 1, NC);
  [fz, fx].forEach((ry, f) => {
    const s = K.sub(g, 0, 0, 0, ry), z = b.d / 2 + 0.012;
    for (let y = 0.5, i = 0; y < top; y += 0.4, i++) {
      K.add(s, bx(K, b.w * 0.84, 0.32, 0.03, 0.01), m.steelD, 0, y, z, 0, 0, 0, 1, NO);
      for (let v = 0; v < 3; v++) K.add(s, bx(K, b.w * 0.34, 0.03, 0.035, 0.005), m.rack, -b.w * 0.2, y - 0.07 + v * 0.07, z, 0, 0, 0, 1, NO); // vents
      K.add(s, bx(K, 0.08, 0.06, 0.04, 0.005), K.rnd() < 0.8 ? m.led : m.ledR, b.w * 0.3, y + 0.06, z, 0, 0, 0, 1, NO); K.add(s, bx(K, 0.08, 0.06, 0.04, 0.005), m.led, b.w * 0.3 - 0.14, y + 0.06, z, 0, 0, 0, 1, NO);
    }
    if (f === 0) { K.add(s, bx(K, b.w * 0.7, 0.4, 0.04, 0.015), m.top, 0, top + 0.4, z, 0, 0, 0, 1, NC); K.add(s, bx(K, b.w * 0.58, 0.26, 0.02, 0.01), m.cell[1], 0, top + 0.4, z + 0.025, 0, 0, 0, 1, NO); for (const u of spread(4, b.w * 0.44)) K.add(s, bx(K, 0.07, 0.08 + K.rnd() * 0.12, 0.02, 0.005), m.cell[0], u, top + 0.34, z + 0.04, 0, 0, 0, 1, NO); } // status screen
  });
}
function petri(K, g, b) { // floating petri dish: glass wall and rim, pale agar on top, glowing colonies (same 6 materials as before: it is rebuilt per moving platform)
  const m = M(K), R = Math.min(b.w, b.d) / 2 - 0.05, y = b.h + 0.012;
  K.add(g, K.cyl(R, R, b.h, 0.06, 24), m.glass, 0, b.h / 2, 0); K.add(g, K.torus(R - 0.03, 0.05, 5, 28), m.glass, 0, b.h - 0.01, 0, Math.PI / 2, 0, 0, 1, NC);
  K.add(g, cy(R * 0.9, R * 0.9, 0.03, 24), m.bubble, 0, y, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < 8; i++) { const a = K.rnd() * 6.28, d = K.rnd() * R * 0.65, r = 0.12 + K.rnd() * 0.15, x = Math.cos(a) * d, z = Math.sin(a) * d; K.add(g, K.sphere(r, 10, 6), m.liquid[i % 4], x, y + 0.02, z, 0, 0, 0, [1, 0.25, 1], NO); if (i % 2) K.add(g, K.sphere(r * 0.4, 6, 4), m.liquid[i % 4], x + r * 1.2, y + 0.02, z, 0, 0, 0, [1, 0.25, 1], NO); }
}
function microscope(K, g, b) { // microscope bench: lab slab with a dark worktop edge, pulls, a small microscope and a flask (6 materials: it is rebuilt per moving platform)
  const m = M(K), W = b.w, D = b.d, H = b.h;
  K.add(g, bx(K, W, H, D, 0.08), m.benchL, 0, H / 2, 0); K.add(g, bx(K, W + 0.04, 0.08, D + 0.04, 0.03), m.top, 0, H - 0.04, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) K.add(g, bx(K, 0.24, 0.05, 0.05, 0.02), m.steel, 0, H * 0.45, s * (D / 2 + 0.025), 0, 0, 0, 1, NO);
  const x = -W * 0.2, z = D * 0.1;
  K.add(g, bx(K, 0.34, 0.05, 0.4, 0.02), m.rack, x, H + 0.025, z, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.08, 0.5, 0.1, 0.03), m.steel, x, H + 0.3, z - 0.12, 0, 0, 0, 1, NC); // base + arm
  K.add(g, bx(K, 0.1, 0.4, 0.1, 0.03), m.rack, x, H + 0.5, z + 0.02, 0.35, 0, 0, 1, NC); K.add(g, bx(K, 0.2, 0.03, 0.2, 0.01), m.rack, x, H + 0.22, z + 0.05, 0, 0, 0, 1, NO); // tube + stage
  flask(K, g, m, W * 0.28, H, -D * 0.2, 0.8);
}
function steelRamp(K, g, b) { // steel ramp with hazard-striped edges
  const m = M(K), ax = b.ramp.axis === 'z', e = 0.14;
  K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.steel, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, ax ? K.rampGeo(e + 0.02, b.h, b.d + 0.02, b.ramp) : K.rampGeo(b.w + 0.02, b.h, e + 0.02, b.ramp), m.hazard, ax ? s * (b.w / 2 - e / 2) : 0, b.h / 2 + 0.02, ax ? 0 : s * (b.d / 2 - e / 2), 0, 0, 0, 1, NC);
}
const ring = (K, g, m, R, y, x = 0, z = 0) => K.add(g, K.torus(R, 0.05, 4, 24), m, x, y, z, Math.PI / 2, 0, 0, 1, NO); // flat floor ring

export default {
  bas: [{ make: bench }, square(tank)],
  haut: [{ make: cabinet }],
  pilier: [{ make: tubeCol }],
  coin: [{ make: server }],
  plateforme: [{ make: petri }],
  rampe: [{ make: steelRamp }],
  parkour: [parkour(petri), parkour(microscope)],
  solCount: [8, 4], // floor decals per room: [at least, up to this many more]
  ambient: { n: 70, color: '#7CFF6B', size: 0.1, rise: 0.35, sway: 0.4, glow: false }, // green bubbles drifting up (Ambient.js)
  mural: [
    { make(K, g) { // periodic table: steel frame, title bar, coloured cells with a symbol dash, legend
      const m = M(K); K.add(g, bx(K, 3.7, 2.4, 0.08, 0.03), m.steelD, 0, 2.6, 0.03, 0, 0, 0, 1, NC); K.add(g, bx(K, 3.4, 2.1, 0.06, 0.02), m.poster, 0, 2.6, 0.06, 0, 0, 0, 1, NO);
      K.add(g, bx(K, 1.4, 0.12, 0.02, 0.005), m.rack, -0.9, 3.52, 0.1, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.5, 0.12, 0.02, 0.005), m.bench, 0.1, 3.52, 0.1, 0, 0, 0, 1, NO);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) if (r > 0 || c === 0 || c === 8) { const x = -1.45 + c * 0.36, y = 3.28 - r * 0.34; K.add(g, bx(K, 0.3, 0.28, 0.02, 0.005), m.cell[(r + c) % 5], x, y, 0.09, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.14, 0.03, 0.02, 0.005), m.rack, x, y - 0.02, 0.105, 0, 0, 0, 1, NO); }
      for (let i = 0; i < 5; i++) { K.add(g, bx(K, 0.2, 0.12, 0.02, 0.005), m.cell[i], -1.4 + i * 0.7, 1.75, 0.09, 0, 0, 0, 1, NO); K.add(g, bx(K, 0.3, 0.03, 0.02, 0.005), m.rack, -1.15 + i * 0.7, 1.75, 0.1, 0, 0, 0, 1, NO); }
    } },
    { make(K, g, o) { // pipes: two pink runs, steel riser, elbows, flanges, pressure gauge and a red valve wheel
      const m = M(K), y = Math.min(o.h - 1, 5.5);
      for (const z of [0.3, 0.7]) { K.add(g, cy(0.14, 0.14, 6, 12), m.pipe, 0, y - z, z, 0, 0, Math.PI / 2, 1, NC); for (const x of [-2.4, 0, 2.4]) K.add(g, K.torus(0.15, 0.04, 4, 12), m.steelD, x, y - z, z, 0, Math.PI / 2, 0, 1, NO); K.add(g, bx(K, 0.12, 0.3, 0.3, 0.03), m.steelD, 1.5, y - z + 0.2, z - 0.1, 0, 0, 0, 1, NO); }
      K.add(g, cy(0.14, 0.14, y, 12), m.steel, -2.4, y / 2, 0.3, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.2, 8, 6), m.steel, -2.4, y - 0.3, 0.3, 0, 0, 0, 1, NC);
      K.add(g, K.torus(0.3, 0.06, 6, 14), m.ledR, -2.4, 1.6, 0.3, Math.PI / 2, 0, 0, 1, NO); K.add(g, bx(K, 0.5, 0.06, 0.06, 0.02), m.ledR, -2.4, 1.6, 0.3, 0, 0, 0, 1, NO);
      K.add(g, cy(0.26, 0.26, 0.1, 14), m.glass, 0.9, y - 0.9, 0.5, Math.PI / 2, 0, 0, 1, NC); K.add(g, bx(K, 0.03, 0.2, 0.02, 0.005), m.rack, 0.9, y - 0.9, 0.57, 0, 0, 0.6, 1, NO); // gauge
    } },
    { make(K, g) { // diamond hazard sign with a three-lobed symbol and a caption plate
      const m = M(K); K.add(g, bx(K, 1.2, 1.2, 0.06, 0.12), m.cell[4], 0, 2.3, 0.05, 0, 0, Math.PI / 4, 1, NC); K.add(g, K.sphere(0.12, 8, 6), m.rack, 0, 2.3, 0.1, 0, 0, 0, [1, 1, 0.3], NO);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; K.add(g, K.torus(0.17, 0.05, 5, 12), m.rack, Math.sin(a) * 0.3, 2.3 + Math.cos(a) * 0.3, 0.1, 0, 0, 0, 1, NO); }
      K.add(g, bx(K, 1.0, 0.24, 0.05, 0.03), m.hazard, 0, 1.4, 0.04, 0, 0, 0, 1, NC); K.add(g, bx(K, 0.1, 0.4, 0.02, 0.005), m.cable, 0.7, 2.25, 0.1, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // molecule board: dark panel with a ring of coloured atoms joined by bonds, plus side chains
      const m = M(K); K.add(g, bx(K, 3.2, 2.2, 0.08, 0.04), m.steelD, 0, 2.6, 0.04, 0, 0, 0, 1, NC); K.add(g, bx(K, 3.0, 2.0, 0.04, 0.01), m.rack, 0, 2.6, 0.09, 0, 0, 0, 1, NO);
      const pts = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; pts.push([-0.5 + Math.cos(a) * 0.6, 2.6 + Math.sin(a) * 0.6]); }
      pts.forEach(([x, y], i) => { const [nx, ny] = pts[(i + 1) % 6]; K.add(g, bx(K, Math.hypot(nx - x, ny - y), 0.05, 0.02, 0.005), m.poster, (x + nx) / 2, (y + ny) / 2, 0.12, 0, 0, Math.atan2(ny - y, nx - x), 1, NO); K.add(g, K.sphere(0.13, 8, 6), m.cell[i % 5], x, y, 0.14, 0, 0, 0, [1, 1, 0.3], NO); });
      for (const [x, y, u] of [[1.0, 2.9, 0], [1.1, 2.3, 1], [1.0, 2.6, 2]]) { K.add(g, bx(K, 0.4, 0.05, 0.02, 0.005), m.poster, x, y, 0.12, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.12, 8, 6), m.cell[(u + 2) % 5], x + 0.25, y, 0.14, 0, 0, 0, [1, 1, 0.3], NO); }
      K.add(g, bx(K, 2.0, 0.04, 0.02, 0.005), m.poster, 0, 1.78, 0.12, 0, 0, 0, 1, NO); K.add(g, bx(K, 1.2, 0.04, 0.02, 0.005), m.cell[1], -0.4, 1.7, 0.12, 0, 0, 0, 1, NO);
    } },
    { make(K, g) { // wall monitor with a green heartbeat trace
      const m = M(K); K.add(g, bx(K, 2.2, 1.4, 0.12, 0.05), m.top, 0, 2.7, 0.06, 0, 0, 0, 1, NC); K.add(g, bx(K, 2.0, 1.2, 0.03, 0.01), m.rack, 0, 2.7, 0.13, 0, 0, 0, 1, NO);
      let x = -0.9, y = 2.7; for (const dy of [0, 0.5, -0.8, 0.6, -0.3, 0, 0]) { const nx = x + 0.26, ny = 2.7 + dy; K.add(g, bx(K, Math.hypot(0.26, ny - y) + 0.03, 0.045, 0.02, 0.005), m.led, (x + nx) / 2, (y + ny) / 2, 0.15, 0, 0, Math.atan2(ny - y, 0.26), 1, NO); x = nx; y = ny; }
      K.add(g, bx(K, 0.3, 0.2, 0.03, 0.01), m.steelD, 0, 1.85, 0.04, 0, 0, 0, 1, NC);
    } },
  ],
  sol: [
    { r: 2.4, make(K, g) { const m = M(K); K.add(g, bx(K, 4.4, 0.01, 0.4, 0.005), m.hazard, 0, 0.008, 0, 0, 0, 0, 1, NO); for (const z of [-0.3, 0.3]) K.add(g, bx(K, 4.4, 0.012, 0.04, 0.004), m.rack, 0, 0.009, z, 0, 0, 0, 1, NO); } }, // hazard strip with edge lines
    { r: 1.2, make(K, g) { const m = M(K); K.add(g, cy(0.9, 0.9, 0.02, 24), m.liquid[Math.floor(K.rnd() * 4)], 0, 0.012, 0, 0, 0, 0, [1, 1, 0.6], NO); K.add(g, K.sphere(0.2, 10, 7), m.glass, 0.9, 0.12, 0.3, 0, 0, Math.PI / 2, [1, 1.4, 1], NC); for (const [x, z, r] of [[-1.1, 0.3, 0.12], [-0.6, -0.7, 0.09]]) K.add(g, cy(r, r, 0.02, 10), m.liquid[0], x, 0.012, z, 0, 0, 0, 1, NO); } }, // glowing spill and a fallen flask
    { r: 1.0, make(K, g) { const m = M(K); for (let i = 0; i < 3; i++) K.add(g, K.torus(0.6 - i * 0.15, 0.04, 6, 24), m.cable, 0, 0.04 + i * 0.01, 0, Math.PI / 2, 0, 0, 1, NO); K.add(g, bx(K, 0.2, 0.08, 0.14, 0.02), m.rack, 0.7, 0.05, 0.3, 0, 0.4, 0, 1, NO); } }, // cable coil and plug
    { r: 1.3, make(K, g) { const m = M(K); ring(K, g, m.hazard, 1.0, 0.012); ring(K, g, m.hazard, 0.7, 0.012); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; K.add(g, bx(K, 0.5, 0.012, 0.1, 0.004), m.hazard, Math.cos(a) * 0.85, 0.01, Math.sin(a) * 0.85, 0, -a, 0, 1, NO); } } }, // safety shower ring
    { r: 1.5, make(K, g) { const m = M(K); for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) if (x * z > 0) K.add(g, bx(K, 0.96, 0.012, 0.96, 0.004), m.steel, x, 0.006, z, 0, 0, 0, 1, NO); } }, // pale floor tiles
    { r: 1.0, make(K, g) { const m = M(K); for (let i = 0; i < 3; i++) { const c = m.liquid[i]; K.add(g, K.capsule(0.04,  0.22, 2, 5), c, (i - 1) * 0.28, 0.05, (i % 2 ? 0.1 : -0.1), 0, 0.3 * i, Math.PI / 2, 1, NO); K.add(g, cy(0.05, 0.05, 0.012, 8), c, (i - 1) * 0.28 + 0.18, 0.008, (i % 2 ? 0.1 : -0.1) + 0.1, 0, 0, 0, 1, NO); } } }, // dropped test tubes
  ],
};
