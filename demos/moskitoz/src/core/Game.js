// Game singleton: renderer, scene, systems and the Tower state machine.
// States: menu -> intro -> playing <-> clearing -> falling -> playing ... ; dying/victory -> over ; paused
import * as THREE from 'three';
import { bus, clamp, damp, easeInOut, easeOut, rng } from './core.js';
import { Settings } from './Settings.js';
import { Touch, isTouchDevice } from '../ui/Touch.js';
import { GamepadInput } from '../ui/Gamepad.js';
import { CFG } from '../player/Moves.js';
import { Post } from '../render/Post.js';
import { INK, SHADE } from '../render/Style.js';
import { fogRange, shadeTint } from '../render/StyleRules.js';
import { Particles, Rings, Splats, Stars } from '../render/Effects.js';
import { surfaceBelow } from '../render/Surface.js';
import { Coins } from '../economy/Coins.js';
import { Profile } from '../economy/Profile.js';
import { chestContent, chestHere, floorBonus, killValue, rainBonus } from '../economy/Drops.js';
import { ITEMS, item, skinOf } from '../economy/Items.js';
import { AudioManager } from '../audio/Audio.js';
import { Level, ROOF } from '../level/Level.js';
import { Player } from '../player/Player.js';
import { Rewards } from '../player/Progress.js';
import { EnemyManager, WaveSpawner } from '../enemies/Spawner.js';
import { Mosquito, TYPES } from '../enemies/Mosquito.js';
import { HUD } from '../ui/HUD.js';
import { MODES, Run, dayKey, floorInfo, huntArena, huntInfo, huntStats, statsFor, unlocksBetween } from '../tower/Tower.js';
import { WEAPON_OF, menaceMods, runLoadout } from '../economy/Loadout.js';
import { CoopSession } from '../net/CoopSession.js';
import { ArenaSession } from '../net/ArenaSession.js';
import { BattleSession } from '../net/BattleSession.js';
import { coopScale } from '../tower/Coop.js';
import { buildExterior } from '../tower/Exterior.js';
import { AcidJets } from '../player/ViewModel.js';
import { Finale, FINALE_TIME, HALL_TIME } from '../tower/Finale.js';
import { LB } from '../tower/Leaderboard.js';

const V3 = THREE.Vector3;
const DEAD_COLORS = { mosquito: 0xff5544, speedbug: 0xff3366, heavy: 0x88ff55, swarmling: 0xffcc33, tyrant: 0xff33aa, spitter: 0xbb77ff, kamikaze: 0xff9933, shield: 0x66aaff, splitter: 0xff77cc, healer: 0x55ffaa };
const ULT_GAIN = { mosquito: 8, speedbug: 8, heavy: 20, swarmling: 3, tyrant: 50, spitter: 10, kamikaze: 6, shield: 14, splitter: 14, healer: 14 };
const HOLE_R = 3.8;
const MENU_FOG = [450, 2600], ROOF_FOG = [120, 900]; // linear fog while the tower is seen from outside / on the roof

