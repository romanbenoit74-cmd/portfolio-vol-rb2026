// Igloo: stacked ice blocks with frost cracks, snowmen on a snow mound, snow drifts, ice-brick walls under snow caps, frozen
// columns with icicles and crystals, ice corner pillars, floating ice floes, snow ramps; icicles, penguins, snowflakes, pines
// and frosted windows on the walls; snow patches, frozen puddles, snowballs, footprints and ice crystals on the floor.
// Snowflakes fall through the room.
import { NC, NO, alongX, parkour, spread, square } from './common.js';

const tube = (K, rt, rb, h, seg = 8) => K.lathe([[0.001, -h / 2], [rb, -h / 2], [rt, h / 2], [0.001, h / 2]], seg); // cheap cylinder without bevel: thin posts, rings and flat discs

const M = (K) => ({
  ice: K.m('#BFE8FF', { rim: 0.6, rimColor: '#FFFFFF' }), iceD: K.m('#96D2F4', { rim: 0.5, rimColor: '#FFFFFF' }), snow: K.m('#F6FBFF', { rim: 0.2, ao: 1 }), brick: K.m('#DDF3FF', { pattern: 'grid', color2: '#B8DFF4', scale: 0.35 }),
  coal: K.m('#1A3A55'), carrot: K.m('#FF7A5C', { rim: 0.2 }), scarf: K.m('#FF5B6A', { rim: 0.2 }), black: K.m('#1E2A3A', { rim: 0.2 }), belly: K.m('#FFFFFF'), beak: K.m('#FFB030'),
  frost: K.f('#FFFFFF'), puddle: K.m('#A6DEFC', { rim: 0.7, rimColor: '#FFFFFF' }), pine: K.m('#4AA89A', { rim: 0.15 }),
});
const lump = (K, g, m, x, y, z, r, o, sy = 0.5) => K.add(g, K.sphere(r, 8, 6), m.snow, x, y, z, 0, 0, 0, [1.2, sy, 1], NO); // a soft snow lump
function slope(K, g, b, mat, a, wid, k = 0.94) { // flat stripe lying on the slope of a ramp box at fraction a (0..1) along its axis
  const ax = b.ramp.axis === 'x', len = ax ? b.w : b.d, up = b.ramp.dir > 0, ang = Math.atan2(b.h, len), p = (a - 0.5) * len, y = b.h * (up ? a : 1 - a) + 0.02;
  if (ax) K.add(g, K.box(wid, 0.03, b.d * k, 0.01), mat, p, y, 0, 0, 0, up ? ang : -ang, 1, NO);
  else K.add(g, K.box(b.w * k, 0.03, wid, 0.01), mat, 0, y, p, up ? -ang : ang, 0, 0, 1, NO);
}
function crystal(K, g, m, x, y, z, s, rz = 0, rx = 0) { K.add(g, K.cone(0.1 * s, 0.45 * s, 4), m.ice, x, y + 0.22 * s, z, rx, 0.4, rz, 1, NC); } // an ice shard
function icicles(K, g, m, R, y, n, h = 0.5) { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = h + (i % 3) * 0.2; K.add(g, K.cone(0.1, k, 6), m.iceD, Math.cos(a) * R, y - k / 2, Math.sin(a) * R, Math.PI, 0, 0, 1, NO); } }

