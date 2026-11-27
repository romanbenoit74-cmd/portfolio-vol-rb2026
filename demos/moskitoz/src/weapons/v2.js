// Arsenal v2 (spec §10, phase 10). Weapons: Aspirateur-Canon, Tapette Titan, Lance-Citronnelle. Hand powers (F):
// Tourbillon de Paume, Clap Sismique, Onde Paume-à-Paume. Same interface as v1 (Weapon / Power), numbers in specs.js.
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { gomme, inkHull } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';
import { Weapon, march } from './Weapon.js';
import { Power } from './powers.js';
import { SPEC, aspiBlast, clapRadius, inCone, isSmall, pierce, powerCd, weaponCd } from './specs.js';

const V3 = THREE.Vector3, _a = new V3(), _b = new V3(), _d = new V3(), _y = new V3(0, 1, 0);
const inked = (geo, color) => { const g = new THREE.Group(); g.add(inkHull(geo, SIGNAL.ink, 2.4), new THREE.Mesh(geo, gomme(color, { rim: 0.3 }))); return g; };
const glow = (color, k = 2) => { const m = new THREE.MeshBasicMaterial({ color }); m.color.multiplyScalar(k); return m; };

/** lobbed projectile step: gravity, move, then what it touched ('enemy' | 'wall' | null) */
function fly(g, pr, dt, grav, radius) {
  pr.vel.y -= grav * dt; _a.copy(pr.pos); pr.pos.addScaledVector(pr.vel, dt);
  for (const e of g.enemies.list) if (!e.dying && e.pos.distanceTo(pr.pos) < e.radius + radius) return { hit: 'enemy', e };
  const lv = g.level;
  if (pr.pos.y <= radius) { pr.pos.y = radius; return { hit: 'wall' }; }
  if (lv && (!lv.isFree(pr.pos.x, pr.pos.y, pr.pos.z, radius) || Math.abs(pr.pos.x) > lv.w / 2 || Math.abs(pr.pos.z) > lv.d / 2 || pr.pos.y > lv.h)) { pr.pos.copy(_a); return { hit: 'wall' }; }
  return null;
}

