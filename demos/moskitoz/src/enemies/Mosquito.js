// Mosquito types and the shared enemy class (behaviour lives in AI.js, models in Models.js).
import * as THREE from 'three';
import { bus, rand } from '../core/core.js';
import { pushSphere } from '../level/Physics.js';
import { AI } from './AI.js';
import { buildModel, teleSprite } from './Models.js';
import { telegraph } from '../audio/MosquitoPatch.js';

const V3 = THREE.Vector3;
const _sv = new V3(), _sd = new V3();

// scale: model unit -> world (model is ~1.6 long). Enlarged vs. reality so they read in FPS view.
export const TYPES = {
  mosquito: { name: 'Moustique', hp: 20, speed: 2.5, dmg: 5, xp: 10, pts: 1, scale: 0.55, radius: 0.45, reach: 1.5, windup: 0.32, color: 0x5a6f9c, acc: 5 },
  speedbug: { name: 'Speedbug', hp: 15, speed: 4.5, dmg: 2, xp: 15, pts: 2, scale: 0.36, radius: 0.32, reach: 1.3, windup: 0.1, color: 0xe0405a, acc: 9 },
  heavy: { name: 'Heavyweight', hp: 50, speed: 1.5, dmg: 15, xp: 30, pts: 5, scale: 1.0, radius: 0.85, reach: 2.4, windup: 0.6, color: 0x58b048, acc: 3, stunPlayer: 0.3 },
  swarmling: { name: 'Swarmling', hp: 8, speed: 3, dmg: 1.5, xp: 5, pts: 1, scale: 0.3, radius: 0.26, reach: 1.15, windup: 0, color: 0xf0b830, acc: 6 },
  spitter: { name: 'Cracheur', hp: 14, speed: 2.4, dmg: 6, xp: 0, pts: 3, scale: 0.5, radius: 0.4, reach: 1.3, windup: 0.55, color: 0x9a55e0, acc: 4 },
  kamikaze: { name: 'Kamikaze', hp: 10, speed: 3.2, dmg: 15, xp: 0, pts: 2, scale: 0.4, radius: 0.34, reach: 1.5, windup: 0.45, color: 0xff7a1a, acc: 6 },
  shield: { name: 'Bouclier', hp: 30, speed: 2, dmg: 6, xp: 0, pts: 4, scale: 0.7, radius: 0.6, reach: 1.8, windup: 0.45, color: 0x4a86e0, acc: 3, shield: true, faceTarget: true },
  splitter: { name: 'Diviseur', hp: 28, speed: 2.3, dmg: 7, xp: 0, pts: 4, scale: 0.75, radius: 0.65, reach: 1.8, windup: 0.4, color: 0xe060a8, acc: 4, splits: true },
  healer: { name: 'Soigneur', hp: 18, speed: 3.1, dmg: 3, xp: 0, pts: 6, scale: 0.5, radius: 0.4, reach: 1.3, windup: 0.4, color: 0x40d896, acc: 5 },
  tyrant: { name: 'MOUSTIQUE TYRAN', hp: 200, speed: 4, dmg: 25, xp: 500, pts: 50, scale: 2.7, radius: 1.8, reach: 3, windup: 1, color: 0xb0307a, acc: 3, boss: true },
};

export const TYPE_ORDER = Object.keys(TYPES); // index of a type on the wire (src/net/coopSync.js)

export class Mosquito {
  constructor(type, pos, diff, group = 0) {
    this.type = type; this.def = TYPES[type]; this.diff = diff;
    this.hp = this.maxHp = this.def.hp * diff.hp;
    this.pos = pos.clone(); this.vel = new V3(); this.kb = new V3();
    this.radius = this.def.radius; this.group = group;
    this.state = 'pursue'; this.stateT = 0; this.t = Math.random() * 10; this.ph = Math.random() * 6.28;
    this.stunT = 0; this.slowT = 0; this.glueT = 0; this.poisonT = 0; this.poisonDps = 0; this.glow = 0; this.flash = 0;
    this.mul = 1; this.squash = 0; this.dead = false; this.dying = false; this.dieT = 0; this.spawnT = 0; this.cd = 0; this.n = 0;
    this.orbit = Math.random() * 6.28; this.dir = new V3(0, 0, 1);
    this.build();
  }
  build() {
    const d = this.def;
    this.model = buildModel(this.type, d.scale >= 0.5); this.mBody = this.model.mat; // tiny bugs skip the shadow map (one draw call each)
    this.root = new THREE.Group();
    const p = (this.pivot = new THREE.Group()); p.scale.setScalar(d.scale); p.add(this.model.body);
    this.tele = teleSprite(); this.tele.position.y = d.scale * 0.62 + 0.18; // attack telegraph "!" (spec §6)
    this.root.add(p, this.tele);
    this.root.position.copy(this.pos);
  }
  get eye() { return this.pos; }

