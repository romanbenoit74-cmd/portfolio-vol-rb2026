// Gamepad (standard mapping: Xbox / PlayStation / Switch Pro). Polled every frame; feeds the same Player entry points as the keyboard and the touch
// controls (key(code), look(dx, dy), combat.*), so rebinds and game rules stay untouched.
//   left stick move · right stick look · A jump · B roll · X power · Y next weapon · LB dash (hold) · RB / RT hit · LT alt fire
//   D-pad: up shield, right ultra, left hands, down equipped weapon · Back / R3 loot chest · Start pause / resume
import { Settings } from '../core/Settings.js';

const DEAD = 0.18, MOVE = 0.4, LOOK = 1250; // stick dead zone, stick tilt that presses a direction key, look speed (mouse-like px / s at full tilt)
const B = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, start: 9, up: 12, down: 13, left: 14, right: 15 };
const ACTIONS = { a: 'jump', b: 'crouch', x: 'power', lb: 'sprint', up: 'invuln', right: 'ultra', left: 'w1', down: 'w2' };

export const stickAxis = (v) => { const m = Math.abs(v); return m < DEAD ? 0 : Math.sign(v) * ((m - DEAD) / (1 - DEAD)) ** 1.6; }; // dead zone + a curve: fine aim near the centre

export class GamepadInput {
  constructor(game) { this.g = game; this.held = new Set(); this.hit = false; this.start = false; this.active = false; }
  pad() { try { return [...(navigator.getGamepads ? navigator.getGamepads() : [])].find((p) => p && p.connected && p.mapping === 'standard') || null; } catch { return null; } }
  press(action, down) {
    if (down === this.held.has(action)) return; down ? this.held.add(action) : this.held.delete(action);
    const code = Settings.binds[action] && Settings.binds[action].find(Boolean); if (code) this.g.player.key(code, down);
  }
  releaseAll() {
    for (const a of [...this.held]) this.press(a, false);
    if (this.hit) { this.hit = false; this.g.player.combat.up(); }
  }
  update(dt) {
    const g = this.g, p = this.pad(); if (!p) { if (this.active) { this.active = false; this.releaseAll(); } return; }
    const btn = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    const start = btn(B.start);
    if (start && !this.start) { if (g.state === 'paused') g.resume(); else if (g.live) g.pause(); }
    this.start = start;
    if (g.state !== 'playing' && g.state !== 'clearing' && g.state !== 'falling') { this.releaseAll(); return; }
    const lx = stickAxis(p.axes[0] || 0), ly = stickAxis(p.axes[1] || 0), rx = stickAxis(p.axes[2] || 0), ry = stickAxis(p.axes[3] || 0);
    if (lx || ly || rx || ry || p.buttons.some((b) => b && b.pressed)) this.active = true;
    this.press('forward', ly < -MOVE); this.press('back', ly > MOVE); this.press('left', lx < -MOVE); this.press('right', lx > MOVE);
    for (const [k, a] of Object.entries(ACTIONS)) this.press(a, btn(B[k]));
    if (rx || ry) g.player.look(rx * LOOK * dt, ry * LOOK * dt);
    const hit = btn(B.rb) || btn(B.rt) || (p.buttons[B.rt] && p.buttons[B.rt].value > 0.35);
    if (hit !== this.hit) { this.hit = hit; if (hit) g.player.combat.down(); else g.player.combat.up(); }
    const alt = btn(B.lt) || (p.buttons[B.lt] && p.buttons[B.lt].value > 0.35);
    if (alt && !this.alt) g.player.combat.alt(); this.alt = alt;
    const use = btn(8) || btn(10); // Back / R3: open or swap a loot chest
    if (use && !this.use && g.coop && g.coop.loot) g.coop.loot.interact(); this.use = use;
    if (btn(B.y) && !this.y) g.player.cycleWeapon(); this.y = btn(B.y);
  }
}
