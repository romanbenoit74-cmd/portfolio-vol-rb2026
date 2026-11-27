// Touch controls: left stick (move), right half drag (look), buttons for hit / jump / power, plus use (chest) / shield / ultra / weapon / alt when usable, and pause. Double tap on the stick = dash / roll.
// Feeds the same Player entry points as the keyboard (key(code), look(dx, dy), combat.*), so rebinds and game rules stay untouched.
import { Settings } from '../core/Settings.js';

export const isTouchDevice = () => {
  try { if (new URLSearchParams(location.search).has('touch')) return true; } catch { /* no location */ }
  return !!(matchMedia && matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window);
};

const LOOK = 1.9;          // touch px -> mouse-like pixels
const STICK_R = 56;        // stick travel in px
const DEAD = 0.28;         // normalised dead zone before a direction key is pressed
// [id, label, action | special, css position]
const BTNS = [
  ['hit', 'FRAPPE', 'hit', 'b-hit'], ['jump', 'SAUT', 'jump', 'b-jump'], ['dash', 'DASH', 'dash', 'b-dash'], ['power', 'POUVOIR', 'power', 'b-power'],
  ['use', 'OUVRIR', 'use', 'b-use'], ['shield', 'BOUCLIER', 'invuln', 'b-shield'], ['ultra', 'ULTRA', 'ultra', 'b-ultra'], ['wpn', 'ARME', 'wpn', 'b-wpn'], ['alt', 'ALT', 'alt', 'b-alt'],
];
// DASH holds sprint + crouch (air = dash, ground = roll); a double tap on the stick does the same. Contextual buttons only show when usable.
const DOUBLE_TAP = 320;

export class Touch {
  constructor(game) {
    this.g = game; this.stick = null; this.look = null; this.held = new Set(); this.shown = false; this.tapT = 0;
    const el = this.el = document.createElement('div'); el.id = 'touch'; el.hidden = true;
    el.innerHTML = `<div class="t-look"></div><div class="t-stick"><i></i></div>` +
      BTNS.map(([id, lbl, , cls]) => `<button class="t-btn ${cls}" data-t="${id}" type="button">${lbl}</button>`).join('') +
      `<button class="t-pause" data-t="pause" type="button" aria-label="Pause">II</button>`;
    document.body.appendChild(el);
    this.btn = Object.fromEntries([...el.querySelectorAll('.t-btn')].map((b) => [b.dataset.t, b])); this.vis = '';
    this.pad = el.querySelector('.t-stick'); this.knob = this.pad.querySelector('i');
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    this.bindStick(); this.bindLook(); this.bindButtons();
  }

  /** Called every frame: shows the overlay while a run is live, releases everything when it is not. */
  update() {
    const on = this.g.state === 'playing' || this.g.state === 'clearing' || this.g.state === 'falling';
    if (on) this.syncButtons();
    if (on === this.shown) return;
    this.shown = on; this.el.hidden = !on;
    if (!on) this.releaseAll();
  }

  /** Hides the buttons the player cannot use yet (shield / ultra not unlocked, a single weapon, bare hands). */
  syncButtons() {
    const p = this.g.player, st = p && p.stats; if (!st) return;
    const chest = this.g.coop && this.g.coop.loot && this.g.coop.loot.near;
    const show = { shield: !!st.invuln && p.invulnCd <= 0, ultra: !!st.ultra && p.ultCharge >= 100 && p.ultT <= 0, wpn: st.weapons.length > 1, alt: p.weapon !== 'hands', use: !!chest };
    const key = Object.values(show).join() + (chest && chest.opened); if (key === this.vis) return; this.vis = key;
    for (const [id, v] of Object.entries(show)) this.btn[id].hidden = !v;
    if (chest) this.btn.use.textContent = chest.opened ? 'PRENDRE' : 'OUVRIR';
  }

  press(code, down) { if (code) this.g.player.key(code, down); }
  act(action, down) { this.press(Settings.binds[action] && Settings.binds[action].find(Boolean), down); }
  releaseAll() {
    for (const k of [...this.held]) this.setHeld(k, false);
    this.stick = this.look = null; this.knob.style.transform = '';
    this.g.player.combat.up();
  }
  setHeld(action, down) { if (down === this.held.has(action)) return; down ? this.held.add(action) : this.held.delete(action); this.act(action, down); }

  /** Double tap on the stick: sprint now, crouch a few frames later (the roll needs the move direction), release both. */
  dash() {
    this.setHeld('sprint', true);
    setTimeout(() => this.setHeld('crouch', true), 70);
    setTimeout(() => { this.setHeld('crouch', false); this.setHeld('sprint', false); }, 280);
  }

  dashDown(on) { this.setHeld('sprint', on); this.setHeld('crouch', on); }

  bindStick() {
    const pad = this.pad, upd = (e) => {
      const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / STICK_R, dy = (e.clientY - cy) / STICK_R; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
      this.knob.style.transform = `translate(${dx * STICK_R}px, ${dy * STICK_R}px)`;
      this.setHeld('forward', dy < -DEAD); this.setHeld('back', dy > DEAD); this.setHeld('left', dx < -DEAD); this.setHeld('right', dx > DEAD);
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch { /* */ } this.stick = e.pointerId; upd(e);
      const t = performance.now(); if (t - this.tapT < DOUBLE_TAP) { this.tapT = 0; this.dash(); } else this.tapT = t;
    });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === this.stick) upd(e); });
    const end = (e) => { if (e.pointerId !== this.stick) return; this.stick = null; this.knob.style.transform = ''; for (const a of ['forward', 'back', 'left', 'right']) this.setHeld(a, false); };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  }

  bindLook() {
    const z = this.el.querySelector('.t-look'); let lx = 0, ly = 0;
    z.addEventListener('pointerdown', (e) => { e.preventDefault(); z.setPointerCapture(e.pointerId); this.look = e.pointerId; lx = e.clientX; ly = e.clientY; });
    z.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.look) return;
      this.g.player.look((e.clientX - lx) * LOOK, (e.clientY - ly) * LOOK); lx = e.clientX; ly = e.clientY;
    });
    const end = (e) => { if (e.pointerId === this.look) this.look = null; };
    z.addEventListener('pointerup', end); z.addEventListener('pointercancel', end);
  }

  bindButtons() {
    const spec = Object.fromEntries(BTNS.map(([id, , a]) => [id, a]));
    for (const b of this.el.querySelectorAll('.t-btn, .t-pause')) {
      const id = b.dataset.t, a = spec[id];
      const down = (e) => {
        e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* */ } b.classList.add('on');
        if (id === 'pause') this.g.pause();
        else if (a === 'hit') this.g.player.combat.down();
        else if (a === 'alt') this.g.player.combat.alt();
        else if (a === 'wpn') this.g.player.cycleWeapon();
        else if (a === 'dash') this.dashDown(true);
        else if (a === 'use') { const l = this.g.coop && this.g.coop.loot; if (l) l.interact(); }
        else this.setHeld(a, true);
      };
      const up = (e) => {
        e.preventDefault(); b.classList.remove('on');
        if (a === 'hit') this.g.player.combat.up();
        else if (a === 'dash') this.dashDown(false);
        else if (a && a !== 'alt' && a !== 'wpn' && a !== 'use') this.setHeld(a, false);
      };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    }
  }
}
