// A coop match on this machine (spec 2026-10-04 §3). Everybody simulates their own player; the HOST also simulates the mosquitoes (they chase
// the nearest standing player) and sends a snapshot 10×/s; GUESTS show interpolated "puppet" mosquitoes and send their hits to the host.
// Reliable events (relay `evt`): hits (guest -> host), kill / clear (host -> all), hurt (host -> the stung player), revive (teammate -> downed).
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { Team, nearest, reviveTarget, REVIVE_HP } from '../tower/Coop.js';
import { encodePlayer, decodePlayer, encodeEnemies, decodeEnemies, reconcile, encodeHit, decodeHit, FLAG } from './coopSync.js';
import { TYPE_ORDER } from '../enemies/Mosquito.js';
import { RemotePlayers } from '../player/RemotePlayers.js';
import { LootChests } from '../tower/LootChests.js';
import { CHEST_COUNT } from '../tower/Loot.js';

const V3 = THREE.Vector3;
const STATE_EVERY = 0.05, SNAP_EVERY = 0.1, HITS_PER_MSG = 12;
const flagsOf = (e) => (e.stunT > 0 ? FLAG.stun : 0) | (e.slowT > 0 ? FLAG.slow : 0) | (e.glueT > 0 ? FLAG.glue : 0) | (e.poisonT > 0 ? FLAG.poison : 0) | (e.state === 'windup' || e.state === 'charge' ? FLAG.windup : 0);

export class CoopSession {
  constructor(game, client) {
    const room = client.room;
    this.g = game; this.c = client; this.you = room.you; this.hostId = room.host; this.host = room.host === room.you;
    this.team = new Team([...room.players.keys()]); this.remotes = new RemotePlayers(game.scene);
    this.names = new Map([...room.players.values()].map((p) => [p.id, p.name]));
    for (const p of room.players.values()) if (p.id !== this.you) this.remotes.add(p.id, p.name, p.loadout);
    game.player.maxHp = this.baseHp(); game.player.hp = game.player.maxHp;
    this.now = 0; this.stateT = 0; this.snapT = 0; this.hits = []; this.proxies = new Map(); this.spectating = false; this.offs = [];
    const on = (t, f) => this.offs.push(client.on(t, f));
    on('state', (m) => this.onState(m)); on('snap', (m) => this.onSnap(m)); on('evt', (m) => this.onEvent(m));
    on('left', (id) => this.onLeft(id)); on('host', (id) => this.onHost(id)); on('end', () => this.onRoomEnd());
    this.busOff = []; this.loot = null; this.lootLevel = null;
    this.onKey = (e) => { if (e.code === 'KeyG' && !e.repeat && this.loot) this.loot.interact(); }; addEventListener('keydown', this.onKey);
    const b = (t, f) => { bus.on(t, f); this.busOff.push([t, f]); };
    b('enemy:killed', (k) => { if (this.host && k.enemy.id) client.sendEvent('kill', { id: k.enemy.id, x: +k.pos.x.toFixed(2), y: +k.pos.y.toFixed(2), z: +k.pos.z.toFixed(2), s: k.enemy.suicide ? 1 : 0 }); });
    b('player:clap', () => this.onClap());
  }
  // ---- loot chests: a new set on every new room (floor of the tower, arena, round) ----
  chestCount() { return CHEST_COUNT.coop; }
  chestSeed(info) { return info.seed; }
  /** Called by Game.startFloor: builds the chests of a room once (arena waves re-enter on the same level). */
  onFloor(level, info) {
    if (this.lootLevel === level) return;
    this.lootLevel = level; if (this.loot) this.loot.dispose();
    this.loot = new LootChests(this.g, level, this.chestSeed(info), this.chestCount(), { send: (k, d) => this.c.sendEvent(k, d) });
  }
  /** Max HP of every player in this kind of match: more than solo, where a sting hurts more (a bar is a share of it). */
  baseHp() { return 200; }
  get n() { return this.team.size; }
  /** Index of this player in the team (stable order by id): where they stand on the roof. */
  slot() { const ids = [...this.team.m.keys()].sort((a, b) => a - b); return { i: Math.max(0, ids.indexOf(this.you)), n: ids.length }; }
  dispose() {
    removeEventListener('keydown', this.onKey); if (this.loot) { this.loot.dispose(); this.loot = null; }
    this.offs.forEach((f) => f()); this.busOff.forEach(([t, f]) => bus.off(t, f)); this.remotes.clear(); this.proxies.clear();
    const P = this.g.player; P.hands.root.visible = true;
  }

