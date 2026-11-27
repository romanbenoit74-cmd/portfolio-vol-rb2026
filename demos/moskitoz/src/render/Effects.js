// "Gomme & Encre" VFX (spec §6): solid inked droplets and round puffs, 4-point impact stars, floor splats, flat shockwaves.
// No additive point clouds any more. Everything is pooled and instanced: a whole burst costs the same draw calls as one drop.
import * as THREE from 'three';
import { rand } from '../core/core.js';
import { inkMat, smoothed } from './Style.js';
import { SIGNAL } from '../level/Biomes.js';

const V3 = THREE.Vector3, _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new V3(), _p = new V3(), _c = new THREE.Color(), _z = new V3(0, 0, 1);
const INK = SIGNAL.ink;

function instanced(geo, mat, max) {
  const m = new THREE.InstancedMesh(geo, mat, max);
  m.count = 0; m.frustumCulled = false; m.castShadow = m.receiveShadow = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return m;
}

// ---------------------------------------------------------------- droplets + puffs (emit() keeps the old point-cloud API)
export class Particles {
  constructor(scene, max = 900) {
    this.max = max; this.n = 0;
    const geo = new THREE.IcosahedronGeometry(1, 1);
    this.fill = instanced(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), max);
    this.fill.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.ink = instanced(smoothed(geo), inkMat(INK, 1.6), max);
    scene.add(this.ink, this.fill);
    this.p = Array.from({ length: max }, () => ({ pos: new V3(), vel: new V3(), col: new THREE.Color(), life: 0, max: 1, r: 0.1, grav: 0, puff: false }));
  }
  setScale() { /* kept for Game.resize: droplets are real geometry now */ }
  spawn(pos, vel, col, r, life, grav, puff) {
    if (this.n >= this.max) return;
    const q = this.p[this.n++];
    q.pos.copy(pos); q.vel.copy(vel); q.col.copy(col); q.r = r; q.life = q.max = life; q.grav = grav; q.puff = puff;
  }
  // opts: count, speed, spread (0..1 cone around dir), dir, color, size, life, gravity, up — solid drops, half as many as the old sparks
  emit(p, o = {}) {
    const n = Math.max(1, Math.round((o.count ?? 10) * 0.5)), c = _c.set(o.color ?? 0xffffff);
    const speed = o.speed ?? 4, life = o.life ?? 0.6, size = o.size ?? 0.2;
    for (let k = 0; k < n; k++) {
      let dx = rand(-1, 1), dy = rand(-1, 1), dz = rand(-1, 1);
      const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      if (o.dir) { const s = o.spread ?? 0.4; dx = o.dir.x + dx * s; dy = o.dir.y + dy * s; dz = o.dir.z + dz * s; const m = Math.hypot(dx, dy, dz) || 1; dx /= m; dy /= m; dz /= m; }
      const sp = speed * rand(0.4, 1);
      this.spawn(p, _p.set(dx * sp, dy * sp + (o.up ?? 0), dz * sp), c, size * rand(0.22, 0.4), life * rand(0.6, 1.2), (o.gravity ?? 0) + 6, false);
    }
  }
  // round dust puffs: slow, grow then shrink (landing, jumps, dashes)
  puff(p, count = 6, color = 0xffffff, r = 0.16) {
    const c = _c.set(color);
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + rand(-0.3, 0.3);
      this.spawn(_s.set(p.x + Math.cos(a) * 0.25, p.y + 0.08, p.z + Math.sin(a) * 0.25), _p.set(Math.cos(a) * rand(0.8, 1.8), rand(0.3, 0.9), Math.sin(a) * rand(0.8, 1.8)), c, r * rand(0.8, 1.3), rand(0.35, 0.55), 0, true);
    }
  }
  update(dt) {
    const d = Math.exp(-2.2 * dt), dp = Math.exp(-4 * dt);
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      const q = this.p[i];
      q.life -= dt; if (q.life <= 0) continue;
      const k = q.life / q.max;
      if (q.puff) q.vel.multiplyScalar(dp); else { q.vel.multiplyScalar(d); q.vel.y -= q.grav * dt; }
      q.pos.addScaledVector(q.vel, dt);
      const r = q.puff ? q.r * Math.pow(Math.sin(Math.PI * Math.min(1, (1 - k) * 1.3 + 0.12)), 0.7) * 1.3 : q.r * (0.35 + 0.65 * k);
      _m.compose(q.pos, _q.identity(), _s.setScalar(Math.max(r, 1e-4)));
      this.fill.setMatrixAt(w, _m); this.ink.setMatrixAt(w, _m); this.fill.setColorAt(w, q.col);
      if (w !== i) { const t = this.p[w]; this.p[w] = q; this.p[i] = t; }
      w++;
    }
    this.n = w; this.fill.count = this.ink.count = w;
    if (w) { this.fill.instanceMatrix.needsUpdate = this.ink.instanceMatrix.needsUpdate = true; this.fill.instanceColor.needsUpdate = true; }
  }
  clear() { this.n = 0; this.fill.count = this.ink.count = 0; }
}

