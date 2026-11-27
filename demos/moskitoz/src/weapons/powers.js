// Hand powers v1 (spec §10), key F: Doigt-Canon, Gomme-Grappin, Mille Claques. Cooldowns scale with the s65 bonus (powerCd).
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { gomme, inkHull } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';
import { Weapon, march } from './Weapon.js';
import { SPEC, pierce, powerCd } from './specs.js';
import { makeGloves, rubberArm } from '../player/ViewModel.js';
import { skinOf } from '../economy/Items.js';
import { Profile } from '../economy/Profile.js';

const V3 = THREE.Vector3, _a = new V3(), _b = new V3(), _y = new V3(0, 1, 0), _c = new V3(), _nz = new V3(0, 0, -1);

export class Power extends Weapon {
  ready() { if (this.cd > 0 || this.busy || !this.p.canAct()) { if (this.cd > 0) this.g.audio.play('ui', 0.5); return false; } return true; }
  start(base) { this.cd = this.full = powerCd(base, this.st); }
  hud() { return this.busy ? 1 : this.cd > 0 ? Math.min(1, this.cd / this.full) : 0; }
  hand(out) { return this.p.cam.localToWorld(out.set(0.3, -0.24, -0.62)); } // right glove, world space
  tip(out) { const h = this.p.hands; h.root.updateWorldMatrix(true, true); return h.orb.getWorldPosition(out); } // index fingertip (charge orb)
}

// ---- Doigt-Canon: hold F 0.5 s (finger gun), release: piercing energy bullet through the whole line ----
export class Doigt extends Power {
  constructor(c) {
    super(c); this.t = 0;
  }
  reset() { super.reset(); this.busy = false; }
  down() { if (!this.ready()) return; this.busy = true; this.t = 0; this.p.hands.pose = 'point'; this.g.audio.play('charge'); }
  up(cancel = false) {
    if (!this.busy) return;
    this.busy = false; this.p.hands.pose = null; this.c.charge = 0;
    if (!cancel && this.t >= SPEC.doigt.charge) this.fire(); else this.g.fx.emit(this.hand(_a), { count: 5, speed: 1.5, color: 0xb8f53a, size: 0.08, life: 0.3 });
  }
  fire() {
    const S = SPEC.doigt, eye = this.p.eye, aim = this.p.aimDir(new V3());
    this.start(S.cd);
    const len = march(this.g.level, eye, aim, S.range);
    const hits = pierce(eye, aim, this.enemies.filter((e) => !e.dying), len, S.width);
    hits.forEach((e, i) => {
      this.c.hit(e, S.dmg, { kb: aim.clone().setY(0.3).multiplyScalar(S.kb / Math.max(0.6, e.def.scale * 1.2)), stun: 0.3, crit: true });
      this.g.rings.spawn(e.pos, 0xb8f53a, e.radius * 2.8, 0.25);
      if (i === 0) this.c.boom(e.pos, 'PAN!');
    });
    if (hits.length > 1) bus.emit('float', { pos: hits[hits.length - 1].pos, text: `TRANSPERCÉ ×${hits.length}`, cls: 'note' });
    // bolt: the sheet's inked piercing projectile from the fingertip to the wall
    const from = this.tip(new V3()), to = eye.clone().addScaledVector(aim, len), d = _b.subVectors(to, from).normalize();
    this.g.acid.fire(from, d, { pierce: true, speed: 70, w: 0.12, trail: 0.06, grav: 0, life: len / 70 + 0.03, tag: 2 });
    this.g.rings.spawn(from.clone().addScaledVector(d, 0.15), 0xf4ffb0, 0.5, 0.25);
    this.g.fx.emit(to, { count: 16, speed: 5, color: 0xb8f53a, size: 0.16, life: 0.4 }); if (to.y < 0.5) this.g.splats.spawn(to.clone().setY(0.03), 0xb8f53a, 0.4);
    this.g.audio.play('finger'); this.c.swing('power', 0.25, 'R'); this.p.shake(0.35); this.p.kick.kick(4); this.p.fov.kick(-20);
    if (hits.length) { this.g.hitstop(0.06); this.g.flash = Math.max(this.g.flash, 0.25); }
  }
  update(dt) {
    super.update(dt);
    if (this.busy) {
      if (!this.p.canAct()) { this.busy = false; this.p.hands.pose = null; this.c.charge = 0; }
      else {
        const was = this.t < SPEC.doigt.charge; this.t += dt; this.c.charge = Math.min(1, this.t / SPEC.doigt.charge);
        if (was && this.t >= SPEC.doigt.charge) this.g.audio.play('crit');
        if (Math.random() < dt * 40) this.g.acid.converge(this.tip(_a), 2, 0.3, 0.22);
      }
    }
  }
}

