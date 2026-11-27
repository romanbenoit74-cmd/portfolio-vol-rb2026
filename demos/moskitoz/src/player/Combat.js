// Combat resolution: hands (swipe/combo/power punch), movement attacks (stomp/roll/salto), and the shared helpers the
// arsenal uses. The equipped weapon (key 2) and hand power (key F) are objects from src/weapons (Weapon interface).
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { Racket, Spray, Trap } from '../weapons/classic.js';
import { Jumeaux } from '../weapons/jumeaux.js';
import { Doigt, Grappin, Mille } from '../weapons/powers.js';
import { Aspi, Citro, Clap, Onde, Tapette, Toile, Tourbillon } from '../weapons/v2.js';

const V3 = THREE.Vector3;
const _f = new V3(), _d = new V3();

export class Combat {
  constructor(game, player) {
    this.g = game; this.p = player; this.saltoHit = new Set(); this.rollHit = new Set();
    this.arsenal = { racket: new Racket(this), spray: new Spray(this), trap: new Trap(this), jumeaux: new Jumeaux(this), aspi: new Aspi(this), tapette: new Tapette(this), citro: new Citro(this) }; // engine id (WEAPON_OF)
    this.powers = { doigt: new Doigt(this), grappin: new Grappin(this), mille: new Mille(this), tourbillon: new Tourbillon(this), clap: new Clap(this), toile: new Toile(this), onde: new Onde(this) }; // item id
    this.reset();
  }
  reset() {
    this.holding = false; this.holdT = 0; this.cd = 0; this.punchCd = 0; this.combo = 0; this.comboT = 0; this.hand = 'R';
    this.charge = 0; this.stompCd = 0; this.wCd = 0; this.full = false; this.fcd = 0; this.pending = []; this.spraying = false; this.sprayT = 0; this.hissT = 0;
    for (const w of Object.values(this.arsenal)) w.reset();
    for (const w of Object.values(this.powers)) w.reset();
  }
  get weaponObj() { return this.arsenal[this.p.weapon] || null; }
  get powerObj() { return this.powers[this.p.stats.handPower] || null; }
  get st() { return this.p.stats; }
  get dmgM() { return this.p.stats.dmgMul * (this.p.buffs.rage > 0 ? 1.5 : 1); }
  get enemies() { return this.g.enemies.list; }

  down() {
    if (!this.p.canAct()) return;
    const w = this.p.weapon;
    if (w === 'bomb') this.spraying = true;
    else if (w === 'hands') { this.holding = true; this.holdT = 0; this.full = false; }
    else this.weaponObj?.down();
  }
  up() {
    this.spraying = false; this.weaponObj?.up();
    if (!this.holding) return;
    this.holding = false;
    if (this.holdT >= 0.5 && this.punchCd <= 0 && this.st.power) this.power(); else this.swipe();
    this.charge = 0;
  }

  update(dt) {
    this.cd -= dt; this.fcd -= dt; this.punchCd -= dt;
    for (let i = this.pending.length - 1; i >= 0; i--) { const q = this.pending[i]; q.t -= dt; if (q.t <= 0) { this.pending.splice(i, 1); if (!this.p.dead) q.fn(); } } this.comboT -= dt; this.stompCd -= dt; this.wCd -= dt;
    if (this.holding) {
      if (!this.p.canAct()) { this.holding = false; this.charge = 0; }
      else {
        if (this.holdT === 0 && this.punchCd <= 0 && this.st.power) this.g.audio.play('charge');
        this.holdT += dt;
        this.charge = this.punchCd > 0 || !this.st.power ? 0 : Math.min(1, this.holdT / 0.5);
        if (this.charge >= 1 && !this.full) { this.full = true; this.g.audio.play('crit'); this.g.fx.emit(this.p.eye.clone().addScaledVector(this.p.aimDir(_f), 0.6), { count: 12, speed: 2, color: 0xffdd55, size: 0.12, life: 0.3 }); }
      }
    }
    // ULTRA bomb: continuous poisonous cone
    if (this.spraying && this.p.weapon === 'bomb' && this.p.canAct()) this.bombTick(dt); else this.spraying = false;
    for (const w of Object.values(this.arsenal)) w.update(dt);
    for (const w of Object.values(this.powers)) w.update(dt);
    const po = this.powerObj; if (po && po.busy) this.p.hands.holster(0.4);
  }
  // right click: pichenette with bare hands, the weapon's alt fire otherwise
  alt() { if (this.p.weapon === 'hands') this.flick(); else if (this.p.canAct()) this.weaponObj?.alt(); }
  // [F] pressed / released (Player.tryPower checks the power is unlocked)
  powerDown() {
    const o = this.powerObj; if (!o) return;
    const cd = o.cd; o.down();
    if (o.busy || o.cd > cd) this.p.hands.holster(0.5); // it fired: bare hands for its animation
  }
  powerUp() { this.powerObj?.up(); }
  // pause / blur: drop every held input
  release() { this.holding = false; this.spraying = false; this.charge = 0; this.weaponObj?.up(true); this.powerObj?.up(true); }

