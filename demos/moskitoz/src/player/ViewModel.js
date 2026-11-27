// First-person viewmodel in "Gomme & Encre", ported from concept/js/viewmodel.js: cartoon gloves, the Jumeaux Acides twin pistols, the pooled acid-jet VFX.
// Everything that hangs off the camera never casts or receives shadows and uses a 3 px ink line (closer = slightly bolder).
// Sleeve colour: ink violet (#3A2E5C), not coral — coral is the health / damage signal and would sit in the corner of the
// screen for the whole game; the violet frames the white gloves with maximum value contrast and matches the ink.
import * as THREE from 'three';
import { gomme, flat, part, rbox, rcyl, sphere, torus, INK, smoothGeo, inkMat, TAU } from '../render/Style.js';
import { damp, clamp, lerp, rng } from '../core/core.js';
const V3 = THREE.Vector3;
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SIGNAL } from '../level/Biomes.js';

// ---------------------------------------------------------------- shared helpers
let MAT = null;
function mats() {
  if (MAT) return MAT;
  MAT = {
    glove: gomme('#FFFFFF', { rim: 0.4, rimColor: '#D8E6FF', shadow: 0.68, ao: 1 }),
    shell: gomme('#FFFFFF', { rim: 0.42, rimColor: '#D8E6FF', shadow: 0.66, ao: 1 }), // vertex-coloured glove shell (palm, cuff, sleeve, piping)
    gun: gomme('#FFFFFF', { rim: 0.45, rimColor: '#C4B6FF', shadow: 0.62, ao: 1 }),   // vertex-coloured pistol body
    liquid: flat(SIGNAL.acid),
    bubble: flat(SIGNAL.acidCore),
    glass: flat('#E9FFD6', { transparent: true, opacity: 0.34, depthWrite: false }),
    needle: flat(SIGNAL.coral),
    face: flat('#FFFFFF'),
  };
  MAT.shell.vertexColors = true; MAT.gun.vertexColors = true;
  return MAT;
}
const P = (geo, mat, px = 3) => part(geo, mat, { ink: SIGNAL.ink, px, cast: false, receive: false });

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new V3(), _s = new V3();
/** Bake rigid parts into one geometry (one draw call + one hull). items: [geo, x, y, z, rx, ry, rz, sx, sy, sz] */
export function bake(items) {
  const gs = items.map(([geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx]) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(_m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)));
    return g;
  });
  return mergeGeometries(gs);
}
const _c = new THREE.Color();
const xform = (geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  return g.applyMatrix4(_m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)));
};
/**
 * Rigid multi-colour part in two draw calls: one vertex-coloured mesh + one merged hull built from each item's own
 * smoothed shell, so overlapping parts still get their ink separation lines. items: [geo, color, x, y, z, rx, ry, rz, sx, sy, sz];
 * bare items (no outline) go in `bare`.
 */
