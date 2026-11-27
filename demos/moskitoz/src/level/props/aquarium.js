// Aquarium: coral reef rocks with anemones and sponges, golden treasure chests, giant ribbed clams, rocky ridges with kelp, kelp
// stalks as pillars, coral-crusted corner rocks, floating scallop shells, sand ramps; schools of fish, starfish, jellyfish, a
// porthole and bubble columns on the walls; sand patches with shells, bubble vents, anchors, coral gardens and seaweed on the floor.
import { NC, NO, alongX, parkour, spread, square } from './common.js';

const tube = (K, rt, rb, h, seg = 8) => K.lathe([[0.001, -h / 2], [rb, -h / 2], [rt, h / 2], [0.001, h / 2]], seg); // cheap cylinder without bevel: thin posts, rings and flat discs

const M = (K) => ({
  rock: K.m('#E0AE94', { rim: 0.2 }), rockD: K.m('#C4907A'), sand: K.m('#F2DCA8', { pattern: 'dots', color2: '#E4CA90', scale: 0.25 }), kelp: K.m('#30C894', { rim: 0.2 }), kelpD: K.m('#24A87C'), 
  coral: [K.m('#FF9F6B', { rim: 0.35 }), K.m('#F4A0A8', { rim: 0.35 }), K.m('#FFD070', { rim: 0.35 }), K.m('#B98CFF', { rim: 0.35 })], gold: K.m('#FFD070', { rim: 0.5 }), dark: K.m('#1A2A5A'), wood: K.m('#8A5A3A', { pattern: 'planks', scale: 0.3 }),
  shell: K.m('#F8E6F0', { rim: 0.3 }), pearl: K.m('#FFFFFF', { rim: 0.8 }), fish: [K.m('#FF9F6B', { rim: 0.3 }), K.m('#FFE04A', { rim: 0.3 }), K.m('#FF6B8A', { rim: 0.3 })], bubble: K.m('#DDF4FF', { rim: 0.7 }), star: K.m('#FF7A5A', { rim: 0.3 }),
});