  bombTick(dt) {
    const p = this.p, aim = p.aimDir(new V3()), nz = p.cam.localToWorld(new V3(0.3, -0.2, -0.95));
    this.g.fx.emit(nz, { count: 5, speed: 20, color: 0xc8ff6a, size: 0.55, life: 0.55, dir: aim, spread: 0.2 });
    this.g.fx.emit(nz, { count: 2, speed: 14, color: 0xffffff, size: 0.35, life: 0.45, dir: aim, spread: 0.3 });
    p.shake(0.06);
    this.hissT -= dt; if (this.hissT <= 0) { this.g.audio.play('hiss'); this.hissT = 0.13; }
    this.sprayT -= dt; if (this.sprayT > 0) return;
    this.sprayT = 0.1;
    for (const e of this.enemies) {
      if (e.dying) continue;
      _d.subVectors(e.pos, p.eye); const dist = _d.length();
      if (dist - e.radius > 8.5) continue;
      if (dist - e.radius > 1.2 && _d.divideScalar(dist).dot(aim) < 0.86) continue;
      e.damage(3 * this.dmgM, { poison: 5, shock: true, silent: true, from: p.eye, kb: new V3(aim.x, 0.2, aim.z).multiplyScalar(1.4) });
    }
  }

  // ---- helpers ----
  inCone(e, range, minDot) {
    const eye = this.p.eye; this.p.aimDir(_f);
    _d.subVectors(e.pos, eye); const dist = _d.length(); if (dist - e.radius > range) return false;
    if (dist - e.radius < 1.0) return true;
    return _d.divideScalar(dist).dot(_f) >= minDot;
  }
  hit(e, base, o = {}) {
    const dmg = base * this.dmgM;
    const killed = e.damage(dmg, { ...o, from: this.p.eye });
    const crit = !!o.crit;
    this.g.fx.emit(e.pos, { count: crit ? 16 : 9, speed: crit ? 6 : 4, color: crit ? 0xffdd33 : 0xffd9a0, size: crit ? 0.3 : 0.2, life: 0.4 });
    this.g.audio.play(crit ? 'crit' : 'hit', 0.8 + Math.random() * 0.5);
    if (!killed) this.g.audio.play('punch', 0.6);
    return killed;
  }
  targets(range, dot) { return this.enemies.filter((e) => !e.dying && this.inCone(e, range, dot)); }
  kbFor(e, force, up = 0.5) { this.p.aimDir(_f); return new V3(_f.x, 0, _f.z).normalize().multiplyScalar(force / Math.max(0.6, e.def.scale * 1.2)).setY(up); }
  later(delay, fn) { this.pending.push({ t: delay, fn }); }
  boom(pos, text) { bus.emit('boom', { pos: pos.clone(), text }); }
  swing(kind, dur, hand = 'R') { this.p.hands.attack(hand, kind, dur); if (this.g.coop) this.g.coop.sendAttack(hand, kind, dur); }
  // resolve a hit on everything in the cone; returns hit count
  strike(base, o) {
    const list = this.targets(o.range, o.dot); let n = 0;
    for (const e of list) {
      const crit = Math.random() < (o.crit ?? 0.08); n++;
      this.hit(e, crit ? base * 2 : base, { kb: this.kbFor(e, o.kb, o.up ?? 0.5), stun: o.stun || 0, crit });
      this.g.rings.spawn(e.pos, crit ? 0xffdd33 : 0xfff2b0, e.radius * 2.6, 0.2);
      if (n <= 1) this.boom(e.pos, o.words[Math.floor(Math.random() * o.words.length)]);
    }
    if (n) { this.p.shake(o.shake ?? 0.15); this.g.hitstop(o.hs ?? 0.03); this.g.flash = Math.max(this.g.flash, o.flash ?? 0.12); }
    return n;
  }
  trail(n = 6) {
    this.p.aimDir(_f);
    const c = this.p.eye.clone().addScaledVector(_f, 1.2);
    this.g.fx.emit(c, { count: n, speed: 2.5, color: 0xfff2c0, size: 0.14, life: 0.25, dir: _f, spread: 0.6 });
  }

