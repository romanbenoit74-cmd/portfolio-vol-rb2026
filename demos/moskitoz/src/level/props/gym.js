// Gymnase: vaulting boxes, stacks of mats, medicine balls, wall bars, padded columns and corners, floating mats, soft
// wedges, trampolines as parkour; basketball hoops, a scoreboard, climbing walls, banners and a bench on the walls; court
// lines, cones, balls, tumbling mats and hoops on the floor. Chalk dust floats in the sunlight.
import { NC, NO, alongX, parkour, spread, square } from './common.js';

const tube = (K, rt, rb, h, seg = 8) => K.lathe([[0.001, -h / 2], [rb, -h / 2], [rt, h / 2], [0.001, h / 2]], seg); // cheap cylinder without bevel: thin posts, rings and flat discs

const M = (K) => ({
  leather: K.m('#E84A4A', { rim: 0.2 }), wood: K.m('#C88A4A', { pattern: 'planks', scale: 0.3 }), woodL: K.m('#E8B070'), mat: [K.m('#4A7AE8', { rim: 0.15 }), K.m('#E84A4A', { rim: 0.15 }), K.m('#FFC62E', { rim: 0.15 })],
  ball: K.m('#8A5A3A', { rim: 0.2 }), orange: K.m('#FF8A2E', { rim: 0.3 }), white: K.m('#FFFFFF', { rim: 0.1 }), black: K.m('#2A1A10'), line: K.f('#FFFFFF'), net: K.m('#F4F4F4', { pattern: 'grid', color2: '#CFCFCF', scale: 0.1 }),
  pad: K.m('#4A7AE8', { pattern: 'stripes', color2: '#3E6AD0', scale: 0.4 }), board: K.f('#1E2433'), digit: K.glow('#FF5B3A', 1.8), hold: [K.m('#FFC62E'), K.m('#48C870'), K.m('#B06AE0'), K.m('#FF5B4A')],
  paint: K.m('#6A92E8', { ao: 1 }),
});
const SEG = ['1110111', '0010010', '1011101', '1011011', '0111010', '1101011', '1101111', '1010010', '1111111', '1111011']; // seven-segment digits: top, top-left, top-right, middle, bottom-left, bottom-right, bottom
function digit(K, g, mat, n, x, y, z, s = 1) { // a digit drawn with flat bars (scoreboard, jerseys)
  const on = SEG[n], bars = [[0, 0.5, 0.5, 0.1], [-0.25, 0.25, 0.1, 0.5], [0.25, 0.25, 0.1, 0.5], [0, 0, 0.5, 0.1], [-0.25, -0.25, 0.1, 0.5], [0.25, -0.25, 0.1, 0.5], [0, -0.5, 0.5, 0.1]];
  bars.forEach(([bx, by, bw, bh], i) => { if (on[i] === '1') K.add(g, K.box(bw * s, bh * s, 0.02, 0.01), mat, x + bx * s, y + by * s, z, 0, 0, 0, 1, NO); });
}
function slope(K, g, b, mat, a, wid, k = 0.94) { // flat stripe lying on the slope of a ramp box at fraction a (0..1) along its axis
  const ax = b.ramp.axis === 'x', len = ax ? b.w : b.d, up = b.ramp.dir > 0, ang = Math.atan2(b.h, len), p = (a - 0.5) * len, y = b.h * (up ? a : 1 - a) + 0.02;
  if (ax) K.add(g, K.box(wid, 0.03, b.d * k, 0.01), mat, p, y, 0, 0, 0, up ? ang : -ang, 1, NO);
  else K.add(g, K.box(b.w * k, 0.03, wid, 0.01), mat, 0, y, p, up ? -ang : ang, 0, 0, 1, NO);
}
function star5(K, g, mat, x, y, z, s, rx = 0) { // five-point star made of a pentagon core and five flat spikes (rx = PI/2 lays it on the floor)
  const f = K.sub(g, x, y, z); f.rotation.x = rx; K.add(f, K.cone(0.3 * s, 0.03, 5), mat, 0, 0, 0, Math.PI / 2, 0, 0, 1, NO);
  for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; K.add(f, K.cone(0.13 * s, 0.5 * s, 4), mat, Math.sin(a) * 0.28 * s, Math.cos(a) * 0.28 * s, 0, 0, 0, -a, [1, 1, 0.12], NO); }
}
const handle = (K, g, m, x, y, z, rz) => K.add(g, K.torus(0.1, 0.025, 3, 8, Math.PI), m.black, x, y, z, 0, 0, rz, 1, NO); // carrying loop

