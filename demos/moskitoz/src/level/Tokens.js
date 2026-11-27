// Pickup tokens ("Gomme & Encre" power badges): a thick disc in the pickup's colour, white bezel, the pickup's icon embossed
// through both faces, orbiting sparkles, a pulsing target on the platform below, halo and beam. One family, six icons.
// Geometry and materials are cached per room (level.cached / level.own) so they die with the floor.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { flat, gomme, part, roundedCyl } from '../render/Style.js';

export const TOKEN_COLOR = { heal: '#4DDB7A', rage: '#FF5B4A', haste: '#FFC62E', shield: '#4FC3FF', ult: '#9B6BFF', jump: '#B8F53A' };
const R = 0.42, T = 0.18; // disc radius / thickness

const poly = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
const star = (n, ro, ri, rot = Math.PI / 2) => poly(Array.from({ length: n * 2 }, (_, i) => { const a = rot + (i * Math.PI) / n, r = i % 2 ? ri : ro; return [Math.cos(a) * r, Math.sin(a) * r]; }));
/** Icon outlines (about 0.5 m tall, centred): one or more shapes. */
export function iconShapes(kind) {
  if (kind === 'heal') { const a = 0.085, b = 0.24; return [poly([[-a, b], [a, b], [a, a], [b, a], [b, -a], [a, -a], [a, -b], [-a, -b], [-a, -a], [-b, -a], [-b, a], [-a, a]])]; }
  if (kind === 'rage') { // flame
    const s = new THREE.Shape(); s.moveTo(0, -0.25); s.bezierCurveTo(0.2, -0.25, 0.24, -0.04, 0.12, 0.08); s.bezierCurveTo(0.1, 0.0, 0.06, 0.0, 0.05, 0.04);
    s.bezierCurveTo(0.1, 0.16, 0.02, 0.24, -0.04, 0.28); s.bezierCurveTo(0.0, 0.16, -0.22, 0.1, -0.2, -0.06); s.bezierCurveTo(-0.19, -0.2, -0.1, -0.25, 0, -0.25); return [s];
  }
  if (kind === 'haste') return [poly([[0.05, 0.27], [-0.15, -0.02], [-0.01, -0.02], [-0.07, -0.27], [0.15, 0.05], [0.01, 0.05]])];
  if (kind === 'shield') {
    const s = new THREE.Shape(); s.moveTo(0, 0.25); s.lineTo(0.2, 0.17); s.lineTo(0.19, -0.02); s.quadraticCurveTo(0.14, -0.17, 0, -0.26); s.quadraticCurveTo(-0.14, -0.17, -0.19, -0.02); s.lineTo(-0.2, 0.17); s.closePath(); return [s];
  }
  if (kind === 'jump') { const ch = (y) => poly([[-0.2, y - 0.04], [0, y + 0.13], [0.2, y - 0.04], [0.2, y - 0.14], [0, y + 0.03], [-0.2, y - 0.14]]); return [ch(0.11), ch(-0.11)]; } // double chevron up
  return [star(5, 0.27, 0.115)]; // ult
}

const SIZE = 1.5; // world scale of a token
/**
 * The pickup group for a kind: token (disc, bezel, embossed icon), sparkles, target ring on the platform, a camera-facing halo
 * and a soft light beam so it reads from across the room. Animated by animateToken().
 */
export function buildToken(level, kind) {
  const col = TOKEN_COLOR[kind], g = new THREE.Group(), C = (k, make) => level.cached('tok' + k, make), white = C('white', () => gomme('#FFFFFF', { ao: 1, shadow: 0.75 }));
  const add = (m) => { g.add(m); return m; };
  add(part(C('disc', () => roundedCyl(R, R, T, 0.07, 32).rotateX(Math.PI / 2)), C('face' + kind, () => gomme(col, { rim: 0.45, rimColor: '#FFFFFF', ao: 1, shadow: 0.7 })), { px: 2.2, cast: false }));
  add(part(C('bezel', () => new THREE.TorusGeometry(R - 0.01, 0.045, 10, 40)), white, { ink: false, cast: false }));
  const icon = C('icon' + kind, () => mergeGeometries(iconShapes(kind).map((s) => new THREE.ExtrudeGeometry(s, { depth: T + 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 10 }).translate(0, 0, -(T + 0.05) / 2))));
  add(part(icon, white, { px: 2.2, cast: false }));
  const sparkles = add(new THREE.Mesh(C('sparks', () => mergeGeometries([0.62, -0.62].map((x, i) => new THREE.ShapeGeometry(star(4, 0.11, 0.035, 0)).translate(x, i ? -0.15 : 0.2, 0)))), C('sparkM', () => flat('#FFFFFF', { side: THREE.DoubleSide }))));
  const target = add(new THREE.Mesh(C('target', () => new THREE.RingGeometry(0.45, 0.62, 32).rotateX(-Math.PI / 2)), level.own(flat(col, { transparent: true, opacity: 0.5, depthWrite: false })))); // own: opacity animates
  const halo = add(new THREE.Mesh(C('halo', () => new THREE.RingGeometry(0.62, 0.72, 32)), level.own(flat(col, { transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }))));
  const beam = add(new THREE.Mesh(C('beam', () => new THREE.CylinderGeometry(0.12, 0.42, 5, 12, 1, true)), C('beam' + kind, () => new THREE.MeshBasicMaterial({ color: col, transparent: true, forceSinglePass: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))));
  beam.position.y = 2.5; g.scale.setScalar(SIZE); g.userData = { dyn: true, sparkles, target, halo };
  return g;
}

/** Hover above the platform top (x, y, z), spin, breathe; the target ring stays on the platform, the halo faces the camera. ph: per-pickup phase. */
export function animateToken(g, t, x, y, z, ph, view) {
  const u = g.userData, pulse = Math.sin(t * 4.2 + ph), br = SIZE * (1 + 0.06 * pulse), lift = 1.15 + Math.sin(t * 2.4 + ph) * 0.12;
  g.position.set(x, y + lift, z); g.rotation.y = t * 1.8; g.scale.setScalar(br);
  u.halo.lookAt(view || g.position); u.halo.material.opacity = 0.45 + 0.25 * pulse;
  u.target.position.y = (0.012 - lift) / br; u.target.scale.setScalar(1 + 0.12 * pulse); u.target.material.opacity = 0.35 + 0.2 * pulse;
  u.sparkles.rotation.z = t * 3; u.sparkles.scale.setScalar(0.7 + 0.3 * Math.abs(Math.sin(t * 3 + ph)));
}
