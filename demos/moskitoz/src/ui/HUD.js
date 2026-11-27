// In-game HUD in the "Gomme & Encre" sticker language (spec §4), built by zones and anchored to the screen corners,
// plus floating texts, toasts, banner and combo. Also the facade Game talks to: screens are delegated to Screens.js.
import * as THREE from 'three';
import { bus, clamp } from '../core/core.js';
import { floorLabel, nextUnlock } from '../tower/Tower.js';
import { Settings } from '../core/Settings.js';
import { I } from './Icons.js';
import { fmtInt, fmtTime } from './format.js';
import { Iris, bump, restart, syncMotionClass } from './Transitions.js';
import { Screens } from './Screens.js';
import { WEAPON_OF } from '../economy/Loadout.js';
import { item } from '../economy/Items.js';

const $ = (id) => document.getElementById(id);
const V3 = THREE.Vector3, _v = new V3(), _aim = new V3();
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const INK = '#1E1633', PAPER = '#FFFFFF', ACID = '#B8F53A';
// "ULTRA : bombe anti-moustiques [R]" -> "ULTRA" (the progress caption has one line)
const shortUnlock = (t) => t.split(' — ')[0].split(' : ')[0].replace(/\s*\[[^\]]*\]\s*$/, '');
// loadout slots (spec §9): hands [1], the equipped weapon [2 / wheel], the hand power [F]; then shield [E] and ultra [R]
const WEAPONS = [['hands', '1', 'Mains', 'glove'], ['arme', '2', 'Arme', 'raquette'], ['pouvoir', 'F', 'Pouvoir', 'doigt']];
const SHORT = { brumi: 'Brumi', mille: 'Claques', citro: 'Citron', aspi: 'Aspi', onde: 'Onde' };

export class HUD {
  constructor(game) {
    this.g = game; this.floaters = []; this.pool = []; this.shownScore = 0; this.lastHp = 100; this.cache = {};
    this.el = { hud: $('hud') };
    this.build();
    this.screens = new Screens(game, this);
    const fit = () => {
      const s = Math.min(innerWidth / 1280, innerHeight / 720), st = document.documentElement.style;
      st.setProperty('--k', clamp(s, document.documentElement.classList.contains('touch') ? 0.5 : 0.72, 1.7).toFixed(4)); st.setProperty('--s', s.toFixed(4));
    };
    addEventListener('resize', fit); fit();
    syncMotionClass(); bus.on('settings', syncMotionClass);
    bus.on('reward', (r) => { this.float(r.pos, `+${r.pts}`, 'pts', 0); if (r.mult >= 2) this.showCombo(r); if (r.style) this.float(r.pos, 'STYLE ×' + r.style, 'boom', 0.8); });
    bus.on('enemy:hit', (h) => {
      if (h.dmg >= 1) this.float(h.enemy.pos, Math.round(h.dmg) + (h.crit ? '!' : ''), h.crit ? 'crit' : 'dmg', 0);
      this.q.hit.classList.toggle('crit', !!h.crit); restart(this.q.hit, 'on');
    });
    bus.on('boom', (b) => this.float(b.pos, b.text, 'boom', 0.6));
    bus.on('float', (f) => this.float(f.pos, f.text, f.cls || 'note', 0));
    bus.on('toast', (t) => this.toast(t.text, t.kind));
    bus.on('combo:end', () => this.q.combo.classList.add('off'));
    bus.on('boss:phase', (b) => this.banner(`PHASE ${b.phase}`, 'Le Tyran s’énerve'));
    bus.on('boss:spawn', () => this.g.audio.play('boss'));
    bus.on('ultra:start', () => this.banner('ULTRA !', 'Bombe anti-moustiques · maintiens le clic'));
  }