// ---- Aspirateur-Canon: hold to suck up to 5 small mosquitoes, release to fire the ball that explodes ----
export class Aspi extends Weapon {
  constructor(c) { super(c); this.tank = []; this.balls = []; this.sucking = false; this.tickT = 0; this.hissT = 0; this.geo = new THREE.SphereGeometry(1, 16, 12); }
  reset() { super.reset(); this.tank.length = 0; this.sucking = false; for (const b of this.balls) this.g.scene.remove(b.m); this.balls.length = 0; }
  nozzle(out) { return this.p.cam.localToWorld(out.set(0.22, -0.2, -0.85)); }
  down() { this.sucking = true; }
  unequip() { this.sucking = false; }
  up(cancel = false) {
    if (!this.sucking) return; this.sucking = false;
    if (cancel) return; // pause / weapon switch: the tank keeps its catch
    if (this.cd > 0 || !this.p.canAct()) return;
    const S = SPEC.aspi, n = this.tank.length, aim = this.p.aimDir(new V3()), from = this.nozzle(new V3());
    this.cd = this.full = weaponCd(S.cd, this.st); this.c.swing('power', 0.25, 'R'); this.p.kick.kick(3); this.p.shake(0.2);
    if (!n) { // empty tank: a puff that pushes back
      this.g.audio.play('dash'); this.g.fx.emit(from, { count: 14, speed: 9, color: 0xe9e0ff, size: 0.2, life: 0.35, dir: aim, spread: 0.4 });
      for (const e of this.c.targets(4 * this.st.rangeMul, 0.6)) this.c.hit(e, S.puff, { kb: this.c.kbFor(e, 7, 0.4) });
      return;
    }
    const r = 0.22 + 0.05 * n, m = inked(this.geo, 0xb98cff); m.scale.setScalar(r); m.position.copy(from); this.g.scene.add(m);
    this.balls.push({ m, pos: from.clone(), vel: aim.multiplyScalar(S.speed).add(_a.set(0, 2, 0)), n, r, t: 3 });
    this.tank.length = 0; this.g.audio.play('power', 0.7); bus.emit('float', { pos: from.clone().addScaledVector(aim, 2 / S.speed), text: `×${n}`, cls: 'note' });
  }
  update(dt) {
    super.update(dt); const S = SPEC.aspi, p = this.p;
    if (this.sucking && p.weapon === 'aspi' && p.canAct()) {
      const noz = this.nozzle(new V3()), eye = p.eye, aim = p.aimDir(new V3()), full = this.tank.length >= S.max;
      this.hissT -= dt; if (this.hissT <= 0) { this.g.audio.play('hiss'); this.hissT = 0.18; }
      this.g.fx.emit(_b.copy(eye).addScaledVector(aim, 2 + Math.random() * 3).add(_d.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.6)), { count: 1, speed: 7, color: 0xe9e0ff, size: 0.1, life: 0.3, dir: _d.subVectors(noz, _b).normalize() });
      this.tickT -= dt; const tick = this.tickT <= 0; if (tick) this.tickT = 0.25;
      for (const e of this.enemies) {
        if (e.dying || !inCone(eye, aim, e.pos, S.range * this.st.rangeMul, S.cone)) continue;
        const small = isSmall(e.def), d = e.pos.distanceTo(noz);
        e.pos.addScaledVector(_d.subVectors(noz, e.pos).normalize(), S.pull * dt * (small ? 1 : 0.25)); e.slowT = Math.max(e.slowT, 0.3);
        if (small && !full && d < S.grab) { // swallowed: counts as a kill, the body vanishes into the tank
          this.tank.push(e.type); e.damage(1e6, { silent: true }); e.root.visible = false; this.g.audio.play('pickup', 0.6);
          bus.emit('float', { pos: noz.clone(), text: `${this.tank.length}/${S.max}`, cls: 'note' });
        } else if (!small && tick) e.damage(S.suckDps * 0.25 * this.c.dmgM, { silent: true });
      }
    } else this.sucking = this.sucking && p.weapon === 'aspi';
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i]; b.t -= dt; b.m.rotation.x += dt * 8;
      const f = fly(this.g, b, dt, S.grav, b.r); b.m.position.copy(b.pos);
      if (f || b.t <= 0) { this.explode(b); this.g.scene.remove(b.m); this.balls.splice(i, 1); }
    }
  }
  explode(b) {
    const S = SPEC.aspi, R = S.blast * this.st.rangeMul, dmg = aspiBlast(b.n);
    for (const e of this.enemies) { if (e.dying) continue; const d = e.pos.distanceTo(b.pos); if (d < R + e.radius) this.c.hit(e, dmg * (1 - 0.4 * Math.min(1, d / R)), { kb: _a.subVectors(e.pos, b.pos).setY(0.6).normalize().multiplyScalar(9), stun: 0.4 }); }
    this.g.rings.spawn(b.pos, 0xb98cff, R, 0.35); this.g.fx.emit(b.pos, { count: 30, speed: 8, color: 0xe9e0ff, size: 0.3, life: 0.5 });
    if (b.pos.y < 1.2) this.g.splats.spawn(_a.copy(b.pos).setY(0.03), 0xb98cff, 1.2);
    this.g.audio.play('clap'); this.g.hitstop(0.05); this.c.boom(b.pos, 'BLOP!!');
  }
  hud() { return this.cd > 0 ? this.cd / this.full : 1 - this.tank.length / SPEC.aspi.max; }
}

