// Coins in the world (spec §8), after concept/js/pickups.js: instanced coins (3 kinds × disc / deco / ink = ≤ 9 draw calls)
// that burst, bounce with a squash, spin, get pulled in at 3 m, get sucked into the hatch, then rain in the fall where the
// magnet only reaches 0.9 m. Plus the toy chest and the Plan card. Rules and values live in Drops.js / Profile.js.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { contactShadow, flat, gomme, inkMat, part, put, rbox, rcyl, smoothed, torus } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';
import { surfaceBelow } from '../render/Surface.js';
import { COIN_VALUES, coinsFor } from './Drops.js';
import { item } from './Items.js';

const V3 = THREE.Vector3, INK = SIGNAL.ink;
const KINDS = ['bronze', 'silver', 'gold'];
const SPEC = { bronze: { r: 0.21, th: 0.075, color: SIGNAL.bronze, deep: '#B8622A' }, silver: { r: 0.24, th: 0.08, color: SIGNAL.silver, deep: '#9AAAC2' }, gold: { r: 0.29, th: 0.09, color: SIGNAL.gold, deep: '#E08A00' } };
const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);
const _m = new THREE.Matrix4(), _s = new THREE.Matrix4(), _d = new V3(), _t = new V3();

function coinGeos(kind) {
  const { r, th } = SPEC[kind];
  const disc = rcyl(r, r, th, th * 0.45, 32).clone().rotateX(Math.PI / 2);
  const band = [th / 2 - 0.004, -th / 2 + 0.004].map((z) => torus(r * 0.76, th * 0.13, 6, 32).clone().translate(0, 0, z));
  const M = new THREE.Shape(), s = r * 1.05;
  [[-0.25, -0.21], [-0.25, 0.21], [-0.12, 0.21], [0, 0.06], [0.12, 0.21], [0.25, 0.21], [0.25, -0.21], [0.14, -0.21], [0.14, 0.04], [0, -0.11], [-0.14, 0.04], [-0.14, -0.21]]
    .forEach(([x, y], i) => (i ? M.lineTo(x * s, y * s) : M.moveTo(x * s, y * s)));
  const e = new THREE.ExtrudeGeometry(M, { depth: th * 0.18, bevelEnabled: true, bevelThickness: th * 0.1, bevelSize: r * 0.02, bevelSegments: 1, curveSegments: 2 });
  const deco = [...band, e.clone().translate(0, 0, th / 2 - th * 0.12), e.clone().rotateY(Math.PI).translate(0, 0, -th / 2 + th * 0.12)].map((g) => { g = nonIdx(g); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); return g; });
  const d = nonIdx(disc); for (const k of Object.keys(d.attributes)) if (k !== 'position' && k !== 'normal') d.deleteAttribute(k);
  return { disc: d, deco: mergeGeometries(deco), ink: smoothed(disc) };
}