function star(K, parent, m, x, y, z, ry, s, c, rx = 0) { // starfish lying flat (XZ plane, rx = PI/2 stands it on a wall): five round arms around a dome with dots
  const f = K.sub(parent, x, y, z, ry); f.rotation.x = rx;
  K.add(f, K.sphere(0.13 * s, 7, 5), c, 0, 0.03 * s, 0, 0, 0, 0, [1, 0.5, 1], NO);
  for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; K.add(f, K.capsule(0.07 * s, 0.2 * s, 1, 6), c, Math.sin(a) * 0.2 * s, 0.03 * s, Math.cos(a) * 0.2 * s, Math.PI / 2, 0, -a, [1, 1, 0.5], i ? NO : NC); K.add(f, K.sphere(0.025 * s, 4, 3), m.pearl, Math.sin(a) * 0.17 * s, 0.075 * s, Math.cos(a) * 0.17 * s, 0, 0, 0, 1, NO); }
  return f;
}
function branchy(K, g, c, x, y, z, s = 1) { // branch coral: a stem forking into two round-tipped fingers
  K.add(g, K.capsule(0.06 * s, 0.28 * s, 3, 6), c, x, y + 0.14 * s, z, 0, 0, 0, 1, NO);
  for (const k of [-1, 1]) { K.add(g, K.capsule(0.05 * s, 0.26 * s, 3, 6), c, x + k * 0.09 * s, y + 0.38 * s, z, 0, 0, -k * 0.45, 1, NO); K.add(g, K.sphere(0.06 * s, 6, 4), c, x + k * 0.17 * s, y + 0.53 * s, z, 0, 0, 0, 1, NO); }
}
function sponge(K, g, m, x, y, z, s = 1) { // tube sponge: three open tubes of different heights
  for (const [dx, dz, h] of [[0, 0, 0.4], [0.12, 0.05, 0.28], [-0.1, 0.08, 0.2]]) { K.add(g, tube(K, 0.07 * s, 0.09 * s, h * s, 8), m.coral[3], x + dx * s, y + (h * s) / 2, z + dz * s, 0, 0, 0, 1, NO); K.add(g, tube(K, 0.045 * s, 0.045 * s, 0.01, 8), m.dark, x + dx * s, y + h * s + 0.003, z + dz * s, 0, 0, 0, 1, NO); }
}
function anemone(K, g, m, x, y, z, c, s = 1) { // anemone: a squat foot and a crown of beaded tentacles
  K.add(g, tube(K, 0.14 * s, 0.17 * s, 0.14 * s, 8), m.rockD, x, y + 0.07 * s, z, 0, 0, 0, 1, NO);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; K.add(g, K.capsule(0.025 * s, 0.2 * s, 1, 4), c, x + Math.cos(a) * 0.1 * s, y + 0.22 * s, z + Math.sin(a) * 0.1 * s, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5, 1, NO); K.add(g, K.sphere(0.035 * s, 4, 3), m.pearl, x + Math.cos(a) * 0.17 * s, y + 0.33 * s, z + Math.sin(a) * 0.17 * s, 0, 0, 0, 1, NO); }
}
function fan(K, g, m, x, y, z, ry, s = 1) { // sea fan: a flat lacy ellipse on a short stem
  K.add(g, tube(K, 0.03 * s, 0.04 * s, 0.2 * s, 6), m.coral[0], x, y + 0.1 * s, z, 0, 0, 0, 1, NO);
  K.add(g, K.sphere(0.3 * s, 8, 6), m.coral[1], x, y + 0.42 * s, z, 0, ry, 0, [1, 1.1, 0.12], NO);
  K.add(g, K.sphere(0.18 * s, 6, 4), m.coral[2], x, y + 0.45 * s, z, 0, ry, 0, [1, 1.1, 0.2], NO);
}
function corals(K, g, m, L, T, y, n) { // a reef garden on a top surface: branch corals, anemones, sponges, brain corals, fans and a starfish
  for (let i = 0; i < n; i++) {
    const x = (K.rnd() - 0.5) * (L - 0.7), z = (K.rnd() - 0.5) * (T - 0.7), c = m.coral[Math.floor(K.rnd() * 4)], k = i % 5;
    if (k === 0) branchy(K, g, c, x, y, z); else if (k === 1) anemone(K, g, m, x, y, z, c); else if (k === 2) sponge(K, g, m, x, y, z);
    else if (k === 3) K.add(g, K.sphere(0.22, 8, 6), m.coral[2], x, y + 0.08, z, 0, 0, 0, [1, 0.75, 1], NO); else fan(K, g, m, x, y, z, K.rnd() * 3);
  }
  star(K, g, m, (K.rnd() - 0.5) * (L - 0.8), y + 0.02, (K.rnd() - 0.5) * (T - 0.8), K.rnd() * 6, 1, m.star);
}
function reef(K, g, b) { // reef rock: two-tone lumpy stone with barnacles and a garden of corals on top
  const m = M(K), W = b.w, D = b.d, H = b.h;
  K.add(g, K.box(W, H, D, Math.min(W, D, H) * 0.4), m.rock, 0, H / 2, 0);
  for (const [x, z, s] of [[0.5, 0.5, 0.3], [-0.5, 0.46, 0.34], [0.46, -0.5, 0.28], [-0.5, -0.46, 0.3]]) K.add(g, K.sphere(s, 8, 6), m.rockD, x * W, s * 0.7, z * D, 0, 0, 0, [1.1, 0.8, 1.1], NO); // boulders at the foot
  for (let i = 0; i < 4; i++) { const a = K.rnd() * 6.28, s = 0.05 + K.rnd() * 0.05; K.add(g, K.sphere(s, 5, 4), m.rockD, Math.sin(a) * (W / 2 - 0.03) * (Math.abs(Math.sin(a)) > 0.7 ? 1 : 0.2) + (Math.abs(Math.sin(a)) > 0.7 ? 0 : (K.rnd() - 0.5) * W * 0.6), H * (0.25 + K.rnd() * 0.5), Math.cos(a) * (D / 2 - 0.03) * (Math.abs(Math.cos(a)) > 0.7 ? 1 : 0.2) + (Math.abs(Math.cos(a)) > 0.7 ? 0 : (K.rnd() - 0.5) * D * 0.6), 0, 0, 0, [1, 0.6, 1], NO); } // barnacles
  corals(K, g, m, W, D, H - 0.04, 5);
}
function treasure(K, g, b) { // treasure chest: planked wood, gold bands, corner caps and lock, a pile of coins and gems on top, barnacles
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H * 0.75, T, 0.08), m.wood, 0, H * 0.375, 0);
  K.add(g, K.cyl(T / 2, T / 2, L, 0.06, 12), m.wood, 0, H * 0.75, 0, 0, 0, Math.PI / 2, [(H * 0.25) / (T / 2), 1, 1]);
  for (const x of [-L * 0.35, 0, L * 0.35]) K.add(g, K.box(0.16, H * 0.8, T + 0.04, 0.03), m.gold, x, H * 0.4, 0, 0, 0, 0, 1, NC);
  K.add(g, K.box(0.34, 0.34, 0.06, 0.05), m.gold, 0, H * 0.62, T / 2 + 0.03, 0, 0, 0, 1, NO); K.add(g, K.box(0.06, 0.14, 0.02, 0.01), m.dark, 0, H * 0.6, T / 2 + 0.07, 0, 0, 0, 1, NO);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add(g, K.sphere(0.1, 6, 4), m.gold, sx * (L / 2 - 0.03), 0.08, sz * (T / 2 - 0.03), 0, 0, 0, 1, NO);
  K.add(g, K.sphere(Math.min(0.5, T * 0.4), 10, 8), m.gold, -L * 0.15, H - 0.02, 0.05, 0, 0, 0, [1.4, 0.35, 1], NO); // coin heap
  for (let i = 0; i < 5; i++) K.add(g, tube(K, 0.12, 0.12, 0.03, 10), m.gold, -L * 0.15 + (K.rnd() - 0.4) * 0.8, H + 0.03 + (i % 2) * 0.05, (K.rnd() - 0.3) * T * 0.5, (K.rnd() - 0.5) * 0.6, K.rnd() * 3, 0, 1, NO);
  K.add(g, K.sphere(0.1, 6, 4), m.fish[2], L * 0.2, H + 0.03, T * 0.1, 0, 0, 0, [1, 0.8, 1], NO); K.add(g, K.sphere(0.07, 6, 4), m.pearl, L * 0.28, H + 0.02, -T * 0.1, 0, 0, 0, 1, NO);
  for (const [x, y] of [[0.3, 0.3], [-0.4, 0.5]]) K.add(g, K.sphere(0.06, 5, 4), m.rockD, x * L, y * H, T / 2 + 0.01, 0, 0, 0, [1, 0.7, 0.6], NO); // barnacles
}
function ribs(K, g, mat, R, sy, n) { for (let i = 0; i < n; i++) K.add(g, K.torus(R, 0.03, 3, 8, Math.PI), mat, 0, 0, 0, 0, (i * Math.PI) / n, 0, [1, sy, 1], NO); } // meridian ribs over a half-ellipsoid
function clam(K, g, b) { // giant clam: two ribbed shells, a pink mantle and a pearl between them
  const m = M(K), R = Math.min(b.w, b.d) / 2 - 0.05, H = b.h;
  K.add(g, K.sphere(R, 16, 10), m.shell, 0, 0, 0, 0, 0, 0, [1, (H * 0.55) / R, 1]); ribs(K, K.sub(g, 0, 0, 0), m.coral[1], R * 1.005, (H * 0.55) / R, 5);
  K.add(g, K.sphere(R * 0.92, 10, 6), m.coral[1], 0, H * 0.3, R * 0.04, 0, 0, 0, [1, 0.3, 0.9], NO);
  const up = K.sub(g, 0, H * 0.45, -R * 0.15); up.rotation.x = -0.35;
  K.add(up, K.sphere(R, 16, 10), m.shell, 0, 0, 0, 0, 0, 0, [1, (H * 0.35) / R, 0.95], NO); ribs(K, up, m.coral[1], R * 1.005, (H * 0.35) / R, 5);
  K.add(g, K.sphere(Math.min(0.35, H * 0.2), 10, 8), m.pearl, 0, H * 0.55, R * 0.3, 0, 0, 0, 1, NO);
}
function ridge(K, g, b) { // rocky ridge with a lumpy crest, barnacles and swaying kelp fronds with air bladders
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H * 0.55, T, 0.25), m.rock, 0, H * 0.275, 0);
  for (const x of spread(Math.max(2, Math.round(L / 1.2)), L - 0.4)) K.add(g, K.sphere(T * 0.45, 8, 6), m.rockD, x + (K.rnd() - 0.5) * 0.3, H * 0.55, (K.rnd() - 0.5) * T * 0.3, 0, 0, 0, [1.3, 0.6, 1], NO);
  for (const x of spread(Math.max(3, Math.round(L / 0.7)), L - 0.3)) {
    const h = H * (0.2 + K.rnd() * 0.2), z = (K.rnd() - 0.5) * T * 0.6, c = K.rnd() < 0.5 ? m.kelp : m.kelpD;
    K.add(g, K.capsule(0.12, h, 2, 6), c, x, H * 0.55 + h / 2 - 0.1, z, (K.rnd() - 0.5) * 0.2, 0, (K.rnd() - 0.5) * 0.2, [1, 1, 0.5], NC);
    K.add(g, K.sphere(0.07, 6, 4), m.coral[2], x + 0.1, H * 0.55 + h * 0.6, z, 0, 0, 0, 1, NO);
  }
  for (let i = 0; i < 5; i++) K.add(g, K.sphere(0.06, 5, 4), m.rockD, (K.rnd() - 0.5) * L * 0.8, H * (0.15 + K.rnd() * 0.3), (K.rnd() < 0.5 ? -1 : 1) * (T / 2 + 0.005), 0, 0, 0, [1, 0.7, 0.6], NO);
}
function kelpStalk(K, g, b) { // giant kelp stalk to the ceiling: nodes, leaves with air bladders, a holdfast of lumpy roots
  const m = M(K), R = (b.r ?? b.w / 2) * 0.55, H = b.h;
  K.add(g, K.cyl(R, R * 1.2, H, 0.1, 12), m.kelpD, 0, H / 2, 0);
  for (let y = 0.8; y < H - 0.4; y += 0.7) { const a = y * 2.3; K.add(g, K.capsule(0.16, 0.9, 2, 6), m.kelp, Math.cos(a) * R * 1.3, y, Math.sin(a) * R * 1.3, 0, -a, 1.1, [1, 1, 0.4], NO); K.add(g, K.sphere(0.09, 6, 4), m.coral[2], Math.cos(a) * R * 1.05, y - 0.15, Math.sin(a) * R * 1.05, 0, 0, 0, 1, NO); }
  for (let y = 1.5; y < H - 0.4; y += 1.4) K.add(g, K.torus(R * 1.02, 0.035, 3, 12), m.kelp, 0, y, 0, Math.PI / 2, 0, 0, 1, NO);
  K.add(g, K.box(R * 3.2, 0.6, R * 3.2, 0.25), m.rock, 0, 0.3, 0, 0, 0, 0, 1, NC);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28 + 0.4; K.add(g, K.sphere(R * 0.7, 7, 5), m.rockD, Math.cos(a) * R * 1.6, R * 0.35, Math.sin(a) * R * 1.6, 0, 0, 0, [1.1, 0.7, 1.1], NO); }
}
function shellPad(K, g, b) { // scallop shell: coral underside, shell cap with radial ribs fanning from a hinge, a pearl at the lip
  const m = M(K), h = b.h;
  K.add(g, K.box(b.w, h * 0.5, b.d, h * 0.22), m.coral[1], 0, h * 0.25, 0, 0, 0, 0, 1, NO); K.add(g, K.box(b.w, h * 0.62, b.d, Math.min(0.22, h * 0.28)), m.shell, 0, h * 0.69, 0);
  for (let i = -4; i <= 4; i++) { const a = i * 0.15, len = Math.min((b.d - 0.2) / Math.cos(a), i ? (b.w / 2 - 0.1) / Math.abs(Math.sin(a)) : 9); K.add(g, K.box(0.05, 0.02, len, 0.01), m.coral[1], Math.sin(a) * len / 2, h + 0.005, -b.d / 2 + 0.1 + (Math.cos(a) * len) / 2, 0, a, 0, 1, NO); }
  K.add(g, K.box(b.w * 0.3, 0.05, 0.14, 0.02), m.coral[0], 0, h + 0.01, -b.d / 2 + 0.07, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.09, 8, 6), m.pearl, 0, h + 0.05, b.d / 2 - 0.2, 0, 0, 0, 1, NO);
}
function sandRamp(K, g, b) { // sand ramp rippled with darker lines and a few shells
  const m = M(K), ax = b.ramp.axis === 'x', len = ax ? b.w : b.d, up = b.ramp.dir > 0, ang = Math.atan2(b.h, len);
  K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.sand, 0, b.h / 2, 0);
  for (let a = 0.12; a < 0.95; a += 0.13) { const p = (a - 0.5) * len, y = b.h * (up ? a : 1 - a) + 0.015; if (ax) K.add(g, K.box(0.07, 0.025, b.d * 0.9, 0.01), m.rock, p, y, 0, 0, 0, up ? ang : -ang, 1, NO); else K.add(g, K.box(b.w * 0.9, 0.025, 0.07, 0.01), m.rock, 0, y, p, up ? -ang : ang, 0, 0, 1, NO); }
}
function fish(K, g, m, x, y, z, s, c) { // fish: round body, tail, dorsal fin, white stripe, eye
  K.add(g, K.sphere(0.35 * s, 10, 7), c, x, y, z, 0, 0, 0, [1.5, 1, 0.5], NO); K.add(g, K.cone(0.25 * s, 0.4 * s, 3), c, x - 0.62 * s, y, z, 0, 0, Math.PI / 2, [1, 1, 0.3], NO);
  K.add(g, K.cone(0.14 * s, 0.25 * s, 3), c, x - 0.05 * s, y + 0.36 * s, z, 0, 0, 0, [1, 1, 0.3], NO); K.add(g, K.box(0.08 * s, 0.5 * s, 0.02, 0.01), m.pearl, x + 0.05 * s, y, z + 0.18 * s, 0, 0, 0, 1, NO);
  K.add(g, K.sphere(0.07 * s, 6, 4), m.pearl, x + 0.3 * s, y + 0.08 * s, z + 0.12 * s, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.035 * s, 4, 3), m.dark, x + 0.34 * s, y + 0.08 * s, z + 0.17 * s, 0, 0, 0, 1, NO);
}