function iceBlocks(K, g, b) { // big ice cubes stacked, frosty facets and cracks, a snow cap with lumps, snowballs at the foot
  const m = M(K), { L, T } = alongX(g, b), H = b.h, n = Math.max(1, Math.round(L / 1.5)), rows = Math.max(1, Math.round(H / 1.2)), bh = H / rows - 0.04;
  for (let j = 0; j < rows; j++) for (const x of spread(n, L)) {
    const bw = L / n - 0.06, y = ((j + 0.5) * H) / rows, c = (K.rnd() - 0.5) * 0.06; K.add(g, K.box(bw, bh, T - 0.04, 0.12), j % 2 ? m.iceD : m.ice, x + c, y, 0, 0, (K.rnd() - 0.5) * 0.06, 0);
    for (const s of [-1, 1]) { K.add(g, K.box(bw * 0.45, bh * 0.5, 0.02, 0.01), m.snow, x + bw * 0.1, y + bh * 0.12, s * (T / 2 - 0.015), 0, 0, 0, 1, NO); K.add(g, K.box(bw * 0.3, 0.03, 0.02, 0.01), m.iceD, x - bw * 0.18, y - bh * 0.3, s * (T / 2 - 0.014), 0, 0, 0.5, 1, NO); } // frost facet, crack
  }
  K.add(g, K.box(L * 0.9, 0.14, T * 0.85, 0.07), m.snow, 0, H + 0.02, 0, 0, 0, 0, 1, NO);
  for (const x of spread(Math.max(2, Math.round(L / 1.1)), L * 0.8)) lump(K, g, m, x, H + 0.08, (K.rnd() - 0.5) * T * 0.4, T * 0.22, NC);
  for (const [x, z] of [[-L * 0.4, T / 2 + 0.1], [-L * 0.4 + 0.22, T / 2 + 0.2]]) K.add(g, K.sphere(0.12, 8, 6), m.snow, x, 0.12, z, 0, 0, 0, 1, NO);
}
function snowman(K, g, b) { // snow mound filling the box with a little snowman on its edge: hat, scarf with a tail, buttons, stick arms
  const m = M(K), S = Math.min(b.w, b.d), H = b.h;
  K.add(g, K.box(b.w, H, b.d, Math.min(b.w, b.d, H) * 0.45), m.snow, 0, H / 2, 0);
  const s = Math.min(0.34, S * 0.11), x = b.w * 0.25, z = -b.d * 0.2; // small: it stands on the collider top
  for (const [lx, lz, r] of [[-0.3, 0.3, 0.28], [0.2, 0.38, 0.22], [-0.38, -0.25, 0.2]]) lump(K, g, m, lx * b.w, H, lz * b.d, Math.min(r, S * 0.12), NC, 0.4);
  K.add(g, K.sphere(s * 1.3, 12, 8), m.snow, x, H + s * 1.1, z); K.add(g, K.sphere(s, 12, 8), m.snow, x, H + s * 3, z, 0, 0, 0, 1, NO);
  K.add(g, K.cone(s * 0.18, s * 0.7, 8), m.carrot, x, H + s * 3, z + s * 1.2, Math.PI / 2, 0, 0, 1, NO); for (const e of [-1, 1]) K.add(g, K.sphere(s * 0.1, 6, 4), m.coal, x + e * s * 0.35, H + s * 3.3, z + s * 0.9, 0, 0, 0, 1, NO);
  K.add(g, K.torus(s * 0.9, s * 0.2, 6, 16), m.scarf, x, H + s * 2.2, z, Math.PI / 2, 0, 0, 1, NO); K.add(g, K.box(s * 0.3, s * 0.9, s * 0.2, 0.01), m.scarf, x + s * 0.4, H + s * 1.8, z + s * 0.85, 0, 0, 0.2, 1, NO);
  for (const dy of [1.1, 1.5]) K.add(g, K.sphere(s * 0.1, 5, 4), m.coal, x, H + s * dy + s * 0.5, z + s * 1.25, 0, 0, 0, 1, NO);
  K.add(g, tube(K, s * 0.75, s * 0.75, s * 0.12, 12), m.black, x, H + s * 3.8, z, 0, 0, 0, 1, NO); K.add(g, tube(K, s * 0.5, s * 0.52, s * 0.6, 10), m.black, x, H + s * 4.1, z, 0, 0, 0, 1, NO); // top hat
  K.add(g, K.torus(s * 0.52, s * 0.08, 3, 12), m.scarf, x, H + s * 3.9, z, Math.PI / 2, 0, 0, 1, NO);
  for (const e of [-1, 1]) K.add(g, K.capsule(s * 0.05, s * 1.4, 2, 4), m.coal, x + e * s * 1.4, H + s * 2.2, z, 0, 0, -e * 1.0, 1, NO);
}
function iceWall(K, g, b) { // ice-brick wall: lighter courses, a thick snow cap with lumps, icicles hanging from it
  const m = M(K), { L, T } = alongX(g, b), H = b.h; K.add(g, K.box(L, H - 0.2, T, 0.08), m.brick, 0, (H - 0.2) / 2, 0); K.add(g, K.box(L + 0.1, 0.3, T + 0.14, 0.14), m.snow, 0, H - 0.15, 0, 0, 0, 0, 1, NO);
  for (const y of [H * 0.33, H * 0.66]) for (const s of [-1, 1]) K.add(g, K.box(L * 0.98, 0.07, 0.04, 0.01), m.ice, 0, y, s * (T / 2 + 0.01), 0, 0, 0, 1, NO);
  for (const x of spread(Math.max(2, Math.round(L / 1.0)), L * 0.9)) lump(K, g, m, x, H + 0.05, 0, T * 0.4, NC, 0.45);
  for (const [i, x] of spread(Math.max(3, Math.round(L / 0.7)), L * 0.9).entries()) for (const s of [-1, 1]) K.add(g, K.cone(0.08, 0.4 + ((i + (s > 0)) % 3) * 0.2, 6), m.ice, x, H - 0.4 - ((i + (s > 0)) % 3) * 0.1, s * (T / 2 + 0.08), Math.PI, 0, 0, 1, NO);
}
function frozenCol(K, g, b) { // ice column: snow cuff with lumps, frozen rings, frost crystals, icicles below the top band
  const m = M(K), R = b.r ?? b.w / 2, H = b.h;
  K.add(g, K.cyl(R * 0.9, R, H, 0.1, 12), m.ice, 0, H / 2, 0);
  K.add(g, K.cyl(R * 1.1, R * 1.2, 0.5, 0.2, 14), m.snow, 0, 0.25, 0, 0, 0, 0, 1, NO);
  icicles(K, g, m, R * 0.92, 3.2, 6);
  K.add(g, K.cyl(R * 0.98, R * 0.98, 0.3, 0.08, 12), m.snow, 0, 3.5, 0, 0, 0, 0, 1, NO);
  for (const y of [1.2, 2.2]) K.add(g, K.torus(R * 0.96, 0.05, 3, 12), m.iceD, 0, y, 0, Math.PI / 2, 0, 0, 1, NO);
  for (let i = 0; i < 3; i++) { const a = i * 1.9; crystal(K, g, m, Math.cos(a) * R * 0.88, 0.7 + i * 0.5, Math.sin(a) * R * 0.88, 0.7, Math.sin(a) * 1.1, -Math.cos(a) * 1.1); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.28; lump(K, g, m, Math.cos(a) * R * 1.15, 0.5, Math.sin(a) * R * 1.15, R * 0.35, NO, 0.5); }
  lump(K, g, m, 0, 3.62, 0, R * 0.8, NO, 0.35);
}
function floe(K, g, b) { // ice floe: a darker foot tier under a pale slab, snow cap with lumps, cracks and icicles underneath
  const m = M(K), H = b.h; K.add(g, K.box(b.w * 0.94, H * 0.5, b.d * 0.94, Math.min(0.2, H * 0.22)), m.iceD, 0, H * 0.25, 0, 0, 0, 0, 1, NO);
  K.add(g, K.box(b.w, H * 0.62, b.d, Math.min(0.2, H * 0.28)), m.ice, 0, H * 0.69, 0); K.add(g, K.box(b.w * 0.8, 0.08, b.d * 0.7, 0.04), m.snow, b.w * 0.05, H, -b.d * 0.05, 0, 0.1, 0, 1, NO);
  lump(K, g, m, b.w * 0.3, H + 0.04, b.d * 0.15, Math.min(b.w, b.d) * 0.12); lump(K, g, m, -b.w * 0.25, H + 0.04, -b.d * 0.2, Math.min(b.w, b.d) * 0.09);
  K.add(g, K.box(b.w * 0.25, 0.03, 0.03, 0.01), m.iceD, -b.w * 0.3, H * 0.7, b.d / 2 + 0.005, 0, 0, 0.3, 1, NO); K.add(g, K.box(0.03, 0.03, b.d * 0.22, 0.01), m.iceD, b.w / 2 + 0.005, H * 0.6, b.d * 0.2, 0, 0, 0, 1, NO);
  for (const [x, z] of [[-0.3, 0.2], [0.1, -0.3], [0.35, 0.3]]) K.add(g, K.cone(0.07, H * 0.45, 5), m.ice, x * b.w, H * 0.22, z * b.d, Math.PI, 0, 0, 1, NO);
}
function drift(K, g, b) { // snow drift: a soft mound with lumps, wind ripples, ice shards poking out and a lost coral mitten
  const m = M(K), { L, T } = alongX(g, b), H = b.h; K.add(g, K.box(L, H, T, Math.min(T, H) * 0.48), m.snow, 0, H / 2, 0);
  for (const x of [-L * 0.3, L * 0.2]) K.add(g, K.sphere(0.3, 10, 8), m.snow, x, H, (K.rnd() - 0.5) * T * 0.5, 0, 0, 0, [1.4, 0.4, 1], NO);
  for (let i = 0; i < 4; i++) K.add(g, K.torus(T * 0.3, 0.02, 3, 12, Math.PI * 0.8), m.ice, -L * 0.35 + i * L * 0.22, H * 0.7, T / 2 - 0.02, 0, 0, 0, [1, 0.4, 1], NO);
  crystal(K, g, m, L * 0.3, H - 0.1, T * 0.1, 0.8, 0.2); crystal(K, g, m, -L * 0.1, H - 0.12, -T * 0.15, 0.6, -0.3);
  K.add(g, K.sphere(0.1, 6, 4), m.scarf, L * 0.4, H + 0.02, T * 0.2, 0, 0, 0, [1.2, 0.8, 1], NO);
}
function iceCorner(K, g, b) { // corner pillar of ice: snow skirt, rings, crystals, snow cap with icicles
  const m = M(K); K.add(g, K.box(b.w, b.h, b.d, 0.2), m.iceD, 0, b.h / 2, 0); K.add(g, K.box(b.w + 0.1, 0.5, b.d + 0.1, 0.22), m.snow, 0, 0.25, 0, 0, 0, 0, 1, NO);
  for (const y of [1.3, 2.5]) K.add(g, K.box(b.w + 0.05, 0.1, b.d + 0.05, 0.01), m.ice, 0, y, 0, 0, 0, 0, 1, NO);
  for (let i = 0; i < 4; i++) { const sd = i % 4, y = 0.9 + i * 0.5, o = (K.rnd() - 0.5) * 0.5; crystal(K, g, m, sd < 2 ? (sd ? -1 : 1) * (b.w / 2) : o * b.w, y, sd >= 2 ? (sd === 2 ? 1 : -1) * (b.d / 2) : o * b.d, 0.7, sd < 2 ? (sd ? 1 : -1) * 1.1 : 0, sd >= 2 ? (sd === 2 ? 1 : -1) * 1.1 : 0); }
  for (const x of [-1, 0, 1]) lump(K, g, m, x * b.w * 0.3, 0.5, b.d / 2 + 0.1, 0.3, NO, 0.5);
}

