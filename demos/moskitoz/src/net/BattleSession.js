// A Battle Royale match on this machine: the arena (src/net/ArenaSession.js) with ONE life per round, played over 3 ROUNDS on 3 floors. In a
// round a storm closes in on the centre and stings whoever is outside it; the last player standing wins the round. When a round ends,
// everybody (the fallen included) drops through the floor into the next, new arena. The match goes to whoever won the most rounds; a tie is
// broken by the number of kills (mosquitoes + players). The host rules; every machine keeps the same order of eliminations.
//  - `out`   (host -> all): a player is eliminated this round.
//  - `round` (host -> all): the round is over: winner `w`, next round `r`, tallies `wins` / `kills` (arrays of [id, n]).
//  - `over`  (host -> all): the match is over: winner `w` and the final tallies.
import * as THREE from 'three';
import { bus } from '../core/core.js';
import { ArenaSession } from './ArenaSession.js';
import { BR_TIME, ROUNDS, ROUND_PAUSE, PLACE_BONUS, zoneRadius, zoneDps, outsideZone, Standings, timeoutWinner, matchRanking } from '../tower/BattleRoyale.js';
import { creditFor } from '../tower/Arena.js';
import { CHEST_COUNT } from '../tower/Loot.js';
import { WEAPON_OF } from '../economy/Loadout.js';

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const clock = (t) => { const s = Math.max(0, Math.ceil(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const ZONE_TICK = 0.5;

// The storm wall: a tall cylinder of scrolling violet streaks, brighter at the foot, readable from anywhere in the arena.
const STORM_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const STORM_FS = `uniform float t; varying vec2 vUv;
void main() {
  float a = vUv.x * 160.0, w1 = sin(a + vUv.y * 5.0 - t * 2.4), w2 = sin(a * 0.37 - vUv.y * 9.0 + t * 1.7);
  float streak = smoothstep(0.35, 1.0, w1 * 0.5 + w2 * 0.5 + 0.5), foot = 1.0 - smoothstep(0.0, 0.55, vUv.y), top = smoothstep(0.0, 0.1, 1.0 - vUv.y);
  vec3 col = mix(vec3(0.42, 0.12, 0.95), vec3(1.0, 0.32, 0.78), streak);
  float alpha = (0.34 + 0.4 * streak + 0.5 * foot) * top;
  gl_FragColor = vec4(col + foot * 0.35, clamp(alpha, 0.0, 0.92));
}`;

export class BattleSession extends ArenaSession {
  constructor(game, client) {
    super(game, client);
    this.br = true; this.timeLeft = BR_TIME; this.won = null; this.winner = null; this.zoneT = 0; this.zoneAcc = 0; this.r0 = 0; this.ring = null; this.disc = null;
    this.round = 0; this.roundOver = false; this.interT = 0; this.wins = new Map(); this.kills = new Map(); this.baseBiome = this.biome;
    this.st = new Standings(this.team.m.keys());
    const b = (t, f) => { bus.on(t, f); this.busOff.push([t, f]); };
    b('enemy:killed', ({ enemy }) => { if (this.host && enemy.id > 0 && !enemy.suicide) this.addKill(enemy.lastHit || this.you); });
    this.vig = document.createElement('div'); this.vig.className = 'storm-vig'; document.body.appendChild(this.vig);
    this.compass = document.createElement('div'); this.compass.className = 'br-compass'; this.compass.innerHTML = '<i>▲</i><b></b>'; document.body.appendChild(this.compass);
  }
  chestCount() { return CHEST_COUNT.br; }
  dispose() { this.removeStorm(); this.vig.remove(); this.compass.remove(); super.dispose(); }
  addKill(id) { this.kills.set(id, (this.kills.get(id) || 0) + 1); }
  /** Tallies as [id, n] pairs -> maps (from a `round` / `over` message). */
  loadTally(d) {
    for (const [key, map] of [['wins', this.wins], ['kills', this.kills]]) if (Array.isArray(d[key])) for (const p of d[key].slice(0, 32)) if (Array.isArray(p) && Number.isInteger(p[0]) && Number.isFinite(p[1])) map.set(p[0], p[1]);
  }
  tally() { return { wins: [...this.wins], kills: [...this.kills] }; }

  // ---- eliminations ----
  onEvent(m) {
    const d = m.d || {};
    if (m.k === 'out') { if (!this.host && Number.isInteger(d.id)) this.markOut(d.id); return; }
    if (m.k === 'round') { if (!this.host && Number.isInteger(d.r)) { this.loadTally(d); this.onRound(Number.isInteger(d.w) ? d.w : null); } return; }
    if (m.k === 'over') { this.winner = Number.isInteger(d.w) ? d.w : null; this.loadTally(d); this.finish(); return; }
    super.onEvent(m);
  }
  markOut(id) {
    if (!this.st.eliminate(id)) return;
    const av = this.avatars.get(id); if (av) av.pos.set(0, -500, 0);
    if (id !== this.you) bus.emit('toast', { text: `${this.names.get(id) || '?'} est éliminé · ${this.st.alive().length} en vie`, kind: id === this.you ? 'warn' : 'ach' });
  }
  /** Host: the score board's frag + the elimination, then check whether the round is decided. */
  award(killer, victim) { super.award(killer, victim); if (this.host) { if (killer != null && killer !== victim) this.addKill(killer); this.eliminate(victim); } }
  eliminate(id) {
    if (!this.host || this.over || this.roundOver || !this.st.ids.has(id) || this.st.isOut(id)) return;
    this.c.sendEvent('out', { id }); this.markOut(id); this.checkEnd();
  }
  checkEnd() { if (this.host && !this.over && !this.roundOver && this.st.decided) this.endRound(this.st.alive()[0] ?? null); }

  // ---- rounds ----
  /** Host: the round is decided (or its clock ran out). The last round ends the match. */
  endRound(w) {
    if (!this.host || this.over || this.roundOver) return;
    if (w != null) this.wins.set(w, (this.wins.get(w) || 0) + 1);
    if (this.round + 1 >= ROUNDS) { this.endMatch(); return; }
    this.c.sendEvent('round', { w, r: this.round + 1, ...this.tally() }); this.onRound(w);
  }
  /** Everybody: the round is over, a short pause, then the next arena. */
  onRound(w) {
    if (this.over || this.roundOver) return;
    this.roundOver = true; this.interT = ROUND_PAUSE; this.timeLeft = BR_TIME; // (a spent clock must not end the match in the arena's own tick)
    const n = this.names.get(w);
    this.g.hud.banner(`MANCHE ${this.round + 1}/${ROUNDS} · ${w == null ? 'égalité' : w === this.you ? 'tu gagnes !' : `${n || '?'} gagne`}`, 'Le sol cède : tout le monde tombe à l’étage du dessous…', ROUND_PAUSE);
    this.g.audio.play('milestone');
  }
  /** Everybody, after the pause: a new, different arena; everyone is back in with full health and drops in from above. */
  nextRound() {
    const g = this.g, P = g.player; this.round++; this.roundOver = false;
    this.biome = 1 + ((this.baseBiome - 1 + this.round * 7) % 20); this.wave = 0; this.timeLeft = BR_TIME; this.zoneAcc = 0; this.winner = null;
    this.st = new Standings(this.team.m.keys()); this.spectating = false; this.respawnT = 0; this.lastHit = null;
    this.removeStorm(); g.beginArena();
    P.dead = false; P.hp = P.maxHp; P.invulnT = 3; P.hands.root.visible = true; P.selectWeapon(WEAPON_OF[g.run.loadout.weapon] || 'hands');
    P.pos.y = Math.max(6, g.level.h - 2.5); P.vel.set(0, 0, 0); g.flash = 0.5; g.audio.play('whoosh'); g.hud.fade(0, 300);
    g.hud.banner(`MANCHE ${this.round + 1}/${ROUNDS}`, `${g.level.name} · le dernier debout gagne`, 3);
  }
  endMatch() {
    const w = this.matchWinner(); if (w != null) this.board.add(w, PLACE_BONUS);
    this.sendBoard(); this.c.sendEvent('over', { w, ...this.tally() }); this.winner = w; this.finish();
  }
  matchWinner() { return matchRanking([...this.st.ids], (i) => this.wins.get(i) || 0, (i) => this.kills.get(i) || 0)[0] ?? null; }
  onLeft(id) { super.onLeft(id); this.st.leave(id); this.checkEnd(); }
  onLocalDown() { // final for the round: no respawn
    if (this.over || this.roundOver) return;
    const by = creditFor(this.lastHit, this.now), name = by != null ? this.names.get(by) : null;
    this.respawnT = 0; this.spectating = true; this.g.player.hands.root.visible = false;
    if (this.host) this.award(by, this.you); else this.c.sendEvent('frag', { by }, this.hostId);
    this.st.eliminate(this.you);
    this.g.hud.fade(0.45, 400, '#3a0000'); this.g.hud.banner('ÉLIMINÉ', `${name ? `Touché par ${name} · ` : ''}Place ${this.st.alive().length + 1} de la manche`, 4);
  }

  // ---- the storm ----
  ensureRing(r0) {
    if (this.ring) return;
    this.uni = { t: { value: 0 } };
    const g = new THREE.CylinderGeometry(1, 1, 90, 160, 1, true), m = new THREE.ShaderMaterial({ uniforms: this.uni, vertexShader: STORM_VS, fragmentShader: STORM_FS, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false });
    this.ring = new THREE.Mesh(g, m); this.ring.position.y = 40; this.ring.renderOrder = 5; this.ring.frustumCulled = false; this.g.scene.add(this.ring);
    const dg = new THREE.RingGeometry(1, 8, 128), dm = new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false, fog: false });
    this.disc = new THREE.Mesh(dg, dm); this.disc.rotation.x = -Math.PI / 2; this.disc.position.y = 0.09; this.disc.renderOrder = 4; this.disc.frustumCulled = false; this.g.scene.add(this.disc);
    this.r0 = r0;
  }
  removeStorm() {
    for (const k of ['ring', 'disc']) { const o = this[k]; if (o) { this.g.scene.remove(o); o.geometry.dispose(); o.material.dispose(); this[k] = null; } }
    this.r0 = 0;
  }
  tickTeam(dt) {
    const g = this.g, L = g.level, P = g.player;
    if (this.roundOver) { // pause between two rounds: nobody can be hurt, the next arena comes when it runs out
      P.invulnT = Math.max(P.invulnT, 0.5);
      if (!this.over && (this.interT -= dt) <= 0) this.nextRound();
      this.drawHud(dt); return;
    }
    let out = false;
    if (L && g.live && !this.over) {
      const r0 = Math.min(L.w, L.d) * 0.48; this.ensureRing(r0);
      const t = BR_TIME - this.timeLeft, r = zoneRadius(t, this.r0); this.ring.scale.set(r, 1, r); this.disc.scale.set(r, r, 1); this.uni.t.value = g.time;
      out = !P.dead && outsideZone(P.pos.x, P.pos.z, r);
      if (out && (this.zoneAcc += dt) >= ZONE_TICK) { P.hurt(zoneDps(t) * this.zoneAcc, P.eye.clone(), { by: 'zone' }); this.zoneAcc = 0; }
      else if (!out) this.zoneAcc = 0;
      this.drawCompass(r);
    }
    this.vig.classList.toggle('on', out); this.compass.style.display = L && g.live && !this.over && !P.dead ? '' : 'none';
    if (this.host && this.timeLeft <= 0 && !this.over) this.endRound(timeoutWinner(this.st.alive(), (i) => this.board.get(i))); // clock out
    super.tickTeam(dt);
    if (this.spectating && !this.over) this.watch();
  }
  /** Arrow towards the centre of the safe zone, with the distance left to its edge. */
  drawCompass(r) {
    const P = this.g.player, d = Math.hypot(P.pos.x, P.pos.z), yawT = Math.atan2(P.pos.x, P.pos.z); // direction to the centre as a yaw
    this.compass.firstChild.style.transform = `rotate(${P.yaw - yawT}rad)`;
    const edge = Math.round(r - d); this.compass.lastChild.textContent = edge >= 0 ? `ZONE · ${edge} m` : `TEMPÊTE · retourne ${-edge} m !`; this.compass.classList.toggle('bad', edge < 0);
  }
  /** Spectator: ride along with the nearest player still in. */
  watch() {
    const P = this.g.player, ids = this.st.alive().filter((i) => i !== this.you), s = ids.map((i) => this.remotes.last(i)).find(Boolean); if (!s) return;
    P.pos.set(s.x, s.y, s.z); P.vel.set(0, 0, 0); P.yaw = s.yaw; P.pitch = s.pitch;
  }
  finish() {
    if (this.over) return;
    this.won = this.winner != null ? this.winner === this.you : null; this.removeStorm(); this.vig.classList.remove('on'); this.compass.style.display = 'none';
    super.finish();
  }

  // ---- HUD & result ----
  drawHud(dt) {
    this.hudT += dt; this.el.style.display = this.g.live && !this.over ? '' : 'none'; if (this.hudT < 0.25) return; this.hudT = 0;
    const t = BR_TIME - this.timeLeft, r = this.r0 ? zoneRadius(t, this.r0) : 0, out = !this.g.player.dead && this.r0 && outsideZone(this.g.player.pos.x, this.g.player.pos.z, r);
    const rows = this.board.ranking().filter((e) => !this.st.isOut(e.id)).map((e) => `<div class="ah-row${e.id === this.you ? ' me' : ''}"><span>${e.rank}</span><b>${esc(this.names.get(e.id) || '?')}</b><i>${this.wins.get(e.id) ? '★'.repeat(this.wins.get(e.id)) + ' ' : ''}${e.score}</i></div>`).join('');
    this.el.innerHTML = `<div class="ah-time">${clock(this.timeLeft)}</div><div class="ah-row"><span></span><b>Manche ${Math.min(ROUNDS, this.round + 1)}/${ROUNDS}</b><i>En vie ${this.st.alive().length}/${this.st.ids.size}</i></div>${out ? '<div class="ah-warn">Hors de la zone !</div>' : ''}${rows}`;
  }
  /** Final placements, winner first: most rounds won, then most kills. */
  standings() {
    const ids = [...this.st.ids], w = (i) => this.wins.get(i) || 0, k = (i) => this.kills.get(i) || 0;
    return matchRanking(ids, w, k).map((id, i) => ({ id, place: i + 1, wins: w(id), kills: k(id) }));
  }
}
