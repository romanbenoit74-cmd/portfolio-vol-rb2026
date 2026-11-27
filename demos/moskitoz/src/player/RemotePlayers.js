// Teammates in a match (spec 2026-10-04 §6): each remote player is the same pair of gloves as the first-person view, floating at their eye
// height, in their skin, with a name sticker above (seen through walls). States arrive at 20 Hz and are interpolated (Interp).
import * as THREE from 'three';
import { makeGloves } from './ViewModel.js';
import { skinOf } from '../economy/Items.js';
import { Interp } from '../net/Interp.js';
import { sticker, freeSprite } from '../ui/LobbyScene.js';

const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), easeOut = (t) => 1 - (1 - t) ** 3, easeIn = (t) => t * t, easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const KINDS = new Set(['jab', 'slap', 'flick', 'clap', 'mille', 'power', 'bigracket', 'racket', 'spray', 'swat', 'lob', 'shoot', 'trap']);
/** Glove offsets of an attack at progress p (0..1): the same keyframes as the first-person view (Hands.update), applied as offsets of the rest pose. */
function attackPose(kind, p, side) {
  const out = Math.sin(Math.min(1, p * 1.12) * Math.PI), eo = easeOut(p), o = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1.15, sz: 1, curl: 1 };
  if (kind === 'jab') { o.z -= 0.6 * out; o.x -= 0.18 * side * out; o.y += 0.07 * out; o.rx += 0.1 * out; o.s += 0.4 * out; o.sz = 1 + 0.35 * out; }
  else if (kind === 'slap') { o.curl = 0.05; o.x += side * lerp(0.36, -0.6, eo); o.z -= 0.32 * out; o.y += 0.05 * out; o.ry += side * lerp(-1.0, 1.0, eo); o.rz += side * lerp(0.9, -0.3, eo); o.s += 0.45 * out; o.sz = 1 + 0.2 * out; }
  else if (kind === 'flick') { const w = clamp(p / 0.4, 0, 1), sn = clamp((p - 0.4) / 0.14, 0, 1); o.z += 0.04 * w - 0.22 * Math.sin(sn * Math.PI); o.y += 0.05 * w; o.rx += 0.25 * w - 0.5 * Math.sin(sn * Math.PI); o.x -= 0.08 * side * w; o.s += 0.15 * w; }
  else if (kind === 'clap') {
    let k; if (p < 0.38) k = -1.4 * easeOut(p / 0.38); else if (p < 0.52) k = lerp(-1.4, 1, easeIn((p - 0.38) / 0.14)); else if (p < 0.68) k = 1; else k = 1 - 2.4 * easeOut((p - 0.68) / 0.32);
    const meet = clamp(k, 0, 1), wide = Math.max(0, -k);
    o.curl = 0.02; o.x += side * (-0.285 * meet + 0.32 * wide); o.z += -0.1 - 0.2 * meet - 0.05 * wide; o.y += -0.02 + 0.08 * wide - 0.04 * meet; o.rz += -side * 1.45; o.ry += side * (0.25 * meet - 0.35 * wide); o.rx += 0.1 - 0.25 * wide; o.s -= 0.12 - 0.04 * meet; o.sz = 1 + 0.15 * meet;
  } else if (kind === 'mille') {
    const W = [side * 0.12, 0.05, 0.1, 0.9, side * 0.4, side * 0.6], S = [-side * 0.24, 0.16, -0.36, 1.35, 0, -side * 0.5];
    const [A, B, e] = p < 0.5 ? [S, W, easeInOut(p / 0.5)] : p < 0.72 ? [W, S, easeIn((p - 0.5) / 0.22)] : [S, S, 0], v = A.map((x, i) => lerp(x, B[i], e));
    o.curl = 0.05; [o.x, o.y, o.z, o.rx, o.ry, o.rz] = v;
  } else if (kind === 'power') { o.z -= 0.85 * out; o.y += 0.12 * out; o.x -= 0.22 * side * out; o.rx += 0.4 * out; o.s += 0.7 * out; o.sz = 1 + 0.5 * out; }
  else if (kind === 'bigracket') { const w = clamp(p / 0.42, 0, 1), sw = clamp((p - 0.42) / 0.22, 0, 1), back = easeOut(w) * (1 - sw), hit = easeOut(sw) * (1 - clamp((p - 0.75) / 0.25, 0, 1)); o.x += 0.12 * back - 0.1 * hit; o.y += 0.08 * back - 0.08 * hit; o.z += 0.06 * back - 0.16 * hit; o.ry += -0.5 * back + 0.3 * hit; o.rz += 0.7 * back - 1.25 * hit; o.rx += -0.2 * back + 0.2 * hit; o.curl = 0.9; }
  else if (kind === 'racket') { o.z -= 0.3 * out; o.x += side * lerp(0.28, -0.44, eo); o.ry += lerp(-0.8, 0.9, eo); o.rz += lerp(0.5, -0.6, eo); o.curl = 0.85; }
  else if (kind === 'swat') { const up = Math.min(1, p / 0.55), dn = Math.min(1, Math.max(0, (p - 0.55) / 0.2)); o.y += 0.16 * up - 0.3 * dn; o.rx += 1.1 * up - 1.9 * dn; o.z += 0.05 * up - 0.12 * dn; }
  else if (kind === 'spray') { o.z -= 0.1 * out; o.y += 0.04 * out; o.rx += 0.2 * out; o.curl = 0.9; }
  else if (kind === 'lob') { o.y += 0.1 * out; o.rx += 0.6 * out; o.z -= 0.08 * out; o.curl = 0.9; }
  else if (kind === 'shoot') { o.z += 0.07 * out; o.y += 0.03 * out; o.rx += 0.4 * out; o.curl = 0.9; }
  else if (kind === 'trap') { o.y -= 0.12 * out; o.z -= 0.2 * out; o.rx += 0.5 * out; o.curl = 0.65; }
  return o;
}
const BIG = 2.2;
/** Small health bar above a teammate's name (drawn on a canvas, redrawn only when the 5 % step changes). */
function healthBar() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 20; const tex = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false })); sp.renderOrder = 12; sp.scale.set(0.8, 0.125, 1);
  const draw = (pct) => {
    const x = cv.getContext('2d'), k = Math.max(0, Math.min(1, pct / 100)); x.clearRect(0, 0, 128, 20);
    x.fillStyle = '#1E1633'; x.beginPath(); x.roundRect(0, 0, 128, 20, 8); x.fill();
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(3, 3, 122, 14, 6); x.fill();
    if (k > 0) { x.fillStyle = k > 0.5 ? '#6CD83E' : k > 0.25 ? '#FFC62E' : '#FF5B4A'; x.beginPath(); x.roundRect(3, 3, Math.max(8, 122 * k), 14, 6); x.fill(); }
    tex.needsUpdate = true;
  };
  draw(100); return { sp, draw, dispose() { tex.dispose(); sp.material.dispose(); } };
} // stickers are drawn at lobby scale: bigger in the world
export class RemotePlayers {
  constructor(scene) { this.scene = scene; this.m = new Map(); }
  add(id, name, loadout) {
    if (this.m.has(id)) return;
    const g = new THREE.Group(), hands = new THREE.Group(), gloves = makeGloves({ skin: skinOf(loadout && loadout.hands) });
    hands.rotation.order = 'YXZ'; hands.add(gloves.root); g.add(hands); g.visible = false; this.scene.add(g);
    const e = { g, hands, gloves, name, tag: null, tagText: '', interp: new Interp(100), anim: { L: null, R: null }, bar: healthBar(), barV: 20, last: null, phase: Math.random() * 6 };
    e.bar.sp.position.y = 0.46; g.add(e.bar.sp);
    this.m.set(id, e); this.label(id, name);
  }
  label(id, text) {
    const e = this.m.get(id); if (!e || e.tagText === text) return;
    if (e.tag) { e.g.remove(e.tag); freeSprite(e.tag); }
    e.tag = sticker(text); e.tag.scale.multiplyScalar(BIG); e.tag.position.y = 0.7; e.g.add(e.tag); e.tagText = text;
  }
  /** A teammate's glove animation (the same names as Combat.swing); ignored when unknown. */
  attack(id, hand, kind, dur) {
    const e = this.m.get(id); if (!e || (hand !== 'L' && hand !== 'R') || !KINDS.has(kind) || !(dur > 0)) return;
    e.anim[hand] = { kind, t: 0, dur: Math.min(dur, 2) };
  }
  /** A decoded state (coopSync.decodePlayer) received at `t` ms. */
  state(id, s, t) { const e = this.m.get(id); if (e) { e.interp.push(t, s); e.last = s; } }
  /** Interpolated state of a player as drawn this frame (null before their first state). */
  cur(id) { const e = this.m.get(id); return e ? e.cur || null : null; }
  /** Latest known state of a player, for targeting and revive checks. */
  last(id) { const e = this.m.get(id); return e ? e.last : null; }
  /** Show or hide a teammate's gloves and sticker (arena: out of the fight while K.O.). */
  setVisible(id, v) { const e = this.m.get(id); if (e) e.hide = !v; }
  remove(id) { const e = this.m.get(id); if (!e) return; this.scene.remove(e.g); freeSprite(e.tag); e.bar.dispose(); this.m.delete(id); }
  clear() { for (const id of [...this.m.keys()]) this.remove(id); }
  update(dt, time, now) {
    for (const e of this.m.values()) {
      const s = e.interp.sample(now); if (!s) continue;
      e.cur = s;
      const bv = Math.round(Math.max(0, Math.min(100, s.hp)) / 5); if (bv !== e.barV) { e.barV = bv; e.bar.draw(bv * 5); }
      e.g.visible = !e.hide;
      e.g.position.set(s.x, s.y + (s.down ? 0.45 : 1.6), s.z);
      e.hands.rotation.set(s.down ? 0.9 : s.pitch, s.yaw, 0);
      const pose = s.down ? 'open' : s.pose;
      if (e.gloves.hands.R.pose !== pose) e.gloves.set(pose);
      for (const k of ['L', 'R']) {
        const a = e.anim[k], h = e.gloves.hands[k]; if (!a) continue;
        a.t += dt; const p = Math.min(1, a.t / a.dur), o = attackPose(a.kind, p, k === 'R' ? 1 : -1);
        if (p >= 1) { e.anim[k] = null; h.off.set(0, 0, 0); h.rot.set(0, 0, 0); h.s = 1.15; h.sz = 1; e.gloves.set(pose, k); continue; }
        h.off.set(o.x, o.y, o.z); h.rot.set(o.rx, o.ry, o.rz); h.s = o.s; h.sz = o.sz; h.tgt = [o.curl, o.curl, o.curl * 1.05, o.curl * 0.55, 0];
      }
      e.gloves.update(dt, time + e.phase, { bob: 0 });
    }
  }
}