export default {
  bas: [{ make: iceBlocks }, square(snowman), { make: drift }],
  haut: [{ make: iceWall }, { make: iceBlocks }],
  pilier: [{ make: frozenCol }],
  coin: [{ make: iceCorner }],
  plateforme: [{ make: floe }],
  rampe: [{ make: (K, g, b) => { const m = M(K); K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.snow, 0, b.h / 2, 0); for (const a of [0.15, 0.32, 0.5, 0.68, 0.85]) slope(K, g, b, m.ice, a, 0.07); } }], // snow ramp with wind ripples
  parkour: [parkour(floe)],
  solCount: [4, 3], // floor decals per room: snow patches, puddles, footprints and crystals over the pale ice
  ambient: { n: 140, color: '#FFFFFF', size: 0.11, rise: -0.5, sway: 0.6, glow: false }, // snowflakes falling (Ambient.js)
  mural: [
    { make(K, g, o) { const m = M(K), y = o.h - 0.2; K.add(g, K.box(5, 0.35, 0.6, 0.15), m.snow, 0, y, 0.3, 0, 0, 0, 1, NO); for (const x of spread(5, 4.4)) lump(K, g, m, x, y + 0.2, 0.3, 0.45, NC, 0.45); for (const [i, x] of spread(9, 4.6).entries()) K.add(g, K.cone(0.14, 0.6 + (i % 3) * 0.35, 6), m.ice, x, y - 0.4 - (i % 3) * 0.17, 0.35, Math.PI, 0, 0, 1, NO); } }, // icicles under a snow ledge
    { make(K, g) { // penguin: rounded body, belly, flippers, orange feet and beak, a scarf, eyes with pupils, on a snow mound
      const m = M(K); lump(K, g, m, 0, 0.12, 0.65, 0.8, NC, 0.3);
      K.add(g, K.sphere(0.5, 12, 8), m.black, 0, 0.8, 0.6, 0, 0, 0, [1, 1.4, 0.9]); K.add(g, K.sphere(0.4, 12, 8), m.belly, 0, 0.75, 0.84, 0, 0, 0, [0.9, 1.2, 0.5], NO);
      K.add(g, K.sphere(0.34, 12, 8), m.black, 0, 1.65, 0.62, 0, 0, 0, 1, NO); K.add(g, K.cone(0.1, 0.25, 6), m.beak, 0, 1.6, 0.98, Math.PI / 2, 0, 0, 1, NO);
      for (const s of [-1, 1]) { K.add(g, K.sphere(0.09, 6, 4), m.belly, s * 0.13, 1.72, 0.88, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.045, 5, 4), m.coal, s * 0.14, 1.72, 0.96, 0, 0, 0, 1, NO); K.add(g, K.sphere(0.14, 8, 6), m.black, s * 0.52, 0.95, 0.62, 0, 0, -s * 0.5, [0.5, 1.4, 0.5], NO); K.add(g, K.sphere(0.12, 6, 4), m.beak, s * 0.22, 0.12, 0.95, 0, 0, 0, [1.2, 0.4, 1.6], NO); }
      K.add(g, K.torus(0.3, 0.07, 5, 14), m.scarf, 0, 1.35, 0.62, Math.PI / 2, 0, 0, 1, NO);
    } },
    { make(K, g) { // snowflakes: six-armed, each arm with two little branches
      const m = M(K); for (const [x, y] of [[-1.2, 2.6], [0.8, 3.4], [1.6, 2.2]]) for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; K.add(g, K.box(0.9, 0.08, 0.02, 0.005), m.frost, x, y, 0.05, 0, 0, a, 1, NO); for (const s of [-1, 1]) for (const t of [0.2, 0.34]) for (const e of [-1, 1]) K.add(g, K.box(0.14, 0.04, 0.02, 0.005), m.frost, x + s * Math.cos(a) * t + e * Math.sin(a) * 0.05 * 0, y + s * Math.sin(a) * t, 0.05, 0, 0, a + e * 0.8, 1, NO); }
    } },
    { make(K, g) { const m = M(K); K.add(g, tube(K, 0.14, 0.18, 0.9, 6), m.coal, 0, 0.45, 0.5); for (const [i, [r, y]] of [[1.0, 1.1], [0.78, 1.8], [0.55, 2.4]].entries()) K.add(g, K.cone(r, 0.9, 8), i % 2 ? m.pine : m.pine, 0, y + 0.3, 0.5, 0, 0, 0, 1, i ? NC : NC); for (const [x, y, z] of [[0.35, 1.2, 0.9], [-0.3, 1.9, 0.75]]) K.add(g, K.sphere(0.2, 8, 6), m.snow, x, y, z, 0, 0, 0, [1.2, 0.5, 1], NO); K.add(g, K.sphere(0.12, 8, 6), m.scarf, 0.15, 2.95, 0.5, 0, 0, 0, 1, NO); } }, // pine tree with snow on its branches
    { make(K, g, o) { // frosted window: rounded frame, pale pane, frost corners, a sill with snow
      const m = M(K), y = Math.min(o.h - 2, 3.4); K.add(g, K.box(2.0, 2.2, 0.12, 0.1), m.iceD, 0, y, 0.06, 0, 0, 0, 1, NC); K.add(g, K.box(1.7, 1.9, 0.04, 0.02), m.ice, 0, y, 0.12, 0, 0, 0, 1, NO);
      K.add(g, K.box(0.05, 1.9, 0.05, 0.01), m.iceD, 0, y, 0.15, 0, 0, 0, 1, NO); K.add(g, K.box(1.7, 0.05, 0.05, 0.01), m.iceD, 0, y, 0.15, 0, 0, 0, 1, NO);
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add(g, K.sphere(0.32, 8, 6), m.snow, sx * 0.75, y + sy * 0.85, 0.15, 0, 0, 0, [1, 1, 0.12], NO);
      K.add(g, K.box(2.4, 0.18, 0.4, 0.07), m.snow, 0, y - 1.2, 0.2, 0, 0, 0, 1, NO);
    } },
  ],
  sol: [
    { r: 1.8, make(K, g) { const m = M(K); K.add(g, K.sphere(1.5, 14, 6), m.snow, 0, 0, 0, 0, 0, 0, [1, 0.15, 0.8], NO); for (const [x, z, r] of [[0.5, 0.2, 0.5], [-0.6, -0.1, 0.4], [0.1, -0.5, 0.35]]) lump(K, g, m, x, 0.1, z, r, NO, 0.35); } }, // snow patch with lumps
    { r: 1.4, make(K, g) { const m = M(K); K.add(g, tube(K, 1.2, 1.2, 0.03, 24), m.puddle, 0, 0.015, 0, 0, 0, 0, [1, 1, 0.7], NO); K.add(g, K.torus(1.2, 0.07, 3, 24), m.snow, 0, 0.03, 0, Math.PI / 2, 0, 0, [1, 0.7, 0.4], NO); for (const [x, z, a] of [[0.2, 0.1, 0.4], [-0.3, -0.2, -0.6], [0.5, -0.3, 1.1]]) K.add(g, K.box(0.7, 0.012, 0.025, 0.005), m.frost, x, 0.035, z, 0, a, 0, 1, NO); } }, // frozen puddle with a snowy rim and cracks
    { r: 0.9, make(K, g) { const m = M(K); for (const [x, z, r] of [[0, 0, 0.3], [0.5, 0.3, 0.22], [0.1, 0.55, 0.18]]) K.add(g, K.sphere(r, 9, 6), m.snow, x, r, z); lump(K, g, m, 0.25, 0.04, 0.3, 0.55, NO, 0.12); } },
    { r: 1.2, make(K, g) { // footprints
      const m = M(K); for (let i = 0; i < 6; i++) K.add(g, K.sphere(0.12, 6, 4), m.iceD, (i % 2 ? 1 : -1) * 0.15, 0.012, -0.9 + i * 0.35, 0, i % 2 ? 0.2 : -0.2, 0, [0.7, 0.2, 1.2], NO);
    } },
    { r: 0.9, make(K, g) { const m = M(K); lump(K, g, m, 0, 0.05, 0, 0.5, NC, 0.25); crystal(K, g, m, 0, 0.06, 0, 1.3); crystal(K, g, m, 0.3, 0.05, 0.1, 0.9, -0.4); crystal(K, g, m, -0.3, 0.05, 0.1, 0.7, 0.45); crystal(K, g, m, 0.05, 0.05, -0.3, 0.8, 0.1, -0.4); } }, // ice crystal cluster
  ],
};
