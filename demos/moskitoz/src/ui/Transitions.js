// UI motion (spec §4): iris between menu / run / end, restartable CSS animations (bump, slap, pop), rolling counters.
// Reduced motion (system setting or the in-game toggle) turns the iris into a fade and counters into instant values.
import { Settings } from '../core/Settings.js';

const mq = matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => mq.matches || !!Settings.v.reduceMotion;
export const syncMotionClass = () => document.documentElement.classList.toggle('rm', !!Settings.v.reduceMotion);

/** Replay a CSS animation class (bump, pop, slap, hurt, on…). */
export function restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
export const bump = (el) => restart(el, 'bump');

/** Count up to `to` in `ms` (ease-out), formatted by fmt; instant when motion is reduced or the tab is hidden. */
export function roll(el, to, ms = 900, fmt = String) {
  if (!el) return;
  if (reduced() || document.hidden || !(to > 0)) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), id = (el.__roll = (el.__roll || 0) + 1);
  const step = (now) => {
    if (el.__roll !== id) return; // a newer roll owns this element
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = fmt(k >= 1 ? to : to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  el.textContent = fmt(0); requestAnimationFrame(step);
  setTimeout(() => { if (el.__roll === id) el.textContent = fmt(to); }, ms + 400); // never stay mid-count (hidden tab, throttled frames)
}

/**
 * Iris: an ink curtain with a round hole. open() snaps shut then widens the hole from (x, y) until it covers the screen; the curtain is then
 * hidden so it costs nothing while playing. The hole is a radial-gradient driven frame by frame (no giant box-shadow: phones glitched on it),
 * and measured on the overlay itself (innerWidth / innerHeight move with the phone's browser bars).
 */
export const Iris = {
  el: null, t: 0, raf: 0,
  get node() { return (this.el ||= document.getElementById('iris')); },
  open(ms = 650, x, y) {
    const el = this.node; if (!el) return;
    clearTimeout(this.t); cancelAnimationFrame(this.raf);
    const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight; x ??= w / 2; y ??= h / 2;
    const fade = reduced();
    el.classList.toggle('fade', fade); el.classList.remove('open'); el.style.visibility = 'visible';
    if (fade) { el.style.background = ''; void el.offsetWidth; el.style.setProperty('--t', Math.min(ms, 300) / 1000 + 's'); el.classList.add('open'); this.t = setTimeout(() => { el.style.visibility = 'hidden'; }, ms + 80); return; }
    const R = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 4, draw = (r) => { el.style.background = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, var(--ink) ${r + 1}px)`; };
    draw(0); const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / ms); draw(R * (1 - Math.pow(1 - k, 3))); if (k < 1) this.raf = requestAnimationFrame(step); };
    this.raf = requestAnimationFrame(step);
    this.t = setTimeout(() => { cancelAnimationFrame(this.raf); el.style.visibility = 'hidden'; }, ms + 80); // hidden tab / throttled frames: never stay shut
  },
};
