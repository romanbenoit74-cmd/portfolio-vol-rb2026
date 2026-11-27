// The surprise of floor 0: once the last room is cleared, a golden trophy rises out of the floor in front of the player under a beam of
// light, fireworks burst overhead and confetti falls for a few seconds before the victory screen. Pure staging: no gameplay, no saves.
import * as THREE from 'three';
import { bus, easeOut } from '../core/core.js';
import { gomme, flat, part, rbox, rcyl, torus } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';
import { TROPHY_TOP } from '../level/Hall.js';

export const FINALE_TIME = 9;
const PALETTE = [SIGNAL.coral, SIGNAL.gold, SIGNAL.sky, SIGNAL.acid, SIGNAL.violet, '#FFFFFF', '#FF9AD0'];
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const rnd = (a, b) => a + Math.random() * (b - a);

function makeTrophy() {
  const gold = gomme('#FFC62E', { rim: 0.55, rimColor: '#FFF3B8', shadow: 0.7, ao: 1 }), plum = gomme('#3A2E5C', { rim: 0.3, rimColor: '#8E7BFF', ao: 1 });
  const P = (geo, mat, x, y, z) => { const m = part(geo, mat, { ink: SIGNAL.ink, px: 3, cast: false, receive: false }); m.position.set(x, y, z); return m; };
  const g = new THREE.Group(), top = new THREE.Group(); g.add(top);
  g.add(P(rbox(0.62, 0.14, 0.62, 0.05, 4), plum, 0, 0.07, 0), P(rbox(0.44, 0.12, 0.44, 0.04, 4), gold, 0, 0.2, 0));
  top.add(P(rcyl(0.07, 0.1, 0.42, 0.03, 20), gold, 0, 0.47, 0), P(rcyl(0.3, 0.14, 0.46, 0.07, 28), gold, 0, 0.9, 0));
  for (const s of [-1, 1]) { const h = P(torus(0.13, 0.035, 8, 20, Math.PI), gold, s * 0.33, 0.92, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; top.add(h); }
  // five-point star on the lid
  const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.1 : 0.22; (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * r, Math.sin(a) * r); }
  sh.closePath();
  const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2 }); sg.translate(0, 0, -0.035);
  const star = P(sg, gomme('#FFE27A', { rim: 0.7, rimColor: '#FFFFFF', ao: 1 }), 0, 1.4, 0); top.add(star);
  g.userData = { top, star };
  g.traverse((o) => { o.frustumCulled = false; });
  return g;
}

export const HALL_TIME = 40; // the hall show ends on its own after this (Entrée / the button end it sooner)