// ---------------------------------------------------------------- 4-point impact stars (face the camera, pop, gone in 0.22 s)
function starGeo(inner = 0.3) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? inner : 1; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  return new THREE.ShapeGeometry(s);
}
export class Stars {
  constructor(scene, max = 48) {
    this.max = max; this.list = [];
    this.fill = instanced(starGeo(), new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false, transparent: true }), max);
    this.fill.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.ink = instanced(starGeo(0.36).scale(1.28, 1.28, 1), new THREE.MeshBasicMaterial({ color: INK, depthWrite: false, transparent: true }), max);
    this.ink.renderOrder = 3; this.fill.renderOrder = 4;
    scene.add(this.ink, this.fill);
  }
  spawn(pos, crit = false) {
    if (this.list.length >= this.max) this.list.shift();
    this.list.push({ pos: pos.clone(), t: 0, life: crit ? 0.3 : 0.22, r: crit ? 0.42 : 0.3, rot: rand(-0.5, 0.5), col: new THREE.Color(crit ? SIGNAL.gold : 0xffffff) });
  }
  update(dt, cam) {
    let w = 0;
    for (let i = 0; i < this.list.length; i++) {
      const s = this.list[i]; s.t += dt; const k = s.t / s.life; if (k >= 1) continue;
      const sc = s.r * (k < 0.3 ? 0.4 + 2.3 * k : 1.09 * (1 - (k - 0.3) / 0.7));
      _q.copy(cam.quaternion).multiply(_q2.setFromAxisAngle(_z, s.rot + k * 0.6));
      _m.compose(s.pos, _q, _s.setScalar(Math.max(sc, 1e-4)));
      this.fill.setMatrixAt(w, _m); this.ink.setMatrixAt(w, _m); this.fill.setColorAt(w, s.col);
      this.list[w++] = s;
    }
    this.list.length = w; this.fill.count = this.ink.count = w;
    if (w) { this.fill.instanceMatrix.needsUpdate = this.ink.instanceMatrix.needsUpdate = true; this.fill.instanceColor.needsUpdate = true; }
  }
  clear() { this.list.length = 0; this.fill.count = this.ink.count = 0; }
}

// ---------------------------------------------------------------- floor splats (lobed flat blob + ink edge, shrink away in 3 s)
function splatGeo(seed = 3) {
  const s = new THREE.Shape(), n = 26;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, lobe = 0.72 + 0.28 * Math.pow(Math.abs(Math.sin(a * 3.5 + seed)), 0.6) + (i % 5 === 0 ? 0.22 : 0);
    s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * lobe, Math.sin(a) * lobe);
  }
  return new THREE.ShapeGeometry(s, 2).rotateX(-Math.PI / 2);
}
export class Splats {
  constructor(scene, max = 40) {
    this.max = max; this.list = [];
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const im = new THREE.MeshBasicMaterial({ color: INK, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.fill = instanced(splatGeo(), fm, max); this.ink = instanced(splatGeo().scale(1.1, 1, 1.1), im, max);
    this.fill.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.fill.receiveShadow = false; scene.add(this.ink, this.fill);
  }
  spawn(pos, color, r = 0.6) {
    if (this.list.length >= this.max) this.list.shift();
    this.list.push({ pos: pos.clone(), col: new THREE.Color(color), r: r * rand(0.85, 1.15), rot: rand(0, 6.28), t: 0, life: 3 });
  }
  update(dt) {
    let w = 0;
    for (let i = 0; i < this.list.length; i++) {
      const s = this.list[i]; s.t += dt; if (s.t >= s.life) continue;
      const k = s.t / s.life, sc = s.r * Math.min(1, s.t / 0.08) * (k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1);
      _m.compose(s.pos, _q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, s.rot), _s.setScalar(Math.max(sc, 1e-4)));
      this.fill.setMatrixAt(w, _m); this.ink.setMatrixAt(w, _m); this.fill.setColorAt(w, s.col);
      this.list[w++] = s;
    }
    this.list.length = w; this.fill.count = this.ink.count = w;
    if (w) { this.fill.instanceMatrix.needsUpdate = this.ink.instanceMatrix.needsUpdate = true; this.fill.instanceColor.needsUpdate = true; }
  }
  clear() { this.list.length = 0; this.fill.count = this.ink.count = 0; }
}

// ---------------------------------------------------------------- flat shockwaves with an ink edge ('ring' on the ground, 'sphere' faces the camera)
export class Rings {
  constructor(scene) {
    this.scene = scene; this.list = [];
    this.fillGeo = new THREE.RingGeometry(0.86, 1, 48); this.inkGeo = new THREE.RingGeometry(1, 1.045, 48);
  }
  spawn(p, color, radius = 3, life = 0.35, kind = 'sphere') {
    const fm = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
    const im = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
    const g = new THREE.Group(), f = new THREE.Mesh(this.fillGeo, fm), e = new THREE.Mesh(this.inkGeo, im);
    g.add(f, e); g.position.copy(p); g.scale.setScalar(0.1); if (kind === 'ring') { g.rotation.x = -Math.PI / 2; g.position.y += 0.03; }
    this.scene.add(g);
    this.list.push({ g, fm, im, t: 0, life, radius, face: kind !== 'ring' });
  }
  update(dt, cam) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const r = this.list[i]; r.t += dt;
      const k = r.t / r.life;
      if (k >= 1) { this.scene.remove(r.g); r.fm.dispose(); r.im.dispose(); this.list.splice(i, 1); continue; }
      r.g.scale.setScalar(0.1 + (r.radius - 0.1) * (1 - Math.pow(1 - k, 3)));
      if (r.face && cam) r.g.quaternion.copy(cam.quaternion);
      r.fm.opacity = r.im.opacity = 0.85 * (1 - k * k);
    }
  }
  clear() { for (const r of this.list) { this.scene.remove(r.g); r.fm.dispose(); r.im.dispose(); } this.list.length = 0; }
}
