// Jumeaux Acides (spec §10 + sheet "arme_acid_spray_dual_pistols"): two acid pistols firing in turn while the click is held.
// Left pistol = green jet (slows), right pistol = yellow jet (corrosion, stacks to 5). A jet landing on a target the other
// colour hit less than 1 s ago deals ×1.5. Pressure gauge: 5 per jet, refills by itself. Right click: double squirt in a cone.
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { Weapon } from './Weapon.js';
import { JET_KIND } from '../player/ViewModel.js';
import { SPEC, Pressure, addCorrosion, corrode, inCone, twinMul } from './specs.js';

const V3 = THREE.Vector3, J = SPEC.jumeaux, MAX = 40;
const COL = { vert: new THREE.Color(0x7bea3a), jaune: new THREE.Color(0xffd23c) }, CORE = 0xf4ffb0;
const _a = new V3(), _b = new V3(), _d = new V3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new V3(), _z = new V3(0, 0, 1);

export class Jumeaux extends Weapon {
  constructor(c) {
    super(c);
    this.pres = new Pressure(); this.firing = false; this.fireT = 0; this.side = 0; this.jets = []; this.marks = new Map(); this.now = 0; this.tickT = 0; this.wordT = 0;
    // jets are drawn by the shared AcidJets pool (inked screen-space capsules from the sheet); hits come back through onHit
    this.acid = this.g.acid; this.proxies = new WeakMap(); this.tg = [];
    this.acid.onHit = (tg, pos, kind, vel, tag) => { if (kind === JET_KIND.JET && tag < 2) tg.owner.land(tg.e, tag ? 'jaune' : 'vert', J.dmg); };
    this.acid.onSurface = (pos, n, kind, col) => { if (kind === JET_KIND.JET && n.y > 0.7 && pos.y < 0.6) this.g.splats.spawn(_b.copy(pos).setY(0.03), col.clone(), 0.3); };
  }
  reset() { super.reset(); this.pres.v = J.pressure.max; this.firing = false; this.acid.n = 0; this.marks.clear(); }
  down() { this.firing = true; }
  up() { this.firing = false; }
  unequip() { this.firing = false; }
  muzzle(side, out) { const h = this.p.hands; h.root.updateWorldMatrix(true, true); return h.twin.muzzle(side === 'vert' ? 'L' : 'R', out); }