// ---- Gomme-Grappin: the glove shoots out on a rubber arm. Mosquito first on the line: yanked to you. Wall: you swing / zip. ----
export class Grappin extends Power {
  constructor(c) {
    super(c); this.state = null;
    // the sheet's rubber arm (ink-violet segments, wobbling) ending in a real glove in the fist pose
    this.rubber = rubberArm(this.g.scene); this.glove = makeGloves(); this.fist = this.glove.hands.R; this.glove.set('fist'); this.glove.snap();
    this.fist.g.scale.setScalar(1.7); this.fist.g.visible = false; this.g.scene.add(this.fist.g);
  }
  reset() { super.reset(); this.end(); this.glove.setSkin(skinOf(this.g.skinId())); } // the flying fist wears the equipped skin
  down() {
    if (!this.ready()) return;
    const S = SPEC.grappin, eye = this.p.eye, aim = this.p.aimDir(new V3());
    const wall = march(this.g.level, eye, aim, S.range), prey = pierce(eye, aim, this.enemies.filter((e) => !e.dying && !e.def.boss), wall, 0.55)[0];
    this.start(S.cd); this.busy = true; this.hooked = false; this.t = 0; this.out = 0.12;
    if (prey) { this.state = 'pull'; this.e = prey; this.at = prey.pos.clone(); }
    else if (wall < S.range) { this.state = 'swing'; this.at = eye.clone().addScaledVector(aim, wall - 0.1); this.len = wall; }
    else { this.state = 'miss'; this.at = eye.clone().addScaledVector(aim, S.range); this.cd = this.full = powerCd(1, this.st); }
    this.p.hands.hands.R.g.visible = false;
    this.fist.g.visible = true; this.g.audio.play('stretch'); this.p.kick.kick(2);
  }
  end() {
    this.busy = false; this.state = null; this.e = null; this.rubber.g.visible = false; this.fist.g.visible = false;
    if (this.p.hands) this.p.hands.hands.R.g.visible = true;
  }
  update(dt) {
    super.update(dt);
    if (!this.state) return;
    const S = SPEC.grappin, p = this.p; this.t += dt;
    const hand = this.hand(_a), reach = Math.min(1, this.t / this.out); // glove flies out in 0.12 s
    let tip = _b.lerpVectors(hand, this.at, reach);
    if (reach >= 1 && !this.hooked) { // contact
      this.hooked = true; this.g.audio.play('snap');
      if (this.state === 'pull') { this.c.hit(this.e, S.dmg, { stun: S.stun }); this.c.boom(this.e.pos, 'CHOPÉ!'); }
      else if (this.state === 'swing') { this.g.fx.emit(this.at, { count: 10, speed: 3, color: 0xffffff, size: 0.14, life: 0.3 }); if (p.onGround) { p.vel.y = S.lift; p.onGround = false; } }
    }
    if (this.hooked && this.state === 'pull') { // reel the mosquito in to arm's length
      const e = this.e, goal = p.eye.clone().addScaledVector(p.aimDir(new V3()), 1.8);
      if (e.dying) { this.release(); return; }
      e.pos.lerp(goal, 1 - Math.exp(-12 * dt)); e.vel && e.vel.set(0, 0, 0); e.stunT = Math.max(e.stunT, 0.3); tip = _b.copy(e.pos);
      if (this.t > this.out + S.pullT) this.release();
    } else if (this.hooked && this.state === 'swing') { // rope: pendulum + reel in
      const chest = p.pos.clone().setY(p.pos.y + 1), to = new V3().subVectors(this.at, chest), dist = to.length(); to.divideScalar(dist || 1);
      this.len = Math.max(1.5, this.len - S.reel * dt);
      if (dist > this.len) { const vr = p.vel.dot(to); if (vr < 0) p.vel.addScaledVector(to, -vr); p.vel.addScaledVector(to, (dist - this.len) * 6 * dt * 10); }
      p.vel.addScaledVector(to, 16 * dt); // reel pull: enough to climb towards a high anchor
      if (dist < 1.8 || this.t > S.swingT || p.held('jump') && this.t > 0.25) { p.vel.y = Math.max(p.vel.y, 4); p.airJumps = 0; this.release(); return; }
      tip = _b.copy(this.at);
    } else if (this.state === 'miss' && this.t > this.out + 0.08) { this.release(); return; }
    this.draw(hand, tip);
  }
  release() { this.g.audio.play('stretch', 0.6); this.hooked = false; this.end(); }
  draw(a, b) {
    const d = _c.subVectors(b, a), L = d.length();
    this.rubber.set(a, b, this.hooked ? 0.03 : 0.1, this.t * 26, 0.04);
    this.fist.g.position.copy(b); this.fist.g.quaternion.setFromUnitVectors(_nz, d.divideScalar(L || 1));
  }
}