export function inked(items, mat, px = 3, bare = []) {
  const body = [], hulls = [];
  for (const [list, ink] of [[items, true], [bare, false]]) for (const [geo, color, ...tr] of list) {
    const g = xform(geo, ...tr), n = g.attributes.position.count, ca = new Float32Array(n * 3);
    _c.set(color ?? '#FFFFFF');
    for (let i = 0; i < n; i++) { ca[i * 3] = _c.r; ca[i * 3 + 1] = _c.g; ca[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); body.push(g);
    if (ink) hulls.push(xform(smoothGeo(geo), ...tr));
  }
  const mesh = new THREE.Mesh(mergeGeometries(body), mat); mesh.castShadow = mesh.receiveShadow = false;
  if (hulls.length) { const h = new THREE.Mesh(mergeGeometries(hulls), inkMat(SIGNAL.ink, px)); h.castShadow = h.receiveShadow = false; mesh.add(h); }
  return mesh;
}
const SEG = new Map();
/** Capsule lying along -z/+z (finger segment). */
export const seg = (r, len) => {
  const k = r + '|' + len;
  if (!SEG.has(k)) { const g = new THREE.CapsuleGeometry(r, len, 6, 14); g.rotateX(Math.PI / 2); SEG.set(k, g); }
  return SEG.get(k);
};

// ---------------------------------------------------------------- gloves
function finger(r, l1, l2) {
  const M = mats(), p = new THREE.Group();
  const a = P(seg(r, l1), M.glove); a.position.z = -l1 / 2; p.add(a);
  const j = new THREE.Group(); j.position.z = -l1; p.add(j);
  const b = P(seg(r * 0.96, l2), M.glove); b.position.z = -l2 / 2; j.add(b);
  const tip = new THREE.Object3D(); tip.position.z = -l2 - r; j.add(tip);
  p.userData = { j, tip, bones: [a, b] };
  return p;
}

// ---- hand skins (src/economy/Items.js SKINS): the shell is vertex-coloured by role, the fingers take a per-colour material
const SKIN_ROLE = { glove: 0, sleeve: 1, piping: 2 };
const SHELL_DEFAULT = ['#FFFFFF', '#3A2E5C', SIGNAL.acid]; // role colours the shell is built with (glove, sleeve, piping)
const GLOVE_MATS = new Map();
function gloveMat(color) {
  const k = String(color).toLowerCase();
  if (!GLOVE_MATS.has(k)) GLOVE_MATS.set(k, k === '#ffffff' ? mats().glove : gomme(color, { rim: 0.4, rimColor: '#D8E6FF', shadow: 0.68, ao: 1 }));
  return GLOVE_MATS.get(k);
}
// ---- skin accessories: extra rigid parts per hand (webbing, hook, claw...), built on demand with `inked`.
// Each builder gets the hand side (+1 right / -1 left) and returns { items, bare?, free?, hide? }:
//   `items` = inked parts [geo, color, x, y, z, rx, ry, rz, sx, sy, sz] that always stay, `bare` = parts without outline,
//   `free`  = { items, bare } parts that REPLACE the fingers (claw, hook, mitt...): shown only while the hand holds nothing,
//             so they never melt into a weapon; `hide` = finger indices hidden with them (0-2 fingers, 3 thumb).
// Hand axes: fingers go to -z, the sleeve to +z, the back of the hand is +y, fingers sit at x = side * (-0.043 .. 0.043).
const rings = (z, radius, colors, r = 0.0045) => colors.map((c, i) => [torus(radius, r, 8, 28), c, 0, 0, z + i * 0.04]);
const PI = Math.PI;
/** A duck toe in the xz plane: angle a from -z (+ = toward +x), length L, base radius r, base at (x0, z0). Two phalanges, knuckle, claw, scale bumps. */
function toe(a, L, r, x0 = 0, z0 = -0.05, col = '#FF8A1C', bump = '#E2680A', claw = '#F3D9A4') {
  const s = Math.sin(a), c = Math.cos(a), at = (d, y = 0.002) => [x0 + s * d, y, z0 - c * d], l1 = L * 0.55, l2 = L * 0.45, rot = [PI / 2, 0, a];
  return {
    items: [
      [rcyl(r, r * 0.84, l1, 0.007, 12), col, ...at(l1 / 2), ...rot],
      [sphere(r * 1.12, 12, 9), col, ...at(l1)],
      [rcyl(r * 0.82, r * 0.52, l2, 0.006, 12), col, ...at(l1 + l2 / 2), ...rot],
      [rcyl(r * 0.46, 0.0012, 0.034, 0.001, 8), claw, ...at(L + 0.014), ...rot],
    ],
    bare: [0.2, 0.42, 0.78].map((f) => [sphere(r * 0.34, 8, 6), bump, ...at(L * f, r * 0.8), 0, 0, 0, 1, 0.7, 1.4]),
  };
}
let WEB = null;
/** The membrane between three toes: a flat scalloped fan, soft orange (x, -z = shape x, y). */
function webGeo() {
  if (WEB) return WEB;
  const tip = [[-0.5, 0.215], [0, 0.24], [0.5, 0.215]].map(([a, L]) => [Math.sin(a) * L, 0.05 + Math.cos(a) * L]), sh = new THREE.Shape();
  const ctl = (p, q) => [(p[0] + q[0]) / 2 * 0.9, (p[1] + q[1]) / 2 - 0.05];
  sh.moveTo(-0.022, 0.04); sh.lineTo(...tip[0]); sh.quadraticCurveTo(...ctl(tip[0], tip[1]), ...tip[1]); sh.quadraticCurveTo(...ctl(tip[1], tip[2]), ...tip[2]); sh.lineTo(0.022, 0.04); sh.closePath();
  WEB = new THREE.ExtrudeGeometry(sh, { depth: 0.007, bevelEnabled: false, curveSegments: 10 }); WEB.rotateX(-PI / 2); WEB.translate(0, -0.005, 0);
  return WEB;
}
let HOOK = null;
/** Captain Hook's hook: a gold tube, straight then curling up and back, tapering to a point. */
function hookGeo() {
  if (HOOK) return HOOK;
  const R = 0.06, z0 = -0.2, N = 48, RS = 12, pts = [new V3(0, 0, -0.09), new V3(0, 0, -0.14)];
  for (let k = 0; k <= 12; k++) { const u = (k / 12) * PI * 1.12; pts.push(new V3(0, R * (1 - Math.cos(u)), z0 - R * Math.sin(u))); }
  const curve = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(curve, N, 0.019, RS, false), pos = g.attributes.position, c = new V3(), v = new V3();
  for (let i = 0; i <= N; i++) {
    const t = i / N, k = t < 0.42 ? 1 : lerp(1, 0.12, Math.pow((t - 0.42) / 0.58, 1.15)); curve.getPointAt(t, c);
    for (let j = 0; j <= RS; j++) { const n = i * (RS + 1) + j; v.fromBufferAttribute(pos, n).sub(c).multiplyScalar(k).add(c); pos.setXYZ(n, v.x, v.y, v.z); }
  }
  g.computeVertexNormals(); HOOK = g; return g;
}
/** Chord of a web pattern lying on the back of the hand: from (x1, z1) to (x2, z2), at height y. */
const chord = (x1, z1, x2, z2, y = 0.0355, r = 0.0026) => { const dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz); return [seg(r, Math.max(0.002, l - 2 * r)), '#1B1B2B', (x1 + x2) / 2, y, (z1 + z2) / 2, 0, Math.atan2(dx, dz), 0]; };
const ACC = {
  canard: (side) => { // duck foot: three webbed orange toes with knuckles and claws, a back toe, a ruff of white feathers at the "ankle"
    const T = [toe(-0.5, 0.215, 0.019), toe(0, 0.24, 0.02), toe(0.5, 0.215, 0.019), toe(-side * 1.3, 0.075, 0.014, -side * 0.05, -0.012)];
    const feathers = Array.from({ length: 7 }, (_, k) => { const f = -1.05 + k * 0.35; return [sphere(0.017, 10, 8), k % 2 ? '#FFFFFF' : '#FFF1D0', Math.sin(f) * 0.07, Math.cos(f) * 0.07 + 0.004, 0.155 + Math.abs(f) * 0.012, -0.55, 0, -f * 0.5, 0.8, 0.5, 2.1]; });
    return {
      items: feathers,
      free: { items: [...T.flatMap((x) => x.items), [webGeo(), '#FFB347']], bare: [...T.flatMap((x) => x.bare), ...[-0.36, 0, 0.36].map((a) => [seg(0.0022, 0.12), '#E2680A', Math.sin(a) * 0.08, 0.0035, -0.05 - Math.cos(a) * 0.08, 0, -a, 0])] },
      hide: [0, 1, 2, 3],
    };
  },
  crochet: (side) => { // captain's frilled cuffs and gold braid; the right hand is a gold hook on a flared socket
    const frill = Array.from({ length: 12 }, (_, k) => { const f = (k / 12) * PI * 2; return [sphere(0.017, 8, 6), '#FFFFFF', Math.sin(f) * 0.087, Math.cos(f) * 0.087, 0.118, 0, 0, 0, 1, 1, 1.5]; });
    const GOLD = '#F2C230', DK = '#D9A520';
    return {
      items: [...frill, [torus(0.082, 0.012, 8, 28), '#F5F0E6', 0, 0, 0.145], ...rings(0.26, 0.0545, [GOLD, GOLD], 0.006), [torus(0.0545, 0.005, 6, 24), '#FFFFFF', 0, 0, 0.5]],
      free: side === 1 ? {
        items: [[rcyl(0.086, 0.042, 0.13, 0.012, 24), DK, 0, 0, -0.07, PI / 2], [torus(0.087, 0.009, 8, 28), GOLD, 0, 0, -0.006], [torus(0.045, 0.008, 8, 24), GOLD, 0, 0, -0.128], [hookGeo(), GOLD], [sphere(0.019, 12, 8), '#F7DD7A', 0, 0, -0.145]],
        bare: Array.from({ length: 6 }, (_, k) => { const f = (k / 6) * PI * 2; return [sphere(0.0055, 6, 5), '#FFF2B0', Math.sin(f) * 0.088, Math.cos(f) * 0.088, -0.026]; }),
      } : null,
      hide: side === 1 ? [0, 1, 2, 3] : [],
    };
  },
  homard: () => ({ // lobster: ridged arm, big crusher bulb and two toothed jaws that gape
    items: [[torus(0.07, 0.01, 8, 24), '#B3241A', 0, 0, 0.18]],
    free: {
      items: [[rcyl(0.052, 0.04, 0.09, 0.012, 16), '#E23B2E', 0, 0, -0.08, PI / 2], [torus(0.049, 0.007, 6, 20), '#B3241A', 0, 0, -0.05], [torus(0.044, 0.007, 6, 20), '#B3241A', 0, 0, -0.095],
        [sphere(0.062, 16, 12), '#E23B2E', 0, 0, -0.18, 0, 0, 0, 1, 0.82, 1.35], [sphere(0.016, 8, 6), '#FF6A55', 0, 0.046, -0.15, 0, 0, 0, 1, 0.8, 1.4],
        [rcyl(0.032, 0.007, 0.16, 0.007, 14), '#C92E22', 0, -0.026, -0.3, PI / 2 - 0.05], [rcyl(0.032, 0.007, 0.16, 0.007, 14), '#D4352A', 0, 0.03, -0.3, PI / 2 + 0.2], [sphere(0.0085, 8, 6), '#8B1A12', 0, -0.022, -0.382], [sphere(0.0085, 8, 6), '#8B1A12', 0, 0.052, -0.378]],
      bare: [0.07, 0.1, 0.13].flatMap((d, k) => [[sphere(0.0065, 6, 5), '#FFE9D0', 0, -0.0035 - k * 0.0012, -0.18 - d - 0.065], [sphere(0.0065, 6, 5), '#FFE9D0', 0, 0.0035 + k * 0.014, -0.18 - d - 0.06]]),
    },
    hide: [0, 1, 2, 3],
  }),
  robot: () => ({ // robot: cyan wrist ring and display, bolts on the knuckles
    items: [[torus(0.064, 0.012, 8, 24), '#7CF3FF', 0, 0, 0.06], [rbox(0.06, 0.014, 0.12, 0.005, 2), '#7CF3FF', 0, 0.058, 0.34], ...[-0.043, 0, 0.043].map((x) => [sphere(0.013, 8, 6), '#8892A8', x, 0.034, -0.052]),
      ...[-0.04, 0.04].map((x) => [sphere(0.009, 8, 6), '#C9D1E0', x, 0.043, 0.01])],
  }),
  chat: () => ({ // cat paw: pink pads under the palm, tabby stripes, white fluff at the cuff
    items: [[sphere(0.03, 12, 8), '#FF8FB0', 0, -0.037, 0.005, 0, 0, 0, 1.25, 0.45, 1.2], ...[-0.043, 0, 0.043].map((x) => [sphere(0.012, 8, 6), '#FF8FB0', x, -0.032, -0.07, 0, 0, 0, 1, 0.5, 1.2]),
      ...rings(0.28, 0.0545, ['#5B3A22', '#5B3A22', '#5B3A22'], 0.0055), [torus(0.07, 0.017, 8, 24), '#FFFFFF', 0, 0, 0.19]],
  }),
  squelette: () => ({ // skeleton: skull on the back of the hand, knuckle bones, rib stripes on the sleeve
    items: [[sphere(0.03, 12, 8), '#FFFFFF', 0, 0.052, 0.012, 0, 0, 0, 1, 0.9, 1.05], [rbox(0.026, 0.013, 0.022, 0.004, 2), '#F3EFE0', 0, 0.047, -0.022], ...[-0.043, 0, 0.043].map((x) => [sphere(0.012, 8, 6), '#FFFFFF', x, 0.03, -0.05]),
      ...rings(0.28, 0.0545, ['#F3EFE0', '#F3EFE0', '#F3EFE0'], 0.005)],
    bare: [-0.011, 0.011].map((x) => [sphere(0.007, 8, 6), '#1E1B2E', x, 0.066, -0.01]),
  }),
  mitaine: () => ({ // oven mitt: padded mitten block with stitching, loop and cuff (the block gives way to the fingers when you hold something)
    items: [[torus(0.074, 0.011, 8, 28), '#F5F0E6', 0, 0, 0.19], [torus(0.016, 0.0045, 6, 14), '#F5F0E6', 0, 0.062, 0.14, PI / 2]],
    free: { items: [[rbox(0.128, 0.088, 0.16, 0.042, 4), '#D9382B', 0, 0.004, -0.115]], bare: [-0.032, 0.032].map((x) => [seg(0.0042, 0.1), '#F5F0E6', x, 0.049, -0.115]) },
    hide: [0, 1, 2],
  }),
  licorne: () => ({ // unicorn: golden horn on the back of the hand, rainbow stripes on the sleeve
    items: [[rcyl(0.002, 0.022, 0.11, 0.002, 12), '#FFD35A', 0, 0.082, -0.02, -0.5], [sphere(0.026, 10, 8), '#FFD9EC', 0, 0.044, 0.005, 0, 0, 0, 1, 0.6, 1],
      ...rings(0.27, 0.0555, ['#FF5A6E', '#FFB347', '#FFE45E', '#6BD66B', '#5AA9FF'], 0.0045)],
  }),
  araignee: () => { // spider hero: black web on the back of the hand, grey web-shooter bracelet on the wrist
    const lines = [];
    for (let k = 0; k < 8; k++) { const f = (k / 8) * PI * 2; lines.push(chord(0, -0.005, Math.sin(f) * 0.064, -0.005 + Math.cos(f) * 0.064)); }
    for (const r of [0.02, 0.036, 0.052]) for (let k = 0; k < 8; k++) { const f1 = (k / 8) * PI * 2, f2 = ((k + 1) / 8) * PI * 2; lines.push(chord(Math.sin(f1) * r, -0.005 + Math.cos(f1) * r, Math.sin(f2) * r, -0.005 + Math.cos(f2) * r)); }
    return {
      items: [[torus(0.058, 0.01, 8, 28), '#8A93A8', 0, 0, 0.215], [rbox(0.07, 0.034, 0.095, 0.012, 3), '#B8C2D6', 0, 0.068, 0.2], [rcyl(0.012, 0.012, 0.06, 0.004, 12), '#4A5568', 0, 0.07, 0.15, PI / 2], [rcyl(0.011, 0.011, 0.07, 0.004, 12), '#FFFFFF', 0.026, 0.056, 0.255, PI / 2], [torus(0.0545, 0.006, 6, 24), '#FFFFFF', 0, 0, 0.45]],
      bare: [...lines, [sphere(0.0085, 8, 6), '#E5322D', 0, 0.088, 0.21]],
    };
  },
};
/** Show the part of the accessory that replaces the fingers only while the hand is empty (no weapon in the way). */
function setFree(h, free) {
  if (h.isFree === free) return; h.isFree = free;
  if (h.accFree) h.accFree.visible = free;
  [...h.fingers, h.thumb].forEach((f, i) => f.userData.bones.forEach((b) => { b.visible = !(free && h.hide.includes(i)); }));
}
/** Put the accessory of `skin` on a hand (or take the previous one off). */
function dress(h, skin) {
  for (const k of ['acc', 'accFree']) if (h[k]) { h.g.remove(h[k]); h[k].traverse((o) => o.geometry && o.geometry.dispose()); h[k] = null; }
  h.hide = []; h.isFree = null; setFree(h, true);
  const d = skin && skin.acc && ACC[skin.acc] ? ACC[skin.acc](h.side) : null;
  if (!d) return;
  const add = (spec, key) => { if (!spec || !spec.items || !spec.items.length) return; h[key] = inked(spec.items, mats().shell, 3, spec.bare || []); h[key].traverse((o) => { o.frustumCulled = false; }); h.g.add(h[key]); };
  add(d, 'acc'); add(d.free, 'accFree'); h.hide = d.hide || []; h.isFree = null; setFree(h, true);
}