// ---- Tapette Titan: slow vertical slam, squashes the small ones, a ground wave hits what flies low ----
export class Tapette extends Weapon {
  down() {
    if (this.cd > 0 || !this.p.canAct()) return;
    const S = SPEC.tapette; this.cd = this.full = weaponCd(S.cd, this.st); this.c.swing('swat', S.windup + 0.25, 'R'); this.g.audio.play('swipe');
    this.c.later(S.windup, () => this.slam());
  }
  slam() {
    const S = SPEC.tapette, c = this.c, p = this.p, fw = p.forward(), rm = this.st.rangeMul;
    const at = new V3(p.pos.x + fw.x * 2.4 * rm, p.pos.y + 0.05, p.pos.z + fw.z * 2.4 * rm);
    let n = 0;
    for (const e of c.targets(S.range * rm, S.dot)) {
      n++;
      if (isSmall(e.def, S.squash)) { e.damage(1e6, { from: p.eye, stomp: true }); bus.emit('float', { pos: e.pos, text: 'ÉCRASÉ!', cls: 'note' }); }
      else c.hit(e, S.dmg, { stun: 0.4, kb: new V3(0, -3, 0), crit: true });
    }
    for (const e of this.enemies) if (!e.dying && e.pos.y - p.pos.y < S.low && Math.hypot(e.pos.x - at.x, e.pos.z - at.z) < S.wave * rm + e.radius) c.hit(e, S.waveDmg, { stun: S.stun, kb: _a.subVectors(e.pos, at).setY(0.8).normalize().multiplyScalar(5) });
    this.g.rings.spawn(at, 0xff5b4a, S.wave * rm, 0.45, 'ring'); this.g.rings.spawn(at, 0xffe0dc, 1.6, 0.25);
    this.g.splats.spawn(_a.copy(at).setY(0.03), 0x7a8a3a, 1.1); this.g.fx.emit(at, { count: 22, speed: 6, color: 0xfff2c0, size: 0.24, life: 0.45, up: 0.5 });
    this.g.audio.play('clap'); this.g.audio.play('land', 1); p.shake(0.55); p.kick.kick(4); this.g.hitstop(n ? 0.09 : 0.04); this.g.flash = Math.max(this.g.flash, 0.2);
    c.boom(at, 'SPLAT!!');
  }
  hud() { return this.cd > 0 ? this.cd / this.full : 0; }
}

