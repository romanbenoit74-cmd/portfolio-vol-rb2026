// Mosquito models "Gomme & Encre" (spec §6), ported from concept/js/mosquitoes.js. One template per type, built once and
// shared by every instance. To fit 20 bugs in the draw-call budget the template is merged by material:
//   body  (lit, vertex colours: head, thorax, striped abdomen, legs, antennae, proboscis, helmet, sac, beads, crown, tusks)
//         — material per instance (hit flash) · glow (kamikaze / tyrant stripes, pulsing emissive, material per type)
//   face  (unlit: eyes, pupils, highlights, brows, halo, gems) · ink (one low-poly hull) · 2 wings
// plus the animated extras (kamikaze spark, shield disc). 6 draw calls per mosquito (shadow pass included) instead of ≈ 18.
// Model faces +Z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cone, flat, gomme, inkMat, rbox, rcyl, smoothed, sphere, torus } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';
import { GLB } from '../render/Glb.js';

const V3 = THREE.Vector3, INK = SIGNAL.ink;
// per-type silhouette (concept CFG). abd: { len, r, n bands, shape long|belly|round, tilt }
const CFG = {
  mosquito: { col: '#5A6F9C', stripe: '#E6EEFA', abd: { len: 0.74, r: 0.14, n: 7, shape: 'long', tilt: -0.1 }, eye: 1, prob: 0.36, wing: [1, 1], sweep: 0.38, legs: 1, brow: 1 },
  speedbug: { col: '#E0405A', stripe: '#FFD9DF', abd: { len: 0.98, r: 0.1, n: 9, shape: 'long', tilt: 0.04 }, head: 0.92, headZ: 1.3, eye: 0.95, prob: 0.3, wing: [1.2, 0.72], sweep: 0.9, legs: 0.8, brow: 1.1 },
  heavy: { col: '#58B048', stripe: '#D6F5BF', abd: { len: 0.8, r: 0.28, n: 5, shape: 'belly', tilt: -0.2 }, thorax: 1.28, head: 1.08, eye: 0.82, prob: 0.24, probR: 1.9, wing: [0.88, 1.08], sweep: 0.28, legs: 1.05, brow: 1.35, plates: '#3E8A34' },
  swarmling: { col: '#F0B830', stripe: '#FFF2C4', abd: { len: 0.46, r: 0.24, n: 5, shape: 'round', tilt: 0.05 }, head: 1.18, eye: 1.5, prob: 0.16, wing: [0.62, 0.95], sweep: 0.15, legs: 0.55, brow: 0.55 },
  spitter: { col: '#9A55E0', stripe: '#E9DAFF', abd: { len: 0.7, r: 0.15, n: 7, shape: 'long', tilt: -0.08 }, head: 1.04, eye: 1, prob: 0.2, wing: [1, 1], sweep: 0.42, legs: 1, brow: 0.9, sac: '#C9A2FF' },
  kamikaze: { col: '#FF7A1A', stripe: '#2A1626', abd: { len: 0.58, r: 0.26, n: 6, shape: 'round', tilt: 0.12 }, eye: 1.05, prob: 0.26, wing: [0.95, 1], sweep: 0.35, legs: 0.9, brow: 1.25, fuse: true, glow: '#FF7A1A' },
  shield: { col: '#4A86E0', stripe: '#D8E6FF', abd: { len: 0.72, r: 0.16, n: 7, shape: 'long', tilt: -0.1 }, eye: 0.95, prob: 0.3, wing: [1, 1], sweep: 0.36, legs: 1, brow: 1.2, disc: true },
  splitter: { col: '#E060A8', stripe: '#FFDDEE', abd: null, beads: [0.15, 0.13, 0.11], eye: 1, prob: 0.3, wing: [1, 1], sweep: 0.38, legs: 1, brow: 1 },
  healer: { col: '#40D896', stripe: '#D8FFEF', abd: { len: 0.66, r: 0.14, n: 7, shape: 'long', tilt: -0.06 }, eye: 1.08, prob: 0.26, wing: [1.05, 1.05], sweep: 0.3, legs: 0.95, brow: 0.7, halo: true },
  tyrant: { col: '#B0307A', stripe: '#FFB6DC', abd: { len: 0.86, r: 0.21, n: 7, shape: 'belly', tilt: -0.14 }, thorax: 1.12, head: 1.06, eye: 1.08, prob: 0.44, probR: 1.7, wing: [1.05, 1.1], sweep: 0.36, legs: 1.05, brow: 1.5, crown: true, jaws: true, glow: '#FF4FA8' },
};
const PROFILE = {
  long: (u) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 0.75),
  belly: (u) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.6),
  round: (u) => Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)),
};