/** Recolour one hand in place (skin = { glove, sleeve, piping }); roles were recorded when the shell was built. */
function paintHand(h, c) {
  const col = h.shell.geometry.attributes.color, to = [c.glove, c.sleeve, c.piping].map((x) => new THREE.Color(x)), roles = h.roles;
  for (let i = 0; i < roles.length; i++) { const r = roles[i]; if (r < 0) continue; col.setXYZ(i, to[r].r, to[r].g, to[r].b); }
  col.needsUpdate = true;
  const m = gloveMat(c.glove);
  for (const f of [...h.fingers, h.thumb]) for (const b of f.userData.bones) b.material = m;
}

// pose = [index, middle, ring curl, thumb curl, thumb up (0..1)]
export const POSES = {
  idle: [0.42, 0.5, 0.56, 0.28, 0],
  fist: [1.02, 1.02, 1.02, 0.95, 0],
  open: [0.02, 0.0, 0.04, 0.05, 0],
  grab: [0.28, 0.24, 0.3, 0.1, 0],
  point: [-0.06, 1.05, 1.05, 0.05, 1],
  grip: [0.62, 0.98, 1.02, 0.72, 0],
};

function makeHand(side) {
  const M = mats(), g = new THREE.Group();
  // rigid shell in one mesh + one hull: palm, wrist, flared cuff, violet sleeve, lime piping, three stitch lines
  const shell = inked([
    [rbox(0.135, 0.072, 0.125, 0.034, 4), SHELL_DEFAULT[0]],
    [sphere(0.047, 20, 14), SHELL_DEFAULT[0], 0, -0.002, 0.066, 0, 0, 0, 1, 0.82, 1],
    [rcyl(0.075, 0.058, 0.088, 0.024, 28), SHELL_DEFAULT[0], 0, 0, 0.1, Math.PI / 2],
    [rcyl(0.052, 0.058, 0.52, 0.02, 24), SHELL_DEFAULT[1], 0, 0, 0.405, Math.PI / 2],
    [torus(0.074, 0.0062, 8, 36), SHELL_DEFAULT[2], 0, 0, 0.142],
  ], M.shell, 3, [-0.03, 0, 0.03].map((x) => [seg(0.0048, 0.05), SIGNAL.ink, x, 0.0368 - Math.abs(x) * 0.1, -0.008]));
  g.add(shell);
  // role of every shell vertex (glove / sleeve / piping), read back from the default colours; stitch lines stay ink (-1)
  const sc = shell.geometry.attributes.color, defs = SHELL_DEFAULT.map((x) => new THREE.Color(x)), roles = new Int8Array(sc.count);
  for (let i = 0; i < sc.count; i++) roles[i] = defs.findIndex((d) => Math.abs(d.r - sc.getX(i)) + Math.abs(d.g - sc.getY(i)) + Math.abs(d.b - sc.getZ(i)) < 1e-4);
  const fingers = [];
  for (let i = 0; i < 3; i++) {
    const f = finger(i === 2 ? 0.024 : 0.026, 0.046 + (i === 1 ? 0.007 : 0), 0.04 + (i === 1 ? 0.006 : 0));
    f.position.set(side * (-0.043 + i * 0.043), 0.006, -0.055); f.rotation.y = side * (i - 1) * -0.14;
    g.add(f); fingers.push(f);
  }
  const thumb = finger(0.025, 0.036, 0.032); thumb.position.set(-side * 0.062, -0.006, -0.018); g.add(thumb);
  const mount = new THREE.Group(); g.add(mount);
  g.traverse((o) => { o.frustumCulled = false; });
  return {
    g, side, fingers, thumb, mount, shell, roles,
    base: new V3(side * 0.3, -0.27, -0.5), off: new V3(), rot: new V3(), s: 1.15, sz: 1, q: null,
    cur: POSES.idle.slice(), tgt: POSES.idle.slice(), pose: 'idle', hide: [], isFree: true, acc: null, accFree: null,
  };
}

