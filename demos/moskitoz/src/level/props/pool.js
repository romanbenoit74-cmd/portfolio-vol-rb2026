// Piscine: starting blocks, stacks of kickboards, lifeguard chests, tiled half-walls with a lane rope, tiled columns with a
// ladder, floating pool mats, water slides, inflatable rings as parkour; lifebuoys, pennant flags, depth signs, mosaic fish
// and pool noodles on the walls; puddles, lane lines, a rubber duck, flip-flops and towels on the floor. Bubbles drift up.
import { NC, NO, alongX, parkour, spread, square } from './common.js';

const tube = (K, rt, rb, h, seg = 8) => K.lathe([[0.001, -h / 2], [rb, -h / 2], [rt, h / 2], [0.001, h / 2]], seg); // cheap cylinder without bevel: thin posts, rings and flat discs

const M = (K) => ({
  tile: K.m('#FFFFFF', { pattern: 'grid', color2: '#D8F4FA', scale: 0.25 }), tileB: K.m('#6CD8EA', { pattern: 'grid', color2: '#5CC8DA', scale: 0.25 }), yel: K.m('#FFE04A', { rim: 0.25 }),
  red: K.m('#FF5B4A', { rim: 0.25 }), blue: K.m('#3A8AE8', { rim: 0.2 }), steel: K.m('#E6EEF4', { rim: 0.45 }), board: [K.m('#FFE04A'), K.m('#FF5B4A'), K.m('#3A8AE8'), K.m('#48C870')],
  water: K.m('#5FD8FF', { rim: 0.5 }), dark: K.f('#0E2F45'), white: K.m('#FFFFFF', { rim: 0.15 }), float: [K.m('#FF7AA8', { rim: 0.35, pattern: 'dots', color2: '#FF92B8', scale: 0.3 }), K.m('#FFE04A', { rim: 0.35, pattern: 'dots', color2: '#FFEC80', scale: 0.3 }), K.m('#6FE0B0', { rim: 0.35, pattern: 'dots', color2: '#8CE8C0', scale: 0.3 })],
});
const SEG = ['1110111', '0010010', '1011101', '1011011', '0111010', '1101011', '1101111', '1010010', '1111111', '1111011']; // seven-segment digits: top, top-left, top-right, middle, bottom-left, bottom-right, bottom
function digit(K, g, mat, n, x, y, z, s = 1) { // a digit drawn with flat bars (lane numbers, depth signs)
  const on = SEG[n], bars = [[0, 0.5, 0.5, 0.12], [-0.25, 0.25, 0.12, 0.5], [0.25, 0.25, 0.12, 0.5], [0, 0, 0.5, 0.12], [-0.25, -0.25, 0.12, 0.5], [0.25, -0.25, 0.12, 0.5], [0, -0.5, 0.5, 0.12]];
  bars.forEach(([bx, by, bw, bh], i) => { if (on[i] === '1') K.add(g, K.box(bw * s, bh * s, 0.02, 0.01), mat, x + bx * s, y + by * s, z, 0, 0, 0, 1, NO); });
}
function slope(K, g, b, mat, a, wid, k = 0.94) { // flat stripe lying on the slope of a ramp box at fraction a (0..1) along its axis
  const ax = b.ramp.axis === 'x', len = ax ? b.w : b.d, up = b.ramp.dir > 0, ang = Math.atan2(b.h, len), p = (a - 0.5) * len, y = b.h * (up ? a : 1 - a) + 0.02;
  if (ax) K.add(g, K.box(wid, 0.03, b.d * k, 0.01), mat, p, y, 0, 0, 0, up ? ang : -ang, 1, NO);
  else K.add(g, K.box(b.w * k, 0.03, wid, 0.01), mat, 0, y, p, up ? -ang : ang, 0, 0, 1, NO);
}
function buoy(K, g, m, R, x, y, z, rx = 0, n = 4) { // lifebuoy: red ring with white arcs
  K.add(g, K.torus(R, R * 0.33, 10, 24), m.red, x, y, z, rx, 0, 0, 1, NC);
  for (let i = 0; i < n; i++) K.add(g, K.torus(R, R * 0.35, 8, 6, 0.55), m.white, x, y, z, rx, 0, (i * Math.PI * 2) / n + 0.2, 1, NO);
}