function vault(K, g, b) { // vaulting box: stacked wooden frames on a rubber foot, red leather top with piping, hand slots
  const m = M(K), { L, T } = alongX(g, b), H = b.h, fh = H - 0.4, n = Math.max(2, Math.round(fh / 0.4));
  K.add(g, K.box(L * 0.97, 0.1, T * 0.97, 0.04), m.black, 0, 0.05, 0);
  for (let i = 0; i < n; i++) {
    const k = 1 + (n - 1 - i) * 0.03, y = 0.1 + ((i + 0.5) * fh) / n; K.add(g, K.box(L * k * 0.96, fh / n - 0.02, T * k * 0.96, 0.05), i % 2 ? m.woodL : m.wood, 0, y, 0);
    if (i === n - 1) for (const s of [-1, 1]) K.add(g, K.capsule(0.05, L * 0.22, 3, 6), m.black, 0, y, s * (T * k * 0.48 + 0.005), 0, 0, Math.PI / 2, [1, 1, 0.3], NO); // hand slot
  }
  K.add(g, K.box(L * 0.98, 0.3, T * 0.98, 0.14), m.leather, 0, H - 0.15, 0);
  K.add(g, K.box(L * 0.99, 0.04, T * 0.99, 0.015), m.mat[2], 0, H - 0.31, 0, 0, 0, 0, 1, NO); // piping
  for (const x of spread(3, L * 0.6)) K.add(g, K.sphere(0.05, 6, 4), m.black, x, H + 0.005, 0, 0, 0, 0, [1, 0.4, 1], NO); // tufting buttons
}
function mats(K, g, b) { // stack of thick gym mats in team colours, carrying loops and name labels
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(2, Math.round(H / 0.35)), th = H / n - 0.01;
  for (let i = 0; i < n; i++) {
    const w = L * (0.96 + K.rnd() * 0.04), d = T * (0.94 + K.rnd() * 0.06), x = (K.rnd() - 0.5) * 0.06, y = ((i + 0.5) * H) / n;
    K.add(g, K.box(w, th, d, Math.min(0.14, th / 2.5)), m.mat[i % 3], x, y, 0, 0, (K.rnd() - 0.5) * 0.05, 0);
    handle(K, g, m, x + (i % 2 ? w / 2 : -w / 2) + (i % 2 ? -0.03 : 0.03), y, 0, i % 2 ? -Math.PI / 2 : Math.PI / 2);
    if (th > 0.2) K.add(g, K.box(Math.min(0.7, w * 0.25), th * 0.4, 0.02, 0.01), m.white, x + w * 0.2, y, d / 2 + 0.005, 0, 0, 0, 1, NO); // label
  }
}
function medBalls(K, g, b) { // rack of medicine balls on cradles (square core)
  const m = M(K), S = Math.min(b.w, b.d), H = b.h, R = Math.min(S / 4, H / 2) * 0.95, top = Math.max(0.2, H - R * 2), cols = [m.ball, m.orange, m.leather, m.mat[0]];
  K.add(g, K.box(S * 0.9, top, S * 0.9, 0.06), m.woodL, 0, top / 2, 0);
  K.add(g, K.box(S * 0.94, 0.1, S * 0.94, 0.04), m.black, 0, 0.05, 0);
  K.add(g, K.box(S * 0.92, 0.08, S * 0.92, 0.01), m.mat[2], 0, top * 0.55, 0, 0, 0, 0, 1, NO); // painted stripe
  let i = 0;
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    K.add(g, K.sphere(R, 16, 12), cols[i++ % 4], x * S / 4, H - R, z * S / 4);
    K.add(g, K.torus(R * 0.7, 0.035, 3, 12), m.black, x * S / 4, top + 0.02, z * S / 4, Math.PI / 2, 0, 0, 1, NO); // cradle
    for (const ry of [0, Math.PI / 2]) K.add(g, K.torus(R, 0.02, 3, 14), m.black, x * S / 4, H - R, z * S / 4, 0, ry, 0, 1, NO); // seams
  }
}
function wallBars(K, g, b) { // wall bars (espalier): wooden uprights and round rungs, padded backing, top and bottom beams
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T * 0.3, 0.04), m.pad, 0, H / 2, 0, 0, 0, 0, 1, { ink: false });
  for (const x of spread(Math.max(2, Math.round(L / 1.1)) + 1, L)) K.add(g, K.box(0.14, H, T, 0.04), m.wood, x, H / 2, 0);
  for (let y = 0.3; y < H - 0.1; y += 0.35) for (const s of [-1, 1]) K.add(g, tube(K, 0.04, 0.04, L - 0.1, 8), m.woodL, 0, y, s * T * 0.36, 0, 0, Math.PI / 2, 1, NO);
  K.add(g, K.box(L, 0.18, T, 0.06), m.wood, 0, H - 0.09, 0, 0, 0, 0, 1, NC); K.add(g, K.box(L, 0.16, T, 0.06), m.wood, 0, 0.08, 0, 0, 0, 0, 1, NC);
  for (const x of spread(Math.max(2, Math.round(L / 1.1)) + 1, L)) for (const y of [0.17, H - 0.19]) K.add(g, K.sphere(0.05, 6, 4), m.white, x, y, T * 0.5 + 0.005, 0, 0, 0, 1, NO); // bolts
}
function padCol(K, g, b) { // wooden post in a thick padded sleeve: seams, yellow bands, a jersey number
  const m = M(K), R = b.r ?? b.w / 2, P = R * 1.08;
  K.add(g, K.cyl(R, R, b.h, 0.06, 18), m.woodL, 0, b.h / 2, 0); K.add(g, K.cyl(R * 1.14, R * 1.14, 0.2, 0.06, 18), m.black, 0, 0.1, 0, 0, 0, 0, 1, NC);
  K.add(g, K.cyl(P, P, 2.2, 0.12, 18), m.pad, 0, 1.3, 0, 0, 0, 0, 1, NC);
  for (const y of [0.45, 2.3]) K.add(g, tube(K, P * 1.01, P * 1.01, 0.1, 18), m.mat[2], 0, y, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + 0.4; K.add(g, K.box(0.04, 1.8, 0.03, 0.01), m.mat[0], Math.cos(a) * P * 1.005, 1.35, Math.sin(a) * P * 1.005, 0, Math.PI / 2 - a, 0, 1, NO); }
  const f = K.sub(g, 0, 0, 0, K.rnd() * 6.28); digit(K, f, m.white, Math.floor(K.rnd() * 10), 0, 1.35, P + 0.012, 0.4);
}
function padCorner(K, g, b) { // corner post with a padded jacket: yellow bands, seams, a number
  const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.06), m.woodL, 0, b.h / 2, 0); K.add(g, K.box(b.w + 0.1, 2.2, b.d + 0.1, 0.14), m.pad, 0, 1.3, 0, 0, 0, 0, 1, NC);
  K.add(g, K.box(b.w + 0.12, 0.2, b.d + 0.12, 0.06), m.black, 0, 0.1, 0, 0, 0, 0, 1, NC);
  for (const y of [0.45, 2.3]) K.add(g, K.box(b.w + 0.12, 0.1, b.d + 0.12, 0.03), m.mat[2], 0, y, 0, 0, 0, 0, 1, NO);
  for (const x of [-0.3, 0.3]) for (const s of [-1, 1]) K.add(g, K.box(0.04, 1.8, 0.03, 0.01), m.mat[0], x * b.w, 1.35, s * (b.d / 2 + 0.056), 0, 0, 0, 1, NO);
  digit(K, g, m.white, Math.floor(K.rnd() * 10), 0, 1.35, b.d / 2 + 0.056, 0.4);
}
function floatMat(K, g, b) { // floating mat: soft body, lighter quilted top with a stitched cross, carrying loops, rubber base
  const m = M(K), c = Math.floor(K.rnd() * 3), L = b.w >= b.d;
  K.add(g, K.box(b.w, b.h, b.d, 0.14), m.mat[c], 0, b.h / 2, 0);
  K.add(g, K.box(b.w * 0.84, 0.025, 0.04, 0.01), m.white, 0, b.h + 0.012, 0, 0, 0, 0, 1, NO); K.add(g, K.box(0.04, 0.025, b.d * 0.78, 0.01), m.white, 0, b.h + 0.012, 0, 0, 0, 0, 1, NO);
  K.add(g, K.box(b.w * 0.97, 0.06, b.d * 0.97, 0.02), m.black, 0, 0.03, 0, 0, 0, 0, 1, NC);
  for (const s of [-1, 1]) handle(K, g, m, L ? s * (b.w / 2 - 0.03) : 0, b.h * 0.5, L ? 0 : s * (b.d / 2 - 0.03), L ? -s * Math.PI / 2 : s > 0 ? 0 : Math.PI);
}
function wedge(K, g, b) { // soft wedge: two-tone body with grip stripes across the slope
  const m = M(K); K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.mat[0], 0, b.h / 2, 0); K.add(g, K.rampGeo(b.w + 0.04, b.h * 0.3, b.d + 0.02, b.ramp), m.mat[2], 0, b.h * 0.15, 0, 0, 0, 0, 1, NO);
  for (const a of [0.2, 0.4, 0.6, 0.8]) slope(K, g, b, m.white, a, 0.08);
}
function trampoline(K, g, b) { // trampoline: padded blue rim, taut black bed with a target, springs, splayed rubber legs
  const m = M(K), R = Math.min(b.w, b.d) / 2 - 0.05;
  K.add(g, K.cyl(R, R, b.h * 0.5, 0.1, 24), m.mat[0], 0, b.h * 0.75, 0); K.add(g, tube(K, R * 0.78, R * 0.78, 0.04, 24), m.black, 0, b.h + 0.01, 0, 0, 0, 0, 1, NO);
  K.add(g, K.torus(R * 0.55, 0.03, 3, 24), m.white, 0, b.h + 0.035, 0, Math.PI / 2, 0, 0, [1, 1, 0.3], NO); K.add(g, K.torus(R * 0.9, 0.03, 3, 24), m.mat[2], 0, b.h * 0.75, 0, Math.PI / 2, 0, 0, [1, 1, 1], NO);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; K.add(g, tube(K, 0.03, 0.03, 0.2, 5), m.white, Math.cos(a) * R * 0.8, b.h * 0.5 - 0.02, Math.sin(a) * R * 0.8, 0, 0, 0, 1, NO); } // springs
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; K.add(g, K.box(0.12, b.h * 0.5, 0.12, 0.03), m.black, Math.cos(a) * R * 0.8, b.h * 0.25, Math.sin(a) * R * 0.8, 0, 0, 0, 1, NO); K.add(g, K.box(0.22, 0.04, 0.22, 0.01), m.black, Math.cos(a) * R * 0.8, 0.02, Math.sin(a) * R * 0.8, 0, 0, 0, 1, NO); }
}