export class Coins {
  constructor(game, max = 80) {
    this.g = game; this.max = max; this.items = []; this.pendingRain = 0; this.log = { spawned: 0, collected: 0, lost: 0 }; this.chest = null; this.cols = null; this.colsOf = null;
    this.mesh = {};
    for (const k of KINDS) {
      const G = coinGeos(k), S = SPEC[k], mk = (geo, mat) => { const m = new THREE.InstancedMesh(geo, mat, max); m.count = 0; m.visible = false; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); game.scene.add(m); return m; };
      this.mesh[k] = [mk(G.disc, gomme(S.color, { rim: 0.55, rimColor: '#FFFFFF', shadow: 0.68, ao: 1 })), mk(G.deco, gomme(S.deep, { shadow: 0.7, ao: 1 })), mk(G.ink, inkMat(INK, 2))];
      this.mesh[k][0].castShadow = true;
    }
  }
  // ---- spawning ----
  /** Burst of coins worth `value` from pos (kill, floor bonus, chest). o.up = stronger upward burst. */
  spawn(pos, value, o = {}) {
    const kinds = coinsFor(value);
    for (const kind of kinds) {
      this.log.spawned += COIN_VALUES[kind];
      const it = this.take(kind, pos); if (!it) { this.log.lost += COIN_VALUES[kind]; continue; }
      const a = Math.random() * Math.PI * 2, sp = (o.up ? 4 : 3) + Math.random() * 3;
      it.vel.set(Math.cos(a) * sp * 0.45, sp * (0.75 + Math.random() * 0.35) * (o.up ? 1.2 : 1), Math.sin(a) * sp * 0.45);
    }
  }
  take(kind, pos) {
    if (this.items.length >= this.max) return null;
    const it = { kind, value: COIN_VALUES[kind], pos: pos.clone(), vel: new V3(), state: 'fly', age: 0, spin: Math.random() * 6, spinV: 7 + Math.random() * 7, squash: 0, ms: 0, tilt: 0 };
    this.items.push(it); return it;
  }
  /** Hatch opens: every coin left on the floor is sucked into the hole; its value comes back in the rain. */
  sweep(cx, cz) { this.hole = new V3(cx, 0, cz); for (const it of this.items) if (it.state === 'fly' || it.state === 'rest') { it.state = 'suck'; it.ms = 0; } }
  /** After the swap: the swept value + bonus coins fall in a spiral column around the falling player. */
  rain(p, bonus) {
    const kinds = [...coinsFor(this.pendingRain), ...Array.from({ length: bonus }, (_, i) => (i % 5 === 4 ? 'silver' : 'bronze'))];
    this.pendingRain = 0;
    const top = p.pos.y - 1.5, bottom = 2.2, n = kinds.length;
    kinds.forEach((kind, i) => {
      const k = n > 1 ? i / (n - 1) : 0, a = i * 0.95, r = 0.55 + 1.1 * ((i * 0.618) % 1);
      const bonusCoin = i >= n - bonus; if (bonusCoin) this.log.spawned += COIN_VALUES[kind]; // swept coins were counted when they first dropped
      const it = this.take(kind, new V3(p.pos.x + Math.cos(a) * r, top - (top - bottom) * k, p.pos.z + Math.sin(a) * r)); if (!it) { this.log.lost += COIN_VALUES[kind]; return; }
      it.state = 'rain'; it.vel.set(-Math.sin(a) * 0.6, -1.4, Math.cos(a) * 0.6);
    });
  }
  clear() { this.items.length = 0; this.pendingRain = 0; this.hole = null; this.removeChest(); for (const k of KINDS) for (const m of this.mesh[k]) { m.count = 0; m.visible = false; } }
  // ---- per frame ----
  update(dt, t) {
    const g = this.g, p = g.player, level = g.level;
    if (level && this.colsOf !== level) { this.colsOf = level; this.cols = level.colliders.filter((c) => !c.dynamic); }
    const falling = g.state === 'falling', mag = _t.set(p.pos.x, p.pos.y + 1.0, p.pos.z);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]; it.age += dt;
      const r = SPEC[it.kind].r;
      if (it.state === 'suck') { // glide to the hatch, then drop through it
        const h = this.hole; _d.set(h.x - it.pos.x, 0, h.z - it.pos.z); const dist = _d.length();
        it.ms = Math.min(14, it.ms + dt * 20); if (dist > 0.2) it.pos.addScaledVector(_d.divideScalar(dist), Math.min(dist, it.ms * dt)); else it.pos.y -= dt * 9;
        it.spinV = 16; if (it.pos.y < -0.6) { this.pendingRain += it.value; this.items.splice(i, 1); continue; }
      } else if (it.state === 'magnet') {
        _d.subVectors(mag, it.pos); const dist = _d.length();
        it.ms = Math.min(22, it.ms + dt * 40); it.pos.addScaledVector(_d.divideScalar(Math.max(dist, 1e-4)), Math.min(dist, it.ms * dt)); it.spinV = 18;
        if (dist < 0.4) { this.items.splice(i, 1); this.log.collected += it.value; this.onCollect(it); continue; }
      } else {
        const reach = it.state === 'rain' || falling ? 0.9 : 3, near = _d.subVectors(mag, it.pos).length();
        if ((it.age > 0.45 || it.state === 'rain') && near < reach && g.live) { it.ms = it.state === 'rain' ? 10 : 0; it.state = 'magnet'; continue; }
        if (it.state === 'rain') { // lazy spiral fall; lost when it reaches the floor
          it.vel.y = Math.max(it.vel.y - dt * 2, -3.2); it.pos.addScaledVector(it.vel, dt);
          if (it.pos.y < 0.35) { this.items.splice(i, 1); this.log.lost += it.value; this.pop(it.pos, 0xffffff); continue; }
        } else {
          it.vel.y -= 18 * dt; it.pos.addScaledVector(it.vel, dt);
          const fy = (this.cols ? surfaceBelow(this.cols, it.pos.x, it.pos.y + r, it.pos.z) : 0) + r;
          if (it.pos.y < fy) {
            it.pos.y = fy;
            if (it.vel.y < -1.2) { it.vel.y *= -0.42; it.vel.x *= 0.7; it.vel.z *= 0.7; it.squash = Math.min(1, 0.4 + Math.abs(it.vel.y) * 0.12); }
            else { it.vel.set(it.vel.x * 0.9, 0, it.vel.z * 0.9); it.state = 'rest'; }
          }
          if (it.state === 'rest') { it.vel.x *= Math.exp(-6 * dt); it.vel.z *= Math.exp(-6 * dt); it.spinV += (2.6 - it.spinV) * Math.min(1, dt * 2); }
        }
      }
      it.squash = Math.max(0, it.squash - dt * 5); it.spin += it.spinV * dt;
    }
    this.draw(t);
    if (this.chest) this.chest.update(dt, t, p);
  }
  draw(t) {
    const n = { bronze: 0, silver: 0, gold: 0 };
    for (const it of this.items) {
      const q = it.squash, M = this.mesh[it.kind], k = n[it.kind]++;
      const bob = it.state === 'rest' ? Math.sin(t * 3 + it.age) * 0.03 + 0.03 : 0, sc = it.state === 'magnet' ? 0.75 : 1;
      _m.makeRotationY(it.spin); _s.makeScale(sc * (1 + q * 0.35), sc * (1 - q * 0.45), sc * (1 + q * 0.35)); _m.premultiply(_s);
      _m.setPosition(it.pos.x, it.pos.y + bob, it.pos.z);
      for (const m of M) m.setMatrixAt(k, _m);
    }
    for (const k of KINDS) for (const m of this.mesh[k]) { m.count = n[k]; m.visible = n[k] > 0; if (n[k]) m.instanceMatrix.needsUpdate = true; }
  }
  onCollect(it) { this.pop(it.pos, SIGNAL.gold); this.g.onCoin(it.value); }
  pop(pos, color) { this.g.stars.spawn(pos.clone(), color === SIGNAL.gold); }

  // ---- toy chest + plan ----
  placeChest(pos, content, plat = null) {
    this.removeChest();
    this.chest = new Chest(this, pos, content, plat); this.g.scene.add(this.chest.root);
  }
  removeChest() { if (this.chest) { this.chest.dispose(); this.chest = null; } }
}