  // ---- who the host's mosquitoes chase ----
  targetFor(e) {
    if (!this.host || e.puppet) return null;
    const P = this.g.player, cands = [];
    if (!P.dead) cands.push({ id: this.you, x: P.pos.x, y: P.pos.y, z: P.pos.z });
    for (const id of this.team.ids('alive')) { if (id === this.you) continue; const s = this.remotes.last(id); if (s) cands.push({ id, x: s.x, y: s.y, z: s.z }); }
    const c = nearest(cands, e.pos);
    if (!c || c.id === this.you) return null;
    let p = this.proxies.get(c.id); if (!p) this.proxies.set(c.id, (p = { remote: c.id, pos: new V3(), eye: new V3(), vel: new V3() }));
    p.pos.set(c.x, c.y, c.z); p.eye.set(c.x, c.y + 1.6, c.z); return p;
  }
  /** My glove animation, for the teammates' screens. */
  sendAttack(hand, kind, dur) { this.c.sendEvent('atk', { h: hand, k: kind, d: +dur.toFixed(2) }); }
  hurtRemote(id, dmg, stun, e) { this.c.sendEvent('hurt', { d: +dmg.toFixed(2), st: stun || 0, by: e.type, x: +e.pos.x.toFixed(2), y: +e.pos.y.toFixed(2), z: +e.pos.z.toFixed(2) }, id); }
  blast(pos, r, dmg, by) { for (const id of this.team.ids('alive')) { const s = id !== this.you && this.remotes.last(id); if (s && Math.hypot(s.x - pos.x, s.y + 1.6 - pos.y, s.z - pos.z) < r) this.hurtRemote(id, dmg, 0, { type: by, pos }); } }
  boltHit(pos, dmg) {
    for (const id of this.team.ids('alive')) {
      const s = id !== this.you && this.remotes.last(id);
      if (s && Math.hypot(s.x - pos.x, s.y + 1.6 - pos.y, s.z - pos.z) < 0.85) { this.hurtRemote(id, dmg, 0, { type: 'spitter', pos }); return true; }
    }
    return false;
  }

  // ---- messages in ----
  onState(m) {
    const s = decodePlayer(m.s), id = m.from; if (!s || !this.remotes.m.has(id)) return;
    this.remotes.state(id, s, performance.now());
    if (s.down) { if (this.team.down(id, this.now)) this.note(id, 'est à terre !'); } else if (this.team.stand(id)) this.note(id, 'est de retour !');
  }
  onSnap(m) {
    const g = this.g, s = m.s;
    if (this.host || !s || !g.run || s.f !== g.run.i || !g.live) return;
    const list = decodeEnemies(s.e, TYPE_ORDER), E = g.enemies;
    const known = new Set(E.list.filter((e) => e.puppet && !e.dying).map((e) => e.id)), r = reconcile(known, list);
    for (const d of r.add) E.spawnPuppet(d, (e, a, o) => this.hits.push(encodeHit(e.id, a, o)));
    for (const d of r.keep) { const e = E.byId(d.id); if (e) e.net = d; }
    for (const id of r.drop) { const e = E.byId(id); if (e) { g.scene.remove(e.root); e.dispose(); E.list.splice(E.list.indexOf(e), 1); } } // vanished without a kill event
  }
  onEvent(m) {
    const g = this.g, d = m.d || {};
    if (m.k === 'hit' && this.host) { for (const raw of Array.isArray(d.h) ? d.h.slice(0, 32) : []) { const h = decodeHit(raw), e = h && g.enemies.byId(h.id); if (e && !e.dying) { const o = h.opts; e.lastHit = m.from; this.remoteApplying = true; e.damage(h.amount, { ...o, from: o.from ? new V3(o.from.x, o.from.y, o.from.z) : undefined, kb: o.kb ? new V3(o.kb.x, o.kb.y, o.kb.z) : undefined }); this.remoteApplying = false; } } }
    else if (m.k === 'kill' && !this.host) {
      const e = g.enemies.byId(d.id); if (!e || e.dying || !Number.isFinite(d.x + d.y + d.z)) return;
      e.pos.set(d.x, d.y, d.z); e.puppet = false; e.onHit = null; e.suicide = !!d.s; e.damage(9999, { silent: true });
    } else if (m.k === 'clear' && !this.host) { if (g.state === 'playing') g.onFloorClear(); this.onClear(); }
    else if (m.k === 'hurt') { const P = g.player; P.hurt(+d.d || 0, new V3(+d.x || 0, +d.y || 0, +d.z || 0), { stun: +d.st || 0, by: d.by }); }
    else if (m.k === 'chest') { if (this.loot) this.loot.onEvent(d); }
    else if (m.k === 'atk') this.remotes.attack(m.from, d.h, d.k, +d.d);
    else if (m.k === 'revive') this.standUp(`${this.names.get(m.from) || 'Un coéquipier'} te réveille !`);
  }
  onLeft(id) {
    this.team.remove(id); this.remotes.remove(id); this.names.delete(id);
    if (this.g.live && this.team.wiped) this.g.coopWipe();
  }
  /** The relay picked a new host: if it is me, my puppets become real mosquitoes and the floor goes on (without its unspawned queue). */
  onHost(id) {
    this.hostId = id; const was = this.host; this.host = id === this.you;
    if (!this.host || was) return;
    const g = this.g;
    for (const e of g.enemies.list) if (e.puppet) { e.puppet = false; e.onHit = null; e.id = e.id || g.enemies.nid++; e.state = 'pursue'; g.enemies.nid = Math.max(g.enemies.nid, e.id + 1); }
    if (g.state === 'playing' && g.floorKind !== 'intro') g.spawner.start([[]], { countdown: 0.1, cap: 99 });
    bus.emit('toast', { text: 'Tu es maintenant l’hôte de la partie', kind: 'ach' });
  }
  onRoomEnd() { if (this.g.live) this.g.coopWipe(true); } // the host closed the match while we were still playing