const _bq = new THREE.Quaternion();
/**
 * Cartoon gloves for the camera. root goes in camera space.
 * Each hand exposes off (position offset), rot (euler offset), s (scale), sz (z stretch), q (quaternion override or null).
 * update(dt, t, state): state.bob (0..1 walk amplitude), state.phase (walk phase).
 */
export function makeGloves(o = {}) {
  const root = new THREE.Group(); root.name = 'gloves';
  const hands = { L: makeHand(-1), R: makeHand(1) };
  root.add(hands.L.g, hands.R.g);
  const apply = (h) => {
    const c = h.cur, side = h.side;
    h.fingers.forEach((f, i) => { f.rotation.x = -c[i] * 1.25; f.userData.j.rotation.x = -c[i] * 1.45; });
    const u = c[4];
    h.thumb.rotation.set(lerp(0, 1.2, u) - c[3] * 0.5, lerp(side * 0.75, side * 0.2, u), lerp(-side * 0.55, -side * 0.05, u));
  };
  const api = {
    root, hands, apply,
    /** Dress both hands in a skin (an item of SKINS: colours `c` and optional accessory `acc`); null = the classic white gloves. */
    setSkin(skin) {
      const k = (skin && skin.c) || { glove: SHELL_DEFAULT[0], sleeve: SHELL_DEFAULT[1], piping: SHELL_DEFAULT[2] };
      for (const h of Object.values(hands)) { paintHand(h, k); dress(h, skin); }
    },
    /** Set a pose on both hands, or on 'L' / 'R'. */
    set(name, side) {
      const p = POSES[name] || POSES.idle;
      for (const k of side ? [side] : ['L', 'R']) { hands[k].tgt = p.slice(); hands[k].pose = name; }
    },
    snap() { for (const h of Object.values(hands)) { h.cur = h.tgt.slice(); apply(h); } },
    update(dt, t, s = {}) {
      const bob = s.bob ?? 0, ph = s.phase ?? t * 6;
      for (const h of Object.values(hands)) {
        for (let i = 0; i < 5; i++) h.cur[i] = damp(h.cur[i], h.tgt[i], 22, dt);
        apply(h); setFree(h, !h.mount.children.some((c) => c.visible)); // a hand that holds a weapon gives up its claw / hook
        const side = h.side, b = h.base;
        const sx = Math.cos(t * 0.9 + side) * 0.003 + Math.cos(ph) * 0.012 * bob * side;
        const sy = Math.sin(t * 1.6 + side) * 0.0045 - Math.abs(Math.sin(ph)) * 0.014 * bob;
        h.g.position.set(b.x + h.off.x + sx, b.y + h.off.y + sy, b.z + h.off.z);
        _e.set(-0.12 + h.rot.x, -side * 0.18 + h.rot.y, -side * 0.06 + h.rot.z);
        if (h.q) h.g.quaternion.copy(h.q); else h.g.quaternion.setFromEuler(_e);
        h.g.scale.set(h.s, h.s, h.s * h.sz);
      }
    },
    /** Rest orientation of a hand as a quaternion (for slerping overrides). */
    restQuat(h, out = _bq) { return out.setFromEuler(_e.set(-0.12 + h.rot.x, -h.side * 0.18 + h.rot.y, -h.side * 0.06 + h.rot.z)); },
  };
  api.snap();
  if (o.skin) api.setSkin(o.skin);
  return api;
}

