// The trophy hall (basement −1): where the tower ends. A ballroom in plum and gold: stepped dais in the middle carrying a giant golden
// mosquito on a cup, spotlights from the ceiling, a red carpet, one mini trophy per conquered biome around the dais, banners on the
// walls, coin hoards and four trampolines to fly up to the trophy. Built by Level when opts.hall is set; the show runs in Finale.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BIOMES, SIGNAL } from './Biomes.js';
import { SURF } from './Surfaces.js';
import { buildModel } from '../enemies/Models.js';
import { flat, gomme, lathe, roundedBox, roundedCyl } from '../render/Style.js';

export const HALL_THEME = { id: 'hall', name: 'Salle des trophées', size: [46, 46, 22], indoor: true, hall: true, pal: [['metal', '#FFC62E']] };
const GOLD = '#FFC62E', GOLD_HI = '#FFF0A8', PLUM = '#4A2C7E', PLUM_DK = '#2E1A52', CORAL = SIGNAL.coral;
const DAIS = [[15, 0.45], [11.6, 0.45], [8.2, 0.45]]; // square tiers: width, height (a step each)
const CUP = 1.9; // cup scale: the trophy stands about 13 m tall
export const TROPHY_TOP = 1.35 + 1.3 + CUP * 4.4; // dais + plinth + cup + mosquito: where the show aims