  build() {
    const pressArc = `<svg class="press" viewBox="0 0 140 140" aria-hidden="true">
        <path d="M104.6 50a40 40 0 0 1 0 40" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
        <path d="M104.6 50a40 40 0 0 1 0 40" fill="none" stroke="${PAPER}" stroke-width="6" stroke-linecap="round"/>
        <path data-charge d="M104.6 90a40 40 0 0 0 0-40" fill="none" stroke="${ACID}" stroke-width="6" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/></svg>`;
    const hit = `<svg class="hit" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h8M20 16h8M16 4v8M16 20v8" stroke="${PAPER}" stroke-width="7" stroke-linecap="round"/><path d="M4 16h8M20 16h8M16 4v8M16 20v8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`;
    const slot = ([id, key, name, ico], extra = '') => `<div class="slot${extra}" data-s="${id}"><span class="key">${key}</span><span class="box">${I[ico]()}<span class="cd"></span>${id === 'ult' ? '<span class="pct">0 %</span>' : ''}</span><span class="name outl">${name}</span></div>`;
    this.el.hud.innerHTML = `<div id="vignette"></div>
      <div class="z z-tl h-floor"><div class="stk badge"><span class="lbl">Étage</span><span class="num n" data-floor>—</span></div>
        <div class="meta"><span class="chip biome" data-biome>${I.drop()}<span data-bname></span></span><span class="chip" data-left>${I.mosq()}<span data-ln></span></span><span class="chip">${I.stopwatch()}<span class="num" data-timer>00:00.0</span></span></div></div>
      <div class="z z-tc"><div class="h-prog"><div class="track" data-track><span class="fill"></span><span class="me">${I.glove()}</span></div><div class="cap outl"><span data-pt></span><span data-pn></span></div></div>
        <div class="h-target" data-target><span class="chip" data-tchip></span><span class="mini"><i></i></span></div>
        <div class="h-boss hidden" data-boss><span class="tag">${I.crown()}Moustique Tyran</span><div class="bar"><i></i></div></div></div>
      <div class="z z-tr h-right"><div class="stk h-coins" data-coins>${I.coin()}<span class="num" data-cv>0</span></div><div class="h-score"><span class="lbl">Score</span><span class="num outl" data-score>0</span></div>
        <div class="stk h-combo off" data-combo><span class="num" data-cx>×2</span><small data-ck></small></div></div>
      <div class="z z-bl h-life"><div class="h-buffs" data-buffs></div>
        <div class="h-hp" data-hpw><span class="heart">${I.heart()}</span><span class="bar"><span class="lag"></span><span class="fill"></span><span class="v num outl" data-hp>100</span></span></div>
        <div class="h-move"><span class="mv pips" data-jumps title="Sauts">●●</span><span class="mv" data-mv="dash" title="Dash">${I.dash()}<span class="cd"></span></span><span class="mv" data-mv="roll" title="Roulade">${I.roll()}<span class="cd"></span></span><span class="mv" data-mv="power" title="Power Punch">${I.boom()}<span class="cd"></span></span></div></div>
      <div class="z z-br h-slots">${WEAPONS.map((w) => slot(w)).join('')}${slot(['inv', 'E', 'Bouclier', 'shield'])}${slot(['ult', 'R', 'Ultra', 'ultra'], ' ult')}</div>
      <div class="z z-c h-cross"><span class="dot"></span>${pressArc}${hit}</div>
      <div class="h-banner"><div class="in" data-banner><span class="big" data-bt></span><span class="tag" data-bs></span></div></div>
      <div class="h-toasts" data-toasts></div>
      <div id="floaters"></div><div id="fps"></div>`;
    const q = (s) => this.el.hud.querySelector(s);
    this.q = {
      floor: q('[data-floor]'), biome: q('[data-biome]'), bname: q('[data-bname]'), left: q('[data-left]'), ln: q('[data-ln]'), timer: q('[data-timer]'),
      track: q('[data-track]'), prog: q('.h-prog'), pt: q('[data-pt]'), pn: q('[data-pn]'), target: q('[data-target]'), tchip: q('[data-tchip]'),
      score: q('[data-score]'), coins: q('[data-coins]'), cv: q('[data-cv]'), combo: q('[data-combo]'), cx: q('[data-cx]'), ck: q('[data-ck]'), buffs: q('[data-buffs]'), hpw: q('[data-hpw]'), hp: q('[data-hp]'),
      jumps: q('[data-jumps]'), mv: Object.fromEntries([...this.el.hud.querySelectorAll('[data-mv]')].map((e) => [e.dataset.mv, e])),
      slots: Object.fromEntries([...this.el.hud.querySelectorAll('[data-s]')].map((e) => [e.dataset.s, e])),
      boss: q('[data-boss]'), banner: q('[data-banner]'), bt: q('[data-bt]'), bs: q('[data-bs]'), toasts: q('[data-toasts]'), charge: q('[data-charge]'), press: q('.press'), hit: q('.hit'),
      vig: q('#vignette'), floaters: q('#floaters'),
    };
    this.el.fps = q('#fps');
  }