function startBlock(K, g, b) { // starting block: tiled plinth on a blue skirt, grippy top, lane number plates, grab bar
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = 1 + Math.floor(K.rnd() * 8);
  K.add(g, K.box(L + 0.04, 0.16, T + 0.04, 0.05), m.blue, 0, 0.08, 0);
  K.add(g, K.box(L, H - 0.36, T, 0.08), m.tile, 0, 0.16 + (H - 0.36) / 2, 0);
  K.add(g, K.box(L + 0.06, 0.2, T + 0.06, 0.06), m.blue, 0, H - 0.1, 0);
  K.add(g, K.box(L * 0.9, 0.025, T * 0.8, 0.01), m.steel, 0, H + 0.005, 0, 0, 0, 0, 1, NO); // grip pad
  for (const x of spread(5, L * 0.6)) K.add(g, K.box(0.04, 0.03, T * 0.7, 0.01), m.white, x, H + 0.012, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) { K.add(g, K.box(Math.min(0.9, L * 0.5), H * 0.4, 0.03, 0.01), m.yel, 0, H * 0.55, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); const f = K.sub(g, 0, 0, 0, s < 0 ? Math.PI : 0); digit(K, f, m.dark, n, 0, H * 0.55, T / 2 + 0.03, Math.min(0.5, H * 0.3)); }
  for (const x of [-L * 0.34, -L * 0.18]) K.add(g, tube(K, 0.035, 0.035, 0.28, 6), m.steel, x, H - 0.1, T / 2 + 0.04, 0, 0, 0, 1, NO);
  K.add(g, tube(K, 0.04, 0.04, L * 0.16 + 0.06, 6), m.steel, -L * 0.26, H + 0.04, T / 2 + 0.04, 0, 0, Math.PI / 2, 1, NO);
}
function kickboards(K, g, b) { // stacks of kickboards on a tiled plinth between two steel rack posts, a hole in each top board
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(3, Math.round((H - 0.3) / 0.12)), cols = Math.max(1, Math.round(L / 1.2));
  K.add(g, K.box(L, 0.3, T, 0.06), m.tile, 0, 0.15, 0); K.add(g, K.box(L + 0.04, 0.06, T + 0.04, 0.02), m.blue, 0, 0.03, 0, 0, 0, 0, 1, NO);
  for (const x of spread(cols, L)) {
    for (let i = 0; i < n; i++) K.add(g, K.box(L / cols - 0.12, (H - 0.3) / n - 0.01, T - 0.12, 0.04), m.board[(i + Math.round(x)) % 4], x + (K.rnd() - 0.5) * 0.08, 0.3 + ((i + 0.5) * (H - 0.3)) / n, 0, 0, (K.rnd() - 0.5) * 0.08, 0, 1, { ink: i === n - 1, cast: i === n - 1 });
    K.add(g, K.capsule(0.05, 0.14, 3, 6), m.dark, x, H + 0.002, 0, 0, 0, Math.PI / 2, [0.2, 1, 1], NO);
  }
  for (const s of [-1, 1]) { K.add(g, tube(K, 0.05, 0.05, H, 8), m.steel, s * (L / 2 - 0.03), H / 2, T / 2 - 0.03, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.07, 8, 6), m.steel, s * (L / 2 - 0.03), H, T / 2 - 0.03, 0, 0, 0, 1, NO); }
}
function lifeguard(K, g, b) { // red lifeguard chest: lid line, white cross, steel latches and corners, rope handles, rubber feet
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H - 0.12, T, 0.1), m.red, 0, 0.12 + (H - 0.12) / 2, 0); K.add(g, K.box(L * 0.97, 0.12, T * 0.97, 0.04), m.dark, 0, 0.06, 0, 0, 0, 0, 1, NO);
  K.add(g, K.box(L + 0.03, 0.05, T + 0.03, 0.015), m.white, 0, H - 0.3, 0, 0, 0, 0, 1, NO); // lid seam
  for (const s of [-1, 1]) {
    K.add(g, K.box(0.6, 0.18, 0.03, 0.01), m.white, 0, H * 0.45, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); K.add(g, K.box(0.18, 0.6, 0.03, 0.01), m.white, 0, H * 0.45, s * (T / 2 + 0.01), 0, 0, 0, 1, NO);
    for (const x of [-L * 0.3, L * 0.3]) K.add(g, K.box(0.14, 0.2, 0.04, 0.02), m.steel, x, H - 0.3, s * (T / 2 + 0.02), 0, 0, 0, 1, NO); // latch
    K.add(g, K.torus(0.16, 0.025, 4, 8, Math.PI), m.white, s * (L / 2 - 0.02), H * 0.45, 0, 0, 0, -s * Math.PI / 2, 1, NO); // rope handle
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add(g, K.sphere(0.07, 6, 4), m.steel, sx * (L / 2 - 0.03), H - 0.03, sz * (T / 2 - 0.03), 0, 0, 0, 1, NO);
}
function halfWall(K, g, b) { // tiled wall with a navy depth band and number tiles, blue coping, a taut lane rope of floats between steel posts
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H - 0.15, T, 0.05), m.tileB, 0, (H - 0.15) / 2, 0);
  K.add(g, K.box(L + 0.06, 0.15, T + 0.1, 0.05), m.white, 0, H - 0.075, 0, 0, 0, 0, 1, NO);
  K.add(g, K.box(L + 0.06, 0.1, T + 0.04, 0.03), m.blue, 0, 0.05, 0, 0, 0, 0, 1, NO);
  for (const s of [-1, 1]) { K.add(g, K.box(L * 0.96, 0.16, 0.02, 0.01), m.blue, 0, H * 0.45, s * (T / 2 + 0.005), 0, 0, 0, 1, NO); for (const x of spread(Math.max(2, Math.round(L / 2.4)), L * 0.9)) K.add(g, K.box(0.26, 0.26, 0.02, 0.01), m.yel, x, H * 0.45, s * (T / 2 + 0.01), 0, 0, 0, 1, NO); }
  for (const s of [-1, 1]) K.add(g, tube(K, 0.05, 0.05, 0.5, 8), m.steel, s * (L / 2 - 0.1), H + 0.15, 0, 0, 0, 0, 1, NO);
  K.add(g, tube(K, 0.015, 0.015, L - 0.2, 4), m.dark, 0, H + 0.05, 0, 0, 0, Math.PI / 2, 1, NO);
  for (const [i, x] of spread(Math.max(4, Math.round(L / 0.35)), L - 0.4).entries()) K.add(g, K.sphere(0.13, 8, 6), i % 4 < 2 ? m.red : m.white, x, H + 0.05, 0, 0, 0, 0, [1.3, 0.8, 0.8], NO);
}
function tiledCol(K, g, b) { // tiled column on a blue base with a depth band, coping, and a steel pool ladder with curved handrails
  const m = M(K), R = b.r ?? b.w / 2, q = R * 1.7;
  K.add(g, K.box(q, b.h, q, 0.06), m.tile, 0, b.h / 2, 0); K.add(g, K.box(q + 0.12, 0.3, q + 0.12, 0.08), m.blue, 0, 0.15, 0, 0, 0, 0, 1, NO);
  K.add(g, K.box(q + 0.1, 0.16, q + 0.1, 0.06), m.blue, 0, b.h - 0.08, 0, 0, 0, 0, 1, NC); K.add(g, K.box(q + 0.03, 0.18, q + 0.03, 0.01), m.blue, 0, 1.6, 0, 0, 0, 0, 1, NO);
  const z = q / 2 + 0.06;
  for (const x of [-0.3, 0.3]) { K.add(g, tube(K, 0.04, 0.04, 2.2, 8), m.steel, x, 1.1, z, 0, 0, 0, 1, NO); K.add(g, K.torus(0.2, 0.04, 4, 8, Math.PI), m.steel, x, 2.2, z + 0.2, 0, Math.PI / 2, Math.PI / 2, 1, NO); }
  for (let y = 0.4; y < 2.2; y += 0.4) K.add(g, tube(K, 0.03, 0.03, 0.6, 6), m.steel, 0, y, z, 0, 0, Math.PI / 2, 1, NO);
  const f = K.sub(g, 0, 0, 0, Math.PI); K.add(f, K.box(0.5, 0.5, 0.03, 0.01), m.yel, 0.1, 1.6, q / 2 + 0.02, 0, 0, 0, 1, NO); digit(K, f, m.dark, 1 + Math.floor(K.rnd() * 5), 0.1, 1.6, q / 2 + 0.04, 0.3);
}
function poolMat(K, g, b) { // inflatable mat: puffy dotted cushions side by side, a rope loop and a valve
  const m = M(K), c = m.float[Math.floor(K.rnd() * 3)], n = 4;
  for (const z of spread(n, b.d)) K.add(g, K.capsule(b.h / 2, b.w - b.h, 4, 12), c, 0, b.h / 2, z, 0, 0, Math.PI / 2, [1, 1, (b.d / n / b.h) * 1.02]);
  K.add(g, K.torus(0.12, 0.025, 4, 10, Math.PI), m.white, b.w / 2 - 0.02, b.h * 0.5, 0, 0, 0, -Math.PI / 2, 1, NO); K.add(g, tube(K, 0.04, 0.05, 0.1, 8), m.white, -b.w / 2 + 0.2, b.h + 0.01, b.d / 2 - 0.2, 0, 0, 0, 1, NO);
}
function ring(K, g, b) { // inflatable ring (parkour): fat torus with white stripes and a rope, a flat core keeps the box whole
  const m = M(K), R = Math.min(b.w, b.d) / 2, c = m.float[Math.floor(K.rnd() * 3)], r = b.h / 2, Rm = R - r;
  K.add(g, K.torus(Rm, r, 12, 32), c, 0, r, 0, Math.PI / 2, 0, 0);
  for (let i = 0; i < 4; i++) K.add(g, K.torus(Rm, r * 1.03, 8, 6, 0.5), m.white, 0, r, 0, Math.PI / 2, 0, (i * Math.PI) / 2 + 0.3, 1, NO);
  K.add(g, tube(K, R - b.h * 0.9, R - b.h * 0.9, b.h * 0.3, 24), m.water, 0, b.h * 0.3, 0, 0, 0, 0, 1, NO);
  K.add(g, K.torus(Rm + r * 0.5, 0.025, 4, 28), m.white, 0, r * 1.7, 0, Math.PI / 2, 0, 0, 1, NO); // grab rope
}
function waterSlide(K, g, b) { // water slide: blue chute with lighter water streaks, yellow rails capped with balls, a splash at the foot
  const m = M(K); K.add(g, K.rampGeo(b.w - 0.3, b.h, b.d, b.ramp), m.blue, 0, b.h / 2, 0);
  for (const s of [-1, 1]) K.add(g, K.rampGeo(0.15, b.h * 1.03, b.d, b.ramp), m.yel, s * (b.w / 2 - 0.075), b.h * 0.515, 0);
  const bb = { ...b, w: b.w - 0.5 }; for (const a of [0.15, 0.4, 0.65, 0.88]) slope(K, g, bb, m.water, a, 0.12, 0.92);
}