// ---------------------------------------------------------------- geometry helpers (everything ends up non-indexed, position + normal)
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new V3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), typeof s === 'number' ? new V3(s, s, s) : new V3(...s));
const tf = (geo, ...mats) => { const g = geo.clone(); for (const m of mats) g.applyMatrix4(m); return g; };
const clean = (g, keepUv = false) => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && !(keepUv && k === 'uv')) g.deleteAttribute(k); return g; };
const tint = (g, hex, a) => { const c = new THREE.Color(hex), n = g.attributes.position.count, w = a == null ? 3 : 4, arr = new Float32Array(n * w); for (let i = 0; i < n; i++) { arr[i * w] = c.r; arr[i * w + 1] = c.g; arr[i * w + 2] = c.b; if (w === 4) arr[i * w + 3] = a; } g.setAttribute('color', new THREE.BufferAttribute(arr, w)); return g; };
const tube = (pts, r, seg = 10, rs = 4) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new V3(...p))), seg, r, rs, false);

function abdomenGeos({ len, r, n, shape }) {
  const prof = PROFILE[shape], bands = [[], []], S = 6, pt = (u) => new THREE.Vector2(Math.max(1e-4, r * prof(u)), -u * len);
  for (let b = 0; b < n; b++) {
    const u0 = b / n, u1 = (b + 1) / n, pts = [];
    for (let k = S; k >= 0; k--) pts.push(pt(u0 + ((u1 - u0) * k) / S));
    bands[b % 2].push(new THREE.LatheGeometry(pts, 16).rotateX(Math.PI / 2));
  }
  const full = []; for (let k = 20; k >= 0; k--) full.push(pt(k / 20));
  return { a: bands[0], b: bands[1], hull: new THREE.LatheGeometry(full, 12).rotateX(Math.PI / 2) };
}
function legGeos(k) {
  const g = [];
  for (const s of [-1, 1]) { // front pair reaches forward-down, mid pair dangles, hind pair trails behind
    g.push(tube([[s * 0.05, -0.12, 0.1], [s * 0.2 * k, -0.02 * k, 0.26 * k], [s * 0.22 * k, -0.46 * k, 0.4 * k]], 0.011));
    g.push(tube([[s * 0.06, -0.13, 0.03], [s * 0.26 * k, 0.0, -0.02], [s * 0.28 * k, -0.52 * k, -0.12 * k]], 0.011));
    g.push(tube([[s * 0.05, -0.12, -0.04], [s * 0.24 * k, 0.0, -0.26 * k], [s * 0.22 * k, -0.08 * k, -0.6 * k]], 0.01));
    g.push(tf(sphere(0.02, 8, 6), M(s * 0.22 * k, -0.08 * k, -0.6 * k)), tf(sphere(0.022, 8, 6), M(s * 0.22 * k, -0.46 * k, 0.4 * k)), tf(sphere(0.022, 8, 6), M(s * 0.28 * k, -0.52 * k, -0.12 * k)));
  }
  return g;
}
function wingGeo(wl, ww) { // fill (translucent) + ink rim and veins in one mesh, alpha per vertex
  const L = 0.27 * wl, W = 0.085 * ww, T = 0.022;
  const outer = new THREE.Shape(); outer.absellipse(L, 0, L, W, 0, Math.PI * 2, false, 0);
  const ring = new THREE.Shape(); ring.absellipse(L, 0, L + T, W + T, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path(); hole.absellipse(L, 0, L - T * 0.2, W - T * 0.2, 0, Math.PI * 2, true, 0); ring.holes.push(hole);
  const fill = tint(clean(new THREE.ShapeGeometry(outer, 24)), '#D8F3FF', 0.62);
  const rim = [new THREE.ShapeGeometry(ring, 24), new THREE.PlaneGeometry(L * 1.5, 0.01).translate(L * 0.85, 0.012, 0), new THREE.PlaneGeometry(L * 1.1, 0.008).translate(L * 0.9, -0.03 * ww, 0)].map((g) => tint(clean(g), INK, 1));
  return mergeGeometries([fill, ...rim]).rotateX(-Math.PI / 2);
}

// ---------------------------------------------------------------- templates
const SH = {};
function template(type) {
  if (SH[type]) return SH[type];
  const c = CFG[type] || CFG.mosquito, hs = c.head ?? 1, ts = c.thorax ?? 1, hz = c.headZ ?? 1, e = c.eye;
  const parts = { body: [], glow: [], face: [], ink: [], spark: [], disc: [] }, DARK = '#2A2140';
  // add(kind, geo, colour, hull): geo already in body space; hull = low-poly stand-in for the ink (true = the geo itself)
  const add = (kind, geo, col, hull) => { if (hull) parts.ink.push(smoothed(hull === true ? geo : hull)); parts[kind].push(col ? tint(clean(geo), col) : clean(geo)); };
  const headPos = [0, 0.07, 0.31 + (hs - 1) * 0.1];
  const thM = M(0, 0.04, 0.07, 0, 0, 0, [ts, ts * 1.06, ts * 1.12]), hdM = M(...headPos, 0, 0, 0, [hs, hs, hs * hz]);
  add('body', tf(sphere(0.19, 22, 16), thM), c.col, tf(sphere(0.19, 14, 10), thM));
  add('body', tf(sphere(0.165, 22, 16), hdM), c.col, tf(sphere(0.165, 14, 10), hdM));
  for (const s of [-1, 1]) {
    const ex = s * 0.096 * hs, ey = headPos[1] + 0.045 * hs, ez = headPos[2] + 0.095 * hs, er = 0.08 * e * hs;
    const eyM = M(ex + s * (e - 1) * 0.03, ey, ez, 0, 0, 0, [er, er * 1.12, er * 0.85]);
    add('face', tf(sphere(1, 16, 12), eyM), '#FFFFFF', tf(sphere(1, 10, 8), eyM));
    add('face', tf(sphere(1, 12, 8), M(ex - s * er * 0.18, ey - er * 0.08, ez + er * 0.72, 0, 0, 0, [er * 0.56, er * 0.62, er * 0.4])), '#FF2E3E');
    add('face', tf(sphere(1, 10, 8), M(ex - s * er * 0.42, ey + er * 0.32, ez + er * 0.78, 0, 0, 0, er * 0.2)), '#FFFFFF');
    add('face', tf(rbox(0.13, 0.03, 0.05, 0.014), M(0, 0, 0, 0, 0, s * 0.42 * c.brow), M(ex, ey + er * 1.02, ez + er * 0.35)), INK);
  }
  const pr = c.probR ?? 1, pz = headPos[2] + 0.12 * hs * hz;
  add('body', tf(cone(0.024 * pr, c.prob, 10), M(0, headPos[1] - 0.03, pz + c.prob / 2, Math.PI / 2)), DARK, true);
  for (const s of [-1, 1]) {
    add('body', tube([[s * 0.04 * hs, headPos[1] + 0.12 * hs, headPos[2]], [s * 0.1, headPos[1] + 0.28, headPos[2] + 0.06], [s * 0.17, headPos[1] + 0.34, headPos[2] + 0.2]], 0.008, 8, 4), DARK);
    add('body', tf(sphere(0.028, 8, 6), M(s * 0.17, headPos[1] + 0.34, headPos[2] + 0.2)), DARK);
  }
  for (const g of legGeos(c.legs)) add('body', g, DARK);
  // abdomen (group at (0, .02, -.08), tilted)
  const abdM = M(0, 0.02, -0.08, c.abd ? c.abd.tilt : -0.1);
  if (c.abd) {
    const a = abdomenGeos(c.abd);
    for (const g of a.a) add('body', tf(g, abdM), c.col);
    for (const g of a.b) add(c.glow ? 'glow' : 'body', tf(g, abdM), c.stripe);
    parts.ink.push(smoothed(tf(a.hull, abdM)));
  }
  if (c.plates) { // armoured helmet + rivets
    const hel = M(0, 0.09 * ts, 0.05, -0.1, 0, 0, [ts * 1.1, ts * 0.78, ts * 1.2]);
    add('body', tf(sphere(0.2, 18, 10), hel), c.plates, true);
    for (const [x, z] of [[-0.1, 0.06], [0, 0.1], [0.1, 0.06]]) add('face', tf(sphere(0.022, 8, 6), M(x, 0.19, z), hel), '#CFF2B8');
  }
  if (c.sac) { // throat sac of the spitter
    const sac = M(0, -0.1, 0.24, 0, 0, 0, [1.1, 0.95, 1]);
    add('body', tf(sphere(0.15, 16, 12), sac), c.sac, true); add('face', tf(sphere(0.035, 10, 8), M(-0.06, 0.07, 0.09), sac), '#FFFFFF');
  }
  if (c.fuse) { // kamikaze fuse + spark (spark animates on its own)
    const L = c.abd.len;
    add('body', tf(tube([[0, 0.02, -L * 0.92], [0, 0.2, -L - 0.08], [0.05, 0.36, -L + 0.02]], 0.02, 12, 6), abdM), '#8A5A34');
    parts.sparkAt = new V3(0.05, 0.37, -L + 0.02).applyMatrix4(abdM);
    add('spark', sphere(0.055, 12, 10), '#FFE14A');
    for (let i = 0; i < 4; i++) add('spark', tf(rbox(0.26, 0.035, 0.035, 0.015), M(0, 0, 0, 0, 0, (i * Math.PI) / 4)), '#FFB020');
  }
  if (c.disc) { // frontal energy disc of the shield bug
    const d = M(0, headPos[1] - 0.04, pz + c.prob + 0.06);
    parts.disc.push(clean(tf(rcyl(0.33, 0.33, 0.03, 0.012, 40), M(0, 0, 0, Math.PI / 2), d)));
    add('body', tf(torus(0.33, 0.035, 10, 48), d), '#4FC3FF', true);
    add('face', tf(torus(0.2, 0.01, 6, 40), M(0, 0, 0.01), d), '#EAF7FF');
    add('face', tf(torus(0.26, 0.012, 6, 24, 0.9), M(0, 0, 0.03, 0, 0, 1.9), d), '#FFFFFF');
  }
  if (c.beads) { // splitter: segmented beads with little eyes
    let z = -0.1;
    c.beads.forEach((r, i) => {
      z -= r + 0.035; const b = M(0, 0, z, 0, 0, 0, [1, 0.95, 1.05]);
      add('body', tf(sphere(r, 16, 12), b, abdM), i % 2 ? c.stripe : c.col, true);
      for (const sd of [-1, 1]) { add('face', tf(sphere(r * 0.2, 10, 8), M(sd * r * 0.38, r * 0.45, r * 0.72), b, abdM), '#FFFFFF'); add('face', tf(sphere(r * 0.1, 8, 6), M(sd * r * 0.38, r * 0.45, r * 0.9), b, abdM), INK); }
      z -= r;
    });
  }
  if (c.halo) { // healer halo + cross
    const h = M(0, headPos[1] + 0.34, headPos[2] - 0.05);
    add('face', tf(torus(0.17, 0.026, 10, 36), M(0, 0, 0, Math.PI / 2), h), '#5CF2A0', true);
    add('face', tf(rbox(0.2, 0.065, 0.06, 0.025), M(0, 0.17, 0), h), '#FFFFFF', true); add('face', tf(rbox(0.065, 0.2, 0.06, 0.025), M(0, 0.17, 0), h), '#FFFFFF', true);
  }
  if (c.crown) { // tyrant crown + gems
    const cw = M(headPos[0], headPos[1] + 0.13 * hs, headPos[2] - 0.01);
    add('body', tf(rcyl(0.13, 0.12, 0.07, 0.02, 28), cw), '#FFC62E', true);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + ((i - 2) * Math.PI) / 5.5, x = Math.cos(a + Math.PI / 2) * 0.12, z = Math.sin(a + Math.PI / 2) * 0.12;
      add('body', tf(cone(0.035, 0.13, 10), M(x * 0.95, 0.09, z * 0.4 + 0.02, 0, 0, -x * 1.2), cw), '#FFC62E', true);
      add('face', tf(sphere(0.022, 8, 6), M(x * 0.95, 0.16, z * 0.4 + 0.02), cw), '#FF4FA8');
    }
  }
  if (c.jaws) { // curved tusks: tube + root + pointed tip
    for (const sd of [-1, 1]) {
      const a = [sd * 0.11, headPos[1] - 0.08, headPos[2] + 0.06], b = [sd * 0.2, headPos[1] - 0.14, headPos[2] + 0.2], e2 = [sd * 0.09, headPos[1] - 0.12, headPos[2] + 0.32];
      add('body', tube([a, b, e2], 0.028, 14, 10), '#FFF1D6', true); add('body', tf(sphere(0.028, 12, 8), M(...a)), '#FFF1D6', true);
      add('body', tf(cone(0.028, 0.09, 12), M(e2[0] - sd * 0.035, e2[1], e2[2] + 0.02, Math.PI / 2 - 0.3, 0, sd * 1.1)), '#FFF1D6', true);
    }
  }
  const merge = (list) => (list.length ? mergeGeometries(list) : null);
  const t = (SH[type] = {
    c, flap: type === 'swarmling' ? 55 : type === 'heavy' || type === 'tyrant' ? 30 : 42,
    g: { body: merge(parts.body), glow: merge(parts.glow), face: merge(parts.face), ink: mergeGeometries(parts.ink), spark: merge(parts.spark), disc: merge(parts.disc), wing: wingGeo(c.wing[0], c.wing[1]) },
    sparkAt: parts.sparkAt, ts,
    glowMat: c.glow ? gomme('#FFFFFF', { rim: 0.3, shadow: 0.66, ao: 1, emissive: c.glow, emissiveIntensity: 0.6, params: { vertexColors: true } }) : null,
  });
  return t;
}
let COMMON = null;
const common = () => (COMMON ||= {
  face: new THREE.MeshBasicMaterial({ vertexColors: true }), ink: inkMat(INK, 2.2),
  wing: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false, forceSinglePass: true }),
  wingBlur: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, forceSinglePass: true }), // cartoon buzz smear
  disc: Object.assign(flat('#8FD8FF', { transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }), { forceSinglePass: true }), spark: new THREE.MeshBasicMaterial({ vertexColors: true }),
}); // (single pass: flat transparent sheets don't need three's back-then-front double draw)

