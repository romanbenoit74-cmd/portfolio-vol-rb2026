// Procedural level: shell (floor/walls/ceiling), hand-authored rooms 1-2, seeded scatter for 3-10.
// Look: "Gomme & Encre" kit (render/Style.js) on the biome palette (level/Biomes.js); collisions stay AABB proxies.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as D from './Decor.js';
import { bus, rand, rng } from '../core/core.js';
import { sphereFree } from './Physics.js';
import { MAX_RISE, levelSupports, linked, moverOffset, reachable, sweptBox } from './Reach.js';
import { KIND_COLOR, SURF, bounceHeight, crumbleStep, launchV, solid } from './Surfaces.js';
import { animateToken, buildToken } from './Tokens.js';
import { buildAmbient } from './Ambient.js';
import { HALL_THEME, buildHall } from './Hall.js';
import { SIGNAL, biome } from './Biomes.js';
import { bevel, mixHex, motifFor } from '../render/StyleRules.js';
import { flat, gomme, inkHull, mergeInk, roundedBox, roundedCyl } from '../render/Style.js';
import { makeKit, rampGeo } from './props/kit.js';
import { RECIPES } from './props/index.js';

const V3 = THREE.Vector3;

// gameplay/layout per biome (colours, light and fog come from the palette in Biomes.js; wall/floor/fog/hemi here are legacy)
export const THEMES = [
  null,
  { id: 'bathroom', name: 'Salle de bain', size: [20, 20, 8], wall: ['tiles', '#8fd6e8', 2], floor: ['tiles', '#f4f0e0', 2], ceil: '#f6fbff', trim: 0xffffff, fog: [0xd6f1fa, 0.008], hemi: [0xffffff, 0x9ad0e0, 0.9], lamp: 0xfff6dc, pal: [['tiles', '#ffffff'], ['wood', '#e8b878']], indoor: true },
  { id: 'kitchen', name: 'Cuisine', size: [35, 35, 10], wall: ['plaster', '#ffd98a', 3], floor: ['checker', '#ef6a55', 3], ceil: '#fff3d6', trim: 0xffffff, fog: [0xffecc0, 0.006], hemi: [0xfff6e0, 0xe8b070, 0.9], lamp: 0xfff0c0, pal: [['wood', '#c98a52'], ['metal', '#d8e4ea']], indoor: true },
  { id: 'garden', name: 'Jardin', wall: ['hedge', '#4fbf4a', 3], floor: ['grass', '#7ed957', 3], fog: [0xc6ecff, 0.005], hemi: [0xdaf2ff, 0x6ab84a, 1.0], lamp: 0xfff2c0, pal: [['wood', '#c98a52'], ['concrete', '#d8d4c4']], indoor: false, sky: 0x9edcff },
  { id: 'garage', name: 'Garage', wall: ['concrete', '#c7d0dc', 3], floor: ['concrete', '#9aa4b2', 3], ceil: '#b8c2d0', trim: 0xf0d040, fog: [0xc0c8d4, 0.007], hemi: [0xeaf2ff, 0x8a94a4, 0.95], lamp: 0xe6f2ff, pal: [['metal', '#ef5a4a'], ['metal', '#5aa0e8'], ['wood', '#e0a860']], indoor: true },
  { id: 'office', name: 'Bureau', wall: ['plaster', '#c9d8ff', 3], floor: ['carpet', '#7a8ce0', 3], ceil: '#f4f6ff', trim: 0xffffff, fog: [0xdfe6ff, 0.006], hemi: [0xf2f6ff, 0x9aa8e0, 0.95], lamp: 0xf6faff, pal: [['wood', '#b98052'], ['metal', '#b8c4d8'], ['carpet', '#48c0a0']], indoor: true },
  { id: 'park', name: 'Parc', wall: ['hedge', '#3cb04a', 3], floor: ['grass', '#8be05e', 3], fog: [0xcdefff, 0.005], hemi: [0xe0f6ff, 0x70c050, 1.05], lamp: 0xfff2c0, pal: [['wood', '#c98a52'], ['concrete', '#e0dccc']], indoor: false, sky: 0xa8e2ff },
  { id: 'attic', name: 'Grenier', wall: ['wood', '#d8a068', 3], floor: ['wood', '#c98e54', 3], ceil: '#b87c48', trim: 0xfff0d0, fog: [0xf2d8b0, 0.008], hemi: [0xfff0d0, 0xc09060, 0.9], lamp: 0xffd090, pal: [['wood', '#a86c3c'], ['carpet', '#d85a6a']], indoor: true },
  { id: 'cellar', name: 'Cave', wall: ['concrete', '#8fc8b0', 3], floor: ['concrete', '#6aa890', 3], ceil: '#7ab8a0', trim: 0xd8f8e8, fog: [0xa0d8c0, 0.01], hemi: [0xd0fff0, 0x60a890, 0.85], lamp: 0xb0ffd8, pal: [['wood', '#b47c48'], ['metal', '#90b8a8']], indoor: true },
  { id: 'greenhouse', name: 'Serre', wall: ['hedge', '#48c870', 3], floor: ['concrete', '#e0d8b8', 3], ceil: '#d0fff0', trim: 0xffffff, fog: [0xd0f8e8, 0.006], hemi: [0xf0fff8, 0x60c880, 1.0], lamp: 0xf6ffe6, pal: [['wood', '#d8a868'], ['hedge', '#58d080']], indoor: false, sky: 0xd0f4ff },
  { id: 'library', name: 'Bibliothèque', wall: ['wood', '#c07848', 3], floor: ['carpet', '#c04868', 3], ceil: '#d09868', trim: 0xffe8c0, fog: [0xf0cca0, 0.008], hemi: [0xfff0d0, 0xc08858, 0.9], lamp: 0xffe0a0, pal: [['wood', '#9a5a30'], ['carpet', '#e0607a']], indoor: true },
  { id: 'nursery', name: "Chambre d'enfant", wall: ['plaster', '#ffc8e4', 3], floor: ['carpet', '#8ed8ff', 3], ceil: '#fff5fa', trim: 0xffffff, fog: [0xffeaf4, 0.007], hemi: [0xfff0f8, 0xf0b0d0, 0.95], lamp: 0xfff0f8, pal: [['wood', '#ffb84a'], ['carpet', '#6fd0ff'], ['carpet', '#ff7aa8']], indoor: true },
  { id: 'market', name: 'Supermarché', wall: ['plaster', '#fff3b8', 3], floor: ['checker', '#3aa0e0', 3], ceil: '#ffffff', trim: 0xffffff, fog: [0xfff6d0, 0.006], hemi: [0xffffff, 0xd0c090, 0.95], lamp: 0xffffff, pal: [['metal', '#e04a4a'], ['metal', '#4a9ae0'], ['wood', '#e0b070']], indoor: true },
  { id: 'gym', name: 'Gymnase', wall: ['plaster', '#ffb868', 3], floor: ['wood', '#e8b070', 3], ceil: '#ffe8c8', trim: 0xffffff, fog: [0xffe0b8, 0.007], hemi: [0xfff0d8, 0xc89058, 0.95], lamp: 0xfff0d0, pal: [['metal', '#e84a4a'], ['carpet', '#4a7ae8'], ['wood', '#c88a4a']], indoor: true },
  { id: 'pool', name: 'Piscine', wall: ['tiles', '#7fe6f6', 2], floor: ['tiles', '#38b8ee', 2], ceil: '#e0fbff', trim: 0xffffff, fog: [0xc0f0fc, 0.008], hemi: [0xf0ffff, 0x38a8d8, 1.0], lamp: 0xf0ffff, pal: [['tiles', '#ffffff'], ['metal', '#f0d040']], indoor: true },
  { id: 'lab', name: 'Laboratoire', wall: ['tiles', '#e8f6f0', 2], floor: ['tiles', '#a8d8c8', 2], ceil: '#f4fffa', trim: 0xd8f0e8, fog: [0xe0f8ee, 0.007], hemi: [0xf4fffa, 0x88c8b0, 0.95], lamp: 0xf0fff8, pal: [['metal', '#c0dcd8'], ['carpet', '#58d890'], ['metal', '#f0a0a0']], indoor: true },
  { id: 'aquarium', name: 'Aquarium', wall: ['plaster', '#4a86e8', 3], floor: ['concrete', '#8abcf0', 3], ceil: '#3a64c8', trim: 0x9ad0ff, fog: [0x4a80dc, 0.012], hemi: [0x9adcff, 0x2a4aa0, 0.95], lamp: 0x9adcff, pal: [['hedge', '#30c894'], ['concrete', '#f4a0a8'], ['metal', '#ffd070']], indoor: true },
  { id: 'candy', name: 'Bonbons', wall: ['plaster', '#ff9ccc', 3], floor: ['checker', '#ff6eac', 3], ceil: '#ffd8ec', trim: 0xffffff, fog: [0xffd0e8, 0.007], hemi: [0xfff0f8, 0xf090c0, 1.0], lamp: 0xfff0f8, pal: [['carpet', '#ffd04a'], ['carpet', '#8af0d4'], ['wood', '#ff8ab4']], indoor: true },
  { id: 'ice', name: 'Igloo', wall: ['tiles', '#d0f0ff', 2], floor: ['tiles', '#a0dcfc', 2], ceil: '#e4f8ff', trim: 0xffffff, fog: [0xd8f2ff, 0.009], hemi: [0xf0fbff, 0x90c8ec, 1.0], lamp: 0xf0fbff, pal: [['concrete', '#eafaff'], ['metal', '#a8daf4']], indoor: true },
  { id: 'desert', name: 'Pyramide', wall: ['concrete', '#f2d494', 3], floor: ['concrete', '#eac878', 3], ceil: '#dcb464', trim: 0xffe6a8, fog: [0xffe4a8, 0.007], hemi: [0xfff2d0, 0xd8a850, 1.0], lamp: 0xffe6a8, pal: [['concrete', '#e2b862'], ['wood', '#a8703c'], ['metal', '#40c0b0']], indoor: true },
  { id: 'volcano', name: 'Volcan', wall: ['concrete', '#b04a38', 3], floor: ['concrete', '#4a2424', 3], ceil: '#682018', trim: 0xff9a60, fog: [0xff7a3a, 0.011], hemi: [0xffb078, 0x882414, 0.95], lamp: 0xff9a4a, pal: [['concrete', '#6a2c24'], ['metal', '#ff9430'], ['concrete', '#3a1c1c']], indoor: true },
  { id: 'roof', name: 'Toit', size: [40, 40, 60], wall: ['concrete', '#c9d0dc', 3], floor: ['concrete', '#b4bcc8', 3], fog: [0xcfeaff, 0.0016], hemi: [0xe6f6ff, 0x8aa0b8, 1.05], lamp: 0xffffff, pal: [['metal', '#d8e2ea']], indoor: false, sky: 0x9edcff, roof: true },
];
export const ROOF = THEMES.length - 1;
export const BIOMES = THEMES.length - 2; // playable themes (excluding index 0 and the roof)