  // ---- facade used by Game ----
  fade(to, ms = 400, color = INK) { const f = $('fade'); f.style.transition = `opacity ${ms}ms`; f.style.background = color; f.style.opacity = to; }
  dip(ms = 700) { Iris.open(ms); } // iris opening from the centre (was a cut to black)
  show(on) { this.el.hud.classList.toggle('hidden', !on); }
  hideScreen() { this.screens.hide(); }
  menu() { this.screens.menu(); }
  pause() { this.screens.pause(); }
  end(run) { this.screens.end(run); }
  settings(back) { this.screens.settings(back); }
  leaderboards(back) { this.screens.leaderboards(back); }

  toast(text, kind = '') {
    const d = document.createElement('div'); d.className = 'stk toast ' + kind; d.textContent = text; this.q.toasts.appendChild(d);
    setTimeout(() => d.remove(), 3300); while (this.q.toasts.children.length > 4) this.q.toasts.firstChild.remove();
  }
  // sticker slapped on the screen (rotation -4° -> 0, scale 1.25 -> 1 with a spring), lasts `long` seconds
  banner(t, sub = '', long = 2.2) {
    this.q.bt.textContent = t; this.q.bs.textContent = sub; this.q.bs.classList.toggle('hidden', !sub);
    this.q.banner.style.setProperty('--bd', (long + 1.2).toFixed(2) + 's'); restart(this.q.banner, 'slap'); this.g.audio.play('wave');
  }
  // run coin counter bounces on every pickup (spec §4)
  coin(total) { this.set('coins', this.q.cv, fmtInt(total)); bump(this.q.coins); }
  showCombo(r) {
    this.q.cx.textContent = '×' + r.mult; this.q.ck.textContent = r.combo + ' KILLS';
    this.q.combo.classList.remove('off'); restart(this.q.combo, 'pop'); this.g.audio.play('combo', r.mult);
  }
  float(pos, text, cls, dy = 0) {
    if (this.floaters.length > 45) return;
    const el = this.pool.pop() || document.createElement('div');
    el.className = 'float ' + cls; el.textContent = text; this.q.floaters.appendChild(el);
    this.floaters.push({ el, pos: pos.clone().add(new V3((Math.random() - 0.5) * 0.6, 0.5 + dy * 0.5, (Math.random() - 0.5) * 0.6)), t: 0, life: cls === 'dmg' ? 0.7 : cls === 'boom' ? 0.75 : 1.3, rot: cls === 'boom' ? (Math.random() - 0.5) * 0.45 : 0, boom: cls === 'boom' });
  }
  set(key, el, text) { if (this.cache[key] !== text) { this.cache[key] = text; el.textContent = text; } }
  prop(key, el, name, v) { if (this.cache[key] !== v) { this.cache[key] = v; el.style.setProperty(name, v); } }