/** Simplified open-hand silhouette (palm + straight fingers + thumb) for afterimages. */
export function ghostHandGeometry(side = 1) {
  const items = [[rbox(0.135, 0.072, 0.125, 0.034, 3)], [rcyl(0.075, 0.058, 0.088, 0.024, 20), 0, 0, 0.1, Math.PI / 2]];
  for (let i = 0; i < 3; i++) items.push([seg(0.026, 0.1), side * (-0.043 + i * 0.043), 0.006, -0.12, 0, side * (i - 1) * -0.14, 0]);
  items.push([seg(0.025, 0.07), -side * 0.08, -0.006, -0.05, 0, side * 0.75, -side * 0.55]);
  return bake(items);
}

// ---------------------------------------------------------------- Jumeaux Acides
function makeGun(side) {
  const M = mats(), g = new THREE.Group(), VIO = '#4B3A7A', CREAM = '#F6F2FF', DARK = '#2A2045', A = SIGNAL.acid;
  // every rigid part in one vertex-coloured mesh + one merged hull (per-part outlines preserved)
  g.add(inked([
    [rbox(0.07, 0.08, 0.19, 0.028, 4), VIO, 0, 0.05, -0.12],
    [rbox(0.052, 0.115, 0.058, 0.022, 3), VIO, 0, -0.022, -0.042, 0.28],
    [rcyl(0.025, 0.021, 0.1, 0.008, 20), CREAM, 0, 0.058, -0.255, Math.PI / 2],
    [rbox(0.058, 0.032, 0.085, 0.014, 3), CREAM, 0, 0.012, -0.236],
    [rcyl(0.025, 0.025, 0.008, 0.003, 24), '#FFFFFF', -side * 0.04, 0.052, -0.07, 0, 0, Math.PI / 2],
    [rcyl(0.021, 0.013, 0.032, 0.006, 16), A, 0, 0.058, -0.32, Math.PI / 2],
    [rbox(0.013, 0.032, 0.016, 0.005, 2), A, 0, -0.004, -0.086, -0.3],
    [sphere(0.019, 14, 10), A, side * 0.036, 0.047, -0.15, 0, 0, 0, 0.3, 1.25, 1],
    [sphere(0.009, 10, 8), A, side * 0.036, 0.018, -0.15, 0, 0, 0, 0.35, 1, 1],
    [rcyl(0.03, 0.036, 0.016, 0.006, 20), DARK, 0, 0.094, -0.105],
    [rcyl(0.009, 0.011, 0.018, 0.004, 12), DARK, 0, 0.158, -0.105],
    [torus(0.026, 0.0045, 8, 28), DARK, -side * 0.044, 0.052, -0.07, 0, Math.PI / 2, 0],
  ], M.gun, 2.6));
  // tank: a glass bubble on a collar, acid level = pressure, two rising bubbles
  const lg = new THREE.SphereGeometry(0.029, 20, 14); lg.translate(0, 0.029, 0);
  const liquid = new THREE.Mesh(lg, M.liquid); liquid.position.set(0, 0.1, -0.105); g.add(liquid);
  const bub = new THREE.Mesh(bake([[sphere(0.006, 10, 8), 0.01, 0, 0.008], [sphere(0.006, 10, 8), -0.008, 0.016, -0.01, 0, 0, 0, 0.7]]), M.bubble); liquid.add(bub);
  const glass = P(sphere(0.036, 24, 18), M.glass, 2.4); glass.position.set(0, 0.128, -0.105); g.add(glass);
  const glint = new THREE.Mesh(sphere(0.008, 10, 8), M.face); glint.position.set(-side * 0.014, 0.146, -0.09); glint.scale.set(1, 1.6, 0.5); g.add(glint);
  // pressure gauge needle on the inner side (faces the screen centre)
  const pivot = new THREE.Group(); pivot.position.set(-side * 0.0452, 0.052, -0.07); pivot.rotation.y = -side * Math.PI / 2; g.add(pivot);
  const dial = new THREE.Group(); pivot.add(dial);
  const needle = new THREE.Mesh(rbox(0.0045, 0.02, 0.003, 0.0015, 1), M.needle); needle.position.y = 0.008; dial.add(needle);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.058, -0.338); g.add(muzzle);
  g.position.set(0, 0.032, -0.006); g.scale.setScalar(1.08);
  g.traverse((o) => { o.frustumCulled = false; });
  return { g, dial, liquid, bubbles: [bub], muzzle, side };
}

