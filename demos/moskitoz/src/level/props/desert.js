// Pyramide: sandstone blocks with carved glyph panels, painted clay urns, golden sarcophagi with a pharaoh face, hieroglyph
// walls, lotus columns, obelisk corners, floating slabs with turquoise inlay, sand ramps; torches, glyph panels, the eye, a
// winged sun, a cat statue and a tapestry on the walls; dunes, scarabs, pottery shards, royal rugs and ankh inlays on the floor.
// Golden dust floats in the air.
import { NC, NO, alongX, parkour, ramp, spread, square } from './common.js';

const tube = (K, rt, rb, h, seg = 8) => K.lathe([[0.001, -h / 2], [rb, -h / 2], [rt, h / 2], [0.001, h / 2]], seg); // cheap cylinder without bevel: thin posts, rings and flat discs

const M = (K) => ({
  stone: K.m('#E2B862', { rim: 0.12 }), stoneL: K.m('#F2D494'), stoneD: K.m('#C89A48'), sand: K.m('#EAC878', { pattern: 'dots', color2: '#DDB866', scale: 0.2 }), turq: K.m('#40C0B0', { rim: 0.3 }),
  gold: K.m('#FFC62E', { rim: 0.5 }), clay: K.m('#C8703C', { rim: 0.15 }), clayD: K.m('#A8582C'), ink: K.f('#3D2A0E'), glyph: [K.f('#40C0B0'), K.f('#D84A3A'), K.f('#3D2A0E'), K.f('#2A6AC8')],
  wood: K.m('#A8703C'), flame: K.glow('#FFB030', 2.4), flameC: K.glow('#FFF0A0', 2.8), blue: K.m('#2A6AC8', { rim: 0.3 }), white: K.f('#FFF6E0'),
});