// ---- Lance-Citronnelle: candles lobbed in an arc; where they land, a repellent zone that burns for 5 s ----
export class Citro extends Weapon {
  constructor(c) {
    super(c); this.shots = []; this.zones = [];
    this.wax = new THREE.CylinderGeometry(0.12, 0.14, 0.34, 12); this.flameGeo = new THREE.SphereGeometry(0.1, 10, 8); this.discGeo = new THREE.CircleGeometry(1, 40); this.discGeo.rotateX(-Math.PI / 2);
    this.waxMat = gomme(0xffe45a, { rim: 0.3 }); this.flameMat = glow(0xffb030, 2.4); this.zoneMat = new THREE.MeshBasicMaterial({ color: 0xfff1a0, transparent: true, opacity: 0.35, depthWrite: false });
  }
  reset() { super.reset(); for (const s of [...this.shots, ...this.zones]) this.g.scene.remove(s.m); this.shots.length = this.zones.length = 0; }
  candle() { const g = new THREE.Group(), w = new THREE.Mesh(this.wax, this.waxMat), f = new THREE.Mesh(this.flameGeo, this.flameMat); f.position.y = 0.26; f.scale.set(1, 1.6, 1); g.add(inkHull(this.wax, SIGNAL.ink, 2.2), w, f); return g; }
  down() {
    if (this.cd > 0 || !this.p.canAct()) return;
    const S = SPEC.citro, aim = this.p.aimDir(new V3()), from = this.p.cam.localToWorld(new V3(0.26, -0.18, -0.8));
    this.cd = this.full = weaponCd(S.cd, this.st); this.c.swing('lob', 0.3, 'R'); this.g.audio.play('flick'); this.p.kick.kick(2);
    const m = this.candle(); m.position.copy(from); this.g.scene.add(m);
    this.shots.push({ m, pos: from, vel: aim.multiplyScalar(S.speed).add(_a.set(0, S.up, 0)), t: 4 });
  }
  update(dt) {
    super.update(dt); const S = SPEC.citro;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]; s.t -= dt; const f = fly(this.g, s, dt, S.grav, 0.15); s.m.position.copy(s.pos); s.m.rotation.x += dt * 10;
      if (!f && s.t > 0) continue;
      if (f && f.hit === 'enemy') this.c.hit(f.e, S.hit, { kb: this.c.kbFor(f.e, 4) });
      this.g.scene.remove(s.m); this.shots.splice(i, 1); this.zone(s.pos);
    }
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i]; z.t -= dt; z.tick -= dt; z.disc.scale.setScalar(S.r * Math.min(1, (S.life - z.t) * 6)); z.disc.material.opacity = 0.35 * Math.min(1, z.t);
      if (Math.random() < dt * 6) this.g.fx.emit(_a.copy(z.pos).add(_b.set((Math.random() - 0.5) * S.r * 1.6, 0.2, (Math.random() - 0.5) * S.r * 1.6)), { count: 1, speed: 1.2, color: 0xfff1a0, size: 0.25, life: 0.9, up: 1 });
      for (const e of this.enemies) { // repel: pushed out of the circle; burn: 4 ticks per second
        if (e.dying || e.pos.y - z.pos.y > 4) continue;
        const dx = e.pos.x - z.pos.x, dz = e.pos.z - z.pos.z, d = Math.hypot(dx, dz); if (d > S.r + e.radius) continue;
        e.pos.x += (dx / (d || 1)) * S.push * dt; e.pos.z += (dz / (d || 1)) * S.push * dt;
        if (z.tick <= 0) e.damage(S.dps * 0.25 * this.c.dmgM, { silent: true, from: z.pos });
      }
      if (z.tick <= 0) z.tick = 0.25;
      if (z.t <= 0) { this.g.scene.remove(z.m); this.zones.splice(i, 1); }
    }
  }
  zone(pos) {
    const S = SPEC.citro, m = new THREE.Group(), c = this.candle(), disc = new THREE.Mesh(this.discGeo, this.zoneMat.clone());
    m.position.copy(pos).setY(Math.max(0, pos.y - 0.15)); c.position.y = 0.17; disc.position.y = 0.04; m.add(c, disc); this.g.scene.add(m);
    this.zones.push({ m, disc, pos: m.position, t: S.life, tick: 0 });
    if (this.zones.length > S.max) { const o = this.zones.shift(); this.g.scene.remove(o.m); }
    this.g.rings.spawn(m.position, 0xffe45a, S.r, 0.4, 'ring'); this.g.audio.play('trap');
  }
  hud() { return this.cd > 0 ? this.cd / this.full : 0; }
}

