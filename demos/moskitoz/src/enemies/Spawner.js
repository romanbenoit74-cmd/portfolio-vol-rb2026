// Enemy manager (updates, projectiles, separation) + wave spawner.
import * as THREE from 'three';
import { bus, rand, rng } from '../core/core.js';
import { Mosquito } from './Mosquito.js';

const V3 = THREE.Vector3;

export class EnemyManager {
  constructor(game) {
    this.g = game; this.list = []; this.bolts = []; this.groups = new Map(); this.speedMul = 1;
    this.nid = 1; this.target = null; // nid: wire id of the next mosquito; target: coop, the remote player the mosquito being updated chases (null = the local player)
    this.boltGeo = new THREE.SphereGeometry(0.28, 12, 8);
    this.boltMat = new THREE.MeshBasicMaterial({ color: 0xff5522 });
    const self = this;
    this.ctx = {
      get player() { return self.target || self.g.player; },
      get level() { return self.g.level; },
      groups: this.groups,
      get list() { return self.list; },
      fx: this.g.fx,
      explode: (e) => self.explode(e),
      hurt: (e, dmg, stun) => self.hurtTarget(e, dmg, stun),
      fire: (p, dir, dmg, speed) => self.fire(p, dir, dmg, speed),
      summon: (type, p) => self.spawn(type, new V3(p.x + rand(-2, 2), p.y + rand(-1, 1), p.z + rand(-2, 2)), 0),
    };
  }
  hurtTarget(e, dmg, stun) { // a sting lands on whoever the mosquito chases: here, or on a teammate's machine
    const t = this.target, g = this.g;
    if (t && t.remote) g.coop.hurtRemote(t.remote, dmg * g.diff.dmg, stun, e);
    else g.player.hurt(dmg * g.diff.dmg, e.pos, { stun, by: e.type });
  }
  byId(id) { return this.list.find((e) => e.id === id) || null; }
  /** Coop guest: a mirror of one of the host's mosquitoes. d = decoded snapshot entry, onHit = how a hit is sent to the host. */
  spawnPuppet(d, onHit) {
    const e = new Mosquito(d.type, new V3(d.x, d.y, d.z), this.g.diff, 0);
    e.id = d.id; e.puppet = true; e.onHit = onHit; e.net = d; e.mul = 1;
    this.list.push(e); this.g.scene.add(e.root); this.g.fx.emit(e.pos, { count: 10, speed: 3, color: d.type === 'tyrant' ? 0xff44aa : 0xffcc66, size: 0.25, life: 0.5 });
    if (d.type === 'tyrant') bus.emit('boss:spawn', { enemy: e });
    return e;
  }
  get alive() { let n = 0; for (const e of this.list) if (!e.dying && !e.avatar) n++; return n; }
  spawn(type, pos, group = 0) {
    const e = new Mosquito(type, pos, this.g.diff, group); e.mul = this.speedMul; e.id = this.nid++;
    this.list.push(e); this.g.scene.add(e.root);
    this.g.fx.emit(pos, { count: 14, speed: 3, color: type === 'tyrant' ? 0xff44aa : 0xffcc66, size: 0.25, life: 0.5 });
    if (type === 'tyrant') bus.emit('boss:spawn', { enemy: e });
    return e;
  }
  explode(e) { // kamikaze blast
    const P = this.g.player, r = 3.4;
    this.g.fx.emit(e.pos, { count: 40, speed: 9, color: 0xffa030, size: 0.5, life: 0.5 }); this.g.fx.emit(e.pos, { count: 14, speed: 5, color: 0xffffff, size: 0.6, life: 0.3 });
    this.g.rings.spawn(e.pos, 0xff9933, r, 0.3); this.g.audio.play('power', 0.7); this.g.player.shake(0.3);
    if (e.pos.distanceTo(P.eye) < r + 0.5) P.hurt(e.def.dmg * this.g.diff.dmg, e.pos, { by: e.type });
    if (this.g.coop) this.g.coop.blast(e.pos, r + 0.5, e.def.dmg * this.g.diff.dmg, e.type); // teammates in the blast
    for (const o of this.list) if (o !== e && !o.dying && o.pos.distanceTo(e.pos) < r) o.damage(12, { silent: true });
    e.suicide = true; e.damage(9999, { silent: true });
  }
  fire(p, dir, dmg, speed) {
    const m = new THREE.Mesh(this.boltGeo, this.boltMat); m.position.copy(p); this.g.scene.add(m);
    this.bolts.push({ m, pos: p.clone(), vel: dir.clone().multiplyScalar(speed), dmg, life: 4 });
  }
  update(dt) {
    const L = this.list, P = this.g.player;
    // group centroids
    this.groups.clear();
    for (const e of L) if (e.group && !e.dying) {
      let g = this.groups.get(e.group); if (!g) this.groups.set(e.group, (g = { center: new V3(), n: 0 }));
      g.center.add(e.pos); g.n++;
    }
    this.groups.forEach((g) => g.center.divideScalar(g.n));
    // soft separation
    for (let i = 0; i < L.length; i++) {
      const a = L[i]; if (a.dying || a.avatar) continue;
      for (let j = i + 1; j < L.length; j++) {
        const b = L[j]; if (b.dying || b.avatar) continue;
        const dx = a.pos.x - b.pos.x, dy = a.pos.y - b.pos.y, dz = a.pos.z - b.pos.z, r = a.radius + b.radius, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r * r && d2 > 1e-6) { const d = Math.sqrt(d2), k = ((r - d) / d) * 0.5 * Math.min(1, dt * 8); a.pos.x += dx * k; a.pos.y += dy * k; a.pos.z += dz * k; b.pos.x -= dx * k; b.pos.y -= dy * k; b.pos.z -= dz * k; }
      }
    }
    const co = this.g.coop;
    for (let i = L.length - 1; i >= 0; i--) {
      this.target = co && co.targetFor ? co.targetFor(L[i]) : null; // coop host: each mosquito chases its nearest standing player
      if (L[i].update(dt, this.ctx)) { this.g.scene.remove(L[i].root); L[i].dispose(); L.splice(i, 1); }
    }
    this.target = null;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i]; b.life -= dt; b.pos.addScaledVector(b.vel, dt); b.m.position.copy(b.pos);
      let kill = b.life <= 0 || !this.g.level.isFree(b.pos.x, b.pos.y, b.pos.z, 0.2) || b.pos.y < 0.1;
      if (!kill && b.pos.distanceTo(P.eye) < 0.85) { P.hurt(b.dmg * this.g.diff.dmg, b.pos, { by: 'spitter' }); kill = true; }
      if (!kill && this.g.coop && this.g.coop.boltHit(b.pos, b.dmg * this.g.diff.dmg)) kill = true;
      if (kill) { this.g.fx.emit(b.pos, { count: 8, speed: 3, color: 0xff6633, size: 0.2, life: 0.3 }); this.g.scene.remove(b.m); this.bolts.splice(i, 1); }
      else this.g.fx.emit(b.pos, { count: 1, speed: 0.3, color: 0xff7733, size: 0.3, life: 0.25 });
    }
  }
  clear() {
    for (const e of this.list) { this.g.scene.remove(e.root); e.dispose(); }
    for (const b of this.bolts) this.g.scene.remove(b.m);
    this.list.length = 0; this.bolts.length = 0;
  }
}