function glyph(K, g, m, k, x, y, z, c) { // one painted sign: ankh, eye, waves, sun, reeds or pyramid (flat bars and discs, no outline)
  if (k === 0) { K.add(g, K.box(0.06, 0.28, 0.02, 0.005), c, x, y - 0.04, z, 0, 0, 0, 1, NO); K.add(g, K.box(0.2, 0.06, 0.02, 0.005), c, x, y, z, 0, 0, 0, 1, NO); K.add(g, K.torus(0.06, 0.022, 3, 8), c, x, y + 0.17, z, 0, 0, 0, 1, NO); }
  else if (k === 1) { K.add(g, K.sphere(0.13, 8, 6), c, x, y, z, 0, 0, 0, [1.5, 0.7, 0.1], NO); K.add(g, K.sphere(0.045, 5, 4), m.white, x + 0.02, y, z + 0.01, 0, 0, 0, [1, 1, 0.3], NO); K.add(g, K.box(0.06, 0.1, 0.02, 0.005), c, x - 0.1, y - 0.11, z, 0, 0, 0.3, 1, NO); }
  else if (k === 2) for (let i = 0; i < 3; i++) K.add(g, K.box(0.2, 0.03, 0.02, 0.005), c, x, y - 0.1 + i * 0.1, z, 0, 0, i % 2 ? 0.2 : -0.2, 1, NO);
  else if (k === 3) { K.add(g, tube(K, 0.1, 0.1, 0.02, 10), c, x, y, z, Math.PI / 2, 0, 0, 1, NO); K.add(g, tube(K, 0.04, 0.04, 0.025, 6), m.white, x, y, z, Math.PI / 2, 0, 0, 1, NO); }
  else if (k === 4) for (let i = 0; i < 3; i++) K.add(g, K.box(0.05, 0.22 + (i === 1) * 0.1, 0.02, 0.005), c, x + (i - 1) * 0.09, y + (i === 1) * 0.04, z, 0, 0, (i - 1) * 0.1, 1, NO);
  else K.add(g, K.cone(0.16, 0.02, 3), c, x, y, z, Math.PI / 2, 0, 0, 1, NO);
}
function glyphs(K, g, m, L, y, z, n = 6) { // a band of signs along x on the face at z (negative z = the back face)
  const f = z < 0 ? K.sub(g, 0, 0, 0, Math.PI) : g, zz = Math.abs(z), o = Math.floor(K.rnd() * 6);
  for (const [i, x] of spread(n, L - 0.4).entries()) glyph(K, f, m, (i + o) % 6, z < 0 ? -x : x, y, zz, m.glyph[i % 4]);
}
function band(K, g, m, L, y, z, h = 0.5) { // carved panel for a glyph band: darker plate with turquoise rules above and below
  const f = z < 0 ? K.sub(g, 0, 0, 0, Math.PI) : g, zz = Math.abs(z);
  K.add(f, K.box(L, h, 0.02, 0.005), m.stoneD, 0, y, zz, 0, 0, 0, 1, NO); for (const s of [-1, 1]) K.add(f, K.box(L, 0.035, 0.025, 0.005), m.turq, 0, y + s * (h / 2 + 0.02), zz, 0, 0, 0, 1, NO);
}
function block(K, g, b) { // sandstone block: darker plinth, lighter cornice, a carved glyph panel on both faces, chipped corners
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, 0.08), m.stone, 0, H / 2, 0);
  K.add(g, K.box(L + 0.06, 0.22, T + 0.06, 0.06), m.stoneD, 0, 0.11, 0, 0, 0, 0, 1, NO); K.add(g, K.box(L + 0.04, 0.16, T + 0.04, 0.05), m.stoneL, 0, H - 0.08, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) { band(K, g, m, L * 0.9, H * 0.6, s * (T / 2 + 0.005)); glyphs(K, g, m, L * 0.9, H * 0.6, s * (T / 2 + 0.03), Math.max(3, Math.round(L / 0.5))); }
  for (const [x, z] of [[-1, 1], [1, -1]]) K.add(g, K.box(0.14, 0.12, 0.14, 0.03), m.stoneD, x * (L / 2 - 0.05), H - 0.2, z * (T / 2 - 0.05), 0, 0.4, 0, 1, NO);
}
function urns(K, g, b) { // big clay amphora on a stepped plinth: lathe body, handles, painted triangles and bands, a gold-ringed neck
  const m = M(K), S = Math.min(b.w, b.d), H = b.h, R = S / 2 - 0.05, bh = H - 0.3, y0 = 0.3;
  K.add(g, K.box(S, 0.18, S, 0.05), m.stoneD, 0, 0.09, 0); K.add(g, K.box(S * 0.88, 0.12, S * 0.88, 0.04), m.stone, 0, 0.24, 0, 0, 0, 0, 1, NC);
  K.add(g, K.lathe([[0.001, 0], [R * 0.55, 0], [R * 0.95, bh * 0.35], [R, bh * 0.55], [R * 0.55, bh * 0.88], [R * 0.45, bh], [R * 0.6, bh], [0.001, bh]], 20), m.clay, 0, y0, 0);
  K.add(g, K.torus(R * 0.98, 0.05, 6, 24), m.clayD, 0, y0 + bh * 0.55, 0, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.torus(R * 0.52, 0.05, 6, 16), m.gold, 0, y0 + bh * 0.97, 0, Math.PI / 2, 0, 0, 1, NO);
  K.add(g, K.torus(R * 0.7, 0.04, 6, 20), m.turq, 0, y0 + bh * 0.2, 0, Math.PI / 2, 0, 0, 1, NO);
  for (const s of [-1, 1]) K.add(g, K.torus(bh * 0.2, 0.045, 5, 10, Math.PI * 1.1), m.clayD, s * R * 0.62, y0 + bh * 0.75, 0, 0, 0, s * 1.2 + (s < 0 ? Math.PI : 0) - 0.4, 1, NO); // handles
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28, r = R * (0.99 - 0.04 * Math.abs(Math.sin(i))); K.add(g, K.box(0.09, 0.2, 0.02, 0.005), i % 2 ? m.turq : m.white, Math.cos(a) * r, y0 + bh * 0.45, Math.sin(a) * r, 0, Math.PI / 2 - a, 0, 1, NO); } // painted zigzag
}
function sarcophagus(K, g, b) { // golden sarcophagus lying down: stone base, a pharaoh head with a striped headdress, crossed arms, blue stripes
  const m = M(K), { L, T } = alongX(g, b), H = b.h, r = Math.min(T, 1) * 0.3, hx = L / 2 - Math.min(T, 1) * 0.45;
  K.add(g, K.box(L, H, T, Math.min(T, H) * 0.35), m.gold, 0, H / 2, 0); K.add(g, K.box(L * 0.98, 0.16, T * 0.98, 0.05), m.stoneD, 0, 0.08, 0, 0, 0, 0, 1, NO);
  for (const x of spread(4, L * 0.5)) K.add(g, K.box(0.1, 0.02, T * 0.8, 0.005), m.blue, x - L * 0.1, H + 0.005, 0, 0, 0, 0, 1, NO);
  K.add(g, K.sphere(r * 1.05, 12, 8), m.turq, hx, H, 0, 0, 0, 0, [1.05, 0.4, 1.1], NO); K.add(g, K.sphere(r * 0.7, 10, 6), m.stoneL, hx + r * 0.1, H + 0.04, 0, 0, 0, 0, [1, 0.4, 0.9], NO); // headdress and face
  for (const s of [-1, 1]) { K.add(g, K.sphere(0.035, 5, 4), m.ink, hx + r * 0.35, H + 0.08, s * r * 0.3, 0, 0, 0, 1, NO); K.add(g, K.box(r * 0.8, 0.03, 0.05, 0.01), m.blue, hx - r * 0.1, H + 0.015, s * r * 1.0, 0, 0, 0, 1, NO); }
  K.add(g, K.box(0.1, 0.1, 0.06, 0.02), m.blue, hx + r * 0.95, H - 0.02, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) K.add(g, K.capsule(0.05, T * 0.35, 3, 6), m.turq, hx - r * 2.0, H + 0.015, s * T * 0.12, Math.PI / 2, 0.5 * s, 0, [1, 0.5, 1], NO); // crossed arms
  K.add(g, K.box(0.07, 0.025, T * 0.55, 0.01), m.gold, hx - r * 2.8, H + 0.01, 0, 0, 0, 0, 1, NO);
}
function glyphWall(K, g, b) { // hieroglyph wall: plinth, two carved bands per face, stone coping
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H - 0.2, T, 0.05), m.stoneL, 0, (H - 0.2) / 2, 0); K.add(g, K.box(L + 0.1, 0.2, T + 0.12, 0.05), m.stoneD, 0, H - 0.1, 0, 0, 0, 0, 1, NC);
  K.add(g, K.box(L + 0.06, 0.22, T + 0.06, 0.05), m.stoneD, 0, 0.11, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) for (const y of [H * 0.35, H * 0.7]) { band(K, g, m, L * 0.96, y, s * (T / 2 + 0.005)); glyphs(K, g, m, L, y, s * (T / 2 + 0.03), Math.max(4, Math.round(L / 0.55))); }
}
function lotus(K, g, b) { // lotus column: round base, painted bands, a glyph cartouche, a flared capital with petals and an abacus
  const m = M(K), R = (b.r ?? b.w / 2) * 0.85, H = b.h;
  K.add(g, K.cyl(R, R * 1.05, H, 0.06, 18), m.stoneL, 0, H / 2, 0);
  K.add(g, K.cyl(R * 1.25, R * 1.3, 0.3, 0.08, 18), m.stoneD, 0, 0.15, 0, 0, 0, 0, 1, NO);
  for (const [i, y] of [0.8, 1.1, 3.6].entries()) K.add(g, tube(K, R * 1.04, R * 1.04, 0.16, 18), [m.turq, m.gold, m.turq][i], 0, y, 0, 0, 0, 0, 1, NO);
  K.add(g, K.cyl(R * 1.18, R * 0.95, 0.6, 0.08, 18), m.turq, 0, 4.2, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; K.add(g, K.cone(0.13, 0.5, 5), m.gold, Math.cos(a) * R * 1.12, 4.7, Math.sin(a) * R * 1.12, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25, 1, NO); }
  K.add(g, K.box(R * 2.5, 0.2, R * 2.5, 0.06), m.stoneD, 0, 4.58, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) { const f = s < 0 ? K.sub(g, 0, 0, 0, Math.PI) : g; K.add(f, K.box(0.34, 1.4, 0.02, 0.005), m.stoneD, 0, 2.3, R + 0.005, 0, 0, 0, 1, NO); for (let i = 0; i < 3; i++) glyph(K, f, m, (i * 2 + 1) % 6, 0, 2.8 - i * 0.45, R + 0.02, m.glyph[i]); }
}
function obelisk(K, g, b) { // obelisk corner: stepped plinth, glyph columns, turquoise and gold bands, a sun disc
  const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.06), m.stone, 0, b.h / 2, 0);
  K.add(g, K.box(b.w + 0.1, 0.3, b.d + 0.1, 0.06), m.stoneD, 0, 0.15, 0, 0, 0, 0, 1, NO); K.add(g, K.box(b.w + 0.05, 0.3, b.d + 0.05, 0.05), m.stoneL, 0, 0.45, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) { const f = s < 0 ? K.sub(g, 0, 0, 0, Math.PI) : g, z = b.d / 2 + 0.01; K.add(f, K.box(0.5, 2.1, 0.02, 0.005), m.stoneD, 0, 1.75, z, 0, 0, 0, 1, NO); for (let i = 0; i < 4; i++) glyph(K, f, m, (i * 2 + (s > 0 ? 0 : 1)) % 6, 0, 0.95 + i * 0.5, z + 0.015, m.glyph[i % 4]); }
  for (const y of [1.2, 2.9]) K.add(g, K.box(b.w + 0.04, 0.08, b.d + 0.04, 0.02), m.turq, 0, y, 0, 0, 0, 0, 1, NO);
  K.add(g, K.box(b.w + 0.06, 0.3, b.d + 0.06, 0.05), m.gold, 0, 3.2, 0, 0, 0, 0, 1, NC);
}
function slab(K, g, b) { // floating slab: bevelled stone, a carved border, turquoise inlay diamond, gold studs
  const m = M(K), h = b.h; K.add(g, K.box(b.w, h, b.d, Math.min(0.14, h * 0.4)), m.stone, 0, h / 2, 0);
  for (const [w, d, x, z] of [[b.w * 0.86, 0.04, 0, b.d * 0.38], [b.w * 0.86, 0.04, 0, -b.d * 0.38], [0.04, b.d * 0.76, b.w * 0.43, 0], [0.04, b.d * 0.76, -b.w * 0.43, 0]]) K.add(g, K.box(w, 0.02, d, 0.005), m.stoneD, x, h + 0.005, z, 0, 0, 0, 1, NO);
  K.add(g, K.box(Math.min(b.w, b.d) * 0.4, 0.02, Math.min(b.w, b.d) * 0.4, 0.005), m.turq, 0, h + 0.01, 0, 0, Math.PI / 4, 0, 1, NO); K.add(g, K.box(Math.min(b.w, b.d) * 0.16, 0.025, Math.min(b.w, b.d) * 0.16, 0.005), m.gold, 0, h + 0.015, 0, 0, Math.PI / 4, 0, 1, NO);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add(g, K.sphere(0.06, 5, 4), m.gold, x * (b.w / 2 - 0.15), h + 0.005, z * (b.d / 2 - 0.15), 0, 0, 0, [1, 0.5, 1], NO);
}