// ---------------------------------------------------------------- toy chest: opens when you walk up to it
class Chest {
  constructor(coins, pos, content, plat) {
    this.coins = coins; this.content = content; this.plat = plat; this.k = 0; this.opened = false; this.done = false; this.card = null;
    const root = (this.root = new THREE.Group()), P = (gm, m, px = 2.2) => part(gm, m, { ink: INK, px });
    this.mats = [gomme('#4FC3FF', { rim: 0.2, ao: 1 }), gomme(SIGNAL.coral, { rim: 0.2, ao: 1 }), gomme(SIGNAL.gold, { rim: 0.4, ao: 1 }), gomme('#FFFFFF', { ao: 1 })];
    const [blue, coral, gold, white] = this.mats;
    put(root, P(rbox(1.5, 0.85, 1.0, 0.14), blue), 0, 0.45, 0);
    put(root, P(rbox(1.56, 0.16, 1.06, 0.07), coral, 2), 0, 0.1, 0);
    for (const x of [-0.5, 0.5]) put(root, P(rbox(0.14, 0.86, 1.06, 0.05), gold, 1.8), x, 0.46, 0);
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.07 : 0.17; i ? star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : star.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    this.starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 });
    put(root, P(this.starGeo, white, 1.6), 0, 0.45, 0.5);
    this.glow = put(root, new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), flat('#FFE27A', { transparent: true, opacity: 0, depthWrite: false })), 0, 0.88, 0, -Math.PI / 2);
    this.hinge = new THREE.Group(); put(root, this.hinge, 0, 0.88, -0.5);
    put(this.hinge, P(rbox(1.6, 0.3, 1.1, 0.14), coral), 0, 0.12, 0.5);
    put(this.hinge, P(rbox(0.26, 0.24, 0.1, 0.05), gold, 1.8), 0, 0.02, 1.06);
    put(root, contactShadow(1.05, 0.25, INK), 0, 0.01, 0);
    root.position.copy(pos); root.rotation.y = Math.atan2(-pos.x, -pos.z); // lid faces the room centre
  }
  update(dt, t, p) {
    if (this.plat) this.root.position.set(this.plat.center.x, this.plat.center.y + 0.225, this.plat.center.z);
    const pos = this.root.position, near = Math.hypot(p.pos.x - pos.x, p.pos.z - pos.z) < 1.9 && Math.abs(p.pos.y - pos.y) < 1.9;
    if (!this.opened && near && this.coins.g.live) { this.opened = true; this.coins.g.audio.play('chest'); }
    if (this.opened && this.k < 1) {
      this.k = Math.min(1, this.k + dt / 0.6);
      this.hinge.rotation.x = -this.k * 1.9; this.glow.material.opacity = this.k * 0.85;
      if (this.k >= 0.5 && !this.done) this.release();
    }
    if (this.card) this.card.update(dt, t, p);
  }
  release() {
    this.done = true; const top = this.root.position.clone().setY(this.root.position.y + 1.0);
    if (this.content.coins) this.coins.spawn(top, this.content.coins, { up: true });
    else if (this.content.plan) { this.card = new PlanCard(this.coins.g, this.content.plan, top); this.root.parent.add(this.card.root); }
  }
  dispose() {
    this.root.removeFromParent(); if (this.card) this.card.dispose();
    this.mats.forEach((m) => m.dispose()); this.glow.material.dispose(); this.glow.geometry.dispose(); this.starGeo.dispose();
  }
}

