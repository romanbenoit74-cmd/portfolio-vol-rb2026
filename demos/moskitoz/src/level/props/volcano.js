// Volcan (concept/js/biome-volcano.js): basalt boulders with glowing cracks, hexagonal basalt columns (walls, pillars,
// corners), basalt slabs with lava seams (platforms / parkour), rock ramps; lava falls and glowing wall cracks; lava pools
// and cracks on the floor. Lava is emissive HDR (it blooms in high quality) and purely decorative: no damage, same play.
import { alongX } from './kit.js';
import { band } from './common.js';

const M = (K) => ({
  // lava-lit edges: an orange fresnel rim on the rock so silhouettes read against the dark room
  rock: K.m('#4A2A2A', { rim: 0.22, rimColor: '#FF9A6A', shadow: 0.62 }), rockL: K.m('#6A3A32', { rim: 0.18, rimColor: '#FF9A6A' }), basalt: K.m('#3A2A30', { rim: 0.25, rimColor: '#FF8A5A' }), basaltL: K.m('#54404A', { rim: 0.2, rimColor: '#FF8A5A' }),
  crust: K.m('#2A1A1E'), lava: K.glow('#FF7A2E', 2.2), hot: K.glow('#FFD24A', 2.8), obsidian: K.m('#241A2A', { rim: 0.35, rimColor: '#FF9A6A' }),
});

function cracks(K, g, m, L, T, y, n = 3) { // glowing zigzag seams on a top surface
  for (let i = 0; i < n; i++) { const x = (K.rnd() - 0.5) * L * 0.7, z = (K.rnd() - 0.5) * T * 0.6; K.add(g, K.box(L * (0.25 + K.rnd() * 0.25), 0.05, 0.09, 0.02), m.lava, x, y, z, 0, K.rnd() * Math.PI, 0, 1, { ink: false, cast: false }); }
}
function boulder(K, g, b) { // basalt boulder with lava cracks, smaller rocks at its foot
  const m = M(K), W = b.w, D = b.d, H = b.h;
  K.add(g, K.box(W, H, D, Math.min(W, D, H) * 0.38), m.rock, 0, H / 2, 0);
  cracks(K, g, m, W, D, H + 0.005, 3);
  for (const [x, z, s] of [[0.44, 0.38, 0.28], [-0.42, -0.4, 0.22]]) K.add(g, K.sphere(s, 10, 8), m.rockL, x * W, s * 0.55, z * D, 0, 0, 0, [1.2, 0.7, 1.1]);
}
function obsidian(K, g, b) { // faceted obsidian block with a glowing core line
  const m = M(K), { L, T } = alongX(g, b), H = b.h;
  K.add(g, K.box(L, H, T, Math.min(L, T, H) * 0.12), m.obsidian, 0, H / 2, 0);
  K.add(g, K.box(L + 0.02, 0.1, 0.1, 0.03), m.lava, 0, H * 0.55, T / 2, 0, 0, 0, 1, { ink: false, cast: false });
}
function hexRow(K, g, b) { // wall of hexagonal basalt columns (the tallest reaches the box top)
  const m = M(K), { L, T } = alongX(g, b), H = b.h, r = T * 0.58, n = Math.max(2, Math.round(L / (r * 1.7)));
  K.add(g, K.box(L, H * 0.5, T, 0.1), m.basalt, 0, H * 0.25, 0, 0, 0, 0, 1, { ink: false }); // solid core under the columns
  for (let i = 0; i < n; i++) { const h = i % 3 === 1 ? H : H * (0.78 + 0.18 * K.rnd()); K.add(g, K.cyl(r, r, h, 0.08, 6), i % 2 ? m.basalt : m.basaltL, -L / 2 + (i + 0.5) * (L / n), h / 2, 0, 0, i * 0.4); }
}
function hexColumn(K, g, b) { // one basalt column to the ceiling, glowing seam rings
  const m = M(K), R = b.r ?? Math.min(b.w, b.d) / 2, H = b.h, seams = Math.max(1, Math.floor(H / 3.2));
  K.add(g, K.cyl(R, R, H, 0.1, 6), m.basalt, 0, H / 2, 0);
  for (let i = 1; i <= seams; i++) K.add(g, K.cyl(R * 1.02, R * 1.02, 0.08, 0.02, 6), m.lava, 0, (i * H) / (seams + 1), 0, 0, 0, 0, 1, { ink: false, cast: false });
}
function hexCluster(K, g, b) { // corner: three columns of different heights (the tallest to the ceiling)
  const m = M(K), H = b.h, r = Math.min(b.w, b.d) * 0.3;
  K.add(g, K.cyl(r * 1.15, r * 1.15, H, 0.1, 6), m.basalt, 0, H / 2, 0);
  for (const [x, z, k] of [[0.45, 0.2, 0.6], [-0.3, 0.45, 0.4]]) K.add(g, K.cyl(r, r, H * k, 0.08, 6), m.basaltL, x * b.w * 0.5, H * k / 2, z * b.d * 0.5, 0, x);
}
function slab(K, g, b, parkour = false) { // basalt slab with lava seams (platform / parkour)
  const m = M(K), H = b.h;
  K.add(g, K.box(b.w, H, b.d, Math.min(0.2, H * 0.45)), m.basalt, 0, H / 2, 0);
  cracks(K, g, m, b.w, b.d, H + 0.005, 2);
  if (parkour) band(K, g, b);
}
function rockRamp(K, g, b) { const m = M(K); K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), m.rockL, 0, b.h / 2, 0); }