// flat marks lying on a parkour top (XZ plane, y = 0)
function chevronGeo(len, t) { // ">" pointing to -z
  const a = new THREE.PlaneGeometry(t, len).rotateX(-Math.PI / 2), b = a.clone();
  a.rotateY(Math.PI / 4).translate(-len * 0.25, 0, 0); b.rotateY(-Math.PI / 4).translate(len * 0.25, 0, 0);
  return mergeGeometries([a, b]);
}
function crackGeo() { // zigzag crack with a branch
  const pts = [[-1.2, -0.3], [-0.6, 0.1], [-0.2, -0.25], [0.35, 0.2], [0.8, -0.1], [1.25, 0.25]], parts = [];
  const seg = ([x0, z0], [x1, z1], t) => { const L = Math.hypot(x1 - x0, z1 - z0); return new THREE.PlaneGeometry(t, L).rotateX(-Math.PI / 2).rotateY(-Math.atan2(x1 - x0, z1 - z0)).translate((x0 + x1) / 2, 0, (z0 + z1) / 2); };
  for (let i = 1; i < pts.length; i++) parts.push(seg(pts[i - 1], pts[i], 0.07));
  parts.push(seg([-0.2, -0.25], [-0.05, -0.85], 0.05), seg([0.35, 0.2], [0.2, 0.8], 0.05));
  return mergeGeometries(parts);
}

// HDR flat colour (> 1): only it blooms in high quality (lit marks of the movement plates)
const glowMat = (color, k) => { const m = new THREE.MeshBasicMaterial({ color }); m.color.multiplyScalar(k); return m; };
const shapeGeo = (pts) => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));
const flatZ = (g) => g.rotateX(-Math.PI / 2).rotateY(Math.PI); // a shape drawn pointing +y lies flat, pointing +z
const chevron = (y, w = 0.42, t = 0.2) => flatZ(shapeGeo([[-w, y - 0.12], [0, y + 0.18], [w, y - 0.12], [w, y - 0.12 - t], [0, y + 0.18 - t], [-w, y - 0.12 - t]]));
/** Lit marks of a movement plate, flat, pointing +z (where it sends you): one geometry per separately lit part, back to front. */
function padMarks(kind) {
  if (kind === 'speed') return [-0.66, -0.22, 0.22, 0.66].map((y) => chevron(y));
  if (kind === 'launch') return [chevron(-0.62, 0.36, 0.16), chevron(-0.24, 0.36, 0.16), flatZ(shapeGeo([[-0.5, 0.12], [0.5, 0.12], [0, 0.78]]))];
  const tri = [0, 1, 2, 3].map((i) => flatZ(shapeGeo([[-0.24, -0.84], [0.24, -0.84], [0, -0.56]])).rotateY((i * Math.PI) / 2)); // bounce: four arrows to the centre
  return [mergeGeometries(tri), new THREE.RingGeometry(0.2, 0.34, 32).rotateX(-Math.PI / 2)];
}

export class Level {
  constructor(index, opts = {}) {
    this.index = index;
    const th = (this.theme = opts.hall ? HALL_THEME : THEMES[Math.min(index, THEMES.length - 1)]);
    this.name = th.name; this.pal = biome(th.id); this.mats = [];
    this.seedV = opts.seed ?? index * 7919 + 13; this.kit = RECIPES[th.id] ? makeKit(this, RECIPES[th.id]) : null; // biome prop kit (spec §5)
    this.group = new THREE.Group();
    this.colliders = []; this.safeZones = []; this.zoneMeshes = []; this.matCache = new Map();
    this.rnd = rng(opts.seed ?? index * 7919 + 13);
    this.hand = opts.hand !== false; this.props = opts.props;
    this.hole = new V3(0, 0, 0); this.ceilHole = new V3(0, 0, 0);
    const r = this.rnd;
    const sc = (this.sc = opts.scale ?? 1); // multiplayer maps are bigger (footprint only: the height stays)
    this.w = Math.round((th.size ? th.size[0] : Math.round(32 + r() * 12)) * sc);
    this.d = Math.round((th.size ? th.size[1] : Math.round(32 + r() * 12)) * sc);
    this.h = th.size ? th.size[2] : Math.round(12 + r() * 8);
    this.zoneCount = opts.zones ?? 2;
    this.buildShell();
    if (th.roof) this.buildRoof(); else if (th.hall) this.hall = buildHall(this); else if (this.hand && index === 1) this.build1(); else if (this.hand && index === 2) this.build2(); else this.scatter();
    if (!th.roof && !th.hall) { this.buildParkour(Math.round((opts.pk ?? 2) * Math.max(1, sc)), !!opts.ult); this.decorate(); }
    else if (th.roof) this.decorate();
    this.pending = opts.layoutOnly ? [] : ['finishOutlines', 'batchStatic', 'ambient']; // layoutOnly: colliders for tests / tools, no draw-call merging
    if (!opts.defer) this.finish(); // defer: the caller spreads these over frames with step()
    this.buildZones();
  }