// ---- Tourbillon de Paume: a spiral orb leaves the palm, drills, pulls in a vortex, then bursts ----
export class Tourbillon extends Power {
  constructor(c) {
    super(c); this.orbs = [];
    this.coreGeo = new THREE.SphereGeometry(0.35, 16, 12); this.ringGeo = new THREE.TorusGeometry(0.55, 0.06, 6, 28);
    this.coreMat = glow(0x9fdcff, 1.8); this.ringMat = new THREE.MeshBasicMaterial({ color: 0xd8f1ff, transparent: true, opacity: 0.8, depthWrite: false });
  }
  reset() { super.reset(); this.busy = false; for (const o of this.orbs) this.g.scene.remove(o.m); this.orbs.length = 0; }
  down() {
    if (!this.ready()) return;
    const S = SPEC.tourbillon; this.start(S.cd);
    const m = new THREE.Group(); m.add(new THREE.Mesh(this.coreGeo, this.coreMat)); for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(this.ringGeo, this.ringMat); r.rotation.set(i * 1.1, i * 0.7, 0); m.add(r); }
    const pos = this.hand(new V3()); m.position.copy(pos); this.g.scene.add(m);
    this.orbs.push({ m, pos, vel: this.p.aimDir(new V3()).multiplyScalar(S.speed), t: S.life, tick: 0 });
    this.c.swing('power', 0.3, 'R'); this.g.audio.play('charge'); this.p.kick.kick(2);
  }
  update(dt) {
    super.update(dt); const S = SPEC.tourbillon;
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i]; o.t -= dt; o.tick -= dt;
      _a.copy(o.pos).addScaledVector(o.vel, dt); const lv = this.g.level;
      if (!lv || (lv.isFree(_a.x, _a.y, _a.z, 0.3) && _a.y > 0.3)) o.pos.copy(_a); // drills in place against a wall
      o.m.position.copy(o.pos); o.m.rotation.y += dt * 14; o.m.children.forEach((r, k) => { if (k) r.rotation.z += dt * (6 + k * 3); });
      if (Math.random() < dt * 30) this.g.fx.emit(_b.copy(o.pos).add(_d.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(S.pull * 0.6)), { count: 1, speed: 6, color: 0xd8f1ff, size: 0.12, life: 0.35, dir: _d.negate() });
      const tick = o.tick <= 0; if (tick) o.tick = 0.1;
      for (const e of this.enemies) {
        if (e.dying) continue; const d = e.pos.distanceTo(o.pos);
        if (d < S.pull && !e.def.boss) { e.pos.addScaledVector(_d.subVectors(o.pos, e.pos).normalize(), S.force * dt * (1 - 0.6 * (d / S.pull))); e.slowT = Math.max(e.slowT, 0.2); }
        if (tick && d < S.drill + e.radius) { e.damage(S.drillDps * 0.1 * this.c.dmgM, { from: o.pos }); this.g.fx.emit(e.pos, { count: 3, speed: 3, color: 0x9fdcff, size: 0.12, life: 0.25 }); }
      }
      if (o.t <= 0) { // burst
        for (const e of this.enemies) if (!e.dying && e.pos.distanceTo(o.pos) < S.burstR + e.radius) this.c.hit(e, S.burst, { kb: _a.subVectors(e.pos, o.pos).setY(0.5).normalize().multiplyScalar(10), stun: 0.5 });
        this.g.rings.spawn(o.pos, 0x9fdcff, S.burstR, 0.4); this.g.fx.emit(o.pos, { count: 36, speed: 9, color: 0xd8f1ff, size: 0.26, life: 0.5 });
        this.g.audio.play('power'); this.p.shake(0.35); this.g.hitstop(0.05); this.c.boom(o.pos, 'VRRRAC!');
        this.g.scene.remove(o.m); this.orbs.splice(i, 1);
      }
    }
  }
}

// ---- Clap Sismique: clap, then slam the floor: a radial wave stuns whatever flies low ----
export class Clap extends Power {
  reset() { super.reset(); this.busy = false; this.wave = null; }
  down() {
    if (!this.ready()) return;
    const S = SPEC.clap; this.start(S.cd); this.busy = true;
    this.c.swing('clap', 0.5, 'R'); this.c.swing('clap', 0.5, 'L'); this.g.audio.play('swipe');
    this.c.later(S.windup, () => {
      const p = this.p; this.g.audio.play('clap'); this.g.audio.play('power', 0.8); p.shake(0.6); p.fov.kick(40); this.g.hitstop(0.05); this.g.flash = Math.max(this.g.flash, 0.25);
      this.wave = { at: p.pos.clone().setY(p.pos.y + 0.05), t: 0, hit: new Set() };
      for (let k = 0; k < 3; k++) this.g.rings.spawn(this.wave.at, k ? 0xffe9a0 : 0xffc62e, S.r * (0.55 + k * 0.25), S.grow + 0.15 * k, 'ring');
      this.c.boom(p.eye.clone().addScaledVector(p.aimDir(_a), 2), 'BOUM!');
    });
  }
  update(dt) {
    super.update(dt); const w = this.wave; if (!w) return;
    const S = SPEC.clap; w.t += dt; const R = clapRadius(w.t) * this.st.rangeMul;
    if (Math.random() < 0.8) { const a = Math.random() * Math.PI * 2; this.g.fx.emit(_a.set(w.at.x + Math.cos(a) * R, w.at.y + 0.1, w.at.z + Math.sin(a) * R), { count: 2, speed: 2, color: 0xfff2c0, size: 0.3, life: 0.4, up: 1 }); }
    for (const e of this.enemies) {
      if (e.dying || w.hit.has(e) || e.pos.y - w.at.y > S.low) continue;
      if (Math.hypot(e.pos.x - w.at.x, e.pos.z - w.at.z) <= R + e.radius) { w.hit.add(e); this.c.hit(e, S.dmg, { stun: S.stun, kb: new V3(0, 4, 0) }); }
    }
    if (w.t >= S.grow + 0.1) { this.wave = null; this.busy = false; }
  }
}