  // ---- attacks ----
  // Left click combo: claque (slap) -> coup de poing -> claque à deux mains (clap)
  swipe() {
    if (this.cd > 0) return;
    const cdm = this.st.cdMul, rm = this.st.rangeMul;
    this.combo = this.comboT > 0 ? (this.combo + 1) % 3 : 0; this.comboT = 0.75;
    if (this.combo === 0) {
      this.cd = 0.3 * cdm; this.swing('slap', 0.26, 'R'); this.g.audio.play('slap'); this.trail(10); this.p.roll.kick(-5);
      this.later(0.07, () => this.strike(10, { range: 2.7 * rm, dot: -0.1, kb: 5, words: ['CLAQUE!', 'SPLAF!', 'TCHAF!'] }));
    } else if (this.combo === 1) {
      this.cd = 0.28 * cdm; this.swing('jab', 0.22, 'L'); this.g.audio.play('swipe'); this.trail(8); this.p.kick.kick(-3);
      this.later(0.06, () => this.strike(13, { range: 2.6 * rm, dot: 0.3, kb: 8, shake: 0.22, hs: 0.045, words: ['PAF!', 'POW!', 'BAM!'] }));
    } else {
      this.cd = 0.75 * cdm; this.swing('clap', 0.6, 'R'); this.swing('clap', 0.6, 'L'); this.g.audio.play('swipe'); this.p.fov.kick(-30);
      this.later(0.315, () => {
        const fw = this.p.eye.clone().addScaledVector(this.p.aimDir(_f), 1.5), hp = this.p.cam.localToWorld(new V3(0, -0.15, -0.72));
        this.g.audio.play('clap'); this.p.fov.kick(90);
        this.g.fx.emit(hp, { count: 34, speed: 8, color: 0xfff2a0, size: 0.32, life: 0.45 }); this.g.fx.emit(hp, { count: 12, speed: 5, color: 0xffffff, size: 0.5, life: 0.3 });
        this.g.rings.spawn(hp, 0xffffff, 1.6, 0.18); this.g.rings.spawn(fw, 0xffee99, 3.4 * rm, 0.32); this.g.rings.spawn(fw.clone().setY(this.p.pos.y + 0.1), 0xffcc66, 4.2 * rm, 0.4, 'ring');
        this.boom(hp, 'CLAP!!'); bus.emit('player:clap', { pos: this.p.pos }); // coop: wakes a downed teammate
        this.strike(18, { range: 3.3 * rm, dot: -0.35, kb: 12, stun: 0.55, shake: 0.7, hs: 0.1, flash: 0.55, words: ['SPLASH!'] });
        this.p.kick.kick(2);
      });
    }
  }
  // Right click: pichenette (finger flick) — fast, long reach, precise, stuns small bugs
  flick() {
    if (!this.p.canAct() || this.fcd > 0 || this.p.weapon !== 'hands') return;
    this.fcd = 0.42 * this.st.cdMul; this.swing('flick', 0.34, 'R'); this.g.audio.play('flick');
    this.later(0.16, () => this.strike(8, { range: 5 * this.st.rangeMul, dot: 0.93, kb: 3, up: 0.2, stun: 0.45, crit: 0.25, shake: 0.08, words: ['TCHAC!', 'PLING!', 'TAC!'] }));
  }
  power() {
    this.punchCd = this.st.punchCd * this.st.cdMul; this.cd = 0.3;
    const range = 3.2 * this.st.rangeMul; this.swing('power', 0.3, 'R');
    this.g.audio.play('power'); this.trail(24); this.p.shake(0.25); this.p.kick.kick(3);
    this.later(0.1, () => {
      this.g.rings.spawn(this.p.eye.clone().addScaledVector(this.p.aimDir(_f), 1.6), 0xffcc66, range, 0.35);
      this.strike(30, { range, dot: 0.25, kb: 16, up: 1.5, stun: 0.4, crit: 1, shake: 0.7, hs: 0.09, flash: 0.5, words: ['KABOOM!', 'WHAM!', 'KRAK!'] });
    });
  }
  // ---- movement attacks (called every frame) ----
  passive(dt) {
    const p = this.p; if (p.dead) return;
    const chest = p.pos.y + 0.9;
    for (const e of this.enemies) {
      if (e.dying) continue;
      const hd = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
      // stomp: land on an enemy from above -> double damage + stun
      if (this.stompCd <= 0 && p.vel.y < -2 && !p.onGround && hd < e.radius + 0.7 && p.pos.y <= e.pos.y + e.radius * 0.9 + 0.3 && p.pos.y > e.pos.y - e.radius * 0.3) {
        this.stompCd = 0.2;
        this.hit(e, 20, { stun: 0.5, stomp: true, crit: true, kb: new V3(0, -2, 0) });
        p.vel.y = 8; p.airJumps = Math.max(0, p.airJumps - 1); p.shake(0.4); this.g.hitstop(0.06);
        this.g.rings.spawn(e.pos, 0xffee88, 2.4, 0.3); bus.emit('float', { pos: e.pos, text: 'ÉCRASÉ!', cls: 'note' });
      }
      // offensive roll: automatic hit + slide
      if (p.rollT > 0 && !this.rollHit.has(e) && hd < e.radius + 1.0 && Math.abs(e.pos.y - chest) < 1.8) {
        this.rollHit.add(e); this.hit(e, 12, { stun: 0.3, kb: new V3(p.rollDir.x * 9, 1, p.rollDir.z * 9) }); p.shake(0.25);
      }
    }
  }
}