  decorate() {
    const th = this.theme, { w, d, h } = this, r = this.rnd;
    if (this.kit) { // biome murals + floor decals; the plants of the hand-made rooms keep their colliders
      if (this.hand && this.index === 1) this.box({ x: 8.6, z: -3, w: 1.08, d: 1.08, h: 0.84, look: 'plant' });
      if (this.hand && this.index === 2) this.box({ x: 15, z: 14, w: 1.44, d: 1.44, h: 1.12, look: 'plant' });
      this.kit.decorate(); return;
    }
    if (this.hand && this.index === 1) {
      D.windowAt(this, 0, -3, 3, 2.4, 1.6, 0xd8f4ff); D.mirror(this, 0, 6.5, 3.4, 2.6, 1.7);
      D.picture(this, 2, -4, 2.6, 1.6, 1.1, 3); D.picture(this, 3, 3, 2.8, 1.2, 1.6, 9);
      D.duck(this, -7.8, 1.1, -8.3); D.plant(this, 8.6, -3, 1.2);
    } else if (this.hand && this.index === 2) {
      D.windowAt(this, 1, -8, 3.2, 5, 2.6, 0xfff0c8); D.windowAt(this, 1, 8, 3.2, 5, 2.6, 0xfff0c8);
      D.clock(this, 3, 2, 4.4, 1.0); D.picture(this, 2, -6, 3.6, 2.2, 1.4, 5); D.picture(this, 2, 8, 3.6, 2.2, 1.4, 11);
      D.tileBand(this, 0, 0, 2.9, 34, 2.2, this.mat('tiles', '#f2e4c4'));
      D.pendant(this, 0, 2, 4.6); D.plant(this, 15, 14, 1.6);
    } else if (th.indoor) {
      const n = 2 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) D.windowAt(this, i % 4, (r() - 0.5) * (w * 0.5), Math.min(h * 0.55, 5), 4 + r() * 2, 2.6, th.id === 'attic' || th.id === 'cellar' ? 0x6f8cff : 0xdcecff, th.id !== 'cellar');
      for (let i = 0; i < 3; i++) D.picture(this, (i + 1) % 4, (r() - 0.5) * (w * 0.6), Math.min(h * 0.4, 3.4), 2 + r() * 1.4, 1.4 + r(), i * 13 + this.index);
    }
  }

  own(m) { this.mats.push(m); return m; }
  cached(key, make) { if (!this.matCache.has(key)) this.matCache.set(key, make()); return this.matCache.get(key); }
  wallFrame(i) { return D.wallFrame(this, i); }
  // no collider touching the floor around (x, z): room for a decal / small decor
  floorFree(x, z, r) { for (const c of this.colliders) if (c.min.y < 0.5 && x + r > c.min.x && x - r < c.max.x && z + r > c.min.z && z - r < c.max.z) return false; return true; }
  flatMat(color) { const k = 'flat' + color; if (!this.matCache.has(k)) this.matCache.set(k, flat(color)); return this.matCache.get(k); }
  // prop material: biome ink lines, the old texture becomes a world-space motif with a lighter second tone
  mat(tex, color, extra = {}) {
    const key = tex + color + JSON.stringify(extra);
    if (!this.matCache.has(key)) this.matCache.set(key, gomme(color, { pattern: motifFor(tex), color2: mixHex(color, '#FFFFFF', 0.3), line: this.pal.ink, lineA: 0.14, ...extra }));
    return this.matCache.get(key);
  }
  buildShell() {
    const th = this.theme, pal = this.pal, ink = pal.ink, { w, d, h } = this;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.own(gomme(pal.floor, { pattern: pal.floorMotif, scale: pal.floorScale, color2: pal.floor2, line: ink, lineA: 0.12, ao: 1, hole: this.hole })));
    fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; this.group.add(fl);
    if (th.roof) return;
    if (th.indoor || th.id === 'greenhouse') {
      const cl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.own(gomme(pal.ceil || mixHex(pal.wall, '#FFFFFF', 0.7), { ao: 1, shadow: 0.9, side: THREE.DoubleSide, hole: this.ceilHole })));
      cl.rotation.x = Math.PI / 2; cl.position.y = h; this.group.add(cl);
    } else { // open sky: flat colour, the hatch of the room above cuts through it
      const sk = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.3, d * 1.3), this.own(flat(pal.sky || pal.air, { side: THREE.DoubleSide, fog: false, hole: this.ceilHole })));
      sk.rotation.x = Math.PI / 2; sk.position.y = h + 0.02; this.group.add(sk);
    }
    const wallMat = this.own(gomme(pal.wall, { pattern: pal.wallMotif, color2: pal.wall2, line: ink, lineA: 0.12, ao: 0.72, aoH: 1.6 }));
    const trimMat = this.own(gomme(pal.trim || '#FFFFFF', { ao: 0.85 }));
    for (let i = 0; i < 4; i++) {
      const f = D.wallFrame(this, i), len = f.userData.len;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h), wallMat); m.position.set(0, h / 2, 0); m.receiveShadow = true; f.add(m);
      const trim = (geo, y, z) => { const t = new THREE.Mesh(geo, trimMat); t.position.set(0, y, z); t.receiveShadow = true; f.add(t); this.addOutline(geo, t); };
      trim(roundedBox(len - 0.02, 0.34, 0.14, 0.05), 0.17, 0.07); // baseboard
      if (th.indoor) trim(roundedBox(len - 0.02, 0.22, 0.16, 0.05), h - 0.11, 0.08); // crown
    }
  }

  // ---- building blocks ----
  box(o) {
    const { x = 0, z = 0, w = 1, d = 1, h = 1, y = 0, tex = 'concrete', color = '#cccccc', ramp = null, collide = true, emissive = 0, outline = false, role = null, look = null } = o;
    const rec = !emissive && this.kit ? (look ? this.kit.look(look) : role ? this.kit.pick(role, { w, d, h, ramp }) : null) : null;
    if (rec) { // biome recipe: the visual fills the box, the collider stays the box
      const g = new THREE.Group(); g.position.set(x, y, z); this.group.add(g);
      (rec.make || rec)(this.kit, g, { w, d, h, ramp, y });
      if (collide) this.colliders.push({ min: new V3(x - w / 2, y, z - d / 2), max: new V3(x + w / 2, y + h, z + d / 2), ramp, role });
      return g;
    }
    const geo = ramp ? rampGeo(w, h, d, ramp) : roundedBox(w, h, d, bevel(w, h, d));
    const material = emissive ? this.flatMat(emissive) : this.mat(tex, color);
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y + h / 2, z); m.castShadow = !emissive; m.receiveShadow = !emissive;
    this.group.add(m);
    if ((collide || outline) && !emissive) this.addOutline(geo, m);
    if (collide) this.colliders.push({ min: new V3(x - w / 2, y, z - d / 2), max: new V3(x + w / 2, y + h, z + d / 2), ramp, role });
    return m;
  }
  // static ink: every outline of the room is merged into one draw call at the end (constant pixel width, biome ink)
  addOutline(geo, mesh) {
    mesh.updateWorldMatrix(true, false); // the group is still unparented at identity while the room is built
    (this.outlines ||= []).push({ geo, matrix: mesh.matrixWorld.clone() });
  }
  /** Run one pending merge step (outlines, static batch, ambient); false when none is left. Runs with the group at the origin. */
  step() {
    const k = this.pending.shift(); if (!k) return false;
    const g = this.group, y = g.position.y; g.position.y = 0; g.updateMatrixWorld(true);
    if (k === 'ambient') this.updateDust = buildAmbient(this); else this[k]();
    g.position.y = y; g.updateMatrixWorld(true);
    return true;
  }
  finish() { while (this.step()); }
  finishOutlines() {
    if (this.outlines && this.outlines.length) this.group.add(mergeInk(this.outlines, this.pal.ink, 2.4));
    this.outlines = null;
  }
  // static batching: opaque meshes that never move and share a material become one draw call per material (like the ink)
  batchStatic() {
    this.group.updateMatrixWorld(true);
    const buckets = new Map();
    this.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      for (let p = o; p && p !== this.group; p = p.parent) if (p.userData.dyn) return;
      const m = o.material;
      if (Array.isArray(m) || m.transparent || m.isShaderMaterial || m.map) return;
      const key = m.uuid + (o.receiveShadow ? 'r' : ''); // shadow casting is OR-ed below: one call per material
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    });
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const geos = list.map((o) => {
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
        return g.applyMatrix4(o.matrixWorld); // the group sits at identity while the room is built
      });
      const merged = new THREE.Mesh(mergeGeometries(geos), list[0].material);
      merged.castShadow = list.some((o) => o.castShadow); merged.receiveShadow = list[0].receiveShadow;
      geos.forEach((g) => g.dispose());
      for (const o of list) { o.parent.remove(o); o.geometry.dispose(); }
      this.group.add(merged);
    }
  }
  cyl(x, z, r, h, y, tex, color, collide = true, role = 'pilier', look = null) {
    const rec = this.kit ? (look ? this.kit.look(look) : this.kit.pick(role, { w: 2 * r, d: 2 * r, h, r })) : null;
    if (rec) {
      const g = new THREE.Group(); g.position.set(x, y, z); this.group.add(g);
      (rec.make || rec)(this.kit, g, { w: 2 * r, d: 2 * r, h, r, y });
      if (collide) this.colliders.push({ min: new V3(x - r, y, z - r), max: new V3(x + r, y + h, z + r), ramp: null, role });
      return g;
    }
    const m = new THREE.Mesh(roundedCyl(r, r, h, Math.min(0.08, r * 0.3), 24), this.mat(tex, color));
    m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; this.group.add(m);
    if (collide) this.addOutline(m.geometry, m);
    if (collide) this.colliders.push({ min: new V3(x - r, y, z - r), max: new V3(x + r, y + h, z + r), ramp: null, role });
    return m;
  }
  propPal(i) { const p = this.theme.pal; return p[i % p.length]; }

  build1() {
    const T = 'tiles', W = 'wood';
    this.box({ x: -6.4, z: -8.3, w: 6.6, d: 2.8, h: 1.1, tex: T, color: '#f6fafc', look: 'tub' });                // bathtub
    this.box({ x: -6.4, z: -8.3, w: 5.8, d: 2.0, h: 0.03, y: 1.09, emissive: 0x6ec6e8, emi: 0.6, color: '#7fd0ee', collide: false, look: 'skip' }); // water (drawn by the tub)
    this.cyl(-9.0, -9.3, 0.12, 0.8, 1.1, 'metal', '#c8d0d6', false, 'pilier', 'skip');                // faucet (drawn by the tub)
    this.box({ x: 6.5, z: -8.8, w: 3, d: 2.4, h: 2, tex: W, color: '#c9a273', look: 'cabinet' });                        // sink cabinet
    this.box({ x: 6.5, z: -8.8, w: 3.4, d: 2.6, h: 0.2, y: 2, tex: T, color: '#f6fafc', look: 'ceramicSlab' });              // basin
    this.box({ x: 6.5, z: -6.3, w: 2.6, d: 2.6, h: 2.1, tex: W, color: '#b98a5a', ramp: { axis: 'z', dir: -1 }, look: 'duckboard' }); // ramp to sink
    this.box({ x: 8.7, z: 5.5, w: 2.2, d: 2.4, h: 0.9, tex: T, color: '#f6fafc', look: 'toilet' });                     // toilet
    this.box({ x: 9.4, z: 5.5, w: 1.0, d: 2.0, h: 1.6, tex: T, color: '#f0f5f7', look: 'tank' });                     // tank
    this.box({ x: -9.4, z: 2, w: 1.2, d: 5, h: 0.2, y: 2.0, tex: W, color: '#c9a273', look: 'shelf' });                // shelves
    this.box({ x: -9.4, z: 2, w: 1.2, d: 5, h: 0.2, y: 3.4, tex: W, color: '#c9a273', look: 'shelf' });
    this.box({ x: 3.2, z: 6.3, w: 3.6, d: 4.2, h: 1.4, tex: 'carpet', color: '#c98a9a', ramp: { axis: 'z', dir: 1 }, look: 'hamper' }); // hamper ramp
    this.box({ x: -2, z: 9.5, w: 4.5, d: 0.5, h: 1.7, y: 0.3, tex: 'metal', color: '#eef2f5', look: 'radiator' });        // radiator
    this.box({ x: 2, z: -3.5, w: 1.8, d: 1.8, h: 1.0, tex: W, color: '#d1a670', look: 'basket' });                      // laundry basket
    this.box({ x: -3.5, z: 0.5, w: 1.6, d: 1.6, h: 0.6, y: 1.9, tex: W, color: '#d1a670', look: 'soap' });           // floating soap bars
    this.box({ x: 4.5, z: 0.5, w: 1.6, d: 1.6, h: 0.5, y: 2.6, tex: W, color: '#d1a670', look: 'soap' });
    this.box({ x: 0, z: 0, w: 3.4, d: 2.2, h: 0.03, tex: 'carpet', color: '#d9738a', collide: false, look: 'bathMat' });   // bath mat
    this.zoneDefs = [[-3, 6], [4.5, -2.5], [-7, -3.2]];
    for (const [x, z] of [[-4, 0], [4, 0]]) this.lampAt(x, z);
  }

  build2() {
    const W = 'wood', M = 'metal';
    this.box({ x: 0, z: -16, w: 34, d: 3, h: 1.6, tex: W, color: '#8a5a34', look: 'counter' });                          // counter
    this.box({ x: 0, z: -16, w: 34, d: 3.2, h: 0.15, y: 1.6, tex: 'concrete', color: '#dcdcdc', look: 'counterTop' });
    this.box({ x: -9, z: -16.4, w: 9, d: 1.6, h: 2, y: 3.6, tex: W, color: '#7a4a28', look: 'upperCab' });                 // upper cabinets
    this.box({ x: 9, z: -16.4, w: 9, d: 1.6, h: 2, y: 3.6, tex: W, color: '#7a4a28', look: 'upperCab' });
    this.box({ x: -11, z: -11.8, w: 4, d: 5, h: 1.75, tex: W, color: '#c9a273', ramp: { axis: 'z', dir: -1 }, look: 'woodRamp' }); // cutting-board ramp
    this.box({ x: -15, z: 11, w: 4, d: 4, h: 5, tex: M, color: '#d4dade', look: 'fridge' });                             // fridge
    this.box({ x: 13, z: -9, w: 4.5, d: 4.5, h: 2.4, tex: M, color: '#8b9299', look: 'stove' });                        // stove
    // table
    this.box({ x: 0, z: 2, w: 10, d: 6, h: 0.35, y: 2.4, tex: W, color: '#b98a5a', look: 'tableTop' });
    for (const [lx, lz] of [[-4.6, -2.6], [4.6, -2.6], [-4.6, 2.6], [4.6, 2.6]]) this.box({ x: lx, z: 2 + lz, w: 0.6, d: 0.6, h: 2.4, tex: W, color: '#8a5a34', look: 'leg' });
    // chairs
    for (const [cx, cz] of [[-7.5, 2], [7.5, 2], [-2.5, 6.8], [3.5, 7]]) { this.box({ x: cx, z: cz, w: 2, d: 2, h: 1.3, tex: W, color: '#9a6a3a', look: 'chair' }); }
    this.box({ x: -8.4, z: 2, w: 0.4, d: 2, h: 1.6, y: 1.3, tex: W, color: '#9a6a3a', look: 'chairBack' });
    this.box({ x: 8.4, z: 2, w: 0.4, d: 2, h: 1.6, y: 1.3, tex: W, color: '#9a6a3a', look: 'chairBack' });
    this.cyl(11, 12, 0.9, 5, 0, 'wood', '#d8b98a', true, 'pilier', 'rollingPin');                                                     // rolling pin
    this.cyl(12, -1.5, 1.6, 2.2, 0, M, '#777c82', true, 'pilier', 'pot');                                                      // pot
    this.cyl(-3, -8, 1.2, 0.5, 2.3, M, '#40454a', false, 'pilier', 'skip');
    this.box({ x: -3, z: -9, w: 2.4, d: 2.4, h: 0.5, y: 2.3, tex: M, color: '#40454a', look: 'pan' });               // floating pan platform
    this.box({ x: 4, z: -7, w: 2.4, d: 2.4, h: 0.4, y: 3.4, tex: W, color: '#c9a273', look: 'board' });
    this.box({ x: -13, z: 0, w: 3, d: 3, h: 0.4, y: 2.8, tex: 'plaster', color: '#f5f5f5', look: 'board' });
    this.box({ x: 15.5, z: 6, w: 3, d: 10, h: 0.3, y: 3.2, tex: W, color: '#a67b4b', look: 'board' });                 // wall shelf
    this.zoneDefs = [[-8, -6], [9, 7], [-10, 12]];
    for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) this.lampAt(x, z);
  }

  scatter() {
    const r = this.rnd, th = this.theme, { w, d, h } = this;
    const n = this.props ?? 7 + Math.floor(this.index * 0.6);
    const free = (x, z, s) => Math.hypot(x, z) > 5 + s && Math.abs(x) < w / 2 - s && Math.abs(z) < d / 2 - s;
    for (let i = 0; i < n; i++) {
      let x, z, tries = 0;
      const kind = ['crate', 'pillar', 'float', 'ramp', 'crate', 'wall'][Math.floor(r() * 6)];
      const s = kind === 'pillar' ? 1 : 2 + r() * 2.5;
      do { x = (r() - 0.5) * (w - 6); z = (r() - 0.5) * (d - 6); } while (!free(x, z, s + 1) && ++tries < 30);
      if (tries >= 30) continue;
      const [tex, col] = this.propPal(Math.floor(r() * 3));
      const hh = 1 + r() * 1.5, pr = 0.6 + r() * 0.5, fy = 1.8 + r() * Math.min(3, h - 4), rh = 1.5 + r() * 1.2;
      const mk = (mx, mz, flip) => {
        if (kind === 'crate') this.box({ x: mx, z: mz, w: s, d: s, h: hh, tex, color: col, role: 'bas' });
        else if (kind === 'pillar') this.cyl(mx, mz, pr, h - 0.02, 0, tex, col, true, 'pilier');
        else if (kind === 'float') this.box({ x: mx, z: mz, w: s, d: s, h: 0.4, y: fy, tex, color: col, role: 'plateforme' });
        else if (kind === 'ramp') this.box({ x: mx, z: mz, w: s + 1, d: s + 3, h: rh, tex, color: col, ramp: { axis: 'z', dir: flip ? -1 : 1 }, role: 'rampe' });
        else this.box({ x: mx, z: mz, w: 0.6, d: s + 4, h: Math.min(h * 0.6, 4.5), tex, color: col, role: 'haut' });
      };
      mk(x, z, false);
      mk(-x, -z, true); // 180-degree rotational symmetry
    }
    // corner pillars for framing
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) if (th.indoor) this.box({ x: sx * (w / 2 - 1), z: sz * (d / 2 - 1), w: 1.6, d: 1.6, h, tex: this.propPal(0)[0], color: this.propPal(0)[1], role: 'coin' });
    this.zoneDefs = [[-w / 4, -d / 4], [w / 4, d / 4], [w / 4, -d / 3]];
    if (th.indoor) for (const [x, z] of [[-w / 4, -d / 4], [w / 4, -d / 4], [-w / 4, d / 4], [w / 4, d / 4]]) this.lampAt(x, z);
  }

  // free space for a parkour platform (a moving one needs its whole run, a lift its whole column)
  platFree(x, y, z, type) {
    const ex = 1.7 + (type === 'x' ? 4.6 : 0), ez = 1.7 + (type === 'z' ? 4.6 : 0);
    for (const o of this.colliders) {
      const c = sweptBox(o);
      if (c.min.x > x + ex || c.max.x < x - ex || c.min.z > z + ez || c.max.z < z - ez) continue;
      if (type === 'lift') return false; // whole column must be clear
      if (c.max.y > y - 1.3 && c.min.y < y + 2.6) return false;
    }
    return true;
  }
  // ---- parkour (spec §5): boxes carrying pickups. Each one must be reachable from the floor inside the design envelope
  // (Reach.js); a high one gets its own route (bounce pad or wall-kick panel), else it moves. Rim colour = function.
  buildParkour(n, ult) {
    const r = this.rnd, { h } = this, maxY = h - 2.9, th = this.theme;
    const kinds = ['heal', 'heal', 'rage', 'haste', 'shield', 'jump', ult ? 'ult' : 'heal'], tiers = [3.3, 5.4, 7.2];
    const special = !th.size && this.index >= 3, slick = th.id === 'ice' || th.id === 'pool'; // the first two biomes keep fixed / moving
    this.movers = []; this.pickups = []; this.crumbles = []; this.pads = [];
    for (let i = 0; i < n; i++) {
      const tier = i === 0 ? 0 : Math.floor(r() * 3), moving = r() < 0.55, type = moving ? (r() < 0.4 ? 'lift' : r() < 0.5 ? 'x' : 'z') : null;
      const v = r(), kind = moving ? 'moving' : !special ? 'fixed' : v < 0.22 ? 'crumble' : v < (slick ? 0.7 : 0.42) ? 'ice' : 'fixed';
      const c = this.placeParkour(Math.min(tiers[tier], maxY), type, kind, special);
      if (!c) continue;
      this.parkourMesh(c);
      if (c.mover) this.movers.push(c);
      if (c.crumble) this.crumbles.push(c);
      const pick = kinds[Math.floor(r() * kinds.length)];
      this.pickups.push({ kind: pick, plat: c, taken: false, group: this.makePickup(pick) });
    }
    if (this.index >= 1) this.addTrampolines();
    if (special) this.addSpeedPads();
  }
  placeParkour(y, type, kind, special) {
    const r = this.rnd, { w, d } = this;
    for (let tries = 0; tries < 40; tries++) {
      const x = (r() - 0.5) * (w - 12), z = (r() - 0.5) * (d - 12);
      if (Math.hypot(x, z) < 5 || !this.platFree(x, y, z, type)) continue;
      const c = this.parkourCollider(x, y, z, type, kind);
      if ((special && y > MAX_RISE.single + 1 && this.addHelper(c)) || this.reaches(c)) return c; // high boxes get their own route
      this.colliders.pop();
    }
    return null;
  }
  // surface traits live on the collider: the player reads grip / launch / crumble, Reach reads the jump profile
  parkourCollider(x, y, z, type, kind) {
    const r = this.rnd, { w, d } = this;
    let base = new V3(x, y - 0.225, z), amp = 4.5;
    if (type === 'lift') { const lo = Math.max(2.4, y - 3.4); base = new V3(x, (lo + y) / 2 - 0.225, z); amp = (y - lo) / 2; }
    if (type === 'x') amp = Math.min(4.5, w / 2 - 2.2 - Math.abs(x)); if (type === 'z') amp = Math.min(4.5, d / 2 - 2.2 - Math.abs(z));
    const c = { min: new V3(), max: new V3(), ramp: null, role: 'parkour', pk: true, kind, d: new V3(), center: base.clone(), mesh: null, mover: type ? { type, base, amp: Math.max(1, amp), speed: 0.5 + r() * 0.4, phase: r() * 6.28 } : null };
    if (kind === 'ice') c.grip = SURF.iceGrip;
    if (kind === 'crumble') c.crumble = { phase: 'idle', t: 0 };
    c.dynamic = !!(c.mover || c.crumble); // does not stay put: coins, splats and the chest never rest on it
    this.setPlat(c, base);
    this.colliders.push(c);
    return c;
  }
  /** Is collider c reachable from the floor with what is built so far? sup: levelSupports(this) when already computed. */
  reaches(c, sup = levelSupports(this)) {
    const seen = reachable(sup.nodes, { h: this.h, floorNear: sup.floorNear });
    return sup.nodes.some((n, j) => n.col === c && !n.kick && seen.has(j));
  }
  /** A movement plate (bounce or propulseur) or a wall-kick panel beside platform c, kept only if a jump from it lands on c. */
  addHelper(c, force) {
    const r = this.rnd, { w, d, h } = this, v = r(), kind = force || (v < 0.55 ? 'bounce' : v < 0.78 ? 'launch' : 'wall'), ctr = c.mover ? c.mover.base : c.center, half = SURF.pad.size / 2;
    const P = { bounce: { gap: 1.4, far: 1.4, half, along: half, role: 'rebond' }, launch: { gap: 4, far: 3, half, along: half, role: 'propulseur' }, wall: { gap: 3, far: 1.4, half: 0.25, along: 1.6, role: 'mur' } }[kind];
    for (let k = 0; k < 8; k++) {
      const side = Math.floor(r() * 4), ax = side < 2, sg = side % 2 ? 1 : -1, off = 1.6 + P.gap + r() * P.far + P.half, lat = (r() - 0.5) * 1.6;
      const x = ctr.x + (ax ? sg * off : lat), z = ctr.z + (ax ? lat : sg * off), hx = ax ? P.half : P.along, hz = ax ? P.along : P.half;
      if (Math.abs(x) + hx > w / 2 - 1.2 || Math.abs(z) + hz > d / 2 - 1.2 || Math.hypot(x, z) < 4 || !this.areaFree(x, z, hx, hz, 0.8)) continue;
      const H = kind === 'wall' ? Math.max(4.5, Math.min(h - 2.5, c.max.y - 1.2)) : SURF.pad.h;
      const o = { min: new V3(x - hx, 0, z - hz), max: new V3(x + hx, H, z + hz), ramp: null, role: P.role, kind };
      if (kind !== 'wall') this.padTraits(o, { x: ax ? -sg : 0, z: ax ? 0 : -sg }); // a propulseur faces the platform
      this.colliders.push(o);
      const sup = levelSupports(this), to = sup.nodes.find((n) => n.col === c);
      if (sup.nodes.some((n) => n.col === o && linked(n, to, h)) && this.reaches(c, sup)) { if (kind === 'wall') this.makeKickWall(o, ax); else this.makePad(o); return true; }
      this.colliders.pop();
    }
    return false;
  }
  /** Trampolines: up to two bounce plates on the floor beside raised boxes that have no plate yet (straight up, then onto the box). */
  addTrampolines() {
    const has = (c) => this.colliders.some((o) => o.kind === 'bounce' && Math.hypot((o.min.x + o.max.x) / 2 - c.center.x, (o.min.z + o.max.z) / 2 - c.center.z) < 7);
    let n = 0;
    for (const p of this.pickups) if (n < 2 && p.plat.center.y > 2.5 && !has(p.plat) && this.addHelper(p.plat, 'bounce')) n++;
  }
  /** Nothing (movers over their whole run) within m of the footprint centred on x, z (half sizes hx, hz). */
  areaFree(x, z, hx, hz, m, skip = null) {
    return !this.colliders.some((o) => { if (o === skip) return false; const b = sweptBox(o); return b.min.x < x + hx + m && b.max.x > x - hx - m && b.min.z < z + hz + m && b.max.z > z - hz - m; });
  }
  /** What a movement plate does to whoever steps on it (read by Player): vertical launch speed, forward push, and the reach profile. */
  padTraits(o, dir) {
    const S = SURF, H = o.max.y; o.dir = dir;
    if (o.kind === 'bounce') { o.bounceH = bounceHeight(H, this.h); o.launch = launchV(o.bounceH); }
    else if (o.kind === 'launch') { o.bounceH = Math.min(S.launch.h, bounceHeight(H, this.h)); o.launch = launchV(o.bounceH); o.push = { x: dir.x * S.launch.push, z: dir.z * S.launch.push }; }
    else { o.launch = launchV(S.speed.hop); o.push = { x: dir.x * S.speed.push, z: dir.z * S.speed.push }; }
  }
  /** Accélérateurs: a gold plate at the foot of some ramps, aimed up the slope (run in, dash, fly off the top). */
  addSpeedPads() {
    const r = this.rnd, { w, d } = this, half = SURF.pad.size / 2;
    for (const c of this.colliders.filter((o) => o.ramp && o.min.y < 0.1)) {
      if (r() > 0.35) continue;
      const ax = c.ramp.axis === 'x', s = c.ramp.dir, lo = ax ? (s > 0 ? c.min.x : c.max.x) : (s > 0 ? c.min.z : c.max.z), p = lo - s * (half + 0.3);
      const x = ax ? p : (c.min.x + c.max.x) / 2, z = ax ? (c.min.z + c.max.z) / 2 : p;
      if (Math.abs(x) + half > w / 2 - 1 || Math.abs(z) + half > d / 2 - 1 || !this.areaFree(x, z, half, half, 0.25, c)) continue;
      const o = { min: new V3(x - half, 0, z - half), max: new V3(x + half, SURF.pad.h, z + half), ramp: null, role: 'accélérateur', kind: 'speed' };
      this.padTraits(o, { x: ax ? s : 0, z: ax ? 0 : s }); this.colliders.push(o); this.makePad(o);
    }
  }
  parkourMesh(c) {
    const moving = !!c.mover, kind = c.kind, rec = this.kit && this.kit.pick('parkour', { w: 3.2, h: 0.45, d: 3.2 });
    const g = new THREE.Group(); g.position.copy(c.center); this.group.add(g);
    if (rec) { // the biome object; boxes that stay put join the room's static batch, the others merge on their own
      const b = { w: 3.2, h: 0.45, d: 3.2, moving, kind };
      if (c.dynamic) { const vis = this.kit.buildDyn(rec.make, b); vis.position.y = -0.225; g.add(vis); } else { const s = new THREE.Group(); s.position.y = -0.225; g.add(s); g.updateMatrixWorld(true); rec.make(this.kit, s, b); }
    } else {
      const geo = this.cached('pkGeo', () => roundedBox(3.2, 0.45, 3.2, 0.12)), lipGeo = this.cached('pkLip', () => new THREE.BoxGeometry(2.6, 0.02, 2.6));
      const m = new THREE.Mesh(geo, this.cached('pk' + kind, () => gomme(KIND_COLOR[kind], { rim: 0.18, ao: 1 }))); m.castShadow = m.receiveShadow = true; g.add(m);
      if (c.dynamic) m.add(inkHull(geo, this.pal.ink, 2.4)); else this.addOutline(geo, m);
      const stripe = new THREE.Mesh(lipGeo, this.flatMat(mixHex(KIND_COLOR[kind], '#FFFFFF', 0.6))); stripe.position.y = 0.23; g.add(stripe);
    }
    this.badge(g, c);
    if (c.dynamic) g.userData.dyn = true;
    c.mesh = g;
  }
  /** Function marks on top of a parkour box: slide arrows (moving), gloss streaks (ice), cracks (crumble). */
  badge(mesh, c) {
    const kind = c.kind, mark = (geo, mat, x, z, ry, s = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, 0.235, z); m.rotation.y = ry; m.scale.setScalar(s); m.receiveShadow = true; mesh.add(m); return m; };
    if (kind === 'moving') {
      const mat = this.flatMat('#FFF6D8'), t = c.mover.type;
      if (t === 'lift') for (const [x, z] of [[-1.15, -1.15], [1.15, 1.15]]) mark(this.cached('pkDot', () => new THREE.CircleGeometry(0.16, 16).rotateX(-Math.PI / 2)), mat, x, z, 0);
      else for (const s of [-1, 1]) mark(this.cached('pkChev', () => chevronGeo(0.5, 0.14)), mat, t === 'x' ? s * 1.05 : 0, t === 'z' ? s * 1.05 : 0, t === 'x' ? (s > 0 ? -Math.PI / 2 : Math.PI / 2) : s > 0 ? Math.PI : 0);
    } else if (kind === 'ice') {
      const geo = this.cached('pkGloss', () => new THREE.PlaneGeometry(0.16, 1.5).rotateX(-Math.PI / 2)), mat = this.cached('pkGlossM', () => flat('#FFFFFF', { transparent: true, opacity: 0.75 }));
      for (const [x, z, s] of [[-0.6, -0.25, 1], [-0.25, -0.05, 0.6], [0.55, 0.45, 0.8]]) mark(geo, mat, x, z, Math.PI / 4).scale.set(1, 1, s);
    } else if (kind === 'crumble') {
      const geo = this.cached('pkCrack', () => crackGeo()), mat = this.flatMat(this.pal.ink);
      mark(geo, mat, 0, 0, 0); mark(geo, mat, 0.2, -0.1, 2.2, 0.7);
    }
  }
  /**
   * Movement plate (Fortnite-like, in Gomme & Encre): slate frame with a steel lip and corner bolts (static batch), a recessed panel
   * tinted with the function colour, a glowing line around it and lit marks that sweep (chevrons) or pulse; rings rise when it fires.
   */
  makePad(c) {
    const S = SURF.pad.size, H = c.max.y, kind = c.kind, col = KIND_COLOR[kind], ink = this.pal.ink, C = (k, make) => this.cached(k, make);
    const g = new THREE.Group(); g.position.set((c.min.x + c.max.x) / 2, 0, (c.min.z + c.max.z) / 2); if (c.dir) g.rotation.y = Math.atan2(c.dir.x, c.dir.z); this.group.add(g);
    const add = (geo, mat, y, inked = false) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.receiveShadow = true; m.castShadow = inked; g.add(m); if (inked) this.addOutline(geo, m); return m; };
    add.g = g;
    const steel = C('padSteel', () => gomme('#D4DCE6', { ao: 1, rim: 0.25 }));
    let mat = null;
    if (kind === 'bounce') mat = this.trampoline(add, C, col, ink, H); else {
    add(C('padBaseG', () => roundedBox(S, H, S, 0.08)), C('padSlate', () => gomme(mixHex('#4A5266', ink, 0.15), { ao: 1, rim: 0.12 })), H / 2, true);
    add(C('padLipG', () => mergeGeometries([0, 1, 2, 3].map((i) => roundedBox(S - 0.12, 0.05, 0.13, 0.025).translate(0, 0, S / 2 - 0.12).rotateY((i * Math.PI) / 2)))), steel, H + 0.01);
    add(C('padBoltG', () => mergeGeometries([[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => new THREE.CylinderGeometry(0.075, 0.08, 0.06, 12).translate(a * (S / 2 - 0.12), 0.03, b * (S / 2 - 0.12))))), steel, H);
    add(C('padCornerG', () => mergeGeometries([0, 1, 2, 3].flatMap((i) => [new THREE.BoxGeometry(0.34, 0.035, 0.07).translate(-(S - 0.62) / 2 + 0.17, 0, -(S - 0.62) / 2), new THREE.BoxGeometry(0.07, 0.035, 0.34).translate(-(S - 0.62) / 2, 0, -(S - 0.62) / 2 + 0.17)].map((q) => q.rotateY((i * Math.PI) / 2))))), steel, H + 0.025); // corner brackets on the panel
    add(C('padPanelG', () => new THREE.BoxGeometry(S - 0.5, 0.04, S - 0.5)), C('padPanel' + kind, () => gomme(mixHex(col, ink, 0.62), { ao: 1, shadow: 0.8 })), H - 0.005);
    add(C('padLineG', () => mergeGeometries([0, 1, 2, 3].map((i) => new THREE.BoxGeometry(S - 0.46, 0.02, 0.05).translate(0, 0, (S - 0.48) / 2).rotateY((i * Math.PI) / 2)))), C('padLine' + kind, () => glowMat(col, 1.5)), H + 0.02);
    // lit marks: every plate of a kind shares the same few materials, swept in update()
    const marks = padMarks(kind), mats = marks.map((_, i) => C('padMarkM' + kind + i, () => glowMat(col, 1)));
    (this.padGlow ||= new Map()).set(kind, mats);
    marks.forEach((geo, i) => add(C('padMark' + kind + i, () => geo), mats[i], H + 0.03));
    }
    let rings = null;
    if (kind !== 'speed') { // rings rising from the plate: where it sends you
      const rg = new THREE.Group(); rg.userData.dyn = true; g.add(rg);
      const ringGeo = C('padRingG', () => new THREE.RingGeometry(0.8, 1.0, 4, 1, Math.PI / 4).rotateX(-Math.PI / 2));
      rings = [0, 1].map(() => { const m = new THREE.Mesh(ringGeo, this.own(flat(col, { transparent: true, opacity: 0.6, depthWrite: false }))); rg.add(m); return m; }); // own: opacity animates per ring
    }
    c.pad = { rings, H, hitT: -9, kind, lean: kind === 'launch' ? 0.7 : 0, mat }; this.pads.push(c.pad);
  }
  /** Round trampoline on the bounce footprint: stubby legs, padded rim in the function colour, dark sprung mat with a glowing target (dips on a bounce). */
  trampoline(add, C, col, ink, H) {
    const R = SURF.pad.size / 2 - 0.08;
    add(C('trLegG', () => mergeGeometries(Array.from({ length: 6 }, (_, i) => new THREE.CylinderGeometry(0.07, 0.09, H, 8).translate(Math.cos(i * 1.047) * (R - 0.12), 0, Math.sin(i * 1.047) * (R - 0.12))))), C('trLeg', () => gomme(mixHex('#4A5266', ink, 0.2), { ao: 1 })), H / 2, true);
    add(C('trFrameG', () => new THREE.CylinderGeometry(R, R, 0.12, 32, 1, true)), C('trLeg', null), H - 0.06);
    add(C('trRimG', () => new THREE.TorusGeometry(R - 0.06, 0.13, 10, 36).rotateX(Math.PI / 2)), C('trRim', () => gomme(col, { rim: 0.4, rimColor: '#FFFFFF', ao: 1, shadow: 0.7 })), H + 0.02, true);
    add(C('trStripeG', () => mergeGeometries(Array.from({ length: 12 }, (_, i) => new THREE.BoxGeometry(0.06, 0.03, 0.27).translate(0, 0.14, R - 0.06).rotateY(i * 0.5236)))), C('trStripe', () => gomme('#FFFFFF', { ao: 1 })), H + 0.02);
    const mat = new THREE.Group(); mat.userData.dyn = true; mat.position.y = H; add.g.add(mat);
    const disc = new THREE.Mesh(C('trMatG', () => new THREE.CircleGeometry(R - 0.16, 32).rotateX(-Math.PI / 2)), C('trMat', () => gomme(mixHex('#2A2F3E', ink, 0.3), { ao: 1, pattern: 'grid', color2: '#3A4152', scale: 6 }))); disc.receiveShadow = true; mat.add(disc);
    const glow = C('trGlow', () => glowMat(col, 1.2)); (this.padGlow ||= new Map()).set('bounce', [glow]);
    for (const [r0, r1] of [[0.32, 0.4], [0.68, 0.76]]) { const m = new THREE.Mesh(C('trRing' + r0, () => new THREE.RingGeometry(r0, r1, 32).rotateX(-Math.PI / 2)), glow); m.position.y = 0.01; mat.add(m); }
    return mat;
  }
  /** Wall-kick panel: a climbing wall in the biome accent, white frame, round holds on both faces (jump at it, kick off, double jump). */
  makeKickWall(c, alongZ) {
    const W = alongZ ? c.max.z - c.min.z : c.max.x - c.min.x, T = 0.5, H = c.max.y, accent = this.pal.accent, ink = this.pal.ink;
    const g = new THREE.Group(); g.position.set((c.min.x + c.max.x) / 2, 0, (c.min.z + c.max.z) / 2); if (alongZ) g.rotation.y = Math.PI / 2; this.group.add(g);
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); this.addOutline(geo, m); };
    add(roundedBox(W, H, T, 0.12), this.cached('kwFrame', () => gomme('#FFFFFF', { ao: 0.85 })), 0, H / 2, 0);
    const face = this.cached('kwFaceG' + W + H, () => roundedBox(W - 0.36, H - 0.5, T + 0.08, 0.06)); add(face, this.cached('kwBody', () => gomme(accent, { ao: 0.8, rim: 0.12 })), 0, H / 2 - 0.05, 0);
    const hold = new THREE.SphereGeometry(0.23, 14, 10).scale(1, 0.75, 0.6), spots = [[], []]; let k = 0; // holds: one merged mesh per colour
    for (let y = 0.9; y < H - 0.6; y += 0.62) for (const s of [-1, 1]) { spots[(k + (k >> 1)) % 2].push(hold.clone().translate(((k * 0.37) % 1 - 0.5) * (W - 0.9), y, s * (T / 2 + 0.06))); k++; }
    spots.forEach((list, i) => { if (list.length) add(mergeGeometries(list), this.cached(i ? 'kwHoldB' : 'kwHoldA', () => gomme(i ? SIGNAL.gold : '#FFFFFF', { ao: 1, rim: 0.25 })), 0, 0, 0); list.forEach((q) => q.dispose()); });
    hold.dispose();
    add(this.cached('kwCapG' + W, () => roundedBox(W + 0.1, 0.2, T + 0.16, 0.06)), this.cached('kwCap', () => gomme(mixHex(accent, ink, 0.25))), 0, H - 0.1, 0);
  }
  setPlat(c, ctr) {
    c.d.subVectors(ctr, c.center); c.center.copy(ctr);
    c.min.set(ctr.x - 1.6, ctr.y - 0.225, ctr.z - 1.6); c.max.set(ctr.x + 1.6, ctr.y + 0.225, ctr.z + 1.6);
    if (c.mesh) c.mesh.position.copy(ctr);
  }
  /** Pickup: a power token (Tokens.js). */
  makePickup(kind) { const g = buildToken(this, kind); this.group.add(g); return g; }
  lampAt(x, z) {
    this.box({ x, z, w: 2.4, d: 1.2, h: 0.12, y: this.h - 0.12, emissive: this.theme.lamp, emi: 3, color: '#ffffff', collide: false });
    (this.lampPos ||= []).push([x, z]);
  }

  buildRoof() {
    const { w, d } = this, col = '#ece6d6', t = 0.5, hh = 1.3;
    const par = (x, z, pw, pd) => this.box({ x, z, w: pw, d: pd, h: hh, tex: 'concrete', color: col, collide: false, outline: true });
    par(0, -d / 2 + t / 2, w, t); par(0, d / 2 - t / 2, w, t); par(-w / 2 + t / 2, 0, t, d - 2 * t); par(w / 2 - t / 2, 0, t, d - 2 * t);
    this.box({ x: -12, z: -9, w: 4.5, d: 3, h: 2.3, tex: 'metal', color: '#d8e2ea', look: 'ac' });
    this.box({ x: 12, z: -14, w: 4, d: 3, h: 2, tex: 'metal', color: '#c8d6e2', look: 'ac' });
    this.box({ x: 15, z: 11, w: 3, d: 3, h: 1.6, tex: 'metal', color: '#d8e2ea', look: 'ac' });
    this.box({ x: -13, z: 13, w: 6, d: 5, h: 4.6, tex: 'plaster', color: '#f2e2c8', look: 'hut' });
    this.box({ x: -13, z: 10.44, w: 1.7, d: 0.12, h: 2.7, tex: 'wood', color: '#b8763c', collide: false, look: 'door' });
    for (const [lx, lz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) this.box({ x: 12 + lx, z: 3 + lz, w: 0.4, d: 0.4, h: 2.4, tex: 'metal', color: '#9aa8b4', look: 'leg' });
    this.cyl(12, 3, 2, 3, 2.4, 'metal', '#c8d8e4', true, 'pilier', 'tank');
    const mast = new THREE.Mesh(roundedCyl(0.12, 0.18, 18, 0.05, 12), this.own(gomme('#E03A3A'))); mast.position.set(-15, 9, -15); this.group.add(mast); this.addOutline(mast.geometry, mast);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), this.own(flat(SIGNAL.coral))); tip.position.set(-15, 18.2, -15); this.group.add(tip);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40), this.own(gomme('#8FA4BC', { ao: 1, hole: this.hole })));
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.03; pad.receiveShadow = true; this.group.add(pad);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.9, 40), this.own(flat(SIGNAL.gold, { hole: this.hole })));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.035; this.group.add(ring);
  }

  buildZones() {
    const defs = (this.zoneDefs || []).slice(0, this.zoneCount + 1);
    const ringGeo = new THREE.RingGeometry(1.85, 2.1, 48), discGeo = new THREE.CircleGeometry(1.85, 48);
    for (let [x, z] of defs.slice(0, this.zoneCount === 3 ? 3 : 2)) {
      for (let k = 0; k < 12 && !this.zoneFree(x, z); k++) { x += (k % 2 ? 1 : -1) * 1.5; z += 1.1; }
      this.safeZones.push({ x, z, r: 2.1 });
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x66ffaa, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: 0x44ff99, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
      for (const m of [ring, disc]) { m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, z); this.group.add(m); }
      this.zoneMeshes.push({ ring, disc });
    }
  }
  zoneFree(x, z) {
    for (const c of this.colliders) if (!c.ramp && c.min.y < 0.5 && x > c.min.x - 2.2 && x < c.max.x + 2.2 && z > c.min.z - 2.2 && z < c.max.z + 2.2) return false;
    return true;
  }
  inZone(p) { for (const z of this.safeZones) if (Math.hypot(p.x - z.x, p.z - z.z) < z.r) return true; return false; }
  update(t) {
    const dt = Math.min(0.1, Math.max(0, t - (this.lastT ?? t))); this.lastT = t;
    for (const c of this.crumbles || []) this.crumbleUpdate(c, dt);
    if (this.hall) this.hall.update(t);
    for (const p of this.pads || []) { // rings rise from bounce / launch plates (leaning forward on a launch), faster right after a use
      if (!p.rings) continue;
      const fire = Math.max(0, 1 - (t - p.hitT) * 2);
      if (p.mat) { const k = t - p.hitT; p.mat.position.y = p.H - (k < 0.6 ? Math.sin(k * 21) * Math.exp(-k * 7) * 0.12 : 0); } // the mat dips and wobbles after a bounce
      for (let i = 0; i < 2; i++) { const m = p.rings[i], u = (t * (0.7 + fire) + i * 0.5) % 1; m.position.set(0, p.H + u * 1.8, u * 1.8 * p.lean); m.scale.setScalar(1 - 0.3 * u + 0.4 * fire); m.material.opacity = (0.65 + 0.35 * fire) * (1 - u); }
    }
    if (this.padGlow) for (const [kind, mats] of this.padGlow) { // chevrons sweep toward where the plate sends you; other marks pulse
      const base = KIND_COLOR[kind];
      for (let i = 0; i < mats.length; i++) { const k = kind === 'speed' || kind === 'launch' ? Math.max(0, Math.sin(t * 7 - i * 1.3)) : 0.5 + 0.5 * Math.sin(t * 4); mats[i].color.set(base).multiplyScalar(0.75 + 0.9 * k); }
    }
    for (const c of this.movers || []) {
      const m = c.mover, off = moverOffset(m, t), p = (m.tmp ||= new V3()).copy(m.base);
      if (m.type === 'x') p.x += off; else if (m.type === 'z') p.z += off; else p.y += off;
      this.setPlat(c, p);
    }
    for (const k of this.pickups || []) {
      if (k.taken) continue;
      const c = k.plat.center; animateToken(k.group, t, c.x, c.y + 0.225, c.z, c.x + c.z, this.viewPos);
    }
    if (this.updateDust) this.updateDust(t); this.zoneMeshes.forEach((z, i) => { z.ring.material.opacity = 0.55 + Math.sin(t * 3 + i) * 0.25; z.disc.material.opacity = 0.12 + Math.sin(t * 3 + i) * 0.05; }); }
  bounced(c) { if (c.pad) c.pad.hitT = this.lastT ?? 0; }
  /** Crumbling platform: shakes while loaded (c.load, set by the player standing on it), drops out (collider off), pops back. */
  crumbleUpdate(c, dt) {
    const s = c.crumble, was = s.phase; crumbleStep(s, dt, c.load); c.load = false;
    if (s.phase === 'idle' && was === 'idle') return;
    if (s.phase !== was) {
      if (s.phase === 'shake') bus.emit('level:cue', { level: this, sound: 'crack', at: c.center });
      else if (s.phase === 'gone') bus.emit('level:cue', { level: this, sound: 'crumble', at: c.center, burst: { count: 16, speed: 3, color: 0xff8a7a, size: 0.3, life: 0.6 } });
      if (solid(s)) this.setPlat(c, c.center); else c.min.y = c.max.y = -100; // gone: the box sinks out of every collision test
    }
    const m = c.mesh, sh = s.phase === 'shake' ? 0.05 + 0.1 * s.t : 0;
    m.visible = s.phase !== 'gone';
    m.position.set(c.center.x + rand(-sh, sh) / 2, c.center.y - (s.phase === 'shake' ? s.t * 0.12 : 0), c.center.z + rand(-sh, sh) / 2);
    m.scale.setScalar(s.phase === 'back' ? 0.5 + 0.5 * Math.min(1, s.t / SURF.crumble.back) : 1);
  }
  isFree(x, y, z, r) { return sphereFree(this, x, y, z, r); }
  dispose() {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.matCache.forEach((m) => m.dispose()); this.mats.forEach((m) => m.dispose());
  }
}
