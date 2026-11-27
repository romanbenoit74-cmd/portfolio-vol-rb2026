// The tower seen from outside (menu + intro fly-up): a widening skyscraper of 20 biome blocks with framed lit windows,
// pilasters and neon cornices, a lobby podium on a plaza, ring road with cars, a real city with lit facades, trees,
// a patchwork of fields, distant mountains, a gradient sky with a low sun and soft shaded clouds.
// Everything is merged / instanced (a handful of draw calls) and built once, then reused between menus and runs.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { rng } from '../core/core.js';
import { gomme } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';
import { THEMES } from '../level/Level.js';

export const TOWER_W = 46, FLOOR_H = 4, TOWER_H = 400;
const NB = 20, BH = TOWER_H / NB, GY = -TOWER_H - 0.3; // GY = ground level
const bw = (k) => TOWER_W + k * 0.55;                    // the tower widens toward its base
const PODIUM = bw(NB - 1) + 14, PH = 12;

const canvasTex = (size, paint) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = size; paint(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const glow = (stops) => canvasTex(128, (c, s) => { const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(0, 0, s, s); });

// coloured box; side faces get UVs in "texture cells" of uu x uv metres, tops sample the plain wall at the texture centre
function part(w, h, d, x, y, z, color, uu = 8, uv = 4, openTop = false) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (openTop) g.setIndex(Array.from(g.index.array).filter((_, i) => i < 12 || i >= (openTop > 1 ? 24 : 18))); // drop the +Y face (and -Y when openTop = 2)
  const t = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; if (f === 2 || f === 3) t.setXY(i, 0.5, 0.5); else t.setXY(i, (t.getX(i) * dims[f][0]) / uu, (t.getY(i) * dims[f][1]) / uv); }
  g.translate(x, y, z);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const shell = (w, h, d, x, y, z, t = 0.7, openTop = false) => { // ink outline (drawn back-face)
  const g = new THREE.BoxGeometry(w + t * 2, h + t * 2, d + t * 2);
  if (openTop) g.setIndex(Array.from(g.index.array).filter((_, i) => i < 12 || i >= 18)); // seen from inside the tower, its top would be a black lid over the hatch
  return g.translate(x, y, z);
};

let CACHE = null;
export function buildExterior() {
  if (!CACHE) CACHE = make();
  CACHE.position.set(0, 0, 0);
  return CACHE;
}

