// Player: FPS controller with acrobatics (double jump, wall-jump, roll, air dash), spring camera.
import * as THREE from 'three';
import { bus, Spring, clamp, damp, easeInOut } from '../core/core.js';
import { moveBody } from '../level/Physics.js';
import { Hands } from './Hands.js';
import { Combat } from './Combat.js';
import { Settings } from '../core/Settings.js';
import { CFG } from './Moves.js';
import { launchV } from '../level/Surfaces.js';

const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
export const DEFAULT_STATS = { jumpMul: 1, rangeMul: 1, punchCd: 1.5, airJumps: 1, saltoBonus: 0, dmgMul: 1, cdMul: 1, invuln: false, power: false, ultra: false, weapons: ['hands'], handPower: null, rateMul: 1, powerCdMul: 1 };

export class Player {
  constructor(game) {
    this.g = game; this.cam = game.camera; this.cam.rotation.order = 'YXZ';
    this.pos = new V3(); this.vel = new V3(); this.radius = 0.4; this.height = 1.8; this.onGround = true; this.wall = null;
    this.keys = new Set(); this.wish = new V3(); this.eye = new V3();
    this.eyeY = new Spring(1.7, 500, 42); this.fov = new Spring(80, 140, 16); this.roll = new Spring(0, 90, 12);
    this.flip = new Spring(0, 200, 20); this.kick = new Spring(0, 150, 14); this.bobAmp = new Spring(0, 60, 10);
    this.stats = { ...DEFAULT_STATS }; this.gravMul = 1; this.buffs = { rage: 0, haste: 0, jump: 0 }; this.stand = null; this.ultCharge = 0; this.ultT = 0; this.prevWeapon = 'hands';
    this.hands = new Hands(this.cam); this.combat = new Combat(game, this);
    this.maxHp = CFG.maxHp; // multiplayer matches raise it (CoopSession.baseHp)
    this.reset();
  }
  reset() {
    this.pos.set(0, 0, 0); this.vel.set(0, 0, 0); this.yaw = 0; this.pitch = 0; this.hp = this.maxHp; this.dead = false;
    this.invulnT = 0; this.invulnCd = 0; this.stunT = 0; this.rollT = 0; this.rollCd = 0; this.dashT = 0; this.dashCd = 0;
    this.flipT = 0; this.flipDur = 0; this.flipDir = 1; this.saltoT = 0; this.airJumps = 0; this.coyote = 0; this.jumpBuf = 0; this.wallCd = 0; this.wallTime = 0;
    this.wallN = null; this.djCd = 0; this.bobPhase = 0; this.shakeA = 0; this.weapon = 'hands'; this.hands.setWeapon('hands'); this.ultT = 0;
    this.rollDir = new V3(0, 0, -1); this.dashDir = new V3(0, 0, -1); this.sprinting = false; this.crouching = false; this.hurtT = 0; this.jumping = false;
    this.eyeY.snap(1.7); this.flip.snap(0); this.combat.reset(); this.keys.clear(); this.buffs.rage = this.buffs.haste = this.buffs.jump = 0; this.stand = null;
  }
  get alive() { return !this.dead; }
  canAct() { return !this.dead && this.stunT <= 0 && this.g.live; }