// ---------------------------------------------------------------- Plan card: rises from the chest, flies to the player
class PlanCard {
  constructor(game, id, pos) {
    this.g = game; this.id = id; this.t = 0; this.got = false;
    const it = item(id), cv = document.createElement('canvas'); cv.width = 256; cv.height = 320; const c = cv.getContext('2d');
    c.fillStyle = '#7C4DFF'; c.fillRect(0, 0, 256, 320); c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1;
    for (let x = 0; x <= 256; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 320); c.stroke(); }
    for (let y = 0; y <= 320; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '400 54px "Lilita One", sans-serif'; c.fillText('PLAN', 128, 120);
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.setLineDash([8, 8]); c.strokeRect(24, 150, 208, 90); c.setLineDash([]);
    c.font = '900 22px Nunito, sans-serif'; const words = it.name.toUpperCase().split(' ');
    words.forEach((w, i) => c.fillText(w, 128, 185 + i * 28 - (words.length - 1) * 10));
    c.font = '900 18px Nunito, sans-serif'; c.fillText('★★★', 128, 285);
    this.tex = new THREE.CanvasTexture(cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.root = new THREE.Group(); this.root.position.copy(pos);
    this.body = gomme('#6A3DF0', { rim: 0.3, ao: 1 }); this.face = new THREE.MeshBasicMaterial({ map: this.tex });
    put(this.root, part(rbox(0.82, 1.04, 0.06, 0.05), this.body, { ink: INK, px: 2.2, cast: false }), 0, 0, 0);
    this.plane = put(this.root, new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.925), this.face), 0, 0, 0.032);
  }
  update(dt, t, p) {
    this.t += dt; const r = this.root;
    if (this.t < 1.1) { r.position.y += dt * (1.6 - this.t * 1.2); r.rotation.y = t * 3; return; }
    _d.set(p.pos.x - r.position.x, p.pos.y + 1.2 - r.position.y, p.pos.z - r.position.z); const dist = _d.length();
    r.position.addScaledVector(_d.divideScalar(Math.max(dist, 1e-4)), Math.min(dist, dt * 9)); r.rotation.y = t * 6;
    if (dist < 0.6 && !this.got) { this.got = true; this.g.onPlan(this.id); r.visible = false; }
  }
  dispose() { this.root.removeFromParent(); this.body.dispose(); this.face.dispose(); this.tex.dispose(); this.plane.geometry.dispose(); }
}
