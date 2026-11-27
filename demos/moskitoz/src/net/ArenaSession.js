// An arena match on this machine (spec 2026-10-04 §4): 5 minutes in one biome, everybody for themselves. Same network model as the coop
// (src/net/CoopSession.js: the host simulates the mosquitoes, guests mirror them), plus:
//  - every remote player has an invisible "avatar" in the mosquito list, so ALL weapons can hit them; a hit becomes a `pvp` message to the victim;
//  - the victim applies the damage and reports a K.O. (`frag`) to the host, who keeps the score and broadcasts it every second (`board`);
//  - a K.O. player is back after a few seconds, shielded for a moment; the host ends the match with `over` when the clock runs out.
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { CoopSession } from './CoopSession.js';
import { CHEST_COUNT } from '../tower/Loot.js';
import { Mosquito, TYPES } from '../enemies/Mosquito.js';
import { huntInfo } from '../tower/Tower.js';
import { Board, ARENA_TIME, RESPAWN, RESPAWN_SHIELD, FRAG_PTS, DEATH_PTS, PVP_HIT_MAX, killPoints, pvpDamage, creditFor, pickSpawn, arenaBiome } from '../tower/Arena.js';

const V3 = THREE.Vector3;
const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const clock = (t) => { const s = Math.max(0, Math.ceil(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export class ArenaSession extends CoopSession {
  constructor(game, client) {
    super(game, client);
    this.arena = true; this.over = false; this.timeLeft = ARENA_TIME; this.wave = 0; this.respawnT = 0; this.lastHit = null; this.pvpAcc = new Map(); this.pvpT = 0; this.boardT = 0; this.hudT = 0; this.feed = [];
    this.biome = arenaBiome(client.room.seed);
    this.board = new Board(); for (const id of this.team.m.keys()) this.board.ensure(id);
    this.avatars = new Map(); for (const id of this.remotes.m.keys()) this.addAvatar(id);
    const b = (t, f) => { bus.on(t, f); this.busOff.push([t, f]); };
    b('enemy:hit', ({ enemy }) => { if (this.host && !this.remoteApplying && enemy.id > 0) enemy.lastHit = this.you; }); // my own hits take the credit
    b('enemy:killed', ({ enemy }) => { if (this.host && enemy.id > 0 && !enemy.suicide) this.board.add(enemy.lastHit || this.you, killPoints(TYPES[enemy.type].pts)); });
    this.el = document.createElement('div'); this.el.className = 'arena-hud'; document.body.appendChild(this.el);
  }
  baseHp() { return 250; }
  chestCount() { return CHEST_COUNT.arena; }
  chestSeed() { return this.c.room.seed * 31 + (this.round || 0); }
  dispose() {
    this.el.remove();
    const E = this.g.enemies; for (const av of this.avatars.values()) { this.g.scene.remove(av.root); const i = E.list.indexOf(av); if (i >= 0) E.list.splice(i, 1); }
    this.avatars.clear(); super.dispose();
  }

  // ---- avatars: the hittable body of a remote player ----
  addAvatar(id) {
    const g = this.g, e = new Mosquito('mosquito', new V3(0, -500, 0), g.diff, 0);
    e.avatar = true; e.puppet = true; e.id = -id; e.hp = e.maxHp = 1e9; e.radius = 0.55; e.root.visible = false;
    e.onHit = (en, amount) => this.pvpAcc.set(id, (this.pvpAcc.get(id) || 0) + amount);
    g.enemies.list.push(e); g.scene.add(e.root); this.avatars.set(id, e);
  }
  onLeft(id) {
    const av = this.avatars.get(id); if (av) { this.g.scene.remove(av.root); const i = this.g.enemies.list.indexOf(av); if (i >= 0) this.g.enemies.list.splice(i, 1); this.avatars.delete(id); }
    this.board.remove(id); this.team.remove(id); this.remotes.remove(id); this.names.delete(id);
  }
  onRoomEnd() { this.finish(); }

  // ---- messages ----
  onEvent(m) {
    const d = m.d || {};
    if (m.k === 'pvp') return this.onPvp(m.from, +d.d);
    if (m.k === 'frag') { if (this.host) this.award(Number.isInteger(d.by) ? d.by : null, m.from); return; }
    if (m.k === 'board') { if (!this.host) this.onBoard(d); return; }
    if (m.k === 'wave') { if (!this.host && Number.isInteger(d.k)) this.startWave(d.k); return; }
    if (m.k === 'over') { this.finish(); return; }
    super.onEvent(m);
  }
  onPvp(from, dmg) {
    const P = this.g.player; if (!(dmg > 0) || dmg > PVP_HIT_MAX || P.dead || this.over) return;
    this.lastHit = { id: from, t: this.now };
    const s = this.remotes.last(from); P.hurt(dmg, s ? new V3(s.x, s.y + 1.6, s.z) : P.eye.clone(), { by: 'player' });
  }
  onBoard(d) {
    if (this.board.load(d.s)) for (const id of this.team.m.keys()) this.board.ensure(id);
    if (Number.isFinite(d.t)) this.timeLeft = d.t;
    for (const f of Array.isArray(d.f) ? d.f.slice(0, 4) : []) this.toastFrag(f[0], f[1]);
  }
  toastFrag(k, v) { const n = (id) => this.names.get(id) || '?'; bus.emit('toast', { text: k == null ? `${n(v)} est K.O.` : `${n(k)} met ${n(v)} K.O.`, kind: k === this.you ? 'good' : v === this.you ? 'warn' : 'ach' }); }

  // ---- score (host) ----
  award(killer, victim) {
    const known = (id) => this.board.s.has(id);
    if (killer != null && killer !== victim && known(killer)) this.board.add(killer, FRAG_PTS);
    if (known(victim)) { this.board.add(victim, -DEATH_PTS); if (this.board.get(victim) < 0) this.board.s.set(victim, 0); }
    this.feed.push([killer, victim]); this.toastFrag(killer, victim);
  }
  sendBoard() { this.c.sendEvent('board', { s: this.board.encode(), t: Math.round(this.timeLeft), f: this.feed.splice(0, 4) }); }

  // ---- waves of mosquitoes: the host decides when one is cleared, everybody starts the next floor of the arena ----
  onWaveClear() { if (!this.host) return; this.wave++; this.c.sendEvent('wave', { k: this.wave }); this.startWave(this.wave); }
  startWave(k) { this.wave = k; this.g.run.i = k; this.g.startFloor(huntInfo(this.biome, k, 0)); }

  // ---- K.O. and respawn ----
  onLocalDown() {
    if (this.over) return;
    const by = creditFor(this.lastHit, this.now), name = by != null ? this.names.get(by) : null;
    if (this.host) this.award(by, this.you); else this.c.sendEvent('frag', { by }, this.hostId);
    this.respawnT = RESPAWN; this.g.hud.fade(0.45, 400, '#3a0000'); this.g.hud.banner('K.O.', name ? `Touché par ${name}` : 'Réapparition…', RESPAWN);
  }
  respawn() {
    const g = this.g, P = g.player, L = g.level, p = pickSpawn(Math.random, L.w, L.d, (x, y, z) => L.isFree(x, y, z, 0.5));
    P.pos.set(p.x, 0, p.z); P.vel.set(0, 0, 0); P.eyeY.snap(1.7); P.dead = false; P.hp = P.maxHp; P.invulnT = RESPAWN_SHIELD; this.lastHit = null; g.hud.fade(0, 300);
  }
  tickTeam(dt) {
    const g = this.g, P = g.player;
    if (P.dead && this.respawnT > 0 && !this.over && (this.respawnT -= dt) <= 0) this.respawn();
    for (const id of this.remotes.m.keys()) { const av = this.avatars.get(id); if (!av || !this.g.enemies.list.includes(av)) this.addAvatar(id); } // clearWorld (new wave / arena start) empties the mosquito list
    for (const [id, av] of this.avatars) { // the avatar follows what is drawn; a K.O. player cannot be hit
      const s = this.remotes.cur(id);
      if (s && !s.down) av.pos.set(s.x, s.y + 1, s.z); else av.pos.set(0, -500, 0);
      av.root.position.copy(av.pos); this.remotes.setVisible(id, !(s && s.down));
    }
    this.pvpT += dt;
    if (this.pvpT >= 0.05) { this.pvpT = 0; for (const [id, amount] of this.pvpAcc) this.c.sendEvent('pvp', { d: +pvpDamage(amount).toFixed(1) }, id); this.pvpAcc.clear(); }
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.host) {
      this.boardT += dt; if (this.boardT >= 1) { this.boardT = 0; this.sendBoard(); }
      if (this.timeLeft <= 0 && !this.over) { this.sendBoard(); this.c.sendEvent('over', {}); this.finish(); }
    }
    this.drawHud(dt);
  }
  finish() { if (this.over) return; this.over = true; this.el.style.display = 'none'; this.g.arenaEnd(); }

  drawHud(dt) {
    this.hudT += dt; this.el.style.display = this.g.live && !this.over ? '' : 'none'; if (this.hudT < 0.25) return; this.hudT = 0;
    const rows = this.board.ranking().map((e) => `<div class="ah-row${e.id === this.you ? ' me' : ''}"><span>${e.rank}</span><b>${esc(this.names.get(e.id) || '?')}</b><i>${e.score}</i></div>`).join('');
    this.el.innerHTML = `<div class="ah-time">${clock(this.timeLeft)}</div>${rows}`;
  }
}