export default {
  bas: [{ make: reef }, { make: treasure }, square(clam)],
  haut: [{ make: ridge }],
  pilier: [{ make: kelpStalk }],
  coin: [{ make: (K, g, b) => { // corner reef rock: lumpy two-tone stone with fans, sponges and barnacles growing from its faces
    const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.5), m.rockD, 0, b.h / 2, 0);
    for (let i = 0; i < 6; i++) { const y = 0.5 + i * ((b.h - 1) / 6), side = i % 4, w = side < 2 ? b.d : b.w; K.add(g, K.sphere(0.3 + K.rnd() * 0.15, 7, 5), i % 3 ? m.rock : m.rockD, side === 0 ? b.w / 2 : side === 1 ? -b.w / 2 : (K.rnd() - 0.5) * b.w * 0.6, y, side === 2 ? b.d / 2 : side === 3 ? -b.d / 2 : (K.rnd() - 0.5) * w * 0.6, 0, 0, 0, [1, 0.9, 1], NO); }
    for (const [i, y] of [0.8, 1.9, 3.0].entries()) { const sd = (i + (K.rnd() < 0.5 ? 0 : 1)) % 4, px = sd < 2 ? (sd ? -1 : 1) * (b.w / 2 + 0.08) : (K.rnd() - 0.5) * b.w * 0.5, pz = sd >= 2 ? (sd === 2 ? 1 : -1) * (b.d / 2 + 0.08) : (K.rnd() - 0.5) * b.d * 0.5; fan(K, g, m, px, y, pz, sd < 2 ? Math.PI / 2 : 0, 0.8); }
    corals(K, g, m, b.w, b.d, 0.05, 3);
  } }],
  plateforme: [{ make: shellPad }],
  rampe: [{ make: sandRamp }],
  parkour: [parkour(shellPad), parkour((K, g, b) => reef(K, g, b))],
  solCount: [6, 4], // floor decals per room: sand, shells, vents, anchors and coral gardens over the pale seabed
  ambient: { n: 120, color: '#DDF4FF', size: 0.11, rise: 0.6, sway: 0.4, glow: true }, // bubbles and plankton rising (Ambient.js)
  mural: [
    { make(K, g) { const m = M(K); for (let i = 0; i < 6; i++) fish(K, g, m, (K.rnd() - 0.5) * 3.5, 2 + K.rnd() * 2.5, 0.6, 0.7 + K.rnd() * 0.5, m.fish[i % 3]); } }, // school of fish
    { make(K, g) { const m = M(K); for (let i = 0; i < 4; i++) { star(K, g, m, (i - 1.5) * 0.9, 1.2 + (i % 2) * 1.4, 0.06, i, 1.2, m.star, Math.PI / 2); } } },
    { make(K, g, o) { const m = M(K); K.add(g, K.cone(0.5, 0.4, 8), m.rockD, 0, 0.2, 0.5, 0, 0, 0, 1, NC); for (let i = 0; i < 10; i++) { const r = 0.1 + K.rnd() * 0.14; K.add(g, K.sphere(r, 8, 6), m.bubble, Math.sin(i * 1.3) * 0.3, 0.7 + i * ((o.h - 1.8) / 10), 0.5, 0, 0, 0, 1, NO); K.add(g, K.sphere(r * 0.25, 4, 3), m.pearl, Math.sin(i * 1.3) * 0.3 - r * 0.35, 0.7 + i * ((o.h - 1.8) / 10) + r * 0.35, 0.5 + r * 0.8, 0, 0, 0, 1, NO); } } }, // bubble column rising from a vent
    { make(K, g, o) { // two jellyfish: pastel bell, frilled rim, wavy tentacles
      const m = M(K); for (const [x, y, s] of [[-1, Math.min(o.h - 2, 4.2), 1], [1.1, Math.min(o.h - 3, 2.8), 0.7]]) {
        K.add(g, K.sphere(0.55 * s, 10, 7), m.coral[1], x, y, 0.5, 0, 0, 0, [1, 0.75, 1], NO); K.add(g, K.torus(0.5 * s, 0.07 * s, 5, 16), m.coral[3], x, y - 0.12 * s, 0.5, Math.PI / 2, 0, 0, 1, NO);
        for (let i = 0; i < 5; i++) K.add(g, K.capsule(0.035 * s, 0.9 * s, 2, 4), m.coral[3], x + (i - 2) * 0.17 * s, y - 0.65 * s, 0.5 + (i % 2 ? 0.05 : -0.05), 0, 0, (i - 2) * 0.08, 1, NO);
        K.add(g, K.sphere(0.12 * s, 6, 4), m.pearl, x - 0.15 * s, y + 0.15 * s, 0.5 + 0.45 * s, 0, 0, 0, 1, NO);
      }
    } },
    { make(K, g, o) { // brass porthole onto the deep: dark glass, a fish and bolts
      const m = M(K), y = Math.min(o.h - 2, 3.2); K.add(g, K.torus(1.0, 0.14, 6, 20), m.gold, 0, y, 0.18, 0, 0, 0, 1, NC); K.add(g, tube(K, 1.0, 1.0, 0.1, 24), m.dark, 0, y, 0.05, Math.PI / 2, 0, 0, 1, NO);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; K.add(g, K.sphere(0.05, 5, 4), m.dark, Math.cos(a) * 1.0, y + Math.sin(a) * 1.0, 0.32, 0, 0, 0, 1, NO); }
      fish(K, g, m, 0.1, y + 0.1, 0.15, 0.7, m.fish[1]);
    } },
  ],
  sol: [
    { r: 2.0, make(K, g) { // sand patch with ripples, scallop shells and a starfish
      const m = M(K); K.add(g, tube(K, 1.7, 1.8, 0.1, 24), m.sand, 0, 0.05, 0, 0, 0, 0, 1, NO); for (const r of [0.6, 1.1, 1.5]) K.add(g, K.torus(r, 0.014, 3, 28), m.rock, 0, 0.1, 0, Math.PI / 2, 0, 0, 1, NO);
      for (let i = 0; i < 4; i++) K.add(g, K.sphere(0.14, 8, 6), m.shell, (K.rnd() - 0.5) * 2, 0.11, (K.rnd() - 0.5) * 2, 0, K.rnd() * 3, 0, [1, 0.5, 1], NO); star(K, g, m, 0.5, 0.11, -0.4, 1, 0.9, m.star);
    } },
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.cone(0.5, 0.4, 8), m.rockD, 0, 0.2, 0, 0, 0, 0, 1, NC); K.add(g, K.torus(0.22, 0.05, 3, 10), m.rock, 0, 0.38, 0, Math.PI / 2, 0, 0, 1, NO); for (let i = 0; i < 4; i++) K.add(g, K.sphere(0.08 + i * 0.03, 8, 6), m.bubble, 0, 0.5 + i * 0.45, 0, 0, 0, 0, 1, NO); for (const [x, z] of [[0.55, 0.2], [-0.4, 0.45]]) K.add(g, K.sphere(0.1, 6, 4), m.rock, x, 0.05, z, 0, 0, 0, [1, 0.6, 1], NO); } }, // bubble vent
    { r: 0.6, make(K, g) { star(K, g, M(K), 0, 0.05, 0, K.rnd() * 3, 1.5, M(K).star); } },
    { r: 1.1, make(K, g) { // coral garden on a sand disc
      const m = M(K); K.add(g, tube(K, 0.95, 1.0, 0.08, 20), m.sand, 0, 0.04, 0, 0, 0, 0, 1, NO); branchy(K, g, m.coral[0], -0.4, 0.06, 0.1, 1.1); sponge(K, g, m, 0.4, 0.06, -0.2); anemone(K, g, m, 0.1, 0.06, 0.5, m.coral[1]); K.add(g, K.sphere(0.2, 8, 6), m.coral[2], -0.1, 0.12, -0.5, 0, 0, 0, [1, 0.75, 1], NO);
    } },
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.sphere(0.2, 8, 6), m.rockD, 0, 0.06, 0, 0, 0, 0, [1.2, 0.5, 1.2], NO); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; K.add(g, K.capsule(0.05, 0.5 + (i % 3) * 0.15, 3, 6), i % 2 ? m.kelp : m.kelpD, Math.cos(a) * 0.12, 0.35, Math.sin(a) * 0.12, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35, [1, 1, 0.5], NO); } } }, // seaweed tuft
    { r: 1.0, make(K, g) { // anchor lying on the seabed
      const m = M(K); K.add(g, K.box(0.12, 0.1, 1.3, 0.04), m.dark, 0, 0.06, 0, 0, 0, 0, 1, NC); K.add(g, K.box(0.7, 0.09, 0.1, 0.03), m.dark, 0, 0.12, 0.45, 0, 0, 0, 1, NO); K.add(g, K.torus(0.14, 0.04, 3, 12), m.dark, 0, 0.06, 0.74, Math.PI / 2, 0, 0, 1, NO);
      K.add(g, K.torus(0.4, 0.05, 5, 14, Math.PI), m.dark, 0, 0.06, -0.5, Math.PI / 2, 0, Math.PI, 1, NC); K.add(g, K.cone(0.09, 0.2, 4), m.dark, -0.4, 0.06, -0.5, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.cone(0.09, 0.2, 4), m.dark, 0.4, 0.06, -0.5, Math.PI / 2, 0, 0, 1, NO);
    } },
  ],
};