  // ---- reviving ----
  note(id, text) { bus.emit('toast', { text: `${this.names.get(id) || 'Un joueur'} ${text}`, kind: id === this.you ? 'warn' : 'ach' }); }
  onLocalDown() {
    this.team.down(this.you, this.now);
    this.g.hud.banner('À TERRE', 'Un coéquipier doit te réveiller d’un CLAP (15 s)', 3);
    if (this.team.wiped) this.g.coopWipe();
  }
  onClap() {
    const P = this.g.player; if (P.dead) return;
    const downed = this.team.ids('downed').filter((id) => id !== this.you).map((id) => { const s = this.remotes.last(id); return s && { id, x: s.x, y: s.y, z: s.z }; }).filter(Boolean);
    const id = reviveTarget(downed, P.pos);
    if (id && this.team.revive(id, this.you, this.now)) { this.c.sendEvent('revive', {}, id); this.note(id, 'est réveillé !'); }
  }
  standUp(text) {
    const P = this.g.player; if (!P.dead || this.team.state(this.you) !== 'downed') return;
    this.team.stand(this.you); P.dead = false; P.hp = Math.round(P.maxHp * REVIVE_HP / 100); P.invulnT = 2.5; this.g.hud.fade(0, 300);
    bus.emit('toast', { text, kind: 'good' });
  }
  /** Floor cleared by the team: whoever is downed gets up for the next floor. */
  onClear() { this.team.rescue(); this.standUp('L’étage est franchi : debout !'); }

  // ---- per frame (live game only) ----
  update(dt) {
    this.now += dt; const g = this.g, P = g.player, c = this.c;
    this.stateT += dt; this.snapT += dt;
    if (this.stateT >= STATE_EVERY) {
      this.stateT = 0;
      c.sendState(encodePlayer({ x: P.pos.x, y: P.pos.y, z: P.pos.z, yaw: P.yaw, pitch: P.pitch, pose: P.hands.gloves.hands.R.pose, hp: (P.hp / P.maxHp) * 100, weapon: P.weapon, down: P.dead }));
      if (this.hits.length) { while (this.hits.length) c.sendEvent('hit', { h: this.hits.splice(0, HITS_PER_MSG) }, this.hostId); }
    }
    if (this.host && this.snapT >= SNAP_EVERY && g.run) {
      this.snapT = 0;
      const live = g.enemies.list.filter((e) => !e.dying && !e.puppet && e.id).map((e) => ({ id: e.id, type: e.type, pos: e.pos, yaw: Math.atan2(e.dir.x, e.dir.z), hp: e.hp, maxHp: e.maxHp, flags: flagsOf(e) }));
      c.sendSnap({ f: g.run.i, e: encodeEnemies(live, TYPE_ORDER) });
    }
    this.remotes.update(dt, g.time, performance.now()); if (this.loot) this.loot.update(dt);
    this.tickTeam(dt);
  }
  /** Downed / dead bookkeeping each frame (the arena replaces it with its own K.O. and respawn). */
  tickTeam() {
    const g = this.g, P = g.player;
    for (const id of this.team.tick(this.now)) {
      if (id === this.you) { this.spectating = true; P.hands.root.visible = false; g.hud.banner('SPECTATEUR', 'Tu regardes tes coéquipiers jusqu’à la fin', 3); }
      else this.remotes.label(id, `${this.names.get(id) || '?'} ✗`);
    }
    for (const id of this.team.ids('downed')) if (id !== this.you) this.remotes.label(id, `${this.names.get(id) || '?'} · ${Math.ceil(this.team.left(id, this.now))} s`);
    for (const id of this.team.ids('alive')) if (id !== this.you) this.remotes.label(id, this.names.get(id) || '?');
    if (this.spectating) this.follow();
    if (this.team.wiped && g.state === 'playing') g.coopWipe();
  }
  /** Spectator: ride along with the nearest standing teammate (the player body is frozen, only its position and gaze follow). */
  follow() {
    const P = this.g.player, id = this.team.ids('alive').find((i) => i !== this.you), s = id && this.remotes.last(id); if (!s) return;
    P.pos.set(s.x, s.y, s.z); P.vel.set(0, 0, 0); P.yaw = s.yaw; P.pitch = s.pitch;
  }
}