export class Finale {
  constructor(game) { this.g = game; this.on = false; this.t = 0; this.root = null; this.hall = null; }
  /** The trophy hall show: spots light up one by one, the golden mosquito flashes, fireworks and confetti; the player walks free. */
  startHall(hall) {
    const g = this.g; this.stop(); this.hall = hall; hall.on = 0;
    this.on = true; this.t = 0; this.fw = 0; this.said = false; this.last = false; this.lit = 0; this.ring = 0;
    this.base = new THREE.Vector3(0, TROPHY_TOP, 0);
    g.hud.banner('SALLE DES TROPHÉES', 'Sous-sol −1 · la tour est vaincue', 3.2);
    if (g.touch) { // no Entrée key on a phone: a button ends the show
      const b = this.btn = document.createElement('button'); b.className = 'btn primary hall-exit'; b.textContent = 'Voir mon score';
      b.addEventListener('click', () => { g.endT = Math.min(g.endT, 0.15); }); document.getElementById('hud').appendChild(b);
    }
  }
  hallUpdate(dt) {
    const g = this.g, p = g.player, h = this.hall; this.t += dt; const t = this.t, top = this.base;
    p.invulnT = 99;
    h.on = Math.min(1, Math.max(0, (t - 0.6) / 2.2));
    if (t > 0.6 && this.lit < 6 && t > 0.6 + this.lit * 0.37) { this.lit++; g.audio.play('hit', 0.6 + this.lit * 0.12); } // one clunk per spot
    if (!this.said && t > 3) {
      this.said = true; g.flash = Math.max(g.flash, 0.8); g.audio.play('milestone'); g.audio.play('chest'); g.audio.play('crit');
      bus.emit('boom', { pos: top.clone(), text: 'CHAMPION !!' });
      for (let i = 0; i < 3; i++) g.rings.spawn(new THREE.Vector3(0, 1.4, 0), i % 2 ? '#FFFFFF' : SIGNAL.gold, 11 + i * 5, 0.9 + i * 0.3, 'ring');
      g.fx.emit(top.clone(), { count: 160, speed: 12, color: SIGNAL.gold, size: 0.8, life: 1.6 });
    }
    if (t > 3 && (this.ring -= dt) <= 0) { this.ring = 1.1; g.rings.spawn(new THREE.Vector3(0, 1.4, 0), SIGNAL.gold, 7, 1, 'ring'); }
    if (t > 3 && (this.fw -= dt) <= 0) { // fireworks under the ceiling, around the trophy
      this.fw = rnd(0.25, 0.5);
      const pos = new THREE.Vector3(rnd(-13, 13), rnd(12, 19), rnd(-13, 13)), col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      g.fx.emit(pos, { count: 80, speed: 9, color: col, size: 0.7, life: 1.3 }); g.fx.emit(pos, { count: 26, speed: 4, color: '#FFFFFF', size: 0.5, life: 0.8 });
      g.rings.spawn(pos, col, 3, 0.55); g.audio.play(Math.random() < 0.5 ? 'hit' : 'combo', 1 + Math.random());
    }
    if (t > 3) for (let i = 0; i < 2; i++) g.fx.emit(new THREE.Vector3(rnd(-20, 20), 21.5, rnd(-20, 20)), { count: 3, speed: 0.6, color: PALETTE[Math.floor(Math.random() * PALETTE.length)], size: 0.45, life: 4, up: -1.5, gravity: -4 }); // confetti
    if (t > 6.5 && !this.last) { this.last = true; g.hud.banner('MERCI D’AVOIR JOUÉ', g.touch ? 'Explore la salle · bouton « Voir mon score » pour finir' : 'Explore la salle · Entrée pour voir ton score', 4); g.audio.play('levelup'); }
  }
  /** Place the trophy a few metres ahead of the player, on free floor. */
  start() {
    const g = this.g, p = g.player, lv = g.level; this.stop();
    if (!this.root) { this.root = new THREE.Group(); this.trophy = makeTrophy(); this.root.add(this.trophy); this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 12, 28, 1, true), flat('#FFE27A', { transparent: true, opacity: 0.22, additive: true, depthWrite: false, side: THREE.DoubleSide, fog: false })); this.beam.position.y = 6; this.root.add(this.beam); }
    const fwd = g.camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize(); if (fwd.lengthSq() < 0.5) fwd.set(0, 0, -1);
    let spot = null;
    search: for (const d of [3.6, 3, 2.4, 4.4]) for (const a of [0, 0.5, -0.5, 1.1, -1.1]) {
      const v = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a), x = p.pos.x + v.x * d, z = p.pos.z + v.z * d;
      if (!lv || ([0.3, 0.9, 1.6].every((y) => lv.isFree(x, p.pos.y + y, z, 0.7)) && Math.abs(x) < lv.w / 2 - 1 && Math.abs(z) < lv.d / 2 - 1)) { spot = [x, z]; break search; }
    }
    spot = spot || [p.pos.x + fwd.x * 2, p.pos.z + fwd.z * 2];
    this.base = new THREE.Vector3(spot[0], p.pos.y, spot[1]); this.root.position.copy(this.base);
    this.trophy.scale.setScalar(0.01); this.trophy.position.y = -1.2; g.scene.add(this.root);
    this.on = true; this.t = 0; this.fw = 0.2; this.ring = 0; this.said = false;
    p.invulnT = 99; p.hands.root.visible = false;
    g.hud.banner('REZ-DE-CHAUSSÉE !', 'La tour est à vous… et ce n’est pas fini', 3.2);
    g.flash = Math.max(g.flash, 0.7); g.audio.play('milestone'); g.audio.play('chest'); g.hud.fade(0, 0);
  }
  update(dt) {
    if (!this.on) return;
    if (this.hall) return this.hallUpdate(dt);
    const g = this.g, p = g.player; this.t += dt; const t = this.t;
    p.keys.clear(); p.vel.x *= 0.8; p.vel.z *= 0.8; p.invulnT = 99; p.combat.up?.();
    // trophy rises and spins, bobbing once it is up
    const k = Math.min(1, t / 1.1), e = easeOutBack(k), tr = this.trophy;
    tr.scale.setScalar(Math.max(0.01, e * 1.8)); tr.position.y = -1.2 * (1 - easeOut(k)) + (k >= 1 ? Math.sin(t * 2.2) * 0.04 : 0);
    tr.userData.top.rotation.y += dt * 1.6; tr.userData.star.rotation.z = Math.sin(t * 3) * 0.12;
    this.beam.material.opacity = 0.08 + 0.05 * Math.sin(t * 5) + 0.06 * easeOut(Math.min(1, t));
    const top = this.base.clone().setY(this.base.y + 1.5);
    if (!this.said && t > 0.5) { this.said = true; bus.emit('boom', { pos: top, text: 'SURPRISE !!' }); g.audio.play('crit'); }
    // gold shock rings on the floor
    if ((this.ring -= dt) <= 0) { this.ring = 0.7; g.rings.spawn(this.base.clone(), SIGNAL.gold, 3.2, 0.9, 'ring'); }
    // fireworks overhead
    if (t > 0.5 && (this.fw -= dt) <= 0) {
      this.fw = rnd(0.22, 0.4);
      const pos = this.base.clone().add(new THREE.Vector3(rnd(-6, 6), rnd(3.5, 7), rnd(-6, 6))), col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      g.fx.emit(pos, { count: 70, speed: 9, color: col, size: 0.7, life: 1.2 }); g.fx.emit(pos, { count: 24, speed: 4, color: '#FFFFFF', size: 0.5, life: 0.8 });
      g.rings.spawn(pos, col, 2.6, 0.5); g.audio.play(Math.random() < 0.5 ? 'hit' : 'combo', 1 + Math.random());
    }
    // confetti
    if (t > 0.3) g.fx.emit(this.base.clone().add(new THREE.Vector3(rnd(-7, 7), 8.5, rnd(-7, 7))), { count: 4, speed: 0.6, color: PALETTE[Math.floor(Math.random() * PALETTE.length)], size: 0.45, life: 3, up: -1.5, gravity: -4.5 });
    if (t > 4.5 && !this.last) { this.last = true; g.hud.banner('MERCI D’AVOIR JOUÉ', 'Le trophée est à vous', 3); g.audio.play('levelup'); }
  }
  stop() {
    this.on = false; this.last = false; if (this.hall) this.hall.on = 0; this.hall = null; if (this.btn) { this.btn.remove(); this.btn = null; }
    if (this.root && this.root.parent) this.root.parent.remove(this.root);
  }
}