export class WaveSpawner {
  constructor(game) { this.g = game; this.state = 'idle'; this.gid = 1; this.queue = []; this.wi = 0; this.total = 1; }
  // one wave per floor. opts: rnd (seeded), cap, interval, countdown
  start(waves, o = {}) {
    this.waves = waves; this.wi = -1; this.total = waves.length; this.state = 'intermission'; this.t = o.countdown ?? 2.2; this.queue = []; this.spawnT = 0;
    this.rnd = o.rnd || Math.random; this.cap = o.cap ?? 14; this.interval = o.interval ?? 1.15; this.bossHp = o.bossHp ?? 1;
  }
  idle() { this.state = 'idle'; this.queue = []; }
  beginWave() {
    this.wi++; this.queue = [];
    for (const [type, n] of this.waves[this.wi]) {
      if (type === 'swarmling') { let left = n; while (left > 0) { const c = Math.min(left, 5 + Math.floor(this.rnd() * 4)); this.queue.push({ type, count: c, group: this.gid++ }); left -= c; } }
      else for (let i = 0; i < n; i++) this.queue.push({ type, count: 1, group: 0 });
    }
    // seeded shuffle (bosses first) so the same floor always spawns in the same order
    for (let i = this.queue.length - 1; i > 0; i--) { const j = Math.floor(this.rnd() * (i + 1)); [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]]; }
    this.queue.sort((a, b) => (b.type === 'tyrant') - (a.type === 'tyrant'));
    this.state = 'fight'; this.spawnT = 0.4;
    bus.emit('wave:start', { n: this.wi + 1, total: this.total });
  }
  spawnPoint(r) {
    const g = this.g, L = g.level, p = g.player.pos, rn = this.rnd;
    for (let k = 0; k < 40; k++) {
      const x = (rn() - 0.5) * (L.w - 4), z = (rn() - 0.5) * (L.d - 4), y = 1 + rn() * Math.min(L.h - 2, 4.5);
      if (Math.hypot(x - p.x, z - p.z) < Math.min(9, L.w * 0.35)) continue;
      if (L.isFree(x, y, z, r + 0.3)) return new V3(x, y, z);
    }
    return new V3((rn() - 0.5) * 6, Math.min(L.h - 2, 5), -L.d / 2 + 3);
  }
  update(dt) {
    if (this.state === 'idle' || this.state === 'done') return;
    if (this.state === 'intermission') { this.t -= dt; if (this.t <= 0) this.beginWave(); return; }
    const E = this.g.enemies;
    this.spawnT -= dt;
    if (this.queue.length && this.spawnT <= 0 && (E.alive < this.cap || this.queue[0].type === 'tyrant')) {
      const q = this.queue.shift(), rn = this.rnd;
      if (q.type === 'tyrant') { const e = E.spawn('tyrant', new V3(0, Math.min(this.g.level.h - 3, 5), -this.g.level.d / 4), 0); e.hp = e.maxHp = e.def.hp * this.bossHp; }
      else {
        const c = this.spawnPoint(0.6);
        for (let i = 0; i < q.count; i++) E.spawn(q.type, new V3(c.x + (rn() - 0.5) * 2.4, Math.max(0.6, c.y + (rn() - 0.5) * 1.6), c.z + (rn() - 0.5) * 2.4), q.group);
      }
      this.spawnT = this.interval * (this.queue.length > 6 ? 0.7 : 1);
    }
    if (!this.queue.length && E.alive === 0) {
      if (this.wi >= this.total - 1) { this.state = 'done'; bus.emit('level:clear'); }
      else { this.state = 'intermission'; this.t = 2; bus.emit('wave:clear', { n: this.wi + 1 }); }
    }
  }
}