  // ---- input ----
  look(dx, dy) {
    if (!this.g.live) return;
    const s = 0.0022 * Settings.v.sens;
    this.yaw -= dx * s; this.pitch = clamp(this.pitch - dy * s * (Settings.v.invertY ? -1 : 1), -1.5, 1.5);
  }
  key(code, down) {
    if (down) {
      if (this.keys.has(code)) return;
      this.keys.add(code);
      if (!this.canAct()) return;
      const a = Settings.action(code);
      if (a === 'jump') this.jumpBuf = CFG.buffer;
      else if (a === 'sprint' && !this.onGround) this.tryDash();
      else if (a === 'crouch') this.tryRoll();
      else if (a === 'invuln') this.tryInvuln();
      else if (a === 'ultra') this.tryUltra();
      else if (a === 'power') this.tryPower();
      else if (a === 'w1') this.selectWeapon('hands');
      else if (a === 'w2') this.selectWeapon(this.stats.weapons[1] || 'none');
    } else {
      this.keys.delete(code);
      const a = Settings.action(code);
      if (a === 'jump' && this.jumping && this.vel.y > 0) { this.vel.y *= 0.55; this.jumping = false; } // variable jump height
      else if (a === 'power') this.combat.powerUp();
    }
  }
  selectWeapon(w) {
    if (this.ultT > 0) return; // locked into the bomb during the ultra
    if (!this.stats.weapons.includes(w)) { bus.emit('toast', { text: w === 'none' ? 'Aucune arme équipée (Armurerie)' : 'Arme verrouillée', kind: 'warn' }); return; }
    this.combat.weaponObj?.up(true); this.weapon = w; this.hands.setWeapon(w); this.combat.holding = false; this.g.audio.play('ui'); bus.emit('weapon', { w });
  }
  cycleWeapon() { const w = this.stats.weapons; if (w.length > 1 && this.canAct()) this.selectWeapon(w[(w.indexOf(this.weapon) + 1) % w.length]); } // mouse wheel
  // hand power [F] (spec §9-10): unlocked at s15 (always on in the Chasse); the object lives in Combat.powers
  tryPower() {
    if (this.stats.handPower) { this.combat.powerDown(); return; }
    const lo = this.g.run && this.g.run.loadout;
    bus.emit('toast', { text: lo && lo.power ? 'Pouvoir des mains : pas encore débloqué' : 'Aucun pouvoir équipé (Armurerie)', kind: 'warn' });
  }
  held(action) { return Settings.held(this.keys, action); }