  /** Coop guest: a puppet only mirrors the host's mosquito. A hit is sent to the host (net.hit) and shown locally; the kill comes back as an event. */
  damage(amount, o = {}) {
    if (this.dying) return false;
    if (this.puppet) {
      this.flash = 1; this.squash = 1;
      if (!o.silent) bus.emit('enemy:hit', { enemy: this, dmg: amount, crit: !!o.crit, stomp: !!o.stomp });
      if (this.onHit) this.onHit(this, amount, o);
      return false;
    }
    if (this.def.shield && o.from) { // frontal shield blocks ~90% unless hit from behind / above
      const v = _sv.subVectors(o.from, this.pos), len = v.length() || 1;
      if (v.y < len * 0.6) { v.y = 0; if (v.normalize().dot(_sd.set(this.dir.x, 0, this.dir.z).normalize()) > 0.25) { amount *= 0.1; bus.emit('float', { pos: this.pos, text: 'BLOQUÉ', cls: 'note' }); } }
    }
    this.hp -= amount; this.flash = 1; this.squash = 1;
    if (!o.silent) bus.emit('enemy:hit', { enemy: this, dmg: amount, crit: !!o.crit, stomp: !!o.stomp });
    if (o.kb) this.kb.add(o.kb);
    if (o.stun) this.stunT = Math.max(this.stunT, this.def.boss ? Math.min(o.stun, 0.3) : o.stun);
    if (o.shock) this.slowT = Math.max(this.slowT, 1);
    if (o.poison) { this.poisonT = 5; this.poisonDps = o.poison; }
    if (o.glue) this.glueT = o.glue;
    if (this.hp <= 0) {
      this.dying = true; this.dead = true; this.vel.set(rand(-1, 1), 2, rand(-1, 1)); this.kb.multiplyScalar(0.5);
      bus.emit('enemy:killed', { enemy: this, stomp: !!o.stomp, pos: this.pos.clone() });
      return true;
    }
    return false;
  }
  /** Glide toward the host's last position and show its status flags (src/net/coopSync.js FLAG). */
  puppetStep(dt) {
    const n = this.net; if (!n) return;
    const k = 1 - Math.exp(-12 * dt), px = this.pos.x, py = this.pos.y, pz = this.pos.z;
    this.pos.set(px + (n.x - px) * k, py + (n.y - py) * k, pz + (n.z - pz) * k);
    this.vel.set((n.x - px) * 6, (n.y - py) * 6, (n.z - pz) * 6); // only drives the facing and the wings
    const f = n.flags | 0;
    this.stunT = f & 1 ? 0.2 : -1; this.slowT = f & 2 ? 0.2 : -1; this.glueT = f & 4 ? 0.2 : -1; this.poisonT = f & 8 ? 0.2 : 0;
    this.state = f & 16 ? 'windup' : 'pursue'; this.stateT = this.def.windup * 0.5;
    this.hp = this.maxHp * n.hp;
  }
  speed() { return this.def.speed * this.mul * (this.slowT > 0 ? 0.4 : 1); }