export default {
  bas: [{ make: vault }, { make: mats }, square(medBalls)],
  haut: [{ make: wallBars }, { make: mats }],
  pilier: [{ make: padCol }],
  coin: [{ make: padCorner }],
  plateforme: [{ make: floatMat }],
  rampe: [{ make: wedge }],
  parkour: [parkour(trampoline), parkour(floatMat)],
  solCount: [6, 4], // floor decals per room: court paint, balls, mats and hoops over the big wooden floor
  ambient: { n: 70, color: '#FFF3D6', size: 0.07, rise: 0.12, sway: 0.35, glow: false }, // chalk dust drifting in the light (Ambient.js)
  mural: [
    { make(K, g, o) { // basketball hoop on a wooden plate: backboard with a red frame, bracket, orange ring, net
      const m = M(K), y = Math.min(o.h - 1.8, 4.2);
      K.add(g, K.box(2.6, 1.9, 0.12, 0.06), m.woodL, 0, y - 0.1, 0.06, 0, 0, 0, 1, NC);
      for (const x of [-0.8, 0.8]) K.add(g, K.box(0.1, 0.1, 0.34, 0.03), m.white, x, y - 0.1, 0.27, 0, 0, 0, 1, NO);
      K.add(g, K.box(2.2, 1.4, 0.08, 0.05), m.white, 0, y, 0.48, 0, 0, 0, 1, NC);
      for (const [w, h, x, yy] of [[2.2, 0.06, 0, 0.7], [2.2, 0.06, 0, -0.7], [0.06, 1.4, -1.1, 0], [0.06, 1.4, 1.1, 0]]) K.add(g, K.box(w, h, 0.02, 0.01), m.leather, x, y + yy, 0.53, 0, 0, 0, 1, NO);
      for (const [w, h, x, yy] of [[0.8, 0.05, 0, 0.3], [0.8, 0.05, 0, -0.3], [0.05, 0.6, -0.4, 0], [0.05, 0.6, 0.4, 0]]) K.add(g, K.box(w, h, 0.02, 0.01), m.leather, x, y - 0.3 + yy, 0.53, 0, 0, 0, 1, NO);
      K.add(g, K.box(0.12, 0.12, 0.4, 0.03), m.orange, 0, y - 0.6, 0.72, 0, 0, 0, 1, NO); K.add(g, K.torus(0.34, 0.035, 6, 24), m.orange, 0, y - 0.62, 1.1, Math.PI / 2, 0, 0, 1, NC);
      K.add(g, tube(K, 0.33, 0.2, 0.5, 12), m.net, 0, y - 0.9, 1.1, 0, 0, 0, 1, NO);
    } },
    { make(K, g, o) { // scoreboard hung on two chains: team plates, two scores, a lit buzzer
      const m = M(K), y = Math.min(o.h - 1.6, 4.6), sc = [Math.floor(K.rnd() * 10), Math.floor(K.rnd() * 10), Math.floor(K.rnd() * 10), Math.floor(K.rnd() * 10)];
      K.add(g, K.box(3.6, 1.5, 0.2, 0.08), m.board, 0, y, 0.12, 0, 0, 0, 1, NC);
      K.add(g, K.box(3.7, 0.08, 0.24, 0.03), m.mat[2], 0, y + 0.79, 0.12, 0, 0, 0, 1, NO); K.add(g, K.box(3.7, 0.08, 0.24, 0.03), m.mat[2], 0, y - 0.79, 0.12, 0, 0, 0, 1, NO);
      K.add(g, K.box(1.0, 0.2, 0.02, 0.01), m.mat[0], -1.1, y + 0.5, 0.23, 0, 0, 0, 1, NO); K.add(g, K.box(1.0, 0.2, 0.02, 0.01), m.mat[1], 1.1, y + 0.5, 0.23, 0, 0, 0, 1, NO);
      [-1.4, -0.8, 0.8, 1.4].forEach((x, i) => digit(K, g, m.digit, sc[i], x, y - 0.1, 0.23, 0.7));
      for (const yy of [-0.3, 0.1]) K.add(g, K.sphere(0.06, 6, 4), m.digit, 0, y + yy, 0.23, 0, 0, 0, 1, NO);
      for (const x of [-1.5, 1.5]) K.add(g, tube(K, 0.03, 0.03, o.h - y - 0.7, 6), m.white, x, y + 0.75 + (o.h - y - 0.7) / 2, 0.12, 0, 0, 0, 1, NO);
      K.add(g, tube(K, 0.14, 0.14, 0.16, 10), m.leather, 0, y + 0.88, 0.12, 0, 0, 0, 1, NC);
    } },
    { make(K, g) { // climbing wall: wooden panel, coloured holds with bolts, a rope and a crash mat
      const m = M(K); K.add(g, K.box(3.6, 4.4, 0.1, 0.1), m.wood, 0, 2.4, 0.05, 0, 0, 0, 1, NC);
      for (let i = 0; i < 14; i++) { const x = (K.rnd() - 0.5) * 3.1, y = 0.7 + K.rnd() * 3.5, c = m.hold[i % 4]; K.add(g, K.sphere(0.16, 8, 6), c, x, y, 0.12, 0, 0, K.rnd() * 3, [1.2, 0.9, 0.6], NO); K.add(g, K.sphere(0.04, 5, 4), m.black, x, y, 0.22, 0, 0, 0, 1, NO); }
      K.add(g, K.capsule(0.06, 3.7, 3, 6), m.woodL, 2.0, 2.4, 0.3, 0, 0, 0, 1, NC); K.add(g, K.sphere(0.13, 8, 6), m.woodL, 2.0, 0.45, 0.3, 0, 0, 0, 1, NO);
      K.add(g, K.box(3.8, 0.3, 1.3, 0.14), m.mat[0], 0, 0.15, 0.7, 0, 0, 0, 1, NC);
    } },
    { make(K, g, o) { // team banner on a pole: blue pennant with a swallow tail and a yellow star
      const m = M(K), y = Math.min(o.h - 1.2, 5.6);
      K.add(g, tube(K, 0.04, 0.04, 2.2, 6), m.black, 0, y, 0.2, 0, 0, Math.PI / 2, 1, NO);
      K.add(g, K.box(1.8, 2.2, 0.04, 0.01), m.mat[0], 0, y - 1.1, 0.22, 0, 0, 0, 1, NC); K.add(g, K.cone(0.9, 0.7, 3), m.mat[0], 0, y - 2.55, 0.22, 0, 0, Math.PI, [1, 1, 0.06], NO);
      K.add(g, K.box(1.8, 0.14, 0.05, 0.01), m.mat[2], 0, y - 0.3, 0.23, 0, 0, 0, 1, NO); star5(K, g, m.mat[2], 0, y - 1.3, 0.25, 1.1);
    } },
    { make(K, g) { // bench along the wall with a duffel bag, a bottle and a ball
      const m = M(K); K.add(g, K.box(2.6, 0.12, 0.5, 0.05), m.woodL, 0, 0.55, 0.4); for (const x of [-1, 1]) K.add(g, K.box(0.1, 0.55, 0.4, 0.04), m.black, x, 0.27, 0.4, 0, 0, 0, 1, NC);
      K.add(g, K.capsule(0.2, 0.6, 4, 10), m.mat[1], -0.5, 0.88, 0.4, 0, 0, Math.PI / 2, 1, NC); K.add(g, K.box(0.7, 0.05, 0.05, 0.01), m.white, -0.5, 1.0, 0.4, 0, 0, 0, 1, NO);
      K.add(g, tube(K, 0.07, 0.07, 0.28, 8), m.mat[0], 0.55, 0.75, 0.4, 0, 0, 0, 1, NO); K.add(g, tube(K, 0.04, 0.04, 0.06, 8), m.white, 0.55, 0.92, 0.4, 0, 0, 0, 1, NO);
      K.add(g, K.sphere(0.2, 12, 8), m.orange, 0.2, 0.2, 0.4, 0, 0, 0, 1, NC); K.add(g, K.torus(0.2, 0.012, 3, 14), m.black, 0.2, 0.2, 0.4, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 2.9, make(K, g) { // free-throw lane: painted key, white border and hash marks, free-throw circle
      const m = M(K); K.add(g, K.box(2.6, 0.012, 3.6, 0.005), m.paint, 0, 0.006, 0, 0, 0, 0, 1, NO);
      for (const [w, d, x, z] of [[2.7, 0.1, 0, 1.8], [2.7, 0.1, 0, -1.8], [0.1, 3.7, 1.3, 0], [0.1, 3.7, -1.3, 0]]) K.add(g, K.box(w, 0.014, d, 0.005), m.line, x, 0.008, z, 0, 0, 0, 1, NO);
      for (const z of [-1.1, -0.5, 0.1]) for (const s of [-1, 1]) K.add(g, K.box(0.3, 0.014, 0.08, 0.005), m.line, s * 1.2, 0.008, z, 0, 0, 0, 1, NO);
      K.add(g, K.torus(1.0, 0.05, 3, 28), m.line, 0, 0.008, -1.8, Math.PI / 2, 0, 0, [1, 1, 0.1], NO);
    } },
    { r: 3.4, make(K, g) { // centre court: ring, half-way line, inner disc and a star
      const m = M(K); K.add(g, K.torus(2.4, 0.06, 3, 48), m.line, 0, 0.01, 0, Math.PI / 2, 0, 0, [1, 1, 0.1], NO); K.add(g, K.box(6.4, 0.01, 0.12, 0.005), m.line, 0, 0.008, 0, 0, 0, 0, 1, NO);
      K.add(g, tube(K, 0.9, 0.9, 0.012, 24), m.paint, 0, 0.006, 0, 0, 0, 0, 1, NO); star5(K, g, m.line, 0, 0.013, 0, 1.5, Math.PI / 2);
    } },
    { r: 1.2, make(K, g) { const m = M(K); for (const [x, z] of [[0, 0], [1, 0.4], [-0.8, 0.6]]) { K.add(g, K.box(0.5, 0.04, 0.5, 0.02), m.orange, x, 0.02, z, 0, 0, 0, 1, NO); K.add(g, K.cone(0.2, 0.5, 12), m.orange, x, 0.27, z, 0, 0, 0, 1, NC); K.add(g, K.torus(0.125, 0.03, 3, 12), m.white, x, 0.22, z, Math.PI / 2, 0, 0, 1, NO); } } }, // striped cones
    { r: 0.9, make(K, g) { // basketball with seams, a volleyball beside it
      const m = M(K); K.add(g, K.sphere(0.4, 14, 10), m.orange, 0, 0.4, 0); for (const [rx, ry] of [[Math.PI / 2, 0], [0, 0], [0, Math.PI / 2]]) K.add(g, K.torus(0.4, 0.014, 3, 20), m.black, 0, 0.4, 0, rx, ry, 0, 1, NO);
      K.add(g, K.sphere(0.25, 12, 8), m.white, 0.7, 0.25, 0.3, 0, 0, 0, 1, NC); for (const [i, c] of [m.mat[2], m.mat[0]].entries()) K.add(g, K.torus(0.25, 0.014, 3, 16), c, 0.7, 0.25, 0.3, 0, i * 1.2 + 0.4, 0, 1, NO);
    } },
    { r: 1.5, make(K, g) { // tumbling mat: blue, white piping, two fold lines, a carrying loop
      const m = M(K); K.add(g, K.box(2.4, 0.08, 1.2, 0.04), m.mat[0], 0, 0.04, 0, 0, 0, 0, 1, NC);
      for (const [w, d, x, z] of [[2.3, 0.04, 0, 0.55], [2.3, 0.04, 0, -0.55], [0.04, 1.1, 1.1, 0], [0.04, 1.1, -1.1, 0]]) K.add(g, K.box(w, 0.02, d, 0.005), m.white, x, 0.085, z, 0, 0, 0, 1, NO);
      for (const x of [-0.4, 0.4]) K.add(g, K.box(0.03, 0.015, 1.1, 0.005), m.white, x, 0.088, 0, 0, 0, 0, 1, NO); handle(K, g, m, 1.15, 0.05, 0, -Math.PI / 2);
    } },
    { r: 1.2, make(K, g) { const m = M(K); for (const [i, [x, z]] of [[0, 0], [0.55, 0.3], [-0.2, 0.55]].entries()) K.add(g, K.torus(0.5, 0.03, 3, 20), [m.leather, m.mat[2], m.mat[0]][i], x, 0.03, z, Math.PI / 2, 0, 0, 1, NC); } }, // hula hoops
  ],
};