  // ---- actions ----
  jumpV(h) { return launchV(h); }
  tryJump() {
    const S = this.stats, jb = this.buffs.jump > 0 ? 1.15 : 1;
    if (this.onGround || this.coyote > 0) {
      this.vel.y = this.jumpV(CFG.jumpH) * S.jumpMul * jb; this.onGround = false; this.coyote = 0; this.jumping = true; this.airJumps = 0;
      this.g.audio.play('jump'); this.dust(6); return true;
    }
    if (this.wallTime > 0 && this.wallCd <= 0 && this.wallN) {
      const n = this.wallN;
      this.vel.set(n.x * 8 + this.wish.x * 2, this.jumpV(CFG.jumpH) * 0.9 * S.jumpMul * jb, n.z * 8 + this.wish.z * 2);
      this.wallCd = 0.3; this.wallTime = 0; this.airJumps = Math.max(0, this.airJumps - 1); this.jumping = true;
      this.g.audio.play('wall'); this.g.fx.emit(this.pos.clone().setY(this.pos.y + 1), { count: 12, speed: 3, color: 0xffe9a0, size: 0.2, life: 0.4 });
      this.yaw += 0; bus.emit('player:walljump'); return true;
    }
    if (this.airJumps < S.airJumps + (this.buffs.jump > 0 ? 1 : 0) && this.djCd <= 0) {
      this.airJumps++; this.djCd = 0.3; this.jumping = false;
      bus.emit('player:doublejump');
      this.vel.y = this.jumpV(CFG.djH); this.g.audio.play('djump');
      this.g.fx.emit(this.pos, { count: 10, speed: 3, color: 0xbfe6ff, size: 0.25, life: 0.4 });
      return true;
    }
    return false;
  }
  tryDash() {
    if (this.dashCd > 0 || this.dashT > 0) return;
    const d = this.wish.lengthSq() > 0.01 ? this.wish.clone().normalize() : this.forward();
    this.dashDir.copy(d); this.dashT = CFG.dashDur; this.dashCd = CFG.dashCd * this.stats.cdMul * (this.buffs.haste > 0 ? 0.4 : 1);
    this.vel.x = d.x * CFG.dashSpeed; this.vel.z = d.z * CFG.dashSpeed; this.vel.y = Math.max(this.vel.y * 0.3, 1.5);
    this.fov.kick(120); this.g.audio.play('dash'); this.shake(0.15);
    bus.emit('player:dash');
  }
  tryRoll() {
    if (!this.onGround || this.rollT > 0 || this.rollCd > 0 || this.wish.lengthSq() < 0.01 || !this.held('sprint')) return;
    this.rollDir.copy(this.wish).normalize(); this.rollT = CFG.rollDur; this.rollCd = CFG.rollCd * this.stats.cdMul * (this.buffs.haste > 0 ? 0.4 : 1);
    this.invulnT = Math.max(this.invulnT, CFG.rollDur + 0.1); this.startFlip(CFG.rollDur, -1);
    this.combat.rollHit.clear(); this.g.audio.play('roll'); bus.emit('player:roll');
  }
  // ULTRA: temporary giant anti-mosquito spray bomb (charged by kills)
  tryUltra() {
    if (!this.stats.ultra) return;
    if (this.ultT > 0 || this.ultCharge < 100) { if (this.ultT <= 0) bus.emit('toast', { text: 'Ultra pas prêt (' + Math.floor(this.ultCharge) + '%)', kind: 'warn' }); return; }
    this.ultCharge = 0; this.ultT = 10; this.combat.weaponObj?.up(true); this.prevWeapon = this.weapon; this.weapon = 'bomb'; this.hands.setWeapon('bomb'); this.combat.holding = false; this.combat.charge = 0;
    this.g.audio.play('ult'); this.g.flash = 0.6; this.shake(0.4); this.g.rings.spawn(this.eye, 0xb6ff5a, 6, 0.6);
    bus.emit('ultra:start'); bus.emit('toast', { text: 'ULTRA — BOMBE ANTI-MOUSTIQUES (maintenir clic)', kind: 'good' });
  }
  endUltra() {
    this.ultT = 0; this.combat.spraying = false;
    this.weapon = this.stats.weapons.includes(this.prevWeapon) ? this.prevWeapon : 'hands'; this.hands.setWeapon(this.weapon);
    bus.emit('ultra:end'); bus.emit('toast', { text: 'Bombe vide', kind: 'warn' });
  }
  tryInvuln() {
    if (!this.stats.invuln || this.invulnCd > 0) return;
    this.invulnT = 2; this.invulnCd = 20 * this.stats.cdMul; this.g.audio.play('invuln'); bus.emit('toast', { text: 'INVULNÉRABLE 2s', kind: 'good' });
    this.g.rings.spawn(this.eye, 0x88ddff, 3, 0.5);
  }
  startFlip(dur, dir) { this.flipT = 0.0001; this.flipDur = dur; this.flipDir = dir; }
  forward() { return new V3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  aimDir(out = new V3()) { return out.set(0, 0, -1).applyEuler(this.cam.rotation); }
  dust(n) { this.g.fx.puff(this.pos, Math.max(4, Math.round(n * 0.6)), 0xffffff, 0.15); } // round dust puffs (spec §6)
  shake(a) { this.shakeA = Math.max(this.shakeA, a); }

  hurt(dmg, from, o = {}) {
    if (this.dead || this.invulnT > 0) return false;
    this.hp = Math.max(0, this.hp - dmg); this.hurtT = 0.35;
    this.shake(Math.min(1, 0.2 + dmg * 0.04)); this.kick.kick(-2.5);
    if (o.stun) { this.stunT = o.stun; this.g.audio.play('stun'); }
    this.g.audio.play(dmg >= 10 ? 'hurt' : 'sting');
    bus.emit('player:hurt', { dmg, from, by: o.by });
    if (this.hp <= 0) { this.dead = true; bus.emit('player:dead'); }
    return true;
  }

  // ---- per-frame ----
  update(dt) {
    const lv = this.g.level, S = this.stats, k = (a) => this.held(a);
    this.stunT -= dt; this.invulnT -= dt; this.invulnCd -= dt; this.rollCd -= dt; this.dashCd -= dt; this.wallCd -= dt; this.djCd -= dt; this.hurtT -= dt;
    let fwd = (k('forward') ? 1 : 0) - (k('back') ? 1 : 0);
    let str = (k('right') ? 1 : 0) - (k('left') ? 1 : 0);
    if (this.stunT > 0 || this.dead) fwd = str = 0;
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    this.wish.set(-sy * fwd + cy * str, 0, -cy * fwd - sy * str);
    if (this.wish.lengthSq() > 1) this.wish.normalize();
    const moving = this.wish.lengthSq() > 0.01;
    this.crouching = k('crouch') && this.rollT <= 0;
    this.sprinting = k('sprint') && moving && !this.crouching;
    this.height = this.crouching || this.rollT > 0 ? 1.2 : 1.8;

    if (this.rollT > 0) {
      this.rollT -= dt; const p = 1 - this.rollT / CFG.rollDur, sp = CFG.rollSpeed * (1 - 0.35 * p);
      this.vel.x = this.rollDir.x * sp; this.vel.z = this.rollDir.z * sp;
    } else if (this.dashT > 0) {
      this.dashT -= dt; this.vel.x = this.dashDir.x * CFG.dashSpeed; this.vel.z = this.dashDir.z * CFG.dashSpeed;
      this.g.fx.emit(this.eye.clone().add(new V3(0, -0.3, 0)), { count: 2, speed: 0.6, color: 0x9fdcff, size: 0.18, life: 0.3 });
    } else {
      const speed = (this.crouching ? CFG.crouch : this.sprinting ? CFG.sprint : CFG.walk) * (this.buffs.haste > 0 ? 1.3 : 1);
      const hs = Math.hypot(this.vel.x, this.vel.z);
      if (this.onGround) {
        const grip = (this.stand && this.stand.grip) || 14; // ice platforms (collider.grip): the player slides
        this.vel.x = damp(this.vel.x, this.wish.x * speed, grip, dt); this.vel.z = damp(this.vel.z, this.wish.z * speed, grip, dt);
      } else {
        const cap = Math.max(speed, hs), l = moving ? 2.6 : 0.12; // momentum is conserved in the air
        this.vel.x = damp(this.vel.x, this.wish.x * cap, l, dt); this.vel.z = damp(this.vel.z, this.wish.z * cap, l, dt);
      }
    }
    if (!this.onGround) this.vel.y = Math.max(-40, this.vel.y - CFG.gravity * this.gravMul * dt * (this.dashT > 0 ? 0.15 : 1));
    if (this.jumpBuf > 0) { this.jumpBuf -= dt; if (this.canAct() && this.tryJump()) this.jumpBuf = 0; }
    this.coyote = this.onGround ? CFG.coyote : this.coyote - dt;

    for (const k in this.buffs) if (this.buffs[k] > 0) this.buffs[k] -= dt;
    if (this.stand && this.stand.d && this.onGround) this.pos.add(this.stand.d); // ride moving platforms
    const wasGround = this.onGround, vyBefore = this.vel.y;
    moveBody(this, lv, dt);
    if (this.wall && !this.onGround) { this.wallTime = 0.15; this.wallN = this.wall; } else this.wallTime -= dt;
    if (this.onGround && !wasGround) {
      const impact = -vyBefore;
      this.airJumps = 0; this.jumping = false;
      if (impact > 4) { this.g.audio.play('land', clamp(impact / 20, 0.3, 1)); this.kick.kick(clamp(impact, 0, 20) * 0.2); this.dust(8); this.eyeY.kick(-impact * 0.5); }
      this.saltoT = 0;
      if (this.flipT > 0 && this.rollT <= 0) this.flipT = 0.9999 * this.flipDur; // finish rotation gracefully
    }
    const sf = this.onGround && this.stand;
    if (sf && sf.launch) { // movement plate: rebond (up), propulseur (up + forward), accélérateur (hop + dash); the double jump stays available
      this.vel.y = sf.launch; if (sf.push) { this.vel.x = sf.push.x; this.vel.z = sf.push.z; }
      this.onGround = false; this.stand = null; this.airJumps = 0; this.jumping = false; this.coyote = 0;
      const dash = sf.kind === 'speed'; this.g.audio.play(dash ? 'dash' : 'boing'); this.kick.kick(4); if (dash) this.fov.kick(120);
      this.g.fx.emit(this.pos.clone().setY(this.pos.y + 0.2), { count: 12, speed: 4, color: dash ? 0xffe08a : 0xd8ff8a, size: 0.22, life: 0.4 });
      lv.bounced?.(sf); bus.emit('player:bounce');
    } else if (sf && sf.crumble) sf.load = true;
    if (this.saltoT > 0) this.saltoT += dt;
    if (this.saltoT > CFG.saltoDur + 0.15) this.saltoT = 0;

    // safe zones regenerate HP
    if (!this.dead && lv.inZone(this.pos)) this.hp = Math.min(this.maxHp, this.hp + 6 * dt * (this.maxHp / CFG.maxHp));

    if (this.ultT > 0) { this.ultT -= dt; if (this.ultT <= 0 || this.dead) this.endUltra(); }
    this.combat.update(dt);
    this.combat.passive(dt);

    // ---- camera ----
    const hSpeed = Math.hypot(this.vel.x, this.vel.z);
    this.bobAmp.t = this.onGround && moving ? clamp(hSpeed / 6, 0, 1.3) : 0; const ba = this.bobAmp.update(dt);
    if (this.onGround) this.bobPhase += hSpeed * dt * 1.1;
    this.eyeY.t = this.pos.y + (this.rollT > 0 ? 0.85 : this.crouching ? CFG.eyeCrouch : CFG.eyeStand);
    const ey = this.eyeY.update(dt);
    if (this.flipT > 0) {
      this.flipT += dt; const p = Math.min(1, this.flipT / this.flipDur);
      this.flip.t = this.flipDir * TAU * easeInOut(p);
      if (p >= 1) { this.flipT = 0; this.flip.x -= this.flipDir * TAU; this.flip.t = 0; }
    } else this.flip.t = 0;
    this.roll.t = -str * 0.025 * Math.min(1, hSpeed / 5) + (this.stunT > 0 ? 0.1 : 0);
    const fovT = Settings.v.fov + (this.sprinting ? 7 : 0) + (this.dashT > 0 ? 16 : 0) + (this.rollT > 0 ? 6 : 0) + Math.min(8, Math.abs(this.vel.y) * 0.25) + (this.g.state === 'falling' ? Math.min(12, Math.abs(this.vel.y) * 0.4) : 0);
    this.fov.t = fovT; const fv = this.fov.update(dt);
    if (Math.abs(fv - this.cam.fov) > 0.02) { this.cam.fov = fv; this.cam.updateProjectionMatrix(); }
    this.eye.set(this.pos.x + Math.cos(this.bobPhase) * 0.022 * ba, ey + Math.sin(this.bobPhase * 2) * 0.035 * ba, this.pos.z);
    this.shakeA = Math.max(0, this.shakeA - dt * 2.4);
    const sk = this.shakeA * this.shakeA * 0.12 * Settings.v.shake;
    this.cam.position.set(this.eye.x + (Math.random() - 0.5) * sk, this.eye.y + (Math.random() - 0.5) * sk, this.eye.z + (Math.random() - 0.5) * sk);
    this.cam.rotation.set(this.pitch + this.flip.update(dt) + this.kick.update(dt) * 0.02, this.yaw, this.roll.update(dt) + (Math.random() - 0.5) * sk * 0.5);

    this.hands.charge = this.combat.charge > 0 ? this.combat.charge : 0;
    this.hands.update(dt, { bobPhase: this.bobPhase, bobAmp: ba, sprint: this.sprinting, air: !this.onGround, spraying: this.combat.spraying });
  }
  get motion() { return this.vel.y < -14 ? 1.0 : this.dashT > 0 ? 1.4 : this.rollT > 0 ? 0.8 : this.sprinting ? 0.28 : 0; }
}