export class Game {
  constructor() {
    this.canvas = document.getElementById('c');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; // "Gomme & Encre": flat 2-tone colours, brightness lives in the grade pass
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.08, 2600);
    this.scene.add(this.camera);
    // scene-wide lights (retuned per room, so light count never changes and nothing recompiles)
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1); this.sun = new THREE.DirectionalLight(0xfff6e6, 1);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.04; this.sun.shadow.radius = 3;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.fx = new Particles(this.scene); this.rings = new Rings(this.scene); this.stars = new Stars(this.scene); this.splats = new Splats(this.scene);
    this.acid = new AcidJets(this.scene, { splats: false, solid: (x, y, z) => { const lv = this.level; return !!lv && (!lv.isFree(x, y, z, 0.05) || Math.abs(x) > lv.w / 2 || Math.abs(z) > lv.d / 2 || y > lv.h); } });
    this.finale = new Finale(this);
    this.coins = new Coins(this); this.coinStep = 0; this.coinT = 0;
    this.hatchRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 56), new THREE.MeshBasicMaterial({ color: 0xffd23c, side: THREE.DoubleSide, transparent: true, forceSinglePass: true, depthWrite: false })); this.hatchRing.rotation.x = -Math.PI / 2;
    this.audio = new AudioManager(); this.rewards = new Rewards(this);
    this.diff = { hp: 1, dmg: 1, spawn: 1, zones: 2 };
    this.state = 'menu'; this.time = 0; this.hitstopT = 0; this.slowT = 0; this.endT = 0; this.locked = false; this.intensity = 0; this.frames = 0; this.fpsT = 0; this.lowT = 0; this.goodT = 0; this.res = 1; this.lockT = 0; this.flash = 0;
    this.run = null; this.coop = null; this.trialSkin = null; this.returnTo = null; this.level = null; this.next = null; this.old = null; this.exterior = null; this.floorKind = 'roof'; this.info = null; this.fall = null; this.menuT = 0; this.introT = 0; this.curS = 0;
    this.enemies = new EnemyManager(this); this.spawner = new WaveSpawner(this);
    this.player = new Player(this);
    this.post = new Post(this.renderer, this.scene, this.camera);
    this.hud = new HUD(this);
    this.gamepad = new GamepadInput(this);
    this.touch = isTouchDevice() ? new Touch(this) : null; if (this.touch) document.documentElement.classList.add('touch');
    // mobile profile: start low (no MSAA, 0.825 resolution, smaller shadow map) instead of waiting for autoQuality to drop it
    if (this.touch) { this.res = 0.825; this.sun.shadow.mapSize.set(1024, 1024); }
    this.setQuality(Settings.v.q ?? (this.touch ? 0 : 1), Settings.v.q != null); this.applySettings();
    this.dev = /[?&]dev/.test(location.search);
    this.bind(); this.resize();
    this.toMenu(); this.warm();
    window.game = this;
    this.last = performance.now(); requestAnimationFrame((t) => this.frame(t));
  }
  get live() { return this.state === 'playing' || this.state === 'clearing' || this.state === 'falling'; }

  // ---- scene setup ----
  // smooth = cross-fade colours / fog over ~0.9 s (used when the player drops into the next room)
  applyLighting(L, smooth = false) {
    const pal = L.pal, th = L.theme, { w, d, h } = L;
    SHADE.tint.value.setRGB(...shadeTint(pal));
    // warm key light with shadows + hemisphere tinted sky/ground (hue-shifted shadows) + light linear fog (spec §3.4)
    this.sun.color.set(pal.key); this.sun.intensity = pal.light ? pal.light[0] : pal.indoor ? 2.3 : 2.5; this.sun.position.set(w * 0.25, Math.min(h * 2.2, 60), d * 0.15);
    const ext = Math.max(w, d) * 0.75; Object.assign(this.sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: Math.min(h * 5, 200) });
    this.sun.shadow.camera.updateProjectionMatrix();
    const fr = th.roof ? { near: ROOF_FOG[0], far: ROOF_FOG[1] } : fogRange(Math.max(w, d), pal);
    const to = { hemi: new THREE.Color(pal.hemiSky), ground: new THREE.Color(pal.hemiGround), hi: pal.light ? pal.light[1] : pal.indoor ? 1.75 : 1.85, fog: new THREE.Color(pal.air), near: fr.near, far: fr.far, bg: new THREE.Color(pal.sky || pal.air) };
    if (!this.scene.fog) { this.scene.fog = new THREE.Fog(0xffffff, 1, 2); this.scene.background = new THREE.Color(); this.setLight(to); return; }
    if (smooth) this.lt = { k: 0, to, from: { hemi: this.hemi.color.clone(), ground: this.hemi.groundColor.clone(), hi: this.hemi.intensity, fog: this.scene.fog.color.clone(), near: this.scene.fog.near, far: this.scene.fog.far, bg: this.scene.background.clone() } };
    else { this.lt = null; this.setLight(to); }
  }
  setLight(s) {
    this.hemi.color.copy(s.hemi); this.hemi.groundColor.copy(s.ground); this.hemi.intensity = s.hi;
    this.scene.fog.color.copy(s.fog); this.scene.fog.near = s.near; this.scene.fog.far = s.far; this.scene.background.copy(s.bg);
  }
  lightUpdate(dt) {
    const l = this.lt; if (!l) return;
    l.k = Math.min(1, l.k + dt / 0.9); const e = easeInOut(l.k), f = l.from, t = l.to;
    this.hemi.color.copy(f.hemi).lerp(t.hemi, e); this.hemi.groundColor.copy(f.ground).lerp(t.ground, e); this.hemi.intensity = f.hi + (t.hi - f.hi) * e;
    this.scene.fog.color.copy(f.fog).lerp(t.fog, e); this.scene.fog.near = f.near + (t.near - f.near) * e; this.scene.fog.far = f.far + (t.far - f.far) * e; this.scene.background.copy(f.bg).lerp(t.bg, e);
    if (l.k >= 1) this.lt = null;
  }
  // compile every enemy shader while the menu is up, so the first spawn doesn't freeze the game
  warm() {
    const ms = Object.keys(TYPES).map((t) => new Mosquito(t, new V3(0, -300, 0), this.diff, 0)); ms.forEach((m) => this.scene.add(m.root));
    const done = () => ms.forEach((m) => { this.scene.remove(m.root); m.dispose(); });
    try { this.renderer.compileAsync(this.scene, this.camera).then(done, done); } catch { done(); }
  }
  clearWorld() {
    if (this.finale) this.finale.stop();
    for (const L of [this.level, this.next, this.old]) if (L) { this.scene.remove(L.group); L.dispose(); }
    if (this.exterior) { this.scene.remove(this.exterior); this.exterior.userData.dispose(); }
    this.level = this.next = this.old = this.exterior = null; this.enemies.clear(); this.rings.clear(); this.stars.clear(); this.splats.clear(); this.fx.clear(); this.acid.n = 0; this.coins.clear(); this.spawner.idle();
  }
  buildMenuScene() {
    this.clearWorld();
    this.level = new Level(ROOF, { zones: 0 }); this.scene.add(this.level.group);
    this.exterior = buildExterior(); this.scene.add(this.exterior);
    this.applyLighting(this.level); this.scene.fog.near = MENU_FOG[0]; this.scene.fog.far = MENU_FOG[1];
    this.floorKind = 'roof'; this.camera.fov = 60; this.camera.near = 1; this.camera.updateProjectionMatrix(); // far-away city: a larger near plane keeps the flat overlays from z-fighting
    this.menuCam();
  }
  menuCam() {
    const t = this.menuT, R = 400;
    this.camera.position.set(Math.cos(t) * R, -205 + Math.sin(t * 1.7) * 18, Math.sin(t) * R); this.camera.lookAt(0, -205, 0);
  }
  applySettings() { this.post.u.uBright.value = Settings.v.bright; this.audio.applyVolumes(); }
  setQuality(q, manual) { this.post.setQuality(q); if (manual) this.autoQ = false; }

  bind() {
    addEventListener('resize', () => this.resize());
    bus.on('settings', () => this.applySettings());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas; if (this.locked) this.lockT = performance.now();
      if (!this.locked && this.live) this.pause();
    });
    // ignore the bogus movement spike browsers emit right after the lock, and any single absurd delta
    document.addEventListener('mousemove', (e) => {
      if (!this.live || !this.locked || performance.now() - this.lockT < 150) return;
      if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      this.player.look(e.movementX, e.movementY);
    });
    this.canvas.addEventListener('mousedown', (e) => { if (this.state !== 'playing') return; if (e.button === 0) this.player.combat.down(); else if (e.button === 2) this.player.combat.alt(); });
    addEventListener('mouseup', (e) => { if (e.button === 0) this.player.combat.up(); });
    addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', (e) => { if (this.state !== 'playing' || Math.abs(e.deltaY) < 1) return; e.preventDefault(); const t = performance.now(); if (t - (this.wheelT || 0) > 180) { this.wheelT = t; this.player.cycleWeapon(); } }, { passive: false });
    addEventListener('keydown', (e) => {
      if (this.state === 'intro' && (e.code === 'Space' || e.code === 'Enter')) { this.introT = 99; return; }
      if (this.finale.on && this.finale.t > 3 && (e.code === 'Enter' || (!this.finale.hall && e.code === 'Space'))) { this.endT = Math.min(this.endT, 0.15); return; } // skip the finale
      if (e.code === 'Escape' && this.live && !this.locked) { this.pause(); return; }
      if (!this.live) return;
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ControlLeft'].includes(e.code)) e.preventDefault();
      this.player.key(e.code, true);
      if (this.dev) this.devKey(e.code);
      if (this.run && this.run.dev && this.state === 'playing') this.cheatKey(e);
    });
    addEventListener('keyup', (e) => { this.player.key(e.code, false); });
    addEventListener('blur', () => { this.player.keys.clear(); if (this.live) this.pause(); });
    addEventListener('pagehide', () => this.bankCoins()); // closing the tab never loses picked-up coins
    bus.on('enemy:killed', (k) => this.onKilled(k));
    bus.on('enemy:hit', (h) => { const e = h.enemy, c = this.camera.position; this.stars.spawn(e.pos.clone().add(new V3().subVectors(c, e.pos).normalize().multiplyScalar(e.radius * 0.8)), h.crit); });
    bus.on('level:clear', () => this.onFloorClear());
    bus.on('level:cue', ({ level, sound, at, burst }) => { if (level === this.level) { this.audio.play(sound); if (burst) this.fx.emit(at, burst); } }); // room events (crumbling platforms)
    bus.on('player:dead', () => { if (this.coop) this.coop.onLocalDown(); else this.onDeath(); }); // coop: downed first, the run only ends when the whole team is down
    bus.on('boss:down', () => { this.slowT = 1.4; });
    bus.on('player:hurt', (h) => { this.hitstop(0.04); const r = this.run; if (r) { r.noDamage = false; if (h.by) { r.dmgBy[h.by] = (r.dmgBy[h.by] || 0) + h.dmg; r.lastBy = h.by; } } });
  }
  /** The hand skin worn right now: the one being tried from the Armory, else the profile's. */
  skinId() { return this.trialSkin || Profile.get().loadout.hands; }
  /**
   * Armory « Essayer »: a throwaway run on the first floor with the chosen weapon / power / skin, invincible, nothing saved
   * (same machinery as the developer mode). Leaving it goes back to `back` (the Armory) instead of the menu.
   */
  tryItem({ weapon, power, skin }, back) {
    const lo = Profile.get().loadout;
    this.returnTo = back || null;
    this.startRun('tower', { dev: { weapon: weapon === undefined ? lo.weapon : weapon, power: power === undefined ? lo.power : power, god: true, i: 0 }, skin, trial: true });
  }
  onDeath() { if (!this.run || this.state === 'dying' || this.state === 'over') return; this.state = 'dying'; this.endT = 1.6; this.slowT = 1.6; this.audio.setTrack('none'); this.audio.play('death'); this.hud.fade(0.6, 1400, '#3a0000'); }
  /** Coop: the whole team is down (or the host closed the match): the run is over for everybody. */
  coopWipe(aborted = false) { if (this.run && aborted) this.run.aborted = true; this.onDeath(); }
  devKey(code) {
    if (code === 'KeyK') this.enemies.list.forEach((e) => e.damage(9999, { silent: true }));
    if (code === 'KeyL') { this.spawner.queue = []; this.enemies.list.forEach((e) => e.damage(9999, { silent: true })); }
    if (code === 'KeyH') this.player.hp = this.player.maxHp;
    if (code === 'KeyU') this.player.ultCharge = 100;
  }
  // ---- developer mode (menu → Développeur, password): pick floor / weapon / power, nothing is saved ----
  devGo(o) {
    this.cheat = { weapon: o.weapon || null, power: o.power || null, god: !!o.god, calm: !!o.calm, i: o.i };
    this.run.dev = true; this.run.loadout = { weapon: this.cheat.weapon, power: this.cheat.power }; this.hud.loadout(this.run.loadout);
    this.jumpTo(o.i); this.devSync();
  }
  devStats(st) {
    const c = this.cheat, first = WEAPON_OF[c.weapon];
    st.weapons = ['hands', ...(first ? [first] : []), ...Object.values(WEAPON_OF).filter((w) => w !== first)];
    st.power = true; st.ultra = true; st.invuln = true; st.handPower = c.power;
  }
  devSync() { // after a weapon / power change: slots, stats, equipped item
    const c = this.cheat, r = this.run, p = this.player;
    r.loadout = { weapon: c.weapon, power: c.power }; this.hud.loadout(r.loadout); this.devStats(p.stats);
    p.selectWeapon(WEAPON_OF[c.weapon] || 'hands'); this.devBar();
  }
  devFloor(i) { i = clamp(i, 0, 99); if (i === this.cheat.i) return; this.cheat.i = i; this.jumpTo(i); this.devSync(); }
  cheatKey(e) {
    const c = this.cheat, W = [null, ...ITEMS.filter((x) => x.slot === 'arme').map((x) => x.id)], P = [null, ...ITEMS.filter((x) => x.slot === 'pouvoir').map((x) => x.id)];
    const cyc = (L, v, d) => L[(L.indexOf(v) + d + L.length) % L.length];
    const k = e.code;
    if (k === 'ArrowRight' || k === 'ArrowLeft') c.weapon = cyc(W, c.weapon, k === 'ArrowRight' ? 1 : -1);
    else if (k === 'ArrowUp' || k === 'ArrowDown') c.power = cyc(P, c.power, k === 'ArrowUp' ? 1 : -1);
    else if (k === 'PageUp') return this.devFloor(c.i - 1);
    else if (k === 'PageDown') return this.devFloor(c.i + 1);
    else if (k === 'Home') { c.god = !c.god; return this.devBar(); }
    else if (k === 'Insert') { this.victoryEnd(); return; }
    else if (k === 'End') { this.spawner.idle(); this.enemies.list.forEach((x) => x.damage(9999, { silent: true })); return; }
    else return;
    e.preventDefault(); this.devSync();
  }
  devBar(on = true) {
    let el = document.getElementById('devbar');
    if (!on || !this.run || !this.run.dev) { if (el) el.hidden = true; return; }
    if (!el) { el = document.createElement('div'); el.id = 'devbar'; document.body.appendChild(el); }
    const c = this.cheat, n = (id) => (id ? item(id).name : 'aucun');
    el.hidden = false;
    if (this.run.trial) { el.innerHTML = `<b>ESSAI</b> · Rien n’est enregistré · tu es invincible<br><span>Échap : pause, puis Menu pour revenir à l’Armurerie</span>`; return; }
    el.innerHTML = `<b>MODE DÉVELOPPEUR</b> · Étage ${99 - c.i} · Arme : ${n(c.weapon)} · Pouvoir : ${n(c.power)} · ${c.god ? 'Invincible' : 'Mortel'}${c.calm ? ' · Sans moustiques' : ''}<br><span>← → arme · ↑ ↓ pouvoir · Pg↑ Pg↓ étage · Début invincible · Fin vider la salle · Inser. finale</span>`;
  }
  resize() {
    const w = innerWidth, h = innerHeight, pr = Math.min(devicePixelRatio || 1, 1.5) * this.res;
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.post.resize(w, h, pr); this.fx.setScale(h * pr * 1.2);
    this.renderer.getDrawingBufferSize(INK.res.value); // ink lines keep the same width in pixels
  }
  hitstop(d) { this.hitstopT = Math.max(this.hitstopT, d); }
  lock() {
    if (this.touch) { this.locked = true; this.lockT = performance.now(); return; } // no pointer lock on a touch screen: the look zone drives the camera
    // raw (unaccelerated) mouse input when the browser supports it
    const c = this.canvas, plain = () => { try { const q = c.requestPointerLock(); if (q && q.catch) q.catch(() => {}); } catch { /* unsupported */ } };
    try { const r = c.requestPointerLock({ unadjustedMovement: true }); if (r && r.catch) r.catch(plain); } catch { plain(); }
  }
  unlock() { if (this.touch) { this.locked = false; return; } try { document.exitPointerLock(); } catch { /* */ } }

  // ---- run flow ----
  // ---- coins (spec §8) ----
  onCoin(value) {
    const run = this.run; if (!run) return;
    run.coins += value; this.hud.coin(run.coins);
    this.coinStep = this.coinT > 0 ? this.coinStep + 1 : 0; this.coinT = 0.6; this.audio.play('coin', this.coinStep); // rising scale
  }
  onPlan(id) { Profile.addPlan(id); this.audio.play('milestone'); bus.emit('toast', { text: 'PLAN OBTENU : ' + item(id).name, kind: 'ach' }); }
  bankCoins() { const r = this.run; if (r && !r.dev && r.coins > r.banked) { Profile.bank(r.coins - r.banked); r.banked = r.coins; } }
  endRun(run) {
    if (run.dev) { this.toMenu(); return; }
    this.bankCoins(); Profile.endRun(run.mode.hunt ? 0 : run.cleared);
    if (run.mode.hunt) run.record = Profile.huntRecord(run.biome, run.cleared); // local record only (spec §9)
    this.hud.end(run);
  }
  placeChest(info) {
    const r = rng(info.seed ^ 0x5eed); if (!chestHere(r, info.boss)) return;
    const content = chestContent(r, Profile.get().plans, info.boss), L = this.level;
    const plats = (L.pickups || []).filter((k) => !k.plat.dynamic).sort((a, b) => b.plat.center.y - a.plat.center.y); // on the highest platform that stays put
    if (plats[0]) { const k = plats[0]; k.taken = true; k.group.removeFromParent(); this.coins.placeChest(k.plat.center.clone().setY(k.plat.center.y + 0.225), content, k.plat); }
    else this.coins.placeChest(new V3(L.w / 4, 0, -L.d / 4), content);
  }
  coinLog() { if (this.dev && this.run) { const l = this.coins.log, field = this.coins.items.reduce((s, x) => s + x.value, 0) + this.coins.pendingRain; console.log('[coins]', JSON.stringify({ floor: this.run.i, spawned: l.spawned, collected: l.collected, lost: l.lost, onField: field, run: this.run.coins, banked: this.run.banked, profile: Profile.get().coins })); } }
  toMenu() {
    const back = this.returnTo; this.returnTo = null; this.trialSkin = null;
    this.bankCoins(); if (this.coop) { this.coop.dispose(); this.coop = null; }
    this.finale.stop(); this.devBar(false); this.state = 'menu'; this.hud.fade(0, 250); this.unlock(); this.hud.show(false); this.player.hands.root.visible = false; this.run = null;
    this.buildMenuScene(); this.audio.setTrack('menu'); this.hud.menu(); this.hud.dip(700);
    if (back) back(); // an Armory trial ends back in the Armory
  }
  // o.biome: Chasse arena. The loadout comes from the profile (Défi: drawn from the day, same for everyone).
  startRun(modeId, o = {}) {
    if (this.coop) { this.coop.dispose(); this.coop = null; }
    this.trialSkin = o.skin || null;
    this.audio.init(); this.audio.resume(); this.player.maxHp = CFG.maxHp;
    this.hud.fade(0, 0); // the red death veil must never survive into the next run (retry)
    this.buildMenuScene();
    const mode = MODES[modeId], lo = o.dev ? { weapon: o.dev.weapon, power: o.dev.power } : runLoadout(mode, Profile.get(), dayKey());
    const dw = this.dev && /[?&]weapon=(\w+)/.exec(location.search), di = dw && item(dw[1]); // demo: ?dev&weapon=<item id>
    if (di && di.live) lo[di.slot === 'arme' ? 'weapon' : 'power'] = di.id;
    this.devPower = !!(di && di.live && di.slot === 'pouvoir'); // the demo power is usable from the roof
    this.run = new Run(mode, lo); this.run.trial = !!o.trial; this.run.i = -1; this.rewards.reset(); this.mods = menaceMods(this.run.menace);
    this.hud.loadout(lo);
    this.player.hands.gloves.setSkin(skinOf(this.skinId())); // personal, also in the daily challenge
    if (mode.hunt) this.run.biome = Math.min(Profile.get().stats.biome, Math.max(1, o.biome || 1));
    this.player.reset(); this.player.ultCharge = 0; this.player.stats = statsFor(0, lo); if (this.devPower) this.player.stats.handPower = lo.power; this.player.gravMul = 1; this.curS = mode.base ?? 0;
    this.fallBlur = 0; this.diff.hp = 1; this.diff.dmg = MODES[modeId].dmg || 1; this.enemies.speedMul = 1; this.ghost = LB.ghost(modeId);
    this.hud.hideScreen(); this.hud.show(false); this.player.hands.root.visible = false;
    this.introStart = this.camera.position.clone(); this.introT = 0; this.state = 'intro'; this.floorKind = 'roof'; this.victory = false;
    this.hud.shownScore = 0; this.slowT = 0; this.hitstopT = 0; this.lock(); this.audio.setTrack('menu'); this.hud.dip(900);
    if (o.dev) { this.devGo(o.dev); return; } // developer mode: straight to the chosen floor, nothing is saved
    if (mode.hunt) { this.beginHunt(); return; }
    const m = /[?&]floor=(\d+)/.exec(location.search);
    if (this.dev && m) this.jumpTo(+m[1]);
  }
  /** Coop match from a room (src/ui/LobbyScreen.js on `start`): the same tower as La Tour, played together (src/net/CoopSession.js). */
  startCoop(client) {
    this.startRun('coop');
    this.coop = new CoopSession(this, client);
  }
  /** Arena match from a room (src/ui/LobbyScreen.js on `start`): 5 minutes in one biome, everybody for themselves (src/net/ArenaSession.js). */
  startArena(client) {
    this.startRun('arena');
    this.coop = new ArenaSession(this, client);
  }
  /** Battle Royale match from a room: the arena with one life and a shrinking zone (src/net/BattleSession.js). */
  startBattle(client) {
    this.startRun('br');
    this.coop = new BattleSession(this, client);
  }
  beginArena() { // after the fly-up: the arena room, players on a ring facing the centre, the host's waves of mosquitoes
    const s = this.coop, b = s.biome, a = huntArena(b);
    this.run.biome = b; this.clearWorld();
    const sc = this.levelScale();
    this.level = new Level(b, { seed: a.seed, props: Math.round(a.props * sc * sc * 0.8), pk: a.pk, ult: true, zones: 2, scale: sc }); this.scene.add(this.level.group);
    this.applyLighting(this.level); this.player.reset();
    const L = this.level, sl = s.slot(), ang = (sl.i / sl.n) * Math.PI * 2, r = Math.min(L.w, L.d) * 0.3, x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    this.player.pos.set(x, 0, z); this.player.yaw = Math.atan2(x, z); this.player.pitch = 0; this.player.eyeY.snap(1.7);
    this.camera.near = 0.08; this.camera.fov = 80; this.camera.updateProjectionMatrix();
    this.run.i = 0; this.hud.hideScreen(); this.hud.show(true); this.player.hands.root.visible = true; this.state = 'playing'; this.floorKind = 'floor';
    this.audio.setTrack('gameplay'); this.hud.dip(700);
    this.startFloor(huntInfo(b, 0, 0));
  }
  /** Time is up (or the host closed the match): the score board is the result. */
  arenaEnd() {
    const r = this.run, s = this.coop; if (!r || !s || this.state === 'over') return;
    const me = s.board.ranking().find((e) => e.id === s.you); r.result = (s.br ? s.won : me && me.rank === 1) ? 'victory' : 'done'; r.score = s.board.get(s.you);
    this.state = 'over'; this.unlock(); this.hud.show(false); this.audio.setTrack(r.result === 'victory' ? 'victory' : 'none'); this.endRun(r);
  }
  // Fly-up: spiral around the facade at a safe radius while climbing above the roof, then glide in over the parapet and land at the spawn.
  // (A straight lerp from the menu orbit to the roof went through the tower walls.)
  introUpdate(dt) {
    this.introT += dt;
    const k = clamp(this.introT / 5.2, 0, 1), u = easeInOut(k), sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, lerp = (a, b, t) => a + (b - a) * t;
    const s = this.introStart, r0 = Math.hypot(s.x, s.z), a0 = Math.atan2(s.z, s.x), aEnd = Math.PI / 2; // final approach from +z, looking toward -z
    let da = aEnd - a0; da -= Math.round(da / (2 * Math.PI)) * 2 * Math.PI;
    const rIn = 62, yTop = 30;
    const rad = u < 0.55 ? lerp(r0, rIn, sm(u / 0.5)) : lerp(rIn, 4, sm((u - 0.55) / 0.45));
    const y = u < 0.65 ? lerp(s.y, yTop, sm(u / 0.65)) : lerp(yTop, 1.7, sm((u - 0.65) / 0.35));
    const ang = a0 + da * sm(u / 0.9);
    this.camera.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
    this.introBlur = Math.sin(Math.PI * u) * 0.8; this.camera.fov = 60 + 20 * u; this.camera.updateProjectionMatrix();
    const ty = u < 0.6 ? lerp(-205, 6, sm(u / 0.6)) : lerp(6, 1.7, sm((u - 0.6) / 0.4)), tz = u < 0.6 ? 0 : lerp(0, -20, sm((u - 0.6) / 0.4));
    this.camera.lookAt(0, ty, tz);
    this.scene.fog.near = MENU_FOG[0] + (ROOF_FOG[0] - MENU_FOG[0]) * u; this.scene.fog.far = MENU_FOG[1] + (ROOF_FOG[1] - MENU_FOG[1]) * u;
    if (k >= 1) { if (this.run.mode.arena) this.beginArena(); else this.beginRoof(); }
  }
  beginRoof() {
    const sl = this.coop ? this.coop.slot() : { i: 0, n: 1 };
    this.player.pos.set((sl.i - (sl.n - 1) / 2) * 1.6, 0, 4); this.player.yaw = 0; this.player.pitch = 0; this.player.eyeY.snap(1.7); // teammates side by side
    this.camera.near = 0.08; this.camera.updateProjectionMatrix(); this.scene.fog.near = ROOF_FOG[0]; this.scene.fog.far = ROOF_FOG[1]; this.introBlur = 0; this.hud.dip(500); this.hud.show(true); this.player.hands.root.visible = true; this.state = 'playing'; this.floorKind = 'roof';
    this.audio.setTrack('gameplay'); this.hud.banner('LE TOIT', 'Éliminez le moustique');
    if (!this.coop || this.coop.host) { const e = this.enemies.spawn('mosquito', new V3(6, 6, -30), 0); e.mul = 0.9; this.spawner.start([[]], { countdown: 0.1 }); } // coop guests only mirror the host's mosquitoes
    this.prepSoon();
  }
  /** Footprint multiplier of the arena / floor being built: coop floors and the Battle Royale are much bigger than solo rooms (the hand-made rooms keep theirs). */
  levelScale(info = null) { const s = this.coop; if (!s) return 1; if (s.br) return 2.2; if (s.arena) return 1.4; return info && info.hand ? 1 : 1.8; }
  beginHunt() { // Chasse: one arena, waves chained in place (no hatch)
    const b = this.run.biome, a = huntArena(b);
    this.clearWorld();
    this.level = new Level(b, { seed: a.seed, props: a.props, pk: a.pk, ult: true, zones: 2 }); this.scene.add(this.level.group);
    this.applyLighting(this.level); this.player.reset(); this.player.pos.set(0, 0, 4); this.player.yaw = 0; this.player.pitch = 0; this.player.eyeY.snap(1.7);
    this.camera.near = 0.08; this.camera.fov = 80; this.camera.updateProjectionMatrix();
    this.run.i = 0; this.hud.hideScreen(); this.hud.show(true); this.player.hands.root.visible = true; this.state = 'playing'; this.floorKind = 'floor';
    this.audio.setTrack('gameplay'); this.hud.dip(700);
    this.startFloor(huntInfo(b, 0, this.run.menace));
  }
  jumpTo(i) { // dev shortcut: land directly on floor i
    const info = floorInfo(this.run.mode, i, this.run.menace, this.coop ? this.coop.n : 1);
    this.clearWorld();
    this.level = new Level(info.themeIdx, { seed: info.seed, hand: info.hand, props: info.props, pk: info.pk, ult: statsFor(info.s).ultra, zones: 2 }); this.scene.add(this.level.group);
    this.applyLighting(this.level); this.player.reset(); this.player.stats = statsFor(0, this.run.loadout);
    this.run.i = i; this.hud.hideScreen(); this.hud.show(true); this.player.hands.root.visible = true; this.state = 'playing'; this.run.timerOn = true;
    this.startFloor(info);
  }

  // build the room below while the player is still fighting / celebrating
  prepareNext() {
    const info = floorInfo(this.run.mode, this.run.i + 1, this.run.menace, this.coop ? this.coop.n : 1);
    const sc = this.levelScale(info), nxt = new Level(info.themeIdx, { seed: info.seed, hand: info.hand, props: Math.round(info.props * sc * sc * 0.8), pk: info.pk, ult: statsFor(info.s).ultra, zones: 2, defer: true, scale: sc });
    const tick = () => { if (this.next === nxt && nxt.step()) setTimeout(tick, 120); }; setTimeout(tick, 120); // the merge steps land on separate frames: three small hitches, not one big one
    nxt.group.position.y = -(nxt.h + 0.5); this.scene.add(nxt.group);
    this.next = nxt; this.nextInfo = info;
    try { this.renderer.compileAsync(this.scene, this.camera).catch(() => {}); } catch { /* compile the new room's shaders off the critical path */ }
  }
  // build the next room during the fight (not at the kill, where the hitch would land on the celebration)
  prepSoon() {
    const run = this.run;
    setTimeout(() => { if (this.run === run && !run.mode.hunt && this.live && !this.next && run.i + 1 < run.mode.n) this.prepareNext(); }, 1200);
  }
  onFloorClear() {
    if (this.state !== 'playing') return;
    const run = this.run; if (!run) return;
    if (this.coop && this.coop.arena) { this.coop.onWaveClear(); return; } // arena: the next wave, no hatch
    if (this.coop && this.coop.host) { this.coop.c.sendEvent('clear', {}); this.coop.onClear(); } // the host decides when the floor is clear
    if (this.floorKind === 'floor') {
      const b = run.floorBonus(this.info), gh = this.ghost && this.ghost.splits[run.cleared - 1];
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
      const vs = gh != null ? ` · ${run.time <= gh ? '−' : '+'}${Math.abs(run.time - gh).toFixed(1)}s vs record` : '';
      const ms = run.cleared % (run.mode.n >= 100 ? 10 : 5) === 0 && run.i < run.mode.n - 1;
      if (run.mode.hunt) { // next wave in the same arena
        this.hud.banner(`VAGUE ${this.info.label} FRANCHIE`, `+${b.total.toLocaleString('fr-FR')}${b.clean ? ' · sans dégât' : ''}`, 1.8); this.audio.play('levelup');
        this.coins.spawn(this.player.pos.clone().setY(this.player.pos.y + 1.6), floorBonus(run.cleared), { up: true }); this.bankCoins();
        this.state = 'clearing'; this.victory = false; this.endT = 2.4; return;
      }
      this.hud.banner(ms ? `PALIER ${run.cleared} ÉTAGES !` : 'ÉTAGE FRANCHI', `+${b.total.toLocaleString('fr-FR')} · temps +${b.timeB}${b.clean ? ' · sans dégât +' + b.clean : ''}${vs}`, 2);
      this.audio.play(ms ? 'milestone' : 'levelup');
      this.coins.spawn(this.player.pos.clone().setY(this.player.pos.y + 1.6), floorBonus(run.cleared), { up: true }); // floor bonus: 10 + depth/4
      this.bankCoins(); this.coinLog();
      if (run.i >= run.mode.n - 1) { this.victoryEnd(); return; } // floor 0: down to the trophy hall
    } else this.hud.banner('LA TRAPPE S\'OUVRE', 'Prenez une inspiration…', 1.6);
    if (!this.next) this.prepareNext();
    this.next.finish(); // the hatch opens onto it: whatever merging is left happens now
    this.state = 'clearing'; this.victory = false; this.endT = 1.6;
  }
  /** Floor 0 cleared: the hatch opens one last time onto the trophy hall (coop keeps the in-place finale: its peers stay in sync). */
  victoryEnd() {
    const run = this.run; run.result = 'victory'; this.audio.setTrack('victory');
    if (this.coop) { this.state = 'clearing'; this.victory = true; this.endT = FINALE_TIME; this.finale.start(); return; }
    this.spawner.idle();
    if (this.next) { this.scene.remove(this.next.group); this.next.dispose(); }
    const nxt = new Level(0, { hall: true, hand: false, zones: 0, seed: (this.info ? this.info.seed : 1) + 77 });
    nxt.group.position.y = -(nxt.h + 0.5); this.scene.add(nxt.group);
    this.next = nxt; this.nextInfo = { ...this.info, hall: true, label: '−1', mods: [], newBiome: false };
    this.hud.banner('REZ-DE-CHAUSSÉE !', 'La trappe s’ouvre… une dernière fois', 2.2); this.audio.play('milestone');
    this.state = 'clearing'; this.victory = false; this.endT = 2.2;
  }
  enterHall() { this.run.timerOn = false; this.spawner.idle(); this.state = 'clearing'; this.victory = true; this.endT = HALL_TIME; this.finale.startHall(this.level.hall); }
  openHatch() {
    this.state = 'falling'; this.fall = { t: 0, swapped: false, vmax: 0 }; this.audio.play('hatch');
    { const cur = this.level, nxt = this.next, p = this.player, lx = Math.min(cur.w, nxt.w) / 2 - 3.2, lz = Math.min(cur.d, nxt.d) / 2 - 3.2; this.coins.sweep(clamp(p.pos.x, -lx, lx), clamp(p.pos.z, -lz, lz)); } // leftover coins go down the hatch
    this.player.invulnT = Math.max(this.player.invulnT, 8); // no damage while dropping
  }
  fallUpdate(dt) {
    const f = this.fall, p = this.player, cur = this.level, nxt = this.next;
    if (!f.swapped) {
      f.t += dt;
      const r = HOLE_R * easeOut(Math.min(1, f.t / 0.7)), lx = Math.min(cur.w, nxt.w) / 2 - 3.2, lz = Math.min(cur.d, nxt.d) / 2 - 3.2;
      const cx = clamp(p.pos.x, -lx, lx), cz = clamp(p.pos.z, -lz, lz);
      cur.hole.set(cx, cz, r); nxt.ceilHole.set(cx, cz, r);
      if (f.t < 0.8) p.shake(0.15);
      if (!f.ring) { f.ring = this.hatchRing; cur.group.add(f.ring); }
      f.ring.position.set(cx, 0.04, cz); f.ring.scale.setScalar(Math.max(0.01, r + 0.06)); f.ring.material.opacity = 0.65 + Math.sin(f.t * 18) * 0.3;
      if (f.t < 1.2) this.fx.emit(new V3(cx + (Math.random() - 0.5) * 2 * r, 0.1, cz + (Math.random() - 0.5) * 2 * r), { count: 2, speed: 1.5, dir: new V3(0, -1, 0), spread: 0.6, color: 0xffe08a, size: 0.3, life: 0.6 });
      if (p.pos.y < -0.8) this.swapLevels();
    } else if (p.onGround) {
      const k = clamp(f.vmax / 22, 0.35, 1); // landing weight follows how fast the drop was
      this.audio.play('land', 1); p.shake(0.35 + 0.5 * k); p.dust(16); this.flash = 0.2 + 0.3 * k; p.eyeY.kick(-8 * k); p.fov.kick(-60 * k); p.kick.kick(3 * k);
      const lp = new V3(p.pos.x, p.pos.y + 0.05, p.pos.z); this.rings.spawn(lp, 0xffffff, 7, 0.55, 'ring'); this.rings.spawn(lp, 0xffe08a, 11, 0.8, 'ring');
      this.fx.emit(lp, { count: 26, speed: 5, dir: new V3(0, 1, 0), spread: 1.4, color: 0xffe08a, size: 0.25, life: 0.7 });
      this.audio.play('whoosh'); p.invulnT = 0.8; this.state = 'playing'; this.startFloor(this.info); this.fall = null; this.fallBlur = 0;
    } else { // free fall into the next room: speed lines streak upward past the camera, the blur and field of view grow with the speed
      f.vmax = Math.max(f.vmax, -p.vel.y); this.fallBlur = clamp(-p.vel.y / 20, 0, 0.85);
      for (let n = 0; n < 2; n++) this.fx.emit(new V3(p.pos.x + (Math.random() - 0.5) * 6, p.pos.y + 1 + Math.random() * 3, p.pos.z + (Math.random() - 0.5) * 6), { count: 1, speed: 2, dir: new V3(0, 1, 0), spread: 0.1, color: 0xffffff, size: 0.12, life: 0.35 });
    }
  }
  swapLevels() {
    const nxt = this.next, dy = nxt.h + 0.5, p = this.player;
    p.pos.y += dy; p.eyeY.x += dy; p.eyeY.t += dy;
    p.pos.x = clamp(p.pos.x, -nxt.w / 2 + 0.6, nxt.w / 2 - 0.6); p.pos.z = clamp(p.pos.z, -nxt.d / 2 + 0.6, nxt.d / 2 - 0.6);
    if (this.nextInfo.hall) { p.pos.x = 0; p.pos.z = nxt.d / 2 - 6; p.yaw = 0; nxt.ceilHole.set(0, p.pos.z, nxt.ceilHole.z); } // the hall: land on the carpet, facing the trophy
    const old = this.level; old.group.position.y = dy; this.old = old; this.oldT = 3.2;
    if (this.exterior) this.exterior.position.y = dy;
    nxt.group.position.y = 0; this.level = nxt; this.next = null; this.info = this.nextInfo; this.floorKind = 'floor';
    this.applyLighting(nxt, true); if (!this.nextInfo.hall) this.run.i++; this.fall.swapped = true; this.audio.play('whoosh'); this.flash = 0.3; this.fall.vmax = Math.max(0, -p.vel.y); // the cut between rooms is hidden by a white pulse
    this.coins.removeChest(); this.coins.rain(p, rainBonus(rng(this.nextInfo.seed + 1))); // they come back as a rain around you (magnet 0.9 m)
  }
  startFloor(info) {
    const run = this.run, p = this.player; this.camera.near = 0.08;
    if (info.hall) { this.info = info; return this.enterHall(); }
    this.info = info; this.floorKind = 'floor'; const tHp = this.coop ? coopScale(this.coop.n).hp : 1; this.diff.hp = (info.mods.some((m) => m.id === 'tough') ? 1.4 : 1) * this.mods.hp * tHp; // Menace: HP ×(1 + 0.1·M)
    this.enemies.speedMul = info.mods.some((m) => m.id === 'fast') ? 1.3 : 1; p.gravMul = info.mods.some((m) => m.id === 'lowgrav') ? 0.5 : 1;
    const hunt = run.mode.hunt || run.mode.arena, news = hunt ? [] : unlocksBetween(this.curS ?? 0, info.s); this.curS = info.s;
    if (!hunt && !run.dev && !run.mode.daily && info.themeIdx > Profile.get().stats.biome) Profile.reach(info.themeIdx); // biomes open to the Chasse
    p.stats = hunt ? huntStats(run.biome, run.loadout) : statsFor(info.s, run.loadout); if (this.devPower) p.stats.handPower = run.loadout.power;
    if (run.dev) this.devStats(p.stats);
    if (!p.stats.weapons.includes(p.weapon) && p.ultT <= 0) p.selectWeapon('hands');
    run.timerOn = true; run.floorT = 0; run.noDamage = true; this.rewards.combo = 0;
    if (!this.coop || this.coop.host) this.spawner.start(info.waves, { rnd: rng(info.seed), cap: info.cap, interval: info.interval, countdown: hunt && info.i > 0 ? 1.2 : 2.2, bossHp: info.bossHp * this.mods.hp * tHp });
    if (run.dev && this.cheat.calm) this.spawner.idle();
    if (!hunt) this.placeChest(info);
    const mods = info.mods.map((m) => m.name).join(' · ');
    if (info.newBiome) setTimeout(() => bus.emit('toast', { text: 'NOUVEAU DÉCOR : ' + this.level.name, kind: 'ach' }), 300);
    if (!hunt) this.prepSoon();
    if (this.coop && this.coop.onFloor) this.coop.onFloor(this.level, info); // multiplayer: the room's loot chests
    const what = hunt ? 'VAGUE' : 'ÉTAGE';
    this.hud.banner(info.boss ? `${what} ${info.label} — BOSS` : `${what} ${info.label}`, `${this.level.name}${mods ? ' · ' + mods : ''}`);
    news.forEach((u, k) => setTimeout(() => bus.emit('toast', { text: 'DÉBLOQUÉ : ' + u.text, kind: 'ach' }), 600 + k * 500));
  }

  /** A loot chest hands me an item (a weapon or hand power, unlocked or not): it replaces the one of that slot for the rest of the match. Returns the item it replaced. */
  equipLoot(id) {
    const it = item(id), run = this.run, p = this.player; if (!it || !run) return null;
    let prev;
    if (it.slot === 'arme') { prev = run.loadout.weapon; run.loadout.weapon = id; p.stats.weapons = ['hands', WEAPON_OF[id]]; p.selectWeapon(WEAPON_OF[id]); }
    else { prev = run.loadout.power; run.loadout.power = id; p.stats.handPower = id; }
    this.hud.loadout(run.loadout); return prev;
  }
  pause() {
    if (!this.live) return;
    this.pausedFrom = this.state; this.state = 'paused'; this.unlock(); this.player.keys.clear(); this.player.combat.release(); this.hud.pause();
  }
  resume() { this.hud.hideScreen(); this.state = this.pausedFrom || 'playing'; this.lock(); this.audio.resume(); }
  onKilled({ enemy, pos, stomp }) {
    const c = DEAD_COLORS[enemy.type] || 0xffffff;
    this.fx.emit(pos, { count: enemy.type === 'tyrant' ? 80 : 18, speed: enemy.type === 'tyrant' ? 9 : 5, color: c, size: enemy.type === 'tyrant' ? 0.6 : 0.28, life: 0.7 });
    this.fx.emit(pos, { count: 8, speed: 3, color: 0xffffff, size: 0.2, life: 0.35 });
    this.audio.play('death'); this.hitstop(0.03);
    if (enemy.type === 'tyrant') this.rings.spawn(pos, 0xff66aa, 8, 0.8);
    if (this.level) { // flat splat on the floor (or prop) under the kill, in the bug's colour; it shrinks away in 3 s
      const y = surfaceBelow(this.level.colliders.filter((c) => !c.dynamic), pos.x, pos.y, pos.z);
      if (pos.y - y < 8) this.splats.spawn(new V3(pos.x, y + 0.012, pos.z), enemy.def.color, Math.min(1.2, 0.35 + enemy.def.scale * 0.55));
    }
    if (this.run && !enemy.suicide) this.coins.spawn(pos, killValue(enemy.type)); // spec §8: coins burst from every kill
    if (enemy.def.splits && !enemy.suicide) { const gid = this.spawner.gid++; for (let k = 0; k < 3; k++) this.enemies.spawn('swarmling', pos.clone().add(new V3((k - 1) * 0.6, 0.2, (k % 2) * 0.5)), gid); }
    const P = this.player;
    if (!enemy.suicide && P.stats.ultra && P.ultT <= 0 && P.ultCharge < 100) {
      P.ultCharge = Math.min(100, P.ultCharge + (ULT_GAIN[enemy.type] || 5) + (stomp ? 5 : 0));
      if (P.ultCharge >= 100) bus.emit('toast', { text: 'ULTRA PRÊT — appuie sur R', kind: 'ach' });
    }
  }

  collectPickups() {
    const p = this.player, L = this.level;
    for (const k of L.pickups || []) {
      if (k.taken) continue;
      const g = k.group.position;
      if (Math.abs(g.x - p.pos.x) > 1.1 || Math.abs(g.z - p.pos.z) > 1.1 || g.y < p.pos.y - 0.6 || g.y > p.pos.y + 2.4) continue;
      k.taken = true; L.group.remove(k.group);
      const T = (text, kind = 'good') => bus.emit('toast', { text, kind });
      if (k.kind === 'heal') { p.hp = Math.min(p.maxHp, p.hp + 30); T('+30 PV'); }
      else if (k.kind === 'ult') { if (p.stats.ultra) p.ultCharge = Math.min(100, p.ultCharge + 40); T('ULTRA +40%'); }
      else if (k.kind === 'rage') { p.buffs.rage = 8; T('RAGE — dégâts x1.5 (8s)'); }
      else if (k.kind === 'haste') { p.buffs.haste = 8; T('VITESSE — mouvements boostés (8s)'); }
      else if (k.kind === 'jump') { p.buffs.jump = 10; T('SAUT+ — saut d’air bonus (10s)'); }
      else { p.invulnT = Math.max(p.invulnT, 4); T('BOUCLIER 4s'); }
      this.fx.emit(g, { count: 16, speed: 4, color: 0xffffff, size: 0.22, life: 0.5 }); this.audio.play('pickup');
    }
  }

  // ---- per frame ----
  simulate(dt) {
    const p = this.player, E = this.enemies;
    this.level.viewPos = this.camera.position; this.level.update(this.time); this.collectPickups();
    const steps = Math.max(1, Math.ceil(dt / 0.0225)); // sub-step when the frame rate dips so nobody tunnels through walls or teleports
    for (let i = 0; i < steps; i++) { p.update(dt / steps); E.update(dt / steps); }
    if (this.run && this.run.dev && this.cheat.god) { this.player.invulnT = Math.max(this.player.invulnT, 0.5); this.player.hp = Math.max(this.player.hp, 1); }
    this.spawner.update(dt); this.rewards.update(dt); this.coins.update(dt, this.time); this.coinT -= dt;
    const n = E.alive;
    this.audio.mosquitoes(this.coop && this.coop.arena ? E.list.filter((e) => !e.avatar) : E.list, this.camera, p.vel);
    this.intensity = damp(this.intensity, clamp(n / 14 * 0.6 + this.rewards.combo * 0.06, 0, 1), 1.5, dt); this.audio.intensity = this.intensity;
    if (this.state === 'playing' || this.state === 'clearing') {
      const boss = E.list.some((e) => e.type === 'tyrant' && !e.dying);
      if (this.audio.track !== 'victory') this.audio.setTrack(boss ? 'boss' : 'gameplay');
    }
    if (this.state === 'falling') this.fallUpdate(dt);
    if (this.old) { this.oldT -= dt; if (this.oldT <= 0) this.dropOld(); }
  }
  dropOld() {
    this.hatchRing.removeFromParent(); this.scene.remove(this.old.group); this.old.dispose(); this.old = null; this.splats.clear();
    if (this.exterior) { this.scene.remove(this.exterior); this.exterior.userData.dispose(); this.exterior = null; }
    this.level.ceilHole.set(0, 0, 0);
  }
  frame(now) {
    requestAnimationFrame((t) => this.frame(t));
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000)); this.last = now;
    this.frames++; this.fpsT += dt;
    if (this.fpsT >= 1) { this.fps = this.frames / this.fpsT; this.frames = 0; this.fpsT = 0; this.autoQuality(); if (this.dev) { const r = this.renderer.info.render; document.getElementById('fps').textContent = Math.round(this.fps) + ' fps · q' + this.post.quality + ' · ' + r.calls + ' appels · ' + Math.round(r.triangles / 1000) + 'k tri'; } }
    this.time += dt; if (this.touch) this.touch.update(); this.gamepad.update(dt);
    let sdt = dt;
    if (this.hitstopT > 0) { this.hitstopT -= dt; sdt = dt * 0.05; }
    if (this.slowT > 0) { this.slowT -= dt; sdt *= 0.3; }
    const st = this.state, run = this.run; if ((st === 'intro') !== this.introOn) document.documentElement.classList.toggle('intro', this.introOn = st === 'intro');
    if (this.exterior && this.exterior.userData.tick) this.exterior.userData.tick(dt);
    if (st === 'menu') { this.menuT += dt * 0.08; this.menuCam(); }
    else if (st === 'intro') this.introUpdate(dt);
    else if (st === 'playing' || st === 'clearing' || st === 'falling' || st === 'dying') {
      this.simulate(sdt); if (this.coop) this.coop.update(dt);
      if (run && run.timerOn && st !== 'dying') { run.time += dt; if (st === 'playing') run.floorT += dt; }
      if (st === 'clearing' || st === 'dying') {
        this.endT -= dt;
        if (this.endT <= 0) {
          if (st === 'dying') { run.result = 'death'; this.state = 'over'; this.unlock(); this.hud.show(false); this.endRun(run); }
          else if (this.victory) { this.state = 'over'; this.unlock(); this.hud.show(false); this.endRun(run); }
          else if (run.mode.hunt) { run.i++; this.state = 'playing'; this.startFloor(huntInfo(run.biome, run.i, run.menace)); }
          else this.openHatch();
        }
      }
      this.hud.update(dt);
    }
    if (!this.live && st !== 'dying') this.audio.mosquitoes(null); // menu, intro, pause, end: no buzz
    this.finale.update(dt); this.fx.update(dt); this.acid.update(dt); this.rings.update(dt, this.camera); this.stars.update(dt, this.camera); this.splats.update(dt); this.lightUpdate(dt);
    const u = this.post.u, p = this.player;
    u.uSat.value = damp(u.uSat.value, st === 'dying' || st === 'over' ? 0.3 : 1, 3, dt); // colours drain when you die
    u.uDmg.value = damp(u.uDmg.value, this.live && p.hurtT > 0 ? p.hurtT * 2.5 : 0, 14, dt);
    u.uSpeed.value = damp(u.uSpeed.value, this.live ? Math.max(p.motion, this.fallBlur || 0) : st === 'intro' ? (this.introBlur || 0) * 0.7 : 0, 10, dt);
    this.flash = Math.max(0, this.flash - dt * 7); u.uFlash.value = Math.max(this.flash, p.invulnT > 0 && p.stats.invuln && !(run && run.dev && this.cheat.god) ? 0.6 : 0); // shield glow, not the dev / trial invincibility
    this.post.render(dt, this.time);
  }
  // Drop post quality automatically if the GPU can't keep up.
  autoQuality() {
    if (this.autoQ === false || !this.live) { this.lowT = this.goodT = 0; return; }
    if (this.fps < 45) { this.lowT++; this.goodT = 0; } else { this.lowT = Math.max(0, this.lowT - 1); this.goodT = this.fps > 57 ? this.goodT + 1 : 0; }
    if (this.lowT >= 2) { // first lower the render resolution, then the post effects
      this.lowT = 0;
      if (this.res > 0.66) { this.res = Math.max(0.65, this.res - 0.175); this.resize(); if (!this.resToast) { this.resToast = true; bus.emit('toast', { text: 'Résolution ajustée pour la fluidité', kind: 'warn' }); } }
      else if (this.post.quality > 0) { this.setQuality(this.post.quality - 1); bus.emit('toast', { text: 'Qualité réduite pour la fluidité', kind: 'warn' }); }
    } else if (this.goodT >= 20 && this.res < 1) { this.goodT = 0; this.res = Math.min(1, this.res + 0.175); this.resize(); }
  }
}
