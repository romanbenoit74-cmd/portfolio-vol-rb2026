// Per-type behaviour state machines.
import * as THREE from 'three';
import { bus, rand } from '../core/core.js';

const V3 = THREE.Vector3;
const _t = new V3(), _a = new V3();

function flyTo(e, target, speed, dt, acc = e.def.acc, wob = 0.25) {
  _t.subVectors(target, e.pos);
  const d = _t.length() || 1;
  _t.multiplyScalar(speed / d);
  if (wob) { _t.x += Math.sin(e.t * 3.1 + e.ph) * wob * speed; _t.y += Math.sin(e.t * 2.3 + e.ph * 2) * wob * speed; _t.z += Math.cos(e.t * 2.7 + e.ph) * wob * speed; }
  e.vel.lerp(_t, 1 - Math.exp(-acc * dt));
}
function hold(e, dt, k = 6) { e.vel.multiplyScalar(Math.exp(-k * dt)); }
function away(e, from, dist) { _a.subVectors(e.pos, from).setY(0.3).normalize().multiplyScalar(dist).add(e.pos); return _a; }

export const AI = {
  mosquito(e, dt, c) {
    const P = c.player.eye, d = e.pos.distanceTo(P), spd = e.speed();
    if (e.state === 'pursue') {
      flyTo(e, P, spd, dt);
      if (d < e.def.reach) { e.state = 'windup'; e.stateT = e.def.windup; }
    } else if (e.state === 'windup') {
      hold(e, dt); e.glow = 1; e.stateT -= dt;
      if (e.stateT <= 0) { if (d < e.def.reach + 0.6) c.hurt(e, e.def.dmg); e.state = 'retreat'; e.stateT = 0.7; }
    } else {
      flyTo(e, away(e, P, 5), spd * 1.1, dt); e.stateT -= dt;
      if (e.stateT <= 0) e.state = 'pursue';
    }
  },

  speedbug(e, dt, c) {
    const P = c.player.eye, d = e.pos.distanceTo(P), spd = e.speed();
    if (e.state === 'pursue') { e.state = 'orbit'; e.stateT = rand(1.2, 2.4); }
    if (e.state === 'orbit') {
      e.orbit += dt * 2.2;
      _t.set(P.x + Math.cos(e.orbit) * 4.5, P.y + Math.sin(e.orbit * 1.7) * 1.4, P.z + Math.sin(e.orbit) * 4.5);
      flyTo(e, _t, spd, dt, 8, 0.1); e.stateT -= dt;
      if (e.stateT <= 0) e.state = 'dive';
    } else if (e.state === 'dive') {
      flyTo(e, P, spd * 1.7, dt, 12, 0);
      if (d < e.def.reach) { e.state = 'burst'; e.n = 3; e.stateT = 0.1; }
    } else if (e.state === 'burst') {
      hold(e, dt, 10); e.glow = 0.6; e.stateT -= dt;
      if (e.stateT <= 0) { if (d < e.def.reach + 0.7) c.hurt(e, e.def.dmg); e.n--; e.stateT = 0.12; if (e.n <= 0) { e.state = 'flee'; e.stateT = 0.9; } }
    } else {
      flyTo(e, away(e, P, 7), spd * 1.3, dt, 10, 0.2); e.stateT -= dt;
      if (e.stateT <= 0) { e.state = 'orbit'; e.stateT = rand(1.2, 2.4); }
    }
  },

  heavy(e, dt, c) {
    const P = c.player.eye, d = e.pos.distanceTo(P), spd = e.speed();
    if (e.state === 'pursue') {
      flyTo(e, P, spd, dt, 3, 0.03);
      if (d < e.def.reach) { e.state = 'windup'; e.stateT = e.def.windup; }
    } else if (e.state === 'windup') {
      hold(e, dt, 4); e.glow = 1; e.stateT -= dt;
      if (e.stateT <= 0) { if (d < e.def.reach + 0.6) c.hurt(e, e.def.dmg, e.def.stunPlayer); e.state = 'recover'; e.stateT = 1.0; }
    } else { hold(e, dt, 3); e.stateT -= dt; if (e.stateT <= 0) e.state = 'pursue'; }
  },

  swarmling(e, dt, c) {
    const P = c.player.eye, d = e.pos.distanceTo(P), spd = e.speed();
    const g = c.groups.get(e.group);
    _t.copy(P);
    if (g && g.n > 1 && d > 4) _t.lerp(g.center, 0.3);        // coordinated: stay near group centroid until close
    flyTo(e, _t, spd, dt, 6, 0.6);                              // erratic flight
    if (d < e.def.reach && e.cd <= 0) { c.hurt(e, e.def.dmg); e.cd = 0.5; e.glow = 0.5; }
  },

  shield(e, dt, c) { AI.mosquito(e, dt, c); },
  splitter(e, dt, c) { AI.mosquito(e, dt, c); },

  spitter(e, dt, c) { // keeps its distance and spits slow projectiles
    const P = c.player.eye, d = e.pos.distanceTo(P), spd = e.speed();
    if (e.state === 'pursue') {
      if (d > 12) flyTo(e, P, spd, dt, 4, 0.15);
      else if (d < 8) flyTo(e, away(e, P, 6), spd * 1.1, dt, 5, 0.15);
      else { e.orbit += dt * 0.9; _t.set(P.x + Math.cos(e.orbit) * 10, Math.max(2, P.y + Math.sin(e.orbit * 1.3) * 1.5), P.z + Math.sin(e.orbit) * 10); flyTo(e, _t, spd, dt, 4, 0.1); }
      e.atkT = (e.atkT ?? 1 + Math.random() * 1.5) - dt;
      if (e.atkT <= 0) { e.state = 'windup'; e.stateT = e.def.windup; }
    } else {
      hold(e, dt, 6); e.glow = 1; e.stateT -= dt;
      if (e.stateT <= 0) { _a.subVectors(P, e.pos).normalize(); c.fire(e.pos, _a.clone(), e.def.dmg, 11); e.state = 'pursue'; e.atkT = 2.4; }
    }
  },

  kamikaze(e, dt, c) { // approaches, telegraphs, then dives and explodes
    const P = c.player.eye, d = e.pos.distanceTo(P), spd = e.speed();
    if (e.state === 'pursue') {
      flyTo(e, P, spd, dt, 5, 0.4);
      if (d < 10) { e.state = 'windup'; e.stateT = e.def.windup; }
    } else if (e.state === 'windup') {
      hold(e, dt, 8); e.glow = 0.5 + 0.5 * Math.sin(e.t * 40); e.stateT -= dt;
      if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 1.4; e.lock = (e.lock || new V3()).copy(P); }
    } else if (e.state === 'charge') {
      flyTo(e, e.lock, e.def.speed * 3.4 * e.mul, dt, 14, 0); e.glow = 1; e.stateT -= dt;
      if (d < e.def.reach) c.explode(e);
      else if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 1.0; }
    } else { hold(e, dt, 3); e.stateT -= dt; if (e.stateT <= 0) e.state = 'pursue'; }
  },

  healer(e, dt, c) { // hangs behind its allies and mends them
    const P = c.player.eye, d = e.pos.distanceTo(P), spd = e.speed();
    let ally = null, best = 1e9;
    for (const o of c.list) if (o !== e && !o.dying && o.type !== 'healer') { const dd = o.pos.distanceTo(e.pos); if (dd < best) { best = dd; ally = o; } }
    if (d < 6 || !ally) flyTo(e, away(e, P, 7), spd * 1.2, dt, 5, 0.2);
    else { _t.subVectors(ally.pos, P).setY(0).normalize().multiplyScalar(3).add(ally.pos); flyTo(e, _t, spd, dt, 4, 0.15); }
    e.cd -= 0; e.healT = (e.healT ?? 1) - dt;
    if (e.healT <= 0) {
      e.healT = 1.2; e.glow = 0.7;
      for (const o of c.list) if (!o.dying && o.hp < o.maxHp && o.pos.distanceTo(e.pos) < 7) { o.hp = Math.min(o.maxHp, o.hp + 4); c.fx.emit(o.pos, { count: 6, speed: 2, color: 0x66ffaa, size: 0.3, life: 0.5, up: 1.5 }); }
    }
  },

  tyrant(e, dt, c) {
    const P = c.player.eye, d = e.pos.distanceTo(P);
    const f = e.hp / e.maxHp, phase = f > 2 / 3 ? 1 : f > 1 / 3 ? 2 : 3;
    if (e.phase !== phase) {
      if (e.phase) { bus.emit('boss:phase', { phase, enemy: e }); for (let i = 0; i < 4; i++) c.summon('swarmling', e.pos); e.stunT = 0.3; }
      e.phase = phase; e.state = 'hover'; e.atkT = 2;
    }
    const spd = e.def.speed * (1 + (phase - 1) * 0.25) * (e.slowT > 0 ? 0.5 : 1);
    if (e.state === 'hover') {
      e.orbit += dt * 0.5 * (1 + phase * 0.2);
      _t.set(P.x + Math.cos(e.orbit) * 9, Math.min(c.level.h - 2.5, 4), P.z + Math.sin(e.orbit) * 9);
      flyTo(e, _t, spd, dt, 2.5, 0.05);
      e.atkT -= dt;
      if (e.atkT <= 0) {
        const opts = phase === 1 ? ['triple'] : phase === 2 ? ['triple', 'summon', 'triple'] : ['triple', 'charge', 'summon', 'charge'];
        e.state = opts[e.n++ % opts.length]; e.stateT = e.state === 'charge' ? 1.1 : 0.8;
        bus.emit('boss:telegraph', { state: e.state });
      }
    } else if (e.state === 'triple') {
      hold(e, dt, 4); e.glow = 1; e.stateT -= dt;
      if (e.stateT <= 0) {
        _a.subVectors(P, e.pos).normalize();
        for (const yaw of [-0.28, 0, 0.28]) { const dir = _a.clone().applyAxisAngle(new V3(0, 1, 0), yaw); c.fire(e.pos, dir, 8, 15 + phase * 2); }
        e.state = 'hover'; e.atkT = [0, 3.4, 2.8, 2.2][phase];
      }
    } else if (e.state === 'summon') {
      hold(e, dt, 4); e.glow = 0.8; e.stateT -= dt;
      if (e.stateT <= 0) { for (let i = 0; i < 4; i++) c.summon('swarmling', e.pos); e.state = 'hover'; e.atkT = 3.5; }
    } else if (e.state === 'charge') {
      hold(e, dt, 5); e.glow = 1; e.stateT -= dt; e.lock = e.lock || new V3(); e.lock.copy(P);
      if (e.stateT <= 0) { e.state = 'dash'; e.stateT = 1.1; e.hitDone = false; e.dashDir = new V3().subVectors(e.lock, e.pos).normalize(); }
    } else if (e.state === 'dash') {
      e.vel.copy(e.dashDir).multiplyScalar(24); e.stateT -= dt; e.glow = 1;
      if (!e.hitDone && d < e.radius + 1.0) { c.hurt(e, e.def.dmg, 0.3); e.hitDone = true; }
      if (e.stateT <= 0 || e.hitDone) { e.state = 'recover'; e.stateT = 1.6; }
    } else if (e.state === 'recover') {
      hold(e, dt, 3); e.stateT -= dt;
      if (e.stateT <= 0) { e.state = 'hover'; e.atkT = 2; }
    }
  },
};