// ---- Mille Claques: 1.5 s of slaps in a cone, afterimages, the combo explodes at the end ----
export class Mille extends Power {
  reset() { super.reset(); this.busy = false; }
  down() {
    if (!this.ready()) return;
    this.start(SPEC.mille.cd); this.busy = true; this.t = 0; this.next = 0; this.n = 0; this.hits = 0;
    this.g.audio.play('whoosh'); this.p.fov.kick(-15);
  }
  update(dt) {
    super.update(dt);
    if (!this.busy) return;
    const S = SPEC.mille, c = this.c, p = this.p;
    if (p.dead) { this.busy = false; return; }
    this.t += dt;
    while (this.busy && this.next <= this.t && this.next < S.dur) {
      this.next += S.every; const side = this.n++ % 2 ? 'L' : 'R';
      c.swing('mille', 0.14, side); p.hands.ghost(side);
      this.g.audio.play('slap', 0.5 + Math.random() * 0.4);
      for (const e of c.targets(S.range * this.st.rangeMul, S.dot)) {
        e.damage(S.dmg * c.dmgM, { from: p.eye, kb: c.kbFor(e, 1.5, 0.2), stun: 0.25 }); this.hits++;
        this.g.fx.emit(e.pos, { count: 4, speed: 3, color: 0xfff2b0, size: 0.14, life: 0.25 });
      }
      p.shake(0.05);
      if (this.hits && this.n % 6 === 0) bus.emit('float', { pos: p.eye.clone().addScaledVector(p.aimDir(_b), 2.2), text: `×${this.hits}`, cls: 'note' });
    }
    if (this.t >= S.dur) this.finish();
  }
  finish() { // the combo explodes
    const S = SPEC.mille, c = this.c, p = this.p; this.busy = false;
    c.swing('clap', 0.4, 'R'); c.swing('clap', 0.4, 'L'); this.g.audio.play('clap');
    const fw = p.eye.clone().addScaledVector(p.aimDir(_a), 2);
    this.g.rings.spawn(fw, 0xffee99, 4 * this.st.rangeMul, 0.35);
    const n = c.strike(S.finisher, { range: (S.range + 0.6) * this.st.rangeMul, dot: 0, kb: 14, stun: 0.6, crit: 0.3, shake: 0.6, hs: 0.08, flash: 0.35, words: ['MILLE CLAQUES!!'] });
    if (this.hits) bus.emit('float', { pos: fw, text: `COMBO ×${this.hits + n}`, cls: 'note' });
  }
}
