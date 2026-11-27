// Raquette Zap, Brumisateur, Pièges Glu: the three original gadgets, ported to the Weapon interface (same behaviour).
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { Weapon } from './Weapon.js';
import { SPEC, weaponCd } from './specs.js';
import { gomme, inkHull } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';

const _f = new THREE.Vector3();

export class Racket extends Weapon {
  constructor(c) { super(c); this.bigCd = 0; }
  reset() { super.reset(); this.bigCd = 0; }
  down() {
    if (this.cd > 0) return;
    const c = this.c, S = SPEC.racket;
    this.cd = this.full = weaponCd(S.cd, this.st); c.swing('racket', 0.26, 'R'); this.g.audio.play('zap'); c.trail(10);
    const range = S.range * this.st.rangeMul; let n = 0;
    this.p.aimDir(_f);
    for (const e of c.targets(range, 0.15)) {
      n++; c.hit(e, S.dmg, { kb: c.kbFor(e, S.kb), shock: true });
      this.g.fx.emit(e.pos, { count: 14, speed: 5, color: 0x66ccff, size: 0.18, life: 0.35 });
    }
    this.g.fx.emit(this.p.eye.clone().addScaledVector(_f, 1.4), { count: 8, speed: 3, color: 0x66ccff, size: 0.14, life: 0.25, dir: _f, spread: 0.7 });
    if (n) { this.p.shake(0.18); this.g.hitstop(0.04); }
  }
  // right click: Grande Claque. The racket swells (wind-up), then a wide slap pushes back and stuns everything in front.
  alt() {
    if (this.bigCd > 0) return;
    const B = SPEC.racket.big;
    this.bigCd = this.bigFull = weaponCd(B.cd, this.st); this.cd = Math.max(this.cd, B.windup + 0.2);
    this.p.hands.growRacket(B.grow, B.windup + 0.3); this.c.swing('bigracket', B.windup + 0.34, 'R'); this.g.audio.play('charge'); this.p.fov.kick(-25);
    this.c.later(B.windup, () => this.slap());
  }
  slap() {
    const B = SPEC.racket.big, c = this.c, p = this.p, range = B.range * this.st.rangeMul; let n = 0;
    p.aimDir(_f);
    for (const e of c.targets(range, B.dot)) {
      n++; c.hit(e, B.dmg, { kb: c.kbFor(e, B.kb, B.up), stun: B.stun, shock: true });
      this.g.fx.emit(e.pos, { count: 18, speed: 6, color: 0x66ccff, size: 0.22, life: 0.4 });
    }
    const at = p.eye.clone().addScaledVector(_f, 2.2);
    this.g.rings.spawn(at, 0x9fe4ff, range * 0.8, 0.32); this.g.rings.spawn(at, 0xffffff, 1.4, 0.2);
    this.g.fx.emit(at, { count: 26, speed: 7, color: 0xbfeeff, size: 0.2, life: 0.35, dir: _f, spread: 1.1 });
    this.g.audio.play('clap'); this.g.audio.play('zap'); p.shake(n ? 0.42 : 0.25); p.kick.kick(5); p.fov.kick(110); this.g.hitstop(n ? 0.08 : 0.03);
    c.boom(at, n ? 'CLAAAC!!' : 'FLAP!');
  }
  update(dt) { super.update(dt); this.bigCd -= dt; }
  hud() { return this.bigCd > 0 ? this.bigCd / this.bigFull : 0; } // HUD ring: the Grande Claque recharging
}

export class Spray extends Weapon {
  constructor(c) { super(c); this.clouds = []; }
  reset() { super.reset(); this.clouds.length = 0; }
  down() {
    if (this.cd > 0) return;
    const S = SPEC.spray;
    this.cd = this.full = weaponCd(S.cd, this.st); this.c.swing('spray', 0.4, 'R'); this.g.audio.play('spray');
    this.clouds.push({ pos: this.p.pos.clone().setY(this.p.pos.y + 1), r: S.r, t: S.life, tick: 0 });
    this.g.rings.spawn(this.p.pos.clone().setY(this.p.pos.y + 0.1), 0x55ff77, S.r, 0.6, 'ring');
  }
  update(dt) {
    super.update(dt);
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i]; c.t -= dt; c.tick -= dt;
      this.g.fx.emit(c.pos, { count: 3, speed: 3.5, color: 0x55ff55, size: 0.9, life: 1.2, up: 0.3 });
      if (c.tick <= 0) {
        c.tick = SPEC.spray.tick;
        for (const e of this.enemies) if (!e.dying && e.pos.distanceTo(c.pos) < c.r + e.radius) this.c.hit(e, SPEC.spray.dmg, { poison: SPEC.spray.poison });
      }
      if (c.t <= 0) this.clouds.splice(i, 1);
    }
  }
  hud() { return this.cd > 0 ? this.cd / this.full : 0; }
}

export class Trap extends Weapon {
  constructor(c) {
    super(c); this.traps = [];
    this.geo = new THREE.CylinderGeometry(1.1, 1.1, 0.06, 28);
    this.mat = gomme(0xffd23c, { rim: 0.35, rimColor: '#FFF0A0', ao: 1 }); // Gomme & Encre glue puck, inked like the rest of the world
  }
  reset() { super.reset(); for (const t of this.traps) this.g.scene.remove(t.m); this.traps.length = 0; }
  down() {
    if (this.cd > 0) return;
    const S = SPEC.trap;
    this.cd = this.full = weaponCd(S.cd, this.st); this.c.swing('trap', 0.3, 'R'); this.g.audio.play('trap');
    const eye = this.p.eye; this.p.aimDir(_f);
    let x, z;
    if (_f.y < -0.05 && -eye.y / _f.y < 9) { const t = -eye.y / _f.y; x = eye.x + _f.x * t; z = eye.z + _f.z * t; }
    else { const fw = this.p.forward(); x = eye.x + fw.x * 5; z = eye.z + fw.z * 5; }
    const m = new THREE.Mesh(this.geo, this.mat); m.add(inkHull(this.geo, SIGNAL.ink, 2.4)); m.position.set(x, 0.05, z); this.g.scene.add(m);
    this.traps.push({ m, life: S.life });
    if (this.traps.length > S.max) { const o = this.traps.shift(); this.g.scene.remove(o.m); }
  }
  update(dt) {
    super.update(dt);
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i]; t.life -= dt;
      let used = false;
      for (const e of this.enemies) {
        if (e.dying || e.glueT > 0) continue;
        if (Math.hypot(e.pos.x - t.m.position.x, e.pos.z - t.m.position.z) < SPEC.trap.r + e.radius * 0.5 && e.pos.y < 3.2) {
          e.damage(0, { glue: SPEC.trap.glue, silent: true }); e.stunT = 0; used = true;
          this.g.fx.emit(e.pos, { count: 10, speed: 2, color: 0xffcc33, size: 0.25, life: 0.5 }); this.g.audio.play('trap'); bus.emit('float', { pos: e.pos, text: 'COLLÉ!', cls: 'note' });
        }
      }
      if (used || t.life <= 0) { this.g.scene.remove(t.m); this.traps.splice(i, 1); }
    }
  }
  hud() { return this.cd > 0 ? this.cd / this.full : 0; }
}