/** Build the hall into level L (shell already built). Returns the per-frame animation. */
export function buildHall(L) {
  const g = L.group, M = (k, make) => L.cached('hall' + k, make), ink = L.pal.ink;
  const gold = M('gold', () => gomme(GOLD, { rim: 0.6, rimColor: GOLD_HI, shadow: 0.62, ao: 1 }));
  const plum = M('plum', () => gomme(PLUM, { rim: 0.25, rimColor: '#B79CFF', ao: 1, pattern: 'stripes', color2: '#53338C', scale: 3 }));
  const plumDk = M('plumDk', () => gomme(PLUM_DK, { rim: 0.2, rimColor: '#8E7BFF', ao: 1 }));
  const cream = M('cream', () => gomme('#FFF4DA', { ao: 1 }));
  const coral = M('coral', () => gomme(CORAL, { ao: 1, pattern: 'stripes', color2: '#F04A3C', scale: 2 }));
  const add = (geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || g).add(m); if (o.ink !== false && !o.parent) L.addOutline(geo, m); return m; };
  const solid = (x, y, z, w, h, d) => L.colliders.push({ min: new THREE.Vector3(x - w / 2, y, z - d / 2), max: new THREE.Vector3(x + w / 2, y + h, z + d / 2), ramp: null, role: 'socle' });

  // stepped dais: plum tiers with a gold lip and a cream top band, every one a step high
  let y = 0;
  for (const [w, h] of DAIS) {
    add(roundedBox(w, h, w, 0.12), plum, 0, y + h / 2, 0); solid(0, y, 0, w, h, w);
    for (let i = 0; i < 4; i++) add(roundedBox(w + 0.12, 0.12, 0.3, 0.05), gold, [0, 1, 0, -1][i] * (w / 2 - 0.09), y + h - 0.02, [1, 0, -1, 0][i] * (w / 2 - 0.09), { cast: false, ry: (i % 2) * Math.PI / 2 }); // gold lip round the edge
    y += h;
  }
  // plinth with gold corners and a coral sash, then the cup
  add(roundedBox(4.8, 1.3, 4.8, 0.16), plumDk, 0, y + 0.65, 0); solid(0, y, 0, 4.8, 1.3, 4.8);
  add(roundedBox(4.96, 0.16, 4.96, 0.06), gold, 0, y + 0.08, 0); add(roundedBox(4.96, 0.16, 4.96, 0.06), gold, 0, y + 1.22, 0);
  for (const s of [-1, 1]) { add(roundedBox(4.84, 0.5, 0.06, 0.02), coral, 0, y + 0.66, s * 2.41, { ink: false, cast: false }); add(roundedBox(0.06, 0.5, 4.84, 0.02), coral, s * 2.41, y + 0.66, 0, { ink: false, cast: false }); }
  y += 1.3;
  solid(0, y, 0, 2.2 * CUP, 3.2 * CUP, 2.2 * CUP); // the cup and the mosquito's feet: nobody climbs in
  const cup = new THREE.Group(); cup.position.y = y; cup.scale.setScalar(CUP); g.add(cup); cup.userData.dyn = true; // turns slowly: kept out of the static batch
  const part = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; cup.add(m); return m; };
  const cupGeo = M('cupG', () => lathe([[0, 0], [0.8, 0], [0.8, 0.12], [0.36, 0.22], [0.2, 0.42], [0.16, 0.8], [0.3, 0.98], [0.9, 1.15], [1.1, 1.5], [1.18, 1.7], [1.02, 1.7], [0.88, 1.32], [0, 1.25]], 36));
  part(cupGeo, gold, 0, 0, 0);
  for (const s of [-1, 1]) { const h = part(M('handleG', () => new THREE.TorusGeometry(0.36, 0.08, 10, 24, Math.PI)), gold, s * 1.12, 1.25, 0); h.rotation.z = -s * Math.PI / 2; }
  const ring = part(M('cupRingG', () => new THREE.TorusGeometry(0.97, 0.05, 8, 40).rotateX(Math.PI / 2)), M('coralF', () => gomme(CORAL, { ao: 1 })), 0, 1.02, 0);
  ring.castShadow = false;
  // the giant golden mosquito standing on the cup (the game's own model, cast in gold, eyes kept)
  const mq = buildModel('mosquito', true), goldBody = M('mqGold', () => gomme(GOLD, { rim: 0.7, rimColor: '#FFFFFF', shadow: 0.6, ao: 1 }));
  const wingGold = M('mqWing', () => flat('#FFE58A', { transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  mq.body.traverse((o) => { if (!o.isMesh) return; if (o.material === mq.mat) o.material = goldBody; else if (o.material.transparent && o.renderOrder === 2) o.material = wingGold; });
  const piv = new THREE.Group(); piv.add(mq.body); piv.scale.setScalar(4.4); piv.position.y = 1.7 + 0.75; cup.add(piv);
  piv.traverse((o) => { o.frustumCulled = false; });

  // red carpet from the door to the dais, gold edges
  const cl = L.d / 2 - DAIS[0][0] / 2 - 0.2;
  add(new THREE.BoxGeometry(3.4, 0.04, cl), coral, 0, 0.02, DAIS[0][0] / 2 + cl / 2, { ink: false, cast: false });
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.14, 0.05, cl), gold, s * 1.7, 0.025, DAIS[0][0] / 2 + cl / 2, { ink: false, cast: false });

  // one mini trophy per biome in a ring around the dais: plinth, gold cup, the biome's accent as a sash and a gem
  const n = BIOMES.length, R = 15.6, cupMini = M('miniCupG', () => lathe([[0, 0], [0.32, 0], [0.32, 0.06], [0.12, 0.12], [0.08, 0.36], [0.16, 0.44], [0.4, 0.56], [0.44, 0.78], [0.36, 0.78], [0.3, 0.6], [0, 0.56]], 20));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n, x = Math.sin(a) * R, z = Math.cos(a) * R;
    if (Math.abs(x) < 3.4 && z > 0) continue; // the carpet runs through here
    const b = BIOMES[i], acc = M('acc' + b.id, () => gomme(b.accent, { rim: 0.4, rimColor: '#FFFFFF', ao: 1 }));
    add(M('plinthG', () => roundedBox(1.3, 1.1, 1.3, 0.1)), plumDk, x, 0.55, z, { ry: a }); solid(x, 0, z, 1.3, 1.1, 1.3);
    add(M('plinthSashG', () => roundedBox(1.36, 0.22, 1.36, 0.05)), acc, x, 0.82, z, { ry: a, cast: false });
    add(cupMini, gold, x, 1.1, z, { ry: a });
    add(M('gemG', () => new THREE.OctahedronGeometry(0.17, 0)), acc, x, 2.05, z, { ink: false, cast: false });
  }

  // columns along the walls, gold capitals, banners hanging between them
  const banner = M('bannerG', () => { const s = new THREE.Shape(); s.moveTo(-1, 0); s.lineTo(1, 0); s.lineTo(1, -4.4); s.lineTo(0, -3.7); s.lineTo(-1, -4.4); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }); });
  const bCols = [CORAL, SIGNAL.sky, SIGNAL.violet, SIGNAL.acid].map((c, i) => M('ban' + i, () => gomme(c, { ao: 1, shadow: 0.75 })));
  const emblem = M('embG', () => new THREE.TorusGeometry(0.42, 0.09, 8, 28)), star = M('starG', () => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.14 : 0.32; (i ? s.lineTo : s.moveTo).call(s, Math.cos(a) * r, Math.sin(a) * r); } return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }); });
  const H = L.h, colGeo = M('colG', () => roundedCyl(0.55, 0.55, H - 1.4, 0.06, 20)), capGeo = M('capG', () => roundedBox(1.6, 0.5, 1.6, 0.1));
  for (let side = 0; side < 4; side++) for (let k = -1; k <= 1; k++) {
    const along = k * 14, inset = L.w / 2 - 1.2, ry = side * Math.PI / 2;
    const [x, z] = [[along, -inset], [inset, along], [-along, inset], [-inset, -along]][side];
    if (side === 2 && k === 0) continue; // the door
    add(colGeo, plum, x, (H - 1.4) / 2 + 0.7, z); add(capGeo, gold, x, H - 0.45, z); add(capGeo, gold, x, 0.25, z); solid(x, 0, z, 1.2, H, 1.2);
    if (k < 1) { // a banner halfway to the next column
      const bx = x + (side === 1 || side === 3 ? 0 : 7 * (side === 0 ? 1 : -1)), bz = z + (side === 0 || side === 2 ? 0 : 7 * (side === 1 ? 1 : -1));
      const nx = Math.sign(-x) * (side % 2), nz = Math.sign(-z) * (1 - side % 2), m = add(banner, bCols[(side + k + 1) % 4], bx + nx * 0.5, H - 1.2, bz + nz * 0.5, { cast: false });
      m.lookAt(bx + nx * 10, H - 1.2, bz + nz * 10);
      add(emblem, gold, 0, -1.6, 0.1, { parent: m, cast: false }); add(star, gold, 0, -1.6, 0.1, { parent: m, cast: false });
    }
  }
  // coin hoards at the dais corners (stacks + a spill), no ink: they are small
  const coinGeo = M('coinG', () => new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16)), heap = [];
  for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let s = 0; s < 7; s++) {
    const r = L.rnd, x = cx * (8.4 + r() * 1.4), z = cz * (8.4 + r() * 1.4), n2 = 2 + Math.floor(r() * 9);
    for (let j = 0; j < n2; j++) heap.push(coinGeo.clone().rotateY(r() * 6).translate(x + (r() - 0.5) * 0.06, 0.04 + j * 0.085, z + (r() - 0.5) * 0.06));
  }
  add(mergeGeometries(heap), gold, 0, 0, 0, { ink: false }); heap.forEach((q) => q.dispose());

  // four trampolines on the diagonals: the way up to see the trophy close
  L.pads ||= [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const half = SURF.pad.size / 2, x = sx * 11, z = sz * 11, o = { min: new THREE.Vector3(x - half, 0, z - half), max: new THREE.Vector3(x + half, SURF.pad.h, z + half), ramp: null, role: 'rebond', kind: 'bounce' };
    L.padTraits(o, { x: -sx, z: -sz }); L.colliders.push(o); L.makePad(o);
  }

  // spotlights: six soft cones from the ceiling onto the trophy, swaying; dark until the show switches them on
  const spots = [], beamGeo = M('beamG', () => new THREE.CylinderGeometry(0.3, 1.9, 1, 24, 1, true).translate(0, -0.5, 0));
  const top = new THREE.Vector3(0, TROPHY_TOP - 2.5, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, from = new THREE.Vector3(Math.cos(a) * 17, H - 0.3, Math.sin(a) * 17);
    const mat = L.own(new THREE.MeshBasicMaterial({ color: i % 2 ? GOLD_HI : '#FFFFFF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    const b = new THREE.Mesh(beamGeo, mat); b.position.copy(from); b.userData.dyn = true; g.add(b);
    const lamp = add(M('lampG', () => roundedCyl(0.5, 0.35, 0.7, 0.08, 16)), plumDk, from.x, from.y - 0.2, from.z, { cast: false });
    spots.push({ b, from, a, mat, lamp });
  }
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(7.7, 8.2, 64).rotateX(-Math.PI / 2), L.own(new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
  glowRing.position.y = 0.03; glowRing.userData.dyn = true; g.add(glowRing);

  // golden chandelier over the trophy: a crown ring on four chains, twelve lit bulbs, turning slowly (one dyn group)
  const ch = new THREE.Group(); ch.position.y = H - 3.2; ch.userData.dyn = true; g.add(ch);
  const cp = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); ch.add(m); return m; };
  cp(M('chRingG', () => new THREE.TorusGeometry(4.2, 0.22, 10, 48).rotateX(Math.PI / 2)), gold, 0, 0, 0).add(new THREE.Mesh(M('chRingG', null), L.cached('hallInk', () => flat(ink, { side: THREE.BackSide }))));
  cp(M('chHubG', () => new THREE.SphereGeometry(0.7, 16, 12)), gold, 0, 0.9, 0);
  const bulb = L.own(new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFE9A0').multiplyScalar(1.6) })), bulbGeo = M('bulbG', () => new THREE.SphereGeometry(0.26, 12, 8)), spike = M('spikeG', () => new THREE.ConeGeometry(0.16, 0.6, 8));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, x = Math.cos(a) * 4.2, z = Math.sin(a) * 4.2; cp(spike, gold, x, 0.45, z); cp(bulbGeo, bulb, x, 0.9, z); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4, c = cp(M('chainG', () => new THREE.CylinderGeometry(0.05, 0.05, 1, 6)), gold, Math.cos(a) * 2.1, 1.6, Math.sin(a) * 2.1); c.scale.y = 3.6; c.rotation.z = Math.cos(a) * 0.52; c.rotation.x = -Math.sin(a) * 0.52; }
  cp(M('chainG', null), gold, 0, 2.4, 0).scale.y = 3.2;

  L.ambientDef = { n: 150, color: '#FFD86A', size: 0.09, rise: 0.25, sway: 0.5, glow: true }; // golden glitter in the air
  const v = new THREE.Vector3();
  const hall = { on: 0, spots, cup, mq, ring: glowRing,
    update(t) { // spots sway around the trophy; `on` (0..1 per spot, set by the show) fades them in
      cup.rotation.y = t * 0.35; ch.rotation.y = -t * 0.15; mq.update(t * 0.5, false, 0.35);
      spots.forEach((s, i) => {
        const k = Math.max(0, Math.min(1, hall.on * 6 - i)), aim = v.set(Math.sin(t * 0.6 + i) * 1.2, top.y + Math.sin(t * 0.9 + i * 2) * 0.8, Math.cos(t * 0.5 + i) * 1.2);
        const dir = aim.clone().sub(s.from), len = dir.length(); s.b.scale.set(1, len, 1); s.b.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
        s.mat.opacity = k * (0.06 + 0.02 * Math.sin(t * 3 + i));
      });
      glowRing.material.opacity = hall.on * (0.35 + 0.25 * Math.sin(t * 2.5));
    } };
  return hall;
}