  update(dt) {
    const g = this.g, p = g.player, q = this.q, run = g.run, st = p.stats, c = p.combat, cdm = st.cdMul;
    // top left: floor badge, biome, mosquitoes left, run clock
    if (run) {
      const roof = g.floorKind === 'roof';
      this.set('floor', q.floor, roof ? 'TOIT' : g.info && g.info.hall ? '−1' : String(floorLabel(run.mode, run.i))); q.floor.classList.toggle('roof', roof);
      this.set('timer', q.timer, fmtTime(run.time));
      this.shownScore += (run.score - this.shownScore) * Math.min(1, dt * 8); this.set('score', q.score, fmtInt(this.shownScore)); this.set('coins', q.cv, fmtInt(run.coins));
    }
    if (g.level) { this.set('bname', q.bname, g.level.name); this.prop('biome', q.biome, '--biome', g.level.pal.wall); }
    const sp = g.spawner, left = sp.state === 'idle' ? -1 : g.enemies.alive + (sp.queue ? sp.queue.reduce((a, x) => a + x.count, 0) : 0);
    q.left.classList.toggle('hidden', left < 0);
    if (left >= 0) this.set('left', q.ln, left + (left > 1 ? ' moustiques' : ' moustique'));
    // top centre: tower progress with boss crowns, next unlock
    if (run) {
      if (this.progMode !== run.mode.id) {
        this.progMode = run.mode.id; q.track.querySelectorAll('.tick,.crown').forEach((t) => t.remove());
        for (let i = 0; i < run.mode.n; i++) if (run.mode.isBoss(i)) { const x = ((i + 1) / run.mode.n) * 100 + '%'; q.track.insertAdjacentHTML('beforeend', `<span class="tick" style="left:${x}"></span><span class="crown" style="left:${x}">${I.crown()}</span>`); }
      }
      this.prop('prog', q.prog, '--f', ((run.cleared / run.mode.n) * 100).toFixed(2) + '%');
      this.set('pt', q.pt, `${run.cleared} / ${run.mode.n}`);
      const key = run.mode.id + run.i;
      if (key !== this.progKey) { this.progKey = key; const nu = nextUnlock(run.mode, Math.max(0, run.i)); this.set('pn', q.pn, nu ? `Prochain : ${shortUnlock(nu.u.text)} · ét. ${nu.label}` : ''); }
    }
    // target under the crosshair
    let best = null, bd = 0.965; const aim = p.aimDir(_aim), eye = p.eye;
    for (const en of g.enemies.list) {
      if (en.dying || en.avatar) continue;
      const dist = _v.copy(en.pos).sub(eye).length(); if (dist > 28) continue;
      const dot = _v.divideScalar(dist).dot(aim); if (dot > bd) { bd = dot; best = en; }
    }
    const boss = g.enemies.list.find((x) => x.type === 'tyrant' && !x.dying);
    if (best === boss) best = null; // the boss bar already says it
    q.target.classList.toggle('on', !!best);
    if (best) { if (this.cache.tt !== best.type) { this.cache.tt = best.type; q.tchip.innerHTML = I.mosq(hex(best.def.color)) + best.def.name; } this.prop('th', q.target, '--t', (clamp(best.hp / best.maxHp, 0, 1) * 100).toFixed(1) + '%'); }
    q.boss.classList.toggle('hidden', !boss);
    if (boss) this.prop('boss', q.boss, '--b', (clamp(boss.hp / boss.maxHp, 0, 1) * 100).toFixed(1) + '%');
    // bottom left: buffs, life, movement
    const B = { rage: ['rage', 'flame', 'Rage'], haste: ['haste', 'bolt', 'Vitesse'], jump: ['jump', 'drop', 'Saut+'] };
    const bh = Object.keys(B).filter((k) => p.buffs[k] > 0).map((k) => `<span class="chip ${B[k][0]}">${I[B[k][1]]()}${B[k][2]} ${Math.ceil(p.buffs[k])} s</span>`).join('')
      + (p.invulnT > 0.3 ? `<span class="chip shield">${I.shield()}Bouclier</span>` : '') + (g.rewards.chain >= 2 ? `<span class="chip style">STYLE ×${g.rewards.chain}</span>` : '');
    if (bh !== this.cache.bh) { this.cache.bh = bh; q.buffs.innerHTML = bh; }
    const mx = p.maxHp || 100, hp = clamp(p.hp, 0, mx), pc = (hp / mx) * 100; // the bar is a share of the max (multiplayer matches have more)
    if (hp < this.lastHp - 0.5) { restart(q.hpw, 'hurt'); setTimeout(() => q.hpw.style.setProperty('--lag', pc + '%'), 60); }
    else if (hp > this.lastHp) q.hpw.style.setProperty('--lag', pc + '%');
    this.lastHp = hp; this.prop('hp', q.hpw, '--hp', pc.toFixed(1) + '%'); this.set('hpv', q.hp, mx > 100 ? `${Math.ceil(hp)}/${mx}` : String(Math.ceil(hp)));
    q.hpw.classList.toggle('low', pc < 30 && hp > 0);
    q.vig.style.opacity = clamp(p.hurtT * 2.2, 0, 1) * 0.9;
    const jt = st.airJumps + (p.buffs.jump > 0 ? 1 : 0), jl = p.onGround ? jt : Math.max(0, jt - p.airJumps);
    this.set('jumps', q.jumps, '●'.repeat(jl) + '○'.repeat(Math.max(0, jt - jl)) || '○'); q.jumps.classList.toggle('busy', !p.onGround && jl === 0);
    this.prop('dash', q.mv.dash, '--p', clamp(p.dashCd / (1.5 * cdm), 0, 1).toFixed(3));
    this.prop('roll', q.mv.roll, '--p', clamp(p.rollCd / (0.9 * cdm), 0, 1).toFixed(3));
    q.mv.power.classList.toggle('hidden', !st.power); this.prop('pow', q.mv.power, '--p', clamp(c.punchCd / (st.punchCd * cdm), 0, 1).toFixed(3));
    // bottom right: weapons, shield, ultra
    { const w = st.weapons[1], a = q.slots.arme, lo = g.run && g.run.loadout;
      q.slots.hands.classList.toggle('on', p.weapon === 'hands');
      a.classList.toggle('hidden', !w); a.classList.toggle('on', !!w && p.weapon === w);
      this.cool('arme', a, w && c.arsenal[w] ? clamp(c.arsenal[w].hud(), 0, 1) : 0); // weapon objects (src/weapons) report their own cooldown / pressure
      const pw = q.slots.pouvoir, po = c.powerObj; pw.classList.toggle('hidden', !(lo && lo.power)); pw.classList.toggle('dim', !st.handPower);
      this.cool('pouvoir', pw, po ? clamp(po.hud(), 0, 1) : 0); pw.classList.toggle('act', !!(po && po.busy)); }
    const inv = q.slots.inv; inv.classList.toggle('hidden', !st.invuln); inv.classList.toggle('act', p.invulnT > 0 && st.invuln); this.cool('inv', inv, st.invuln ? clamp(p.invulnCd / (20 * cdm), 0, 1) : 0);
    const ult = q.slots.ult, act = p.ultT > 0, rdy = !act && p.ultCharge >= 100;
    ult.classList.toggle('hidden', !st.ultra); ult.classList.toggle('act', act); ult.classList.toggle('full', rdy);
    this.prop('ultc', ult, '--c', (act ? p.ultT / 10 : p.ultCharge / 100).toFixed(3));
    this.set('ultp', ult.querySelector('.pct'), act ? Math.ceil(p.ultT) + ' s' : rdy ? 'PRÊT' : Math.floor(p.ultCharge) + ' %');
    // crosshair: power punch charge arc
    const ch = c.charge || 0; q.press.classList.toggle('on', ch > 0.05); this.prop('ch', q.charge, 'stroke-dasharray', `${(ch * 100).toFixed(1)} 100`);
    // floating texts
    const w = innerWidth, h = innerHeight, v = _v;
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i]; f.t += dt; const k = f.t / f.life;
      if (k >= 1) { f.el.remove(); this.pool.push(f.el); this.floaters.splice(i, 1); continue; }
      v.copy(f.pos); v.y += k * 1.2; v.project(g.camera);
      if (v.z > 1) { f.el.style.opacity = 0; continue; }
      f.el.style.opacity = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      f.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px) translate(-50%,-50%) rotate(${f.rot}rad) scale(${f.boom ? 1 + Math.max(0, 0.18 - k) * 7 + (1 - k) * 0.15 : 1 + (1 - k) * 0.25})`;
    }
  }
  // run loadout -> slot icons and names (the engine weapon behind an item: WEAPON_OF)
  loadout(lo) {
    const set = (el, id, ico) => { if (!el) return; el.querySelector('.box .ico')?.remove(); el.querySelector('.box').insertAdjacentHTML('afterbegin', I[ico]()); el.querySelector('.name').textContent = id ? SHORT[id] || item(id).name.split(' ')[0] : ''; };
    set(this.q.slots.arme, lo.weapon, WEAPON_OF[lo.weapon] ? lo.weapon : 'raquette');
    set(this.q.slots.pouvoir, lo.power, lo.power && I[lo.power] ? lo.power : 'doigt');
  }
  // cooldown ring on a slot; a little hop when it comes back
  cool(id, el, r) {
    this.prop('cd' + id, el, '--p', r.toFixed(3));
    const was = this.cache['cw' + id] || 0; this.cache['cw' + id] = r;
    if (was > 0 && r === 0) restart(el, 'ready');
  }
}