export default {
  bas: [square(startBlock), { make: kickboards }, { make: lifeguard }],
  haut: [{ make: halfWall }],
  pilier: [{ make: tiledCol }],
  coin: [{ make: (K, g, b) => { const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.06), m.tileB, 0, b.h / 2, 0); K.add(g, K.box(b.w + 0.04, 0.4, b.d + 0.04, 0.06), m.white, 0, 0.2, 0, 0, 0, 0, 1, NO); K.add(g, K.box(b.w + 0.05, 0.14, b.d + 0.05, 0.03), m.yel, 0, 2.0, 0, 0, 0, 0, 1, NO); K.add(g, K.box(b.w + 0.05, 0.08, b.d + 0.05, 0.03), m.blue, 0, 0.44, 0, 0, 0, 0, 1, NO); } }], // tiled corner with a yellow safety band
  plateforme: [{ make: poolMat }],
  rampe: [{ make: waterSlide }],
  parkour: [parkour(ring), parkour(poolMat)],
  solCount: [5, 3], // floor decals per room: puddles, lane marks, toys and towels over the big blue floor
  ambient: { n: 70, color: '#FFFFFF', size: 0.11, rise: 0.32, sway: 0.3, glow: false }, // bubbles rising (Ambient.js)
  mural: [
    { make(K, g) { const m = M(K); buoy(K, g, m, 0.55, 0, 2.6, 0.2); K.add(g, K.box(1.5, 1.5, 0.08, 0.1), m.white, 0, 2.6, 0.04, 0, 0, 0, 1, NC); K.add(g, K.box(0.12, 0.12, 0.3, 0.03), m.steel, 0, 3.25, 0.15, 0, 0, 0, 1, NO); K.add(g, K.torus(0.5, 0.02, 4, 16), m.white, 0, 2.55, 0.45, 0, 0, 0, 1, NO); } }, // lifebuoy on a plate with a rope and a hook
    { make(K, g, o) { const m = M(K), y = Math.min(o.h - 1, 5); K.add(g, tube(K, 0.02, 0.02, 6, 6), m.dark, 0, y, 0.6, 0, 0, Math.PI / 2, 1, NO); for (const x of [-3, 3]) K.add(g, K.sphere(0.07, 6, 4), m.steel, x, y, 0.6, 0, 0, 0, 1, NO); for (const [i, x] of spread(9, 5.6).entries()) K.add(g, K.cone(0.22, 0.5, 3), [m.red, m.yel, m.blue][i % 3], x, y - 0.3, 0.6, Math.PI, 0, 0, [1, 1, 0.2], NO); } }, // pennant flags
    { make(K, g) { // depth sign: white plate, blue frame, a big number and a wavy line
      const m = M(K), n = 1 + Math.floor(K.rnd() * 3); K.add(g, K.box(1.5, 0.95, 0.06, 0.04), m.blue, 0, 1.6, 0.04, 0, 0, 0, 1, NC); K.add(g, K.box(1.34, 0.8, 0.02, 0.01), m.white, 0, 1.6, 0.075, 0, 0, 0, 1, NO);
      digit(K, g, m.dark, n, -0.4, 1.65, 0.1, 0.55); K.add(g, K.box(0.12, 0.12, 0.02, 0.01), m.dark, -0.05, 1.4, 0.1, 0, 0, 0, 1, NO); digit(K, g, m.dark, Math.floor(K.rnd() * 10), 0.3, 1.65, 0.1, 0.55);
      for (const x of spread(4, 1.1)) K.add(g, K.box(0.2, 0.05, 0.02, 0.01), m.blue, x, 1.3, 0.1, 0, 0, x * 0.4, 1, NO);
    } },
    { make(K, g) { // mosaic fish: tile-coloured body, tail, fin and eye on a blue wave band
      const m = M(K); K.add(g, K.box(3.2, 0.5, 0.03, 0.01), m.blue, 0, 1.0, 0.03, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.8, 12, 8), m.yel, 0, 2.0, 0.06, 0, 0, 0, [1.4, 0.8, 0.12], NO); K.add(g, K.cone(0.5, 0.7, 3), m.yel, -1.4, 2.0, 0.06, 0, 0, Math.PI / 2, [1, 1, 0.12], NO);
      K.add(g, K.cone(0.3, 0.4, 3), m.red, 0, 2.7, 0.07, 0, 0, 0, [1, 1, 0.12], NO); K.add(g, K.sphere(0.13, 8, 6), m.white, 0.7, 2.15, 0.14, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.06, 6, 4), m.dark, 0.74, 2.15, 0.17, 0, 0, 0, 1, NO);
      for (const x of [-0.2, 0.2]) K.add(g, K.box(0.1, 0.8, 0.02, 0.01), m.red, x, 1.95, 0.14, 0, 0, 0.2, 1, NO);
    } },
    { make(K, g) { // rack of pool noodles on wall pegs
      const m = M(K); K.add(g, K.box(2.6, 0.12, 0.1, 0.04), m.white, 0, 3.3, 0.05, 0, 0, 0, 1, NC);
      for (const [i, x] of spread(6, 2.2).entries()) { K.add(g, tube(K, 0.04, 0.04, 0.3, 6), m.steel, x, 3.3, 0.2, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.capsule(0.1, 2.0, 4, 8), m.float[i % 3], x, 2.2, 0.28, 0, 0, (i - 2.5) * 0.04, 1, NC); }
    } },
  ],
  sol: [
    { r: 1.4, make(K, g) { const m = M(K); K.add(g, tube(K, 1.2, 1.2, 0.02, 20), m.water, 0, 0.012, 0, 0, 0, 0, [1, 1, 0.6], NO); K.add(g, K.torus(0.6, 0.015, 4, 16, 1.4), m.white, 0, 0.026, 0.1, Math.PI / 2, 0, 0.8, [1, 1, 0.3], NO); for (const [x, z] of [[1.15, 0.2], [-0.2, 1.0]]) K.add(g, tube(K, 0.12, 0.12, 0.02, 10), m.water, x, 0.012, z, 0, 0, 0, 1, NO); } }, // puddle with a glint and drops
    { r: 3.4, make(K, g) { const m = M(K); K.add(g, K.box(6, 0.01, 0.3, 0.005), m.dark, 0, 0.008, 0, 0, 0, 0, 1, NO); for (const x of [-3, 3]) K.add(g, K.box(0.3, 0.01, 1.2, 0.005), m.dark, x, 0.008, 0, 0, 0, 0, 1, NO); for (const x of spread(7, 5)) K.add(g, K.box(0.1, 0.01, 0.4, 0.005), m.yel, x, 0.009, 0.9, 0, 0, 0, 1, NO); } }, // lane line, T end marks, a dashed yellow guide
    { r: 0.8, make(K, g) { const m = M(K); K.add(g, K.sphere(0.45, 16, 12), m.white, 0, 0.45, 0); for (let i = 0; i < 3; i++) K.add(g, K.sphere(0.452, 16, 12, 0), [m.red, m.yel, m.blue][i], 0, 0.45, 0, 0, (i * Math.PI * 2) / 3, 0, [0.35, 1, 1], NO); K.add(g, tube(K, 0.07, 0.07, 0.03, 8), m.white, 0, 0.9, 0, 0, 0, 0, 1, NO); } },
    { r: 0.7, make(K, g) { // rubber duck
      const m = M(K); K.add(g, K.sphere(0.4, 14, 10), m.yel, 0, 0.32, 0, 0, 0, 0, [1.2, 0.85, 0.9]); K.add(g, K.sphere(0.24, 12, 8), m.yel, 0.28, 0.72, 0); K.add(g, K.sphere(0.2, 10, 6), m.yel, -0.42, 0.45, 0, 0, 0, 0.5, [1.1, 0.7, 0.5], NO);
      K.add(g, K.sphere(0.12, 8, 6), K.m('#FF9A2E'), 0.5, 0.68, 0, 0, 0, 0, [1.2, 0.6, 1], NO); for (const s of [-1, 1]) { K.add(g, K.sphere(0.04, 6, 4), m.dark, 0.38, 0.8, s * 0.14, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.2, 10, 6), m.yel, 0, 0.35, s * 0.34, 0, 0, 0, [1, 0.7, 0.3], NO); }
    } },
    { r: 0.6, make(K, g) { const m = M(K); for (const s of [-1, 1]) { K.add(g, K.sphere(0.18, 10, 6), m.float[0], s * 0.18, 0.04, 0, 0, 0.2 * s, 0, [0.7, 0.3, 1.6], NO); K.add(g, K.torus(0.1, 0.018, 4, 10, Math.PI), m.white, s * 0.18, 0.1, 0.08, 0, 0, 0, 1, NO); } } }, // flip-flops
    { r: 0.9, make(K, g) { const m = M(K); for (const [i, c] of [m.blue, m.white, m.red].entries()) K.add(g, K.box(1.0 - i * 0.1, 0.09, 0.7 - i * 0.06, 0.04), c, 0, 0.05 + i * 0.1, 0, 0, i * 0.35, 0, 1, i === 2 ? NO : NC); K.add(g, K.box(0.5, 0.02, 0.2, 0.01), m.yel, 0, 0.32, 0, 0, 0.7, 0, 1, NO); } }, // folded towels
  ],
};