/** Twin toy pressure-pistols. attach(gloves) mounts them and sets the grip pose. */
export function makeTwinAcid() {
  const L = makeGun(-1), R = makeGun(1);
  let t = 0;
  const api = {
    L, R,
    attach(gloves) { gloves.hands.L.mount.add(L.g); gloves.hands.R.mount.add(R.g); gloves.set('grip'); },
    show(v) { L.g.visible = R.g.visible = v; },
    /** p: 0..1 — needle sweep + visible liquid level. */
    setPressure(p) {
      p = clamp(p, 0, 1);
      for (const G of [L, R]) { G.dial.rotation.z = lerp(2.2, -2.2, p); G.liquid.scale.y = Math.max(0.05, p); }
    },
    update(dt) { t += dt; for (const G of [L, R]) G.bubbles.forEach((b, i) => { b.position.y = 0.012 + ((t * 0.045 + i * 0.022) % 0.03); }); },
    muzzle(side, out) { return (side === 'L' ? L : R).muzzle.getWorldPosition(out); },
  };
  api.setPressure(1);
  return api;
}

// ---------------------------------------------------------------- acid jets VFX
const MAXP = 640;
const JET = 0, DROP = 1, BUBBLE = 2, BOLT = 3;
export const JET_KIND = { JET, DROP, BUBBLE, BOLT };

let splatTex = null;
function splatTexture() {
  if (splatTex) return splatTex;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), r = rng(11);
  const blobs = [[128, 128, 58]];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + r() * 0.5, d = 52 + r() * 36, rr = 7 + r() * 15;
    blobs.push([128 + Math.cos(a) * d, 128 + Math.sin(a) * d, rr]);
    blobs.push([128 + Math.cos(a) * d * 0.62, 128 + Math.sin(a) * d * 0.62, rr * 0.75]);
  }
  const draw = (grow, col) => { c.fillStyle = col; for (const [x, y, rr] of blobs) { c.beginPath(); c.arc(x, y, rr + grow, 0, TAU); c.fill(); } };
  draw(6, SIGNAL.ink); draw(0, SIGNAL.acid);
  c.fillStyle = SIGNAL.acidCore; c.beginPath(); c.arc(112, 110, 24, 0, TAU); c.fill();
  c.beginPath(); c.arc(146, 96, 8, 0, TAU); c.fill();
  splatTex = new THREE.CanvasTexture(cv); splatTex.colorSpace = THREE.SRGBColorSpace; splatTex.anisotropy = 4;
  return splatTex;
}

const _v = new V3(), _n = new V3(), _z = new V3(0, 0, 1);
const ACID = new THREE.Color(SIGNAL.acid);
/**
 * Pooled acid VFX, one draw call for every stream / droplet / bubble / bolt: screen-space inked capsules
 * (pale core, acid body, ink rim) that never collapse when a jet flies straight away from the camera.
 * targets: [{ pos: V3, r: number, ... }] — onHit(target, pos, kind, vel) fires on contact (jets stop, bolts pierce).
 * bounds: { min: V3, max: V3 } room box; the floor is y = 0. Surface hits leave a fading splat decal.
 */