// ---- Onde Paume-à-Paume: palms together, 1 s charge, then a wide beam you sweep for 1.2 s ----
export class Onde extends Power {
  constructor(c) {
    super(c); this.t = 0; this.state = null;
    const geo = new THREE.CylinderGeometry(1, 0.3, 1, 16, 1, true); geo.translate(0, 0.5, 0); // thin at the palms, full width far away
    this.beam = new THREE.Group(); const core = glow(0xf4ffb0, 2.2); core.side = THREE.DoubleSide; // seen from the palms: the camera sits right behind the tube's mouth
    this.core = new THREE.Mesh(geo, core); this.halo = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xb8f53a, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.beam.add(this.core, this.halo); this.beam.visible = false; this.beam.traverse((o) => (o.frustumCulled = false)); this.g.scene.add(this.beam);
  }
  reset() { super.reset(); this.stop(); }
  stop() { this.state = null; this.busy = false; this.beam.visible = false; if (this.p.hands) this.p.hands.pose = null; this.c.charge = 0; }
  down() { if (!this.ready()) return; this.start(SPEC.onde.cd); this.busy = true; this.state = 'charge'; this.t = 0; this.tick = 0; this.p.hands.pose = 'beam'; this.g.audio.play('charge'); }
  up(cancel) { if (cancel) this.stop(); }
  update(dt) {
    super.update(dt); if (!this.state) return;
    const S = SPEC.onde, p = this.p; if (p.dead || p.stunT > 0) { this.stop(); return; }
    this.t += dt;
    const from = p.cam.localToWorld(_b.set(0, -0.32, -0.95));
    if (this.state === 'charge') {
      this.c.charge = Math.min(1, this.t / S.charge);
      if (Math.random() < dt * 40) this.g.fx.emit(from, { count: 1, speed: 1, color: 0xf4ffb0, size: 0.06 + 0.1 * this.c.charge, life: 0.2 });
      if (this.t >= S.charge) { this.state = 'fire'; this.t = 0; this.c.charge = 0; this.beam.visible = true; this.g.audio.play('finger'); this.g.audio.play('ult'); }
      return;
    }
    const aim = p.aimDir(new V3()), len = march(this.g.level, p.eye, aim, S.range), to = _a.copy(p.eye).addScaledVector(aim, len), d = _d.subVectors(to, from), L = d.length();
    const k = 1 - Math.pow(Math.max(0, this.t / S.dur - 0.85) / 0.15, 2), w = S.width * (0.5 + 0.5 * k) * (1 + Math.sin(this.t * 60) * 0.06);
    this.beam.position.copy(from); this.beam.quaternion.setFromUnitVectors(_y, d.normalize()); this.core.scale.set(w * 0.12, L, w * 0.12); this.halo.scale.set(w * 0.4, L, w * 0.4); // visual radius < hit width: the beam must not swallow the view
    p.shake(0.1); this.g.fx.emit(to, { count: 3, speed: 5, color: 0xb8f53a, size: 0.22, life: 0.3 });
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.1;
      for (const e of pierce(p.eye, aim, this.enemies.filter((e) => !e.dying), len, S.width)) e.damage(S.dps * 0.1 * this.c.dmgM, { from: p.eye, silent: Math.random() < 0.6, kb: _b.copy(aim).multiplyScalar(0.6) });
    }
    if (this.t >= S.dur) this.stop();
  }
}