  shoot() {
    if (!this.pres.spend(J.pressure.shot)) { if (this.wordT <= 0) { this.g.audio.play('sizzle', 0.6); this.wordT = 0.5; } return; }
    const side = this.side++ % 2 ? 'jaune' : 'vert', hand = side === 'vert' ? 'L' : 'R';
    const m = this.muzzle(side, new V3()), aim = this.p.aimDir(new V3());
    const dir = _d.copy(this.p.eye).addScaledVector(aim, J.range).sub(m).normalize();
    this.acid.fire(m, dir, { speed: J.speed, grav: J.grav, life: J.range / J.speed, w: 0.028, color: COL[side], tag: side === 'jaune' ? 1 : 0 });
    this.acid.burst(m, null, 1, 0.6, 0.016, COL[side]);
    this.c.swing('shoot', 0.1, hand); this.g.audio.play('squirt', side === 'vert' ? 1 : 1.3); this.p.kick.kick(-0.6);
    this.g.fx.emit(m, { count: 3, speed: 3, color: COL[side].getHex(), size: 0.08, life: 0.18, dir: aim, spread: 0.5 });
  }
  alt() { // double squirt: both colours at once in a 20° cone, 7 m — the second jet always gets the twin bonus
    if (this.cd > 0 || !this.p.canAct()) return;
    if (!this.pres.spend(J.burst.cost)) { this.g.audio.play('sizzle', 0.8); bus.emit('float', { pos: this.p.eye.clone().addScaledVector(this.p.aimDir(_d), 2), text: 'PLUS DE PRESSION', cls: 'note' }); return; }
    this.cd = J.burst.cd; this.c.swing('shoot', 0.3, 'L'); this.c.swing('shoot', 0.3, 'R'); this.g.audio.play('gush'); this.p.shake(0.2); this.p.kick.kick(-2);
    const eye = this.p.eye, aim = this.p.aimDir(new V3());
    for (const side of ['vert', 'jaune']) {
      const m = this.muzzle(side, new V3());
      this.g.fx.emit(m, { count: 26, speed: 16, color: COL[side].getHex(), size: 0.16, life: 0.4, dir: aim, spread: 0.35 });
      for (let i = 0; i < 3; i++) { _d.copy(aim).add(_a.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.28)).normalize(); this.acid.fire(m, _d, { speed: J.speed * 0.7, grav: J.grav, life: 0.25, w: 0.036, color: COL[side], tag: 2 }); } // visual only (tag 2): the cone does the damage
      this.g.fx.emit(m, { count: 8, speed: 12, color: CORE, size: 0.12, life: 0.3, dir: aim, spread: 0.25 });
    }
    let n = 0;
    for (const e of this.enemies) {
      if (e.dying || !inCone(eye, aim, e.pos, J.burst.range + e.radius, J.burst.cone)) continue;
      n++; this.land(e, 'vert', J.burst.dmg); if (!e.dying) this.land(e, 'jaune', J.burst.dmg);
    }
    for (let i = 0; i < 3; i++) { // puddles ahead on the floor
      const k = 3.2 + i * 1.8; _a.copy(eye).addScaledVector(aim, k); if (_a.y > 3) continue;
      this.g.splats.spawn(_a.setY(this.p.pos.y + 0.03), i % 2 ? COL.jaune : COL.vert, 0.4);
    }
    if (n) { this.g.hitstop(0.04); bus.emit('boom', { pos: eye.clone().addScaledVector(aim, 3), text: 'SPLOTCH!!' }); }
  }
  // one jet (or squirt) landing on e
  land(e, side, base) {
    const mk = this.marks.get(e) || { vert: null, jaune: null, corr: null };
    const mul = twinMul(mk, side, this.now);
    mk[side] = this.now; this.marks.set(e, mk);
    if (side === 'vert') e.slowT = Math.max(e.slowT, J.slow);
    else mk.corr = addCorrosion(mk.corr);
    e.damage(base * mul * this.c.dmgM, { from: this.p.eye, crit: mul > 1 });
    this.g.fx.emit(e.pos, { count: mul > 1 ? 10 : 5, speed: 3, color: COL[side].getHex(), size: 0.14, life: 0.35 });
    if (mul > 1 && this.wordT <= 0) { this.wordT = 0.45; bus.emit('float', { pos: e.pos, text: 'ACIDE ×2', cls: 'note' }); }
  }
  update(dt) {
    super.update(dt); this.now += dt; this.wordT -= dt;
    this.fireT -= dt;
    if (this.firing && this.p.weapon === 'jumeaux' && this.p.canAct()) { while (this.fireT <= 0) { this.shoot(); this.fireT += 1 / (J.rate * this.st.rateMul); } }
    else this.fireT = Math.max(this.fireT, 0);
    this.pres.update(dt); // a successful jet resets the 0.4 s delay; holding on an empty gauge sputters as it refills
    this.p.hands.setPressure(this.pres.ratio);
    this.syncTargets();
    // corrosion ticks (4 per s) + drips
    this.tickT -= dt;
    if (this.tickT <= 0) {
      this.tickT = 0.25;
      for (const [e, mk] of this.marks) {
        if (e.dying || this.now - Math.max(mk.vert ?? -9, mk.jaune ?? -9) > 4) { this.marks.delete(e); continue; }
        const d = corrode(mk.corr, 0.25); if (d <= 0) continue;
        e.damage(d * this.c.dmgM, { silent: true });
        this.g.fx.emit(e.pos, { count: mk.corr.n, speed: 1, color: 0xb8f53a, size: 0.1, life: 0.5, up: -0.5 });
      }
    }
  }
  // the pool tests its jets against these proxies (one per live mosquito, radius + 14 cm like the old segment test)
  syncTargets() {
    const tg = this.tg; tg.length = 0;
    for (const e of this.enemies) {
      let t = this.proxies.get(e); if (!t) { t = { pos: e.pos, e, owner: this, r: 0, alive: true }; this.proxies.set(e, t); }
      t.pos = e.pos; t.r = e.radius + 0.14; t.alive = !e.dying; tg.push(t);
    }
    this.acid.targets = tg;
  }
  hud() { return 1 - this.pres.ratio; }
}