export class AcidJets {
  constructor(scene, o = {}) {
    this.scene = scene; this.targets = []; this.bounds = null; this.onHit = null; this.onSurface = null;
    const base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
    const ia = (n) => new THREE.InstancedBufferAttribute(new Float32Array(MAXP * n), n).setUsage(THREE.DynamicDrawUsage);
    this.aA = ia(3); this.aB = ia(3); this.aW = ia(1); this.aC = ia(3); this.col = new Float32Array(MAXP * 3); this.solid = o.solid ?? null; this.onSurface = null;
    g.setAttribute('iA', this.aA); g.setAttribute('iB', this.aB); g.setAttribute('iW', this.aW); g.setAttribute('iC', this.aC); g.instanceCount = 0;
    this.geo = g;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uRes: INK.res, uMinPx: { value: o.minPx ?? 3 }, uInk: { value: new THREE.Color(SIGNAL.ink) }, uBody: { value: new THREE.Color(o.body ?? SIGNAL.acid) }, uCore: { value: new THREE.Color(o.core ?? SIGNAL.acidCore) } },
      vertexShader: `attribute vec3 iA; attribute vec3 iB; attribute float iW; attribute vec3 iC;
        uniform vec2 uRes; uniform float uMinPx;
        varying vec2 vQ; varying float vHalf; varying float vR; varying vec3 vC;
        void main() {
          vec4 cA = projectionMatrix * viewMatrix * vec4( iA, 1.0 );
          vec4 cB = projectionMatrix * viewMatrix * vec4( iB, 1.0 );
          if ( cA.w < 0.03 || cB.w < 0.03 ) { gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 ); return; }
          vec2 hr = uRes * 0.5;
          vec2 sA = cA.xy / cA.w * hr, sB = cB.xy / cB.w * hr;
          vec2 d = sB - sA; float L = length( d );
          vec2 dir = L > 1e-3 ? d / L : vec2( 0.0, 1.0 ); vec2 nrm = vec2( -dir.y, dir.x );
          float k = projectionMatrix[1][1] * hr.y;
          float wA = max( uMinPx, iW * k / cA.w ), wB = max( uMinPx, iW * k / cB.w );
          float t = position.y + 0.5, w = mix( wA, wB, t );
          vec2 s = mix( sA, sB, t ) + dir * ( t * 2.0 - 1.0 ) * w * 0.5 + nrm * position.x * w;
          float cw = mix( cA.w, cB.w, t ), cz = mix( cA.z / cA.w, cB.z / cB.w, t );
          gl_Position = vec4( s / hr * cw, cz * cw, cw );
          vQ = vec2( position.x * w, mix( -L * 0.5, L * 0.5, t ) + ( t * 2.0 - 1.0 ) * w * 0.5 );
          vHalf = L * 0.5; vR = w * 0.5; vC = iC;
        }`,
      fragmentShader: `uniform vec3 uInk, uBody, uCore;
        varying vec2 vQ; varying float vHalf; varying float vR; varying vec3 vC;
        void main() {
          vec2 q = vec2( vQ.x, vQ.y - clamp( vQ.y, -vHalf, vHalf ) );
          float d = length( q ) / max( vR, 1e-3 ), fw = fwidth( d ) * 1.2 + 1e-3;
          float inkAt = mix( 1.05, 0.7, smoothstep( 1.5, 5.0, vR ) );
          vec3 col = mix( uCore, vC, smoothstep( 0.4 - fw, 0.4 + fw, d ) );
          col = mix( col, uInk, smoothstep( inkAt - fw, inkAt + fw, d ) );
          gl_FragColor = vec4( col, 1.0 - smoothstep( 1.0 - fw, 1.0, d ) );
          #include <colorspace_fragment>
        }`,
      alphaToCoverage: true, side: THREE.DoubleSide, // quads are built in screen space, winding is arbitrary
    });
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; scene.add(this.mesh);
    const F = (n = 1) => new Float32Array(MAXP * n);
    this.p = F(3); this.vel = F(3); this.age = F(); this.life = F(); this.w = F(); this.grav = F(); this.trail = F();
    this.kind = new Uint8Array(MAXP); this.tag = new Uint8Array(MAXP); this.mask = new Uint32Array(MAXP); this.n = 0;
    // splat decals
    this.splats = [];
    const sg = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < (o.splats === false ? 0 : 32); i++) {
      const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: splatTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      m.visible = false; m.renderOrder = 1; scene.add(m); this.splats.push({ m, t: 9, s: 1 });
    }
    this.si = 0;
  }
  spawn(kind, x, y, z, vx, vy, vz, w, life, grav, trail, col = ACID) {
    if (this.n >= MAXP) return -1;
    const i = this.n++, p = this.p, v = this.vel;
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; v[i * 3] = vx; v[i * 3 + 1] = vy; v[i * 3 + 2] = vz;
    const c = this.col; c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    this.kind[i] = kind; this.w[i] = w; this.life[i] = life; this.age[i] = 0; this.grav[i] = grav; this.trail[i] = trail; this.mask[i] = 0; this.tag[i] = 0;
    return i;
  }
  /** One acid slug: 45 m/s, slight gravity arc, 2.8 cm. o.pierce makes it a bolt (Doigt-Canon). */
  fire(origin, dir, o = {}) {
    const s = o.speed ?? 45;
    const i = this.spawn(o.pierce ? BOLT : JET, origin.x, origin.y, origin.z, dir.x * s, dir.y * s, dir.z * s, o.w ?? 0.026, o.life ?? 1.2, o.grav ?? 2.2, o.trail ?? 0.05, o.color);
    if (i >= 0) this.tag[i] = o.tag ?? 0;
    return i;
  }
  /** Splash droplets thrown along n (or anywhere when n is null). */
  burst(pos, n = null, count = 6, speed = 3, w = 0.026, col = ACID) {
    for (let k = 0; k < count; k++) {
      _v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      if (n) _v.addScaledVector(n, 1.3).normalize();
      const sp = speed * (0.5 + Math.random() * 0.7);
      this.spawn(DROP, pos.x, pos.y, pos.z, _v.x * sp, _v.y * sp + 1.2, _v.z * sp, w * (0.6 + Math.random() * 0.6), 0.35 + Math.random() * 0.25, 9.8, 0.022, col);
    }
  }
  /** Corrosion bubbles rising off a target. */
  bubbles(pos, count = 3, spread = 0.3) {
    for (let k = 0; k < count; k++) this.spawn(BUBBLE, pos.x + (Math.random() - 0.5) * spread, pos.y + (Math.random() - 0.5) * spread, pos.z + (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 0.3, 0.6 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3, 0.03 + Math.random() * 0.03, 0.6 + Math.random() * 0.4, -0.4, 0);
  }
  /** Motes sucked into a point over `life` seconds (charge-up). */
  converge(pos, count = 2, radius = 0.35, life = 0.28) {
    for (let k = 0; k < count; k++) {
      _v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(radius * (0.6 + Math.random() * 0.4));
      this.spawn(BUBBLE, pos.x + _v.x, pos.y + _v.y, pos.z + _v.z, -_v.x / life, -_v.y / life, -_v.z / life, 0.012 + Math.random() * 0.01, life, 0, 0.03);
    }
  }
  splat(pos, n, size = 0.4) {
    const s = this.splats[this.si]; this.si = (this.si + 1) % this.splats.length;
    s.m.position.copy(pos).addScaledVector(n, 0.012); s.m.quaternion.setFromUnitVectors(_z, n); s.m.rotateZ(Math.random() * TAU);
    s.t = 0; s.s = size * (0.8 + Math.random() * 0.4); s.m.visible = true; s.m.scale.setScalar(0.01);
  }
  kill(i) {
    const j = --this.n; if (i === j) return;
    const c3 = (a) => { a[i * 3] = a[j * 3]; a[i * 3 + 1] = a[j * 3 + 1]; a[i * 3 + 2] = a[j * 3 + 2]; };
    c3(this.p); c3(this.vel); c3(this.col);
    for (const a of [this.age, this.life, this.w, this.grav, this.trail, this.kind, this.tag, this.mask]) a[i] = a[j];
  }
  surface(i, x, y, z, nx, ny, nz) {
    const k = this.kind[i];
    _v.set(x, y, z); _n.set(nx, ny, nz);
    if (k === JET || k === BOLT) { const cc = _c.setRGB(this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]); if (this.splats.length) this.splat(_v, _n, k === BOLT ? 0.8 : 0.42); this.burst(_v, _n, k === BOLT ? 10 : 5, k === BOLT ? 4 : 2.6, 0.026, cc); if (this.onSurface) this.onSurface(_v, _n, k, cc); }
    this.kill(i);
  }
  update(dt) {
    const p = this.p, v = this.vel, B = this.bounds;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this.kill(i); i--; continue; }
      const k = this.kind[i], o = i * 3;
      const x0 = p[o], y0 = p[o + 1], z0 = p[o + 2];
      v[o + 1] -= this.grav[i] * dt;
      p[o] += v[o] * dt; p[o + 1] += v[o + 1] * dt; p[o + 2] += v[o + 2] * dt;
      if (k === BUBBLE) continue;
      // a jet sheds a fine mist of droplets as it flies (reads as a stream, not a pellet)
      if (k === JET && Math.random() < dt * 26) this.spawn(DROP, x0, y0, z0, v[o] * 0.2 + (Math.random() - 0.5) * 0.8, v[o + 1] * 0.2 + Math.random() * 0.4, v[o + 2] * 0.2 + (Math.random() - 0.5) * 0.8, 0.012 + Math.random() * 0.008, 0.3, 9.8, 0.02, _c.setRGB(this.col[o], this.col[o + 1], this.col[o + 2]));
      // targets: segment (prev -> now) vs sphere
      if ((k === JET || k === BOLT) && this.targets.length) {
        let stopped = false;
        const dx = p[o] - x0, dy = p[o + 1] - y0, dz = p[o + 2] - z0, L2 = dx * dx + dy * dy + dz * dz || 1e-9;
        for (let ti = 0; ti < this.targets.length; ti++) {
          const tg = this.targets[ti]; if (!tg.alive || (tg.root && !tg.root.visible)) continue;
          if (k === BOLT && (this.mask[i] & (1 << ti))) continue;
          const c = tg.pos, s = clamp(((c.x - x0) * dx + (c.y - y0) * dy + (c.z - z0) * dz) / L2, 0, 1);
          const qx = x0 + dx * s - c.x, qy = y0 + dy * s - c.y, qz = z0 + dz * s - c.z;
          if (qx * qx + qy * qy + qz * qz > tg.r * tg.r) continue;
          _v.set(x0 + dx * s, y0 + dy * s, z0 + dz * s); _n.set(v[o], v[o + 1], v[o + 2]);
          if (this.onHit) this.onHit(tg, _v, k, _n, this.tag[i]);
          if (k === JET) { _n.normalize().negate(); this.burst(_v, _n, 4, 2.2, 0.022, _c.setRGB(this.col[o], this.col[o + 1], this.col[o + 2])); this.bubbles(_v, 2, 0.25); this.kill(i); i--; stopped = true; break; }
          this.mask[i] |= 1 << ti; this.burst(_v, null, 8, 4, 0.03, _c.setRGB(this.col[o], this.col[o + 1], this.col[o + 2]));
        }
        if (stopped) continue;
      }
      // surfaces
      if (p[o + 1] <= 0.005) { if (k === DROP) { this.kill(i); i--; continue; } this.surface(i, p[o], 0.005, p[o + 2], 0, 1, 0); i--; continue; }
      if (this.solid && k !== DROP && k !== BUBBLE && this.solid(p[o], p[o + 1], p[o + 2])) { _n.set(-v[o], -v[o + 1], -v[o + 2]).normalize(); this.surface(i, x0, y0, z0, _n.x, _n.y, _n.z); i--; continue; }
      if (B) {
        let hit = null;
        if (p[o] < B.min.x) hit = [B.min.x, p[o + 1], p[o + 2], 1, 0, 0];
        else if (p[o] > B.max.x) hit = [B.max.x, p[o + 1], p[o + 2], -1, 0, 0];
        else if (p[o + 2] < B.min.z) hit = [p[o], p[o + 1], B.min.z, 0, 0, 1];
        else if (p[o + 2] > B.max.z) hit = [p[o], p[o + 1], B.max.z, 0, 0, -1];
        else if (p[o + 1] > B.max.y) hit = [p[o], B.max.y, p[o + 2], 0, -1, 0];
        if (hit) { if (k === DROP) { this.kill(i); i--; continue; } this.surface(i, ...hit); i--; continue; }
      }
    }
    // write instances
    const A = this.aA.array, Bb = this.aB.array, W = this.aW.array;
    for (let i = 0; i < this.n; i++) {
      const o = i * 3, tr = Math.min(this.age[i], this.trail[i]);
      Bb[o] = p[o]; Bb[o + 1] = p[o + 1]; Bb[o + 2] = p[o + 2];
      A[o] = p[o] - v[o] * tr; A[o + 1] = p[o + 1] - v[o + 1] * tr; A[o + 2] = p[o + 2] - v[o + 2] * tr;
      let w = this.w[i];
      if (this.kind[i] === BUBBLE) w *= Math.min(1, (this.life[i] - this.age[i]) * 5);
      W[i] = w;
    }
    this.aC.array.set(this.col.subarray(0, this.n * 3)); this.aC.needsUpdate = true;
    this.geo.instanceCount = this.n;
    this.aA.needsUpdate = this.aB.needsUpdate = this.aW.needsUpdate = true;
    for (const s of this.splats) {
      if (!s.m.visible) continue;
      s.t += dt;
      if (s.t > 3) { s.m.visible = false; continue; }
      s.m.scale.setScalar(s.s * easeOutBack(Math.min(1, s.t / 0.14)));
      s.m.material.opacity = s.t < 2.2 ? 1 : 1 - (s.t - 2.2) / 0.8;
    }
  }
}