// ---- Lance-Toile: a web shot from the wrist. A mosquito is webbed and stunned (and its neighbours with it); on a wall the thread pulls you in ----
export class Toile extends Power {
  constructor(c) {
    super(c); this.t = 0; this.hit = false; this.e = null; this.wall = false; this.at = new V3();
    const geo = new THREE.CylinderGeometry(1, 1, 1, 8, 1); geo.translate(0, 0.5, 0); // unit thread along +y, from the hand
    this.thread = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff })); this.thread.add(inkHull(geo, SIGNAL.ink, 2));
    this.thread.visible = false; this.thread.frustumCulled = false; this.g.scene.add(this.thread);
  }
  reset() { super.reset(); this.finish(); }
  down() {
    if (!this.ready()) return;
    const S = SPEC.toile, eye = this.p.eye, aim = this.p.aimDir(new V3());
    const wall = march(this.g.level, eye, aim, S.range), prey = pierce(eye, aim, this.enemies.filter((e) => !e.dying && !e.def.boss), wall, 0.5)[0];
    this.start(S.cd); this.busy = true; this.t = 0; this.hit = false; this.e = prey || null; this.wall = !prey && wall < S.range;
    this.at.copy(prey ? prey.pos : eye.clone().addScaledVector(aim, Math.min(wall, S.range)));
    if (!prey && !this.wall) this.cd = this.full = powerCd(1, this.st); // a shot in the air is cheap
    this.g.audio.play('whoosh'); this.c.swing('power', 0.2, 'R'); this.p.kick.kick(2);
  }
  finish() { this.busy = false; this.hit = false; this.e = null; this.thread.visible = false; }
  contact() {
    const S = SPEC.toile; this.g.audio.play('snap');
    this.g.fx.emit(this.at, { count: 14, speed: 4, color: 0xffffff, size: 0.16, life: 0.4 });
    const e = this.e; if (!e) { if (this.at.y < 0.5) this.g.splats.spawn(this.at.clone().setY(0.03), 0xffffff, 0.45); return; }
    const r = S.r * this.st.rangeMul, near = this.enemies.filter((x) => !x.dying && !x.def.boss && x.pos.distanceTo(e.pos) <= r).sort((a, b) => a.pos.distanceTo(e.pos) - b.pos.distanceTo(e.pos)).slice(0, S.max);
    for (const x of near) { this.c.hit(x, S.dmg, { stun: S.stun, glue: S.stun }); this.g.rings.spawn(x.pos, 0xffffff, x.radius * 3, 0.3); }
    this.c.boom(e.pos, 'TOILE!');
  }
  update(dt) {
    super.update(dt); if (!this.busy) return;
    const S = SPEC.toile, p = this.p; this.t += dt;
    if (p.dead || p.stunT > 0) { this.finish(); return; }
    if (this.e) { if (this.e.dying) { this.finish(); return; } this.at.copy(this.e.pos); }
    const from = this.hand(_a), reach = Math.min(1, this.t / 0.1), tip = _b.lerpVectors(from, this.at, reach);
    if (reach >= 1 && !this.hit) { this.hit = true; this.contact(); }
    if (this.hit && this.wall) { // zip: the thread reels you towards the anchor
      const chest = new V3().copy(p.pos).setY(p.pos.y + 1), d = new V3().subVectors(this.at, chest), dist = d.length(); d.divideScalar(dist || 1);
      if (dist < 2 || this.t > 0.1 + S.zipT) { p.vel.y = Math.max(p.vel.y, 3); this.finish(); return; }
      if (p.onGround && d.y > 0.2) { p.vel.y = 4; p.onGround = false; }
      p.vel.addScaledVector(d, 70 * dt); const sp = p.vel.length(); if (sp > S.zip) p.vel.multiplyScalar(S.zip / sp);
    } else if (this.hit && this.t > 0.1 + 0.3) { this.finish(); return; }
    const dir = new V3().subVectors(tip, from), len = dir.length();
    this.thread.visible = len > 0.05; this.thread.position.copy(from); this.thread.scale.set(0.012, len, 0.012); this.thread.quaternion.setFromUnitVectors(_y, dir.divideScalar(len || 1));
  }
}