/**
 * buildModel(type) -> { body: Group (add to a scaled pivot), mat: per-instance body material (emissive flash), update(t, frozen, flapMul), dispose() }
 * frozen = wings held up (attack telegraph, glue, death), flapMul slows the flap (slowed / glued bugs).
 */
export function buildModel(type, castShadow = true) {
  const imported = GLB.make(type, castShadow); if (imported) return imported; // a .glb listed in assets/models/manifest.json replaces the procedural model
  const T = template(type), C = common(), g = T.g, ts = T.ts;
  const mat = gomme('#FFFFFF', { rim: 0.38, shadow: 0.6, ao: 1, params: { vertexColors: true } });
  const body = new THREE.Group();
  const mesh = (geo, m, cast = false) => { const x = new THREE.Mesh(geo, m); x.castShadow = cast; x.receiveShadow = false; body.add(x); return x; };
  mesh(g.body, mat, castShadow); if (g.glow) mesh(g.glow, T.glowMat); mesh(g.face, C.face); mesh(g.ink, C.ink);
  let spark = null, disc = null;
  if (g.spark) { spark = mesh(g.spark, C.spark); spark.position.copy(T.sparkAt); spark.geometry = g.spark; }
  if (g.disc) disc = mesh(g.disc, C.disc);
  const wings = [], blurs = [];
  for (const sd of [-1, 1]) { // root (sweep) -> flap pivot; a fainter copy trails the flap (motion smear)
    const wr = new THREE.Group(); wr.position.set(sd * 0.07 * ts, 0.2 * ts, 0.02); wr.rotation.y = sd * T.c.sweep; if (sd < 0) wr.scale.x = -1;
    const fl = new THREE.Group(), bl = new THREE.Group(); wr.add(fl, bl);
    const w = new THREE.Mesh(g.wing, C.wing), b = new THREE.Mesh(g.wing, C.wingBlur); w.renderOrder = 2; b.renderOrder = 2; fl.add(w); bl.add(b); body.add(wr); wings.push(fl); blurs.push(bl);
  }
  const ph = Math.random() * 10, glow = T.glowMat, tyrant = type === 'tyrant';
  return {
    body, mat,
    update(t, frozen = false, flapMul = 1) {
      body.position.y = Math.sin(t * 2.3 + ph) * 0.05;
      body.rotation.x = Math.sin(t * 1.7 + ph) * 0.05; body.rotation.z = Math.sin(t * 1.3 + ph) * 0.04;
      // wings held in a V (they read from the front and the side), flapping around it; frozen = raised (telegraph, glue, death)
      const a = 0.55 * Math.min(1, flapMul * 2), ft = t * T.flap * flapMul + ph, f = frozen ? 0.95 : 0.45 + Math.sin(ft) * a, fb = 0.45 + Math.sin(ft - 1.4) * a;
      wings[0].rotation.z = wings[1].rotation.z = f; blurs[0].rotation.z = blurs[1].rotation.z = fb; blurs[0].visible = blurs[1].visible = !frozen && flapMul > 0.3;
      if (spark) { spark.rotation.z = t * 9; spark.scale.setScalar(0.8 + Math.abs(Math.sin(t * 17 + ph)) * 0.5); }
      if (glow) glow.emissiveIntensity = (tyrant ? 0.35 : 0.3) + (0.5 + 0.5 * Math.sin(t * (tyrant ? 2.4 : 7))) * (tyrant ? 0.55 : 0.9);
      if (disc) disc.rotation.z = Math.sin(t * 1.2 + ph) * 0.1;
    },
    dispose() { mat.dispose(); },
  };
}

// "!" attack telegraph: a coral sticker drawn once, shown above the bug during its wind-up (constant size on screen)
let teleMat = null;
export function teleSprite() {
  if (!teleMat) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 80; const x = cv.getContext('2d');
    const rr = (l, t, w, h, r) => { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); };
    x.fillStyle = INK; rr(6, 10, 52, 64, 14); x.fill();                       // offset ink shadow
    x.fillStyle = SIGNAL.coral; x.strokeStyle = INK; x.lineWidth = 6; rr(6, 4, 52, 62, 14); x.fill(); x.stroke();
    x.fillStyle = '#FFFFFF'; x.strokeStyle = INK; x.lineWidth = 4;
    rr(25, 13, 14, 30, 6); x.fill(); x.stroke(); x.beginPath(); x.arc(32, 53, 7, 0, Math.PI * 2); x.fill(); x.stroke();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    teleMat = new THREE.SpriteMaterial({ map: tex, sizeAttenuation: false, depthWrite: false, fog: false });
  }
  const s = new THREE.Sprite(teleMat); s.visible = false; s.renderOrder = 6; s.center.set(0.5, 0);
  return s;
}