export default {
  bas: [{ make: boulder }, { fits: (b) => Math.max(b.w, b.d) / Math.min(b.w, b.d) >= 1.2, make: obsidian }],
  haut: [{ make: hexRow }],
  pilier: [{ make: hexColumn }],
  coin: [{ make: hexCluster }],
  plateforme: [{ make: (K, g, b) => slab(K, g, b) }],
  rampe: [{ make: rockRamp }],
  parkour: [{ make: (K, g, b) => slab(K, g, b, true) }],
  looks: { boulder, obsidian, hexRow, hexColumn, hexCluster, slab: (K, g, b) => slab(K, g, b), rockRamp },
  solCount: [9, 4], // floor decals per room: [at least, up to this many more] (lava pools and cracks everywhere)
  ambient: { n: 160, color: '#FFB25A', size: 0.13, rise: 0.9, sway: 0.5, glow: true }, // embers rising (Ambient.js)
  mural: [
    { make(K, g, o) { // lava fall pouring from a crack in the wall into a small pool
      const m = M(K), top = Math.min(o.h - 1, 7.5);
      K.add(g, K.box(2.2, 1.2, 0.5, 0.2), m.rock, 0, top, 0.2, 0, 0, 0, 1, { cast: false });
      K.add(g, K.box(1.1, top, 0.22, 0.1), m.lava, 0, top / 2, 0.36, 0, 0, 0, 1, { ink: false, cast: false });
      K.add(g, K.box(0.5, top, 0.24, 0.1), m.hot, 0, top / 2, 0.4, 0, 0, 0, 1, { ink: false, cast: false });
      K.add(g, K.box(3.2, 0.3, 1.8, 0.14), m.crust, 0, 0.12, 1.0, 0, 0, 0, 1, { cast: false });
      K.add(g, K.box(2.6, 0.06, 1.3, 0.03), m.lava, 0, 0.28, 1.0, 0, 0, 0, 1, { ink: false, cast: false });
    } },
    { make(K, g, o) { // glowing cracks zigzagging up the wall + a rock shelf
      const m = M(K); let y = 0.8, x = 0;
      for (let i = 0; i < 5; i++) { const nx = x + (i % 2 ? 0.7 : -0.7), ny = y + 0.9; K.add(g, K.box(0.12, Math.hypot(nx - x, ny - y), 0.06, 0.02), m.lava, (x + nx) / 2, (y + ny) / 2, 0.04, 0, 0, Math.atan2(nx - x, ny - y) * -1, 1, { ink: false, cast: false }); x = nx; y = ny; }
      K.add(g, K.box(3.0, 0.4, 1.0, 0.16), m.rock, 1.2, Math.min(o.h - 2, 5.2), 0.5, 0, 0, 0, 1, { cast: false });
    } },
  ],
  sol: [
    { r: 2.2, make(K, g) { const m = M(K); K.add(g, K.cyl(1.6, 1.7, 0.24, 0.1, 20), m.crust, 0, 0.1, 0, 0, 0, 0, 1, { cast: false }); K.add(g, K.cyl(1.25, 1.25, 0.05, 0.02, 20), m.lava, 0, 0.23, 0, 0, 0, 0, 1, { ink: false, cast: false }); K.add(g, K.cyl(0.55, 0.55, 0.05, 0.02, 16), m.hot, 0.3, 0.245, -0.2, 0, 0, 0, 1, { ink: false, cast: false }); } },
    { r: 2.0, make(K, g) { const m = M(K); let x = -1.6, z = 0; for (let i = 0; i < 5; i++) { const nx = x + 0.8, nz = z + (i % 2 ? 0.5 : -0.5); K.add(g, K.box(Math.hypot(nx - x, nz - z) + 0.05, 0.03, 0.1, 0.01), m.lava, (x + nx) / 2, 0.015, (z + nz) / 2, 0, -Math.atan2(nz - z, nx - x), 0, 1, { ink: false, cast: false }); x = nx; z = nz; } } },
    { r: 1.0, make(K, g) { const m = M(K); for (const [x, z, s] of [[0, 0, 0.42], [0.6, 0.3, 0.3], [-0.4, 0.45, 0.24]]) K.add(g, K.sphere(s, 10, 8), m.rockL, x, s * 0.5, z, 0, 0, 0, [1.2, 0.7, 1.1]); } },
  ],
};