function make() {
  const g = new THREE.Group(), r = rng(99), C = (h) => new THREE.Color(h), WHITE = C(0xffffff);
  // gomme 2-tone look, no floor AO out here (everything sits hundreds of metres below y = 0)
  const toon = ({ color = 0xffffff, ...params }) => gomme(color, { ao: 1, params });
  const panel = canvasTex(128, (c, s) => { // tower wall: floor-slab line + panel seam
    c.fillStyle = '#fff'; c.fillRect(0, 0, s, s);
    c.fillStyle = 'rgba(40,30,70,0.16)'; c.fillRect(0, s - 16, s, 16); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, s - 18, s, 2);
    c.fillStyle = 'rgba(40,30,70,0.1)'; c.fillRect(0, 0, 3, s);
  });
  const facade = canvasTex(128, (c, s) => { // city wall with 4x4 windows, some lit
    c.fillStyle = '#f4f4f8'; c.fillRect(0, 0, s, s);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const lit = r(), col = lit < 0.35 ? '#ffe08a' : lit < 0.75 ? '#7fb2dc' : '#39476b';
      c.fillStyle = '#5a5f78'; c.fillRect(x * 32 + 7, y * 32 + 6, 18, 20); c.fillStyle = col; c.fillRect(x * 32 + 9, y * 32 + 8, 14, 16);
    }
  });

  // ---- tower body ----
  const body = [], trim = [], ink = [];
  for (let k = 0; k < NB; k++) {
    const th = THEMES[1 + k], wall = C(th.wall[1]).lerp(WHITE, 0.35), pil = wall.clone().multiplyScalar(0.7), acc = C(th.wall[1]).offsetHSL(0, 0.3, 0.12);
    const w = bw(k), y0 = -BH * k - 0.3, yc = y0 - BH / 2;
    body.push(part(w, BH, w, 0, yc, 0, wall, 8, 4, k === 0 ? 1 : 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) body.push(part(2.2, BH + 0.1, 2.2, sx * (w / 2 - 0.7), yc, sz * (w / 2 - 0.7), pil, 4, 4));
    body.push(part(w + 1.6, 0.8, w + 1.6, 0, y0 - BH + 0.4, 0, C(0x2a2438), 8, 4));   // cornice lip
    trim.push(part(w + 1.7, 0.16, w + 1.7, 0, y0 - BH + 0.9, 0, acc, 1, 1));           // neon line
    ink.push(shell(w + 1.6, BH + 0.4, w + 1.6, 0, yc, 0, 0.35, k === 0));
  }
  body.push(part(TOWER_W + 1.6, 0.6, TOWER_W + 1.6, 0, -0.6, 0, C(0x2a2438), 8, 4, 2)); // no underside: it would cover room 1's ceiling during the first drop
  // roof apron: the playable roof is 40 m wide, the tower top 47.6 m: close the hollow ring between them with a slab and a low parapet (seen during the intro fly-up)
  const RW2 = TOWER_W + 1.6, RF = 40, AP = (RW2 - RF) / 2, ap = C(0xb4bcc8), par = C(0xece6d6);
  for (const s of [-1, 1]) {
    body.push(part(RW2, 0.4, AP, 0, -0.22, s * (RF / 2 + AP / 2), ap, 8, 4), part(AP, 0.4, RF, s * (RF / 2 + AP / 2), -0.22, 0, ap, 8, 4));
    body.push(part(RW2, 1.1, 0.5, 0, 0.5, s * (RW2 / 2 - 0.25), par, 8, 4), part(0.5, 1.1, RW2 - 1, s * (RW2 / 2 - 0.25), 0.5, 0, par, 8, 4));
    ink.push(shell(RW2, 1.1, 0.5, 0, 0.5, s * (RW2 / 2 - 0.25), 0.25), shell(0.5, 1.1, RW2 - 1, s * (RW2 / 2 - 0.25), 0.5, 0, 0.25));
  }
  const wallMat = toon({ map: panel, vertexColors: true });
  g.add(new THREE.Mesh(mergeGeometries(body), wallMat));
  g.add(new THREE.Mesh(mergeGeometries(trim), new THREE.MeshBasicMaterial({ vertexColors: true })));
  g.add(new THREE.Mesh(mergeGeometries(ink), new THREE.MeshBasicMaterial({ color: SIGNAL.ink, side: THREE.BackSide })));

  // windows: dark frame + glass + sill, 6 per face per floor (instanced)
  const N = 100 * 4 * 6, mk = (geo, mat) => new THREE.InstancedMesh(geo, mat, N);
  const frames = mk(new THREE.PlaneGeometry(4.3, 2.9), new THREE.MeshBasicMaterial({ color: 0x1d2233 })), glass = mk(new THREE.PlaneGeometry(3.7, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff })),
    sills = mk(new THREE.BoxGeometry(4.7, 0.24, 0.5), new THREE.MeshBasicMaterial({ color: 0xf2eee4 }));
  const o = new THREE.Object3D(), gc = new THREE.Color(), pal = [0xffe08a, 0xffd070, 0xbfe6ff, 0x9fd0f0, 0x2a3350, 0x33406a];
  let n = 0;
  for (let f = 0; f < 100; f++) {
    const k = Math.floor(f / 5), w = bw(k), half = w / 2 + 0.02, pitch = (w - 11) / 5, y = -FLOOR_H * f - 3.3;
    for (let face = 0; face < 4; face++) {
      const a = (face * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a);
      for (let i = 0; i < 6; i++) {
        const x = (i - 2.5) * pitch;
        o.rotation.set(0, a, 0); o.scale.set(1, 1, 1);
        o.position.set(x * c + half * s, y, -x * s + half * c); o.updateMatrix(); frames.setMatrixAt(n, o.matrix);
        o.position.set(x * c + (half + 0.04) * s, y, -x * s + (half + 0.04) * c); o.updateMatrix(); glass.setMatrixAt(n, o.matrix);
        o.position.set(x * c + (half + 0.2) * s, y - 1.5, -x * s + (half + 0.2) * c); o.updateMatrix(); sills.setMatrixAt(n, o.matrix);
        glass.setColorAt(n, gc.set(pal[Math.floor(r() * pal.length)]).multiplyScalar(0.85 + r() * 0.25)); n++;
      }
    }
  }
  g.add(frames, glass, sills);

  // ---- lobby podium, plaza, ring road ----
  const stone = C(0xe6dccb), podium = [part(PODIUM, PH, PODIUM, 0, GY + PH / 2, 0, stone, 8, 4), part(PODIUM + 2, 1, PODIUM + 2, 0, GY + PH + 0.5, 0, C(0x2a2438), 8, 4),
    part(16, 0.7, 9, 0, GY + 9, PODIUM / 2 + 4, C(0xd8433a), 4, 4), part(1, 9, 1, -7, GY + 4.5, PODIUM / 2 + 7.5, C(0xf2eee4), 4, 4), part(1, 9, 1, 7, GY + 4.5, PODIUM / 2 + 7.5, C(0xf2eee4), 4, 4),
    part(18, 0.5, 6, 0, GY + 0.25, PODIUM / 2 + 3, C(0xcfc4b0), 4, 4), part(20, 0.5, 4, 0, GY + 0.75, PODIUM / 2 + 1.6, C(0xcfc4b0), 4, 4)];
  g.add(new THREE.Mesh(mergeGeometries(podium), wallMat));
  g.add(new THREE.Mesh(shell(PODIUM, PH + 1, PODIUM, 0, GY + PH / 2 + 0.5, 0, 0.5), new THREE.MeshBasicMaterial({ color: SIGNAL.ink, side: THREE.BackSide })));
  const door = new THREE.Mesh(new THREE.PlaneGeometry(10, 7.2), new THREE.MeshBasicMaterial({ color: 0x2b4a78 })); door.position.set(0, GY + 4.1, PODIUM / 2 + 0.06); g.add(door);
  const doorFrame = new THREE.Mesh(new THREE.PlaneGeometry(11, 7.8), new THREE.MeshBasicMaterial({ color: 0xffd23c })); doorFrame.position.set(0, GY + 4.3, PODIUM / 2 + 0.04); g.add(doorFrame);
  const pw = new THREE.InstancedMesh(new THREE.PlaneGeometry(5, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), 4 * 7); n = 0;
  for (let face = 0; face < 4; face++) for (let i = 0; i < 7; i++) {
    const a = (face * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a), x = (i - 3) * (PODIUM / 7.6), h = PODIUM / 2 + 0.06;
    if (face === 0 && Math.abs(x) < 8) { o.scale.set(0, 0, 0); } else o.scale.set(1, 1, 1);
    o.rotation.set(0, a, 0); o.position.set(x * c + h * s, GY + 7.5, -x * s + h * c); o.updateMatrix(); pw.setMatrixAt(n, o.matrix);
    pw.setColorAt(n, gc.set(r() < 0.6 ? 0xffe08a : 0xbfe6ff)); n++;
  }
  g.add(pw);

  const flat = (w, d, x, z, y, tex, col, unit, po = 0) => {
    const geo = new THREE.PlaneGeometry(w, d), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / unit, (uv.getY(i) * d) / unit);
    const m = new THREE.Mesh(geo, gomme(col, { pattern: tex === 'concrete' ? 'grid' : 'none', scale: unit, line: SIGNAL.ink, lineA: 0.07, ao: 1, params: { polygonOffset: !!po, polygonOffsetFactor: -po, polygonOffsetUnits: -po } })); m.rotation.x = -Math.PI / 2; m.position.set(x, GY + y, z); g.add(m); return m;
  };
  flat(150, 150, 0, 0, 0.4, 'concrete', '#e2d8c6', 12, 2);                        // plaza
  const RR = 108, RW = 26, road = [[2 * RR + RW, RW, 0, -RR], [2 * RR + RW, RW, 0, RR], [RW, 2 * RR - RW, -RR, 0], [RW, 2 * RR - RW, RR, 0], [900, RW, RR + RW / 2 + 450, 0], [900, RW, -RR - RW / 2 - 450, 0], [RW, 900, 0, RR + RW / 2 + 450], [RW, 900, 0, -RR - RW / 2 - 450]];
  for (const [w, d, x, z] of road) flat(w, d, x, z, 0.8, 'concrete', '#5b606c', 14, 4);
  const lane = new THREE.MeshBasicMaterial({ color: 0xf6d86a }), lg = [];
  for (const [w, d, x, z] of road) lg.push(new THREE.PlaneGeometry(w > d ? w : 0.6, w > d ? 0.6 : d).rotateX(-Math.PI / 2).translate(x, GY + 1.0, z));
  g.add(new THREE.Mesh(mergeGeometries(lg), lane));
  // cars on the ring road and avenues
  const carGeo = mergeGeometries([new THREE.BoxGeometry(2.3, 1.1, 4.8).translate(0, 0.9, 0), new THREE.BoxGeometry(2, 0.9, 2.4).translate(0, 1.85, -0.2)]), cars = new THREE.InstancedMesh(carGeo, toon({}), 80);
  const carCol = [0xef5a4a, 0x4a9ae8, 0xffd23c, 0xf4f4f4, 0x48c890, 0xff8ab4];
  for (let i = 0; i < 80; i++) {
    const onRing = i < 40, side = r() < 0.5 ? -1 : 1, t = (r() - 0.5) * 2; let x, z, ry;
    if (onRing) { const e = Math.floor(r() * 4), l = side * 4.5; if (e < 2) { x = t * RR; z = (e ? 1 : -1) * RR + l; ry = Math.PI / 2; } else { z = t * RR; x = (e === 3 ? 1 : -1) * RR + l; ry = 0; } }
    else { const ax = Math.floor(r() * 2), d = (RR + RW + r() * 700) * (r() < 0.5 ? -1 : 1); if (ax) { x = side * 4.5; z = d; ry = 0; } else { z = side * 4.5; x = d; ry = Math.PI / 2; } }
    o.rotation.set(0, ry, 0); o.position.set(x, GY + 0.8, z); o.scale.set(1, 1, 1); o.updateMatrix(); cars.setMatrixAt(i, o.matrix); cars.setColorAt(i, gc.set(carCol[i % carCol.length]));
  }
  g.add(cars);

  // ---- city ----
  const city = [], cink = [], foot = [], hues = [0xffc6a8, 0xffe1a0, 0xbfe6d0, 0xa8d4ff, 0xd8c4ff, 0xffb8d0, 0xe8e0d0, 0xc8e8ff];
  for (let i = 0; i < 300; i++) {
    const a = r() * 6.283, rad = 150 + Math.pow(r(), 0.8) * 750, x = Math.cos(a) * rad, z = Math.sin(a) * rad, w = 16 + r() * 26, d = 16 + r() * 26;
    if (Math.min(Math.abs(x), Math.abs(z)) < 22 + Math.max(w, d) / 2 || Math.max(Math.abs(x), Math.abs(z)) < RR + RW + Math.max(w, d) / 2 + 4) continue;
    if (foot.some((f) => Math.abs(f[0] - x) < (f[2] + w) / 2 + 4 && Math.abs(f[1] - z) < (f[3] + d) / 2 + 4)) continue;
    let h = 22 + r() * (40 + 140 * Math.max(0, 1 - rad / 700)); if (rad > 300 && rad < 500) h = Math.min(h, 110); // keep the camera orbit (r 400, y -205) clear
    const col = C(hues[Math.floor(r() * hues.length)]).multiplyScalar(0.92 + r() * 0.1);
    foot.push([x, z, w, d]);
    city.push(part(w, h, d, x, GY + h / 2, z, col, 17, 14)); cink.push(shell(w, h, d, x, GY + h / 2, z, 0.6));
    if (h > 70 && r() < 0.7) { const h2 = 10 + r() * 22; city.push(part(w * 0.6, h2, d * 0.6, x, GY + h + h2 / 2, z, col.clone().multiplyScalar(0.9), 17, 14)); cink.push(shell(w * 0.6, h2, d * 0.6, x, GY + h + h2 / 2, z, 0.6)); }
  }
  g.add(new THREE.Mesh(mergeGeometries(city), toon({ map: facade, vertexColors: true })));
  g.add(new THREE.Mesh(mergeGeometries(cink), new THREE.MeshBasicMaterial({ color: SIGNAL.ink, side: THREE.BackSide })));

  // ---- trees (lawn strips around the plaza + scattered between buildings) ----
  const treeGeo = mergeGeometries([0, 1].map((k) => {
    const t0 = k ? new THREE.IcosahedronGeometry(1, 0).scale(2.3, 2.6, 2.3).translate(0, 4.4, 0) : new THREE.CylinderGeometry(0.3, 0.4, 2.6, 6).translate(0, 1.3, 0), t = t0.index ? t0.toNonIndexed() : t0;
    const c = k ? C(0x58c448) : C(0x7a4a2a), col = new Float32Array(t.attributes.position.count * 3); for (let i = 0; i < col.length; i += 3) { col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b; }
    t.setAttribute('color', new THREE.BufferAttribute(col, 3)); return t;
  }));
  const spots = [];
  for (let i = 0; i < 70; i++) { const e = Math.floor(r() * 4), t = (r() - 0.5) * 2 * 92, off = 80 + r() * 12; spots.push(e < 2 ? [t, (e ? 1 : -1) * off] : [(e === 3 ? 1 : -1) * off, t]); }
  for (let tries = 0; spots.length < 330 && tries < 900; tries++) {
    const a = r() * 6.283, rad = 140 + r() * 700, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (Math.min(Math.abs(x), Math.abs(z)) < 20 || Math.max(Math.abs(x), Math.abs(z)) < RR + RW + 4 || foot.some((f) => Math.abs(f[0] - x) < f[2] / 2 + 3 && Math.abs(f[1] - z) < f[3] / 2 + 3)) continue;
    spots.push([x, z]);
  }
  const trees = new THREE.InstancedMesh(treeGeo, toon({ vertexColors: true }), spots.length);
  spots.forEach(([x, z], i) => { const s = 0.8 + r() * 0.9; o.rotation.set(0, r() * 6, 0); o.scale.set(s, s * (0.9 + r() * 0.4), s); o.position.set(x, GY, z); o.updateMatrix(); trees.setMatrixAt(i, o.matrix); trees.setColorAt(i, gc.setHSL(0.24 + r() * 0.08, 0.5, 0.7 + r() * 0.35)); });
  g.add(trees);
  // lawns inside the ring road
  for (const [w, d, x, z] of [[190, 22, 0, -82], [190, 22, 0, 82], [22, 140, -82, 0], [22, 140, 82, 0]]) flat(w, d, x, z, 0.3, 'grass', '#7ed957', 24, 1);

  // ---- ground: patchwork of fields (per-cell vertex colours), mountains ----
  const SZ = 3600, SEG = 120, geo = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG).rotateX(-Math.PI / 2).toNonIndexed(), P = geo.attributes.position, gcol = new Float32Array(P.count * 3), noise = new ImprovedNoise();
  const fields = [0x86d06a, 0x7cc860, 0x9adb70, 0xb6dc6a, 0xd8d27a, 0x6cbc58].map(C);
  for (let i = 0; i < P.count; i += 3) {
    const cx = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, cz = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3, q = Math.floor(cx / 75) * 75, e = Math.floor(cz / 75) * 75;
    const v = noise.noise(q * 0.004, e * 0.004, 3.1) * 0.6 + noise.noise(q * 0.012, e * 0.012, 7.7) * 0.4, c = fields[Math.min(fields.length - 1, Math.floor((v * 0.5 + 0.5) * fields.length))];
    for (let k = 0; k < 3; k++) { gcol[(i + k) * 3] = c.r; gcol[(i + k) * 3 + 1] = c.g; gcol[(i + k) * 3 + 2] = c.b; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(gcol, 3));
  const ground = new THREE.Mesh(geo, toon({ vertexColors: true })); ground.position.y = GY; g.add(ground);
  const mts = [], mc = [0x7aa8a0, 0x8ab0c8, 0x7898b8, 0x86b090];
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * 6.283 + r() * 0.15, rad = 1350 + r() * 500, h = 220 + r() * 380, w = 260 + r() * 280, cn = new THREE.ConeGeometry(w, h, 6, 1).translate(Math.cos(a) * rad, GY + h / 2 - 10, Math.sin(a) * rad), c = C(mc[i % mc.length]), col = new Float32Array(cn.attributes.position.count * 3);
    for (let k = 0; k < col.length; k += 3) { const top = cn.attributes.position.getY(k / 3) > GY + h * 0.72; const cc = top ? C(0xf4f8ff) : c; col[k] = cc.r; col[k + 1] = cc.g; col[k + 2] = cc.b; }
    cn.setAttribute('color', new THREE.BufferAttribute(col, 3)); mts.push(cn);
  }
  g.add(new THREE.Mesh(mergeGeometries(mts), toon({ vertexColors: true })));

  // ---- sky, sun, clouds ----
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2300, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: C(0x2a7fe6) }, mid: { value: C(0x8fd0ff) }, hor: { value: C(0xd6efff) } },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top,mid,hor; varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c=mix(hor,mid,smoothstep(0.0,0.22,h)); c=mix(c,top,smoothstep(0.18,0.85,h)); gl_FragColor=vec4(c,1.0); }',
  }));
  sky.position.y = -200; sky.renderOrder = -10; sky.frustumCulled = false; g.add(sky);
  const spr = (tex, s, x, y, z, op = 1) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); m.scale.setScalar(s); m.position.set(x, y, z); m.renderOrder = -9; g.add(m); };
  spr(glow([[0, 'rgba(255,240,200,0.9)'], [0.3, 'rgba(255,214,140,0.35)'], [1, 'rgba(255,200,120,0)']]), 900, 1000, 20, -1500);
  spr(glow([[0, '#fff'], [0.55, 'rgba(255,255,235,0.95)'], [1, 'rgba(255,255,235,0)']]), 150, 1000, 20, -1500);
  const cl = [], sph = new THREE.SphereGeometry(1, 10, 8);
  for (let i = 0; i < 34; i++) {
    const a = r() * 6.283, y = -20 - r() * 380, sc = 0.8 + r() * 0.9; let rad = 140 + r() * 800;
    if (rad > 300 && rad < 520 && Math.abs(y + 205) < 70) rad += 260; // keep the menu camera orbit (r 400, y -205) free of clouds
    for (let k = 0; k < 6; k++) {
      const sx = (14 + r() * 14) * sc, sy = (9 + r() * 6) * sc, s = sph.clone().scale(sx, sy, (12 + r() * 10) * sc), P2 = s.attributes.position, col = new Float32Array(P2.count * 3);
      for (let v = 0; v < P2.count; v++) { const t = Math.min(1, Math.max(0, (P2.getY(v) / sy + 1) / 2)), c = C(0xa9bfdc).lerp(WHITE, Math.pow(t, 0.7)); col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; }
      s.setAttribute('color', new THREE.BufferAttribute(col, 3)); s.translate(Math.cos(a) * rad + (k - 3) * 16 * sc, y + r() * 4, Math.sin(a) * rad + r() * 12); cl.push(s);
    }
  }
  const clouds = new THREE.Mesh(mergeGeometries(cl), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.93, fog: false })); g.add(clouds);
  g.userData.tick = (dt) => { clouds.rotation.y += dt * 0.004; };
  g.userData.dispose = () => {}; // shared between menus and runs, built once
  return g;
}