export default {
  bas: [{ make: block }, square(urns), { make: sarcophagus }],
  haut: [{ make: glyphWall }],
  pilier: [{ make: lotus }],
  coin: [{ make: obelisk }],
  plateforme: [{ make: slab }],
  rampe: [{ make: ramp((K) => M(K).sand) }],
  parkour: [parkour(slab)],
  solCount: [5, 3], // floor decals per room: dunes, rugs, ankh inlays, scarabs and shards over the plain sand
  ambient: { n: 90, color: '#D9A441', size: 0.08, rise: 0.1, sway: 0.5, glow: false }, // golden dust drifting (Ambient.js)
  mural: [
    { make(K, g) { const m = M(K); for (const x of [-1.4, 1.4]) { K.add(g, K.box(0.7, 1.1, 0.1, 0.06), m.stoneL, x, 2.6, 0.05, 0, 0, 0, 1, NC); K.add(g, K.box(0.2, 0.5, 0.3, 0.05), m.wood, x, 2.4, 0.2, 0, 0, 0, 1, NC); K.add(g, tube(K, 0.22, 0.12, 0.3, 10), m.stoneD, x, 2.75, 0.35, 0, 0, 0, 1, NC); K.add(g, K.torus(0.2, 0.03, 3, 12), m.gold, x, 2.88, 0.35, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.sphere(0.2, 8, 6), m.flame, x, 3.1, 0.35, 0, 0, 0, [0.9, 1.5, 0.9], NO); K.add(g, K.sphere(0.1, 8, 6), m.flameC, x, 3.02, 0.36, 0, 0, 0, [0.9, 1.4, 0.9], NO); } glyph(K, g, m, 0, 0, 2.6, 0.06, m.glyph[0]); } }, // torches on carved plates, an ankh between them
    { make(K, g) { const m = M(K); K.add(g, K.box(3.4, 2.4, 0.1, 0.06), m.stoneD, 0, 2.2, 0.05, 0, 0, 0, 1, NC); K.add(g, K.box(3.2, 2.2, 0.08, 0.03), m.stoneL, 0, 2.2, 0.08, 0, 0, 0, 1, NO); for (const [i, y] of [1.5, 2.2, 2.9].entries()) { band(K, g, m, 3.0, y, 0.115, 0.5); glyphs(K, g, m, 3, y, 0.13, 6); } } }, // glyph panel in a frame
    { make(K, g) { const m = M(K); K.add(g, K.box(3.2, 1.9, 0.08, 0.1), m.stoneD, 0, 3.0, 0.04, 0, 0, 0, 1, NC); K.add(g, K.box(2.9, 1.6, 0.04, 0.08), m.stoneL, 0, 3.0, 0.08, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.8, 16, 10), m.white, 0, 3, 0.1, 0, 0, 0, [1.4, 0.6, 0.05], NO); K.add(g, tube(K, 0.32, 0.32, 0.04, 16), m.blue, 0, 3, 0.14, Math.PI / 2, 0, 0, 1, NO); K.add(g, tube(K, 0.12, 0.12, 0.05, 10), m.ink, 0, 3, 0.16, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.box(0.08, 0.7, 0.04, 0.01), m.ink, -0.2, 2.45, 0.14, 0, 0, 0.3, 1, NO); K.add(g, K.box(2.4, 0.12, 0.04, 0.01), m.ink, 0, 3.55, 0.14, 0, 0, 0, 1, NO); K.add(g, K.box(0.7, 0.1, 0.04, 0.01), m.turq, 0.9, 2.6, 0.14, 0, 0, 0.2, 1, NO); } }, // the eye in a cartouche
    { make(K, g, o) { // winged sun: gold disc, tiered turquoise/blue/gold wings, two cobras
      const m = M(K), y = Math.min(o.h - 1.5, 4.4); K.add(g, tube(K, 0.5, 0.5, 0.1, 18), m.gold, 0, y, 0.12, Math.PI / 2, 0, 0, 1, NC); K.add(g, tube(K, 0.3, 0.3, 0.12, 12), m.clay, 0, y, 0.14, Math.PI / 2, 0, 0, 1, NO);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const w = 1.5 - i * 0.2; K.add(g, K.box(w, 0.14, 0.05, 0.02), [m.turq, m.blue, m.gold][i % 3], s * (0.5 + w / 2), y + 0.1 - i * 0.17, 0.1 + i * 0.005, 0, 0, s * (-0.04 * i), 1, i ? NO : NC); }
      for (const s of [-1, 1]) { K.add(g, K.capsule(0.05, 0.4, 3, 6), m.clay, s * 0.4, y - 0.55, 0.14, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.09, 6, 4), m.clay, s * 0.4, y - 0.3, 0.14, 0, 0, 0, [1, 0.8, 0.6], NO); }
    } },
    { make(K, g) { // cat statue on a pedestal: black stone, gold collar, glowing-gold eyes
      const m = M(K); K.add(g, K.box(1.0, 0.7, 0.8, 0.12), m.stoneL, 0, 0.35, 0.5); K.add(g, K.box(1.1, 0.12, 0.9, 0.05), m.stoneD, 0, 0.74, 0.5, 0, 0, 0, 1, NC);
      K.add(g, K.sphere(0.4, 12, 8), m.blue, 0, 1.3, 0.5, 0, 0, 0, [0.9, 1.5, 0.8]); K.add(g, K.sphere(0.27, 12, 8), m.blue, 0, 2.05, 0.55, 0, 0, 0, 1, NO); K.add(g, K.torus(0.25, 0.05, 5, 14), m.gold, 0, 1.85, 0.55, Math.PI / 2, 0, 0, 1, NO);
      for (const s of [-1, 1]) { K.add(g, K.cone(0.1, 0.28, 4), m.blue, s * 0.17, 2.35, 0.52, 0, 0.8, s * 0.2, 1, NO); K.add(g, K.sphere(0.045, 6, 4), m.gold, s * 0.1, 2.1, 0.8, 0, 0, 0, 1, NO); K.add(g, K.capsule(0.07, 0.5, 3, 6), m.blue, s * 0.2, 1.05, 0.86, 0, 0, 0, 1, NO); }
      K.add(g, K.capsule(0.06, 0.8, 3, 6), m.blue, 0.5, 0.95, 0.4, 0.3, 0, 0.6, 1, NO);
    } },
    { make(K, g, o) { // hanging tapestry: turquoise cloth, gold border and fringe, a sun and an ankh
      const m = M(K), y = Math.min(o.h - 0.8, 5.2); K.add(g, tube(K, 0.05, 0.05, 2.0, 6), m.wood, 0, y, 0.2, 0, 0, Math.PI / 2, 1, NO); for (const s of [-1, 1]) K.add(g, K.sphere(0.09, 6, 4), m.gold, s * 1.0, y, 0.2, 0, 0, 0, 1, NO);
      K.add(g, K.box(1.8, 3.0, 0.05, 0.02), m.turq, 0, y - 1.55, 0.22, 0, 0, 0, 1, NC); for (const [w, h, x, yy] of [[1.8, 0.1, 0, -0.05], [0.1, 3.0, -0.85, -1.55], [0.1, 3.0, 0.85, -1.55]]) K.add(g, K.box(w, h, 0.06, 0.01), m.gold, x, y + yy, 0.23, 0, 0, 0, 1, NO);
      K.add(g, tube(K, 0.4, 0.4, 0.05, 16), m.gold, 0, y - 1.1, 0.26, Math.PI / 2, 0, 0, 1, NO); glyph(K, g, m, 0, 0, y - 2.0, 0.26, m.glyph[1]); for (const x of spread(8, 1.5)) K.add(g, K.box(0.05, 0.25, 0.02, 0.005), m.gold, x, y - 3.15, 0.22, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 2.0, make(K, g) { const m = M(K); K.add(g, K.sphere(1.7, 16, 8), m.sand, 0, 0, 0, 0, 0, 0, [1, 0.22, 0.75], NO); for (const y of [0.1, 0.2, 0.28]) K.add(g, K.torus(1.7 * Math.sqrt(1 - (y / 0.374) ** 2), 0.012, 3, 28), m.stoneD, 0, y, 0, Math.PI / 2, 0, 0, [1, 0.75, 1], NO); } }, // dune with wind ripples
    { r: 0.6, make(K, g) { const m = M(K); K.add(g, K.sphere(0.3, 12, 8), m.turq, 0, 0.12, 0, 0, 0, 0, [1, 0.45, 1.3]); K.add(g, K.sphere(0.14, 8, 6), m.turq, 0, 0.1, 0.42, 0, 0, 0, 1, NO); K.add(g, K.box(0.02, 0.02, 0.5, 0.005), m.ink, 0, 0.27, -0.02, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.05, 5, 4), m.gold, 0, 0.2, 0.52, 0, 0, 0, 1, NO); for (let i = 0; i < 6; i++) K.add(g, K.capsule(0.025, 0.25, 2, 4), m.ink, (i % 2 ? 1 : -1) * 0.3, 0.05, (Math.floor(i / 2) - 1) * 0.22, 0, 0, Math.PI / 2, 1, NO); } }, // scarab
    { r: 1.0, make(K, g) { const m = M(K); for (let i = 0; i < 5; i++) K.add(g, K.box(0.3 + K.rnd() * 0.2, 0.06, 0.25, 0.02), i % 2 ? m.clay : m.clayD, (K.rnd() - 0.5) * 1.4, 0.03, (K.rnd() - 0.5) * 1.4, 0, K.rnd() * 3, K.rnd() * 0.3, 1, NO); for (let i = 0; i < 3; i++) K.add(g, tube(K, 0.1, 0.1, 0.025, 8), m.gold, (K.rnd() - 0.5) * 1.2, 0.015, (K.rnd() - 0.5) * 1.2, 0, 0, 0, 1, NO); K.add(g, K.torus(0.12, 0.035, 3, 8, Math.PI * 1.2), m.clay, 0.5, 0.05, 0.4, 0, 0, 0.5, 1, NO); } }, // shards, an amphora handle and coins
    { r: 1.6, make(K, g) { // royal rug: blue field, gold border and diamond, fringe
      const m = M(K); K.add(g, K.box(2.6, 0.03, 1.6, 0.01), m.blue, 0, 0.015, 0, 0, 0, 0, 1, NC);
      for (const [w, d, x, z] of [[2.5, 0.06, 0, 0.7], [2.5, 0.06, 0, -0.7], [0.06, 1.4, 1.22, 0], [0.06, 1.4, -1.22, 0]]) K.add(g, K.box(w, 0.012, d, 0.005), m.gold, x, 0.034, z, 0, 0, 0, 1, NO);
      K.add(g, K.box(0.9, 0.012, 0.9, 0.005), m.clay, 0, 0.036, 0, 0, Math.PI / 4, 0, 1, NO); K.add(g, K.box(0.4, 0.014, 0.4, 0.005), m.gold, 0, 0.038, 0, 0, Math.PI / 4, 0, 1, NO);
      for (const s of [-1, 1]) for (const z of spread(8, 1.4)) K.add(g, K.box(0.12, 0.012, 0.03, 0.005), m.stoneL, s * 1.36, 0.008, z, 0, 0, 0, 1, NO);
    } },
    { r: 1.3, make(K, g) { // ankh inlay: a stone disc with a gold ankh
      const m = M(K); K.add(g, tube(K, 1.1, 1.15, 0.05, 20), m.stoneL, 0, 0.025, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(1.0, 0.025, 3, 28), m.turq, 0, 0.055, 0, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, K.box(0.12, 0.02, 1.0, 0.005), m.gold, 0, 0.06, -0.15, 0, 0, 0, 1, NO); K.add(g, K.box(0.55, 0.02, 0.12, 0.005), m.gold, 0, 0.06, 0.1, 0, 0, 0, 1, NO); K.add(g, K.torus(0.2, 0.06, 3, 14), m.gold, 0, 0.06, 0.55, Math.PI / 2, 0, 0, 1, NO);
    } },
  ],
};