  update(dt, c) {
    if (this.avatar) return false; // arena: a hittable stand-in for a remote player, moved by the session
    this.t += dt;
    if (this.dying) {
      this.dieT += dt; this.vel.y -= 14 * dt; this.vel.multiplyScalar(Math.exp(-1 * dt));
      this.pos.addScaledVector(this.vel, dt).addScaledVector(this.kb, dt); this.kb.multiplyScalar(Math.exp(-4 * dt));
      if (this.pos.y < this.radius * 0.5) { this.pos.y = this.radius * 0.5; this.vel.y *= -0.2; }
      this.root.rotation.z += dt * 9; this.root.rotation.x += dt * 5;
      this.root.position.copy(this.pos);
      const k = Math.max(0, 1 - this.dieT / 0.9); this.pivot.scale.setScalar(this.def.scale * (0.2 + 0.8 * k));
      this.model.update(this.t, true); this.tele.visible = false;
      return this.dieT > 0.9;
    }
    this.spawnT = Math.min(1, this.spawnT + dt * 2.2);
    if (this.puppet) { this.puppetStep(dt); this.flash = Math.max(0, this.flash - dt * 6); this.glow = Math.max(0, this.glow - dt * 3); }
    else {
    this.cd -= dt; this.slowT -= dt; this.stunT -= dt; this.glueT -= dt; this.flash = Math.max(0, this.flash - dt * 6);
    this.glow = Math.max(0, this.glow - dt * 3);
    if (this.poisonT > 0) { this.poisonT -= dt; this.damage(this.poisonDps * dt, { silent: true }); if (this.dying) return false; }
    if (this.glueT > 0) { this.vel.multiplyScalar(Math.exp(-10 * dt)); this.pos.y += (this.radius * 0.6 - this.pos.y) * Math.min(1, dt * 6); }
    else if (this.stunT > 0) this.vel.multiplyScalar(Math.exp(-4 * dt));
    else AI[this.type](this, dt, c);
    this.pos.addScaledVector(this.vel, dt).addScaledVector(this.kb, dt);
    this.kb.multiplyScalar(Math.exp(-5 * dt));
    pushSphere(this.pos, this.radius * 0.8, c.level);
    }

    // visuals
    const sp = this.vel.length();
    if (this.def.faceTarget) { const f = c.player.pos; this.dir.lerp(new V3(f.x - this.pos.x, 0, f.z - this.pos.z).normalize(), 1 - Math.exp(-5 * dt)); }
    else if (sp > 0.3) this.dir.lerp(this.vel.clone().normalize(), 1 - Math.exp(-8 * dt));
    else { const f = c.player.pos; this.dir.lerp(new V3(f.x - this.pos.x, 0, f.z - this.pos.z).normalize(), 1 - Math.exp(-4 * dt)); }
    this.root.position.copy(this.pos);
    this.root.lookAt(this.pos.x + this.dir.x, this.pos.y + this.dir.y * 0.6, this.pos.z + this.dir.z);
    if (this.stunT > 0) this.root.rotation.z += Math.sin(this.t * 40) * 0.2;
    this.squash = Math.max(0, this.squash - dt * 4.5);
    const bs = this.def.scale * (0.15 + 0.85 * this.spawnT) * (1 + Math.sin(this.t * 3 + this.ph) * 0.02), q = this.squash * this.squash;
    this.pivot.scale.set(bs * (1 + 0.45 * q), bs * (1 - 0.4 * q), bs * (1 + 0.45 * q));
    // wings: frozen up during the attack wind-up (telegraph) or when glued; the "!" sticker grows as the sting comes
    const tele = this.stunT > 0 || this.glueT > 0 ? 0 : telegraph(this), fl = this.slowT > 0 ? 0.5 : 1;
    this.model.update(this.t, tele > 0 || this.glueT > 0, fl);
    this.tele.visible = tele > 0; if (tele > 0) { const k = 0.03 + 0.022 * tele; this.tele.scale.set(k * 0.8, k, 1); }
    const glow = Math.max(this.flash, this.glow);
    this.mBody.emissive.setRGB(glow, glow * (this.flash > this.glow ? 0.9 : 0.15), glow * (this.slowT > 0 ? 1 : 0.1));
    this.mBody.emissiveIntensity = 0.9 + glow * 1.4;
    if (this.slowT > 0) this.mBody.emissive.lerp(new THREE.Color(0x3399ff), 0.5);
    if (this.poisonT > 0) this.mBody.emissive.lerp(new THREE.Color(0x55ff44), 0.35);
    return false;
  }
  dispose() { this.model.dispose(); }
}