/** Stretchy rubber arm (Gomme-Grappin): N cylinders + joint spheres along a wobbling curve, thinner as it stretches. */
export function rubberArm(parent, N = 10) {
  const M = gomme('#3A2E5C', { rim: 0.55, rimColor: '#8E7BFF', shadow: 0.62, ao: 1 }), Y = new V3(0, 1, 0), w = new V3();
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 14, 1), sph = sphere(1, 16, 12);
  const segs = [], joints = [], g = new THREE.Group(); parent.add(g); g.visible = false;
  const mk = () => { const m = part(cyl, M, { ink: SIGNAL.ink, px: 3, cast: false, receive: false }); g.add(m); return m; };
  for (let i = 0; i < N; i++) segs.push(mk());
  for (let i = 0; i <= N; i++) { const m = part(sph, M, { ink: SIGNAL.ink, px: 3, cast: false, receive: false }); g.add(m); joints.push(m); }
  g.traverse((o) => { o.frustumCulled = false; });
  const pts = Array.from({ length: N + 1 }, () => new V3()), perp = new V3(), d = new V3();
  return {
    g,
    /** a, b in parent space; wob = wobble amplitude (m), ph = phase; r0 = base radius */
    set(a, b, wob, ph, r0 = 0.042) {
      d.subVectors(b, a); const L = d.length();
      g.visible = L > 0.45;
      if (!g.visible) return;
      perp.crossVectors(d, Y).normalize(); if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0);
      const r = clamp(r0 * Math.sqrt(0.55 / Math.max(0.55, L)), r0 * 0.4, r0);
      for (let i = 0; i <= N; i++) {
        const t = i / N, ww = Math.sin(t * Math.PI) * wob * Math.sin(ph - t * 7);
        pts[i].copy(a).lerp(b, t).addScaledVector(perp, ww).addScaledVector(Y, ww * 0.5);
        joints[i].position.copy(pts[i]); joints[i].scale.setScalar(r * (1 + (i === N ? 0.25 : 0)));
      }
      for (let i = 0; i < N; i++) {
        const sg = segs[i]; w.subVectors(pts[i + 1], pts[i]); const l = w.length();
        sg.position.addVectors(pts[i], pts[i + 1]).multiplyScalar(0.5);
        sg.quaternion.setFromUnitVectors(Y, w.divideScalar(Math.max(l, 1e-5))); sg.scale.set(r, l, r);
      }
    },
  };
}
