// Player settings (sensitivity, FOV, brightness, volumes incl. mosquito bus + preset, shake, quality) + rebindable keys. Persisted in localStorage.
import { bus, clamp } from './core.js';
import { DEFAULT_PRESET, sanitizePreset } from '../audio/MosquitoPatch.js';

const KEY = 'mosq-settings-v1';
export const ACTIONS = [
  ['forward', 'Avancer'], ['back', 'Reculer'], ['left', 'Gauche'], ['right', 'Droite'], ['jump', 'Saut'], ['sprint', 'Sprint / Dash'], ['crouch', 'Accroupi / Roulade'],
  ['invuln', 'Invulnérabilité'], ['ultra', 'Ultra'], ['w1', 'Mains'], ['w2', 'Arme équipée'], ['power', 'Pouvoir des mains'],
];
const BINDS = {
  forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], jump: ['Space', ''], sprint: ['ShiftLeft', 'ShiftRight'],
  crouch: ['ControlLeft', 'KeyC'], invuln: ['KeyE', ''], ultra: ['KeyR', ''], w1: ['Digit1', ''], w2: ['Digit2', ''], power: ['KeyF', ''],
};
export const DEFAULTS = { sens: 1, invertY: false, fov: 80, bright: 1, master: 1, music: 1, sfx: 1, mosq: 0.7, mosqPreset: DEFAULT_PRESET, shake: 1, q: null, reduceMotion: false };
const RANGES = { sens: [0.2, 3], fov: [60, 110], bright: [0.5, 1.6], master: [0, 1], music: [0, 1], sfx: [0, 1], mosq: [0, 1], shake: [0, 1] };
const clone = (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, [...v]]));

let layout = null; // physical key -> label on the player's keyboard layout (Chromium only)
try { navigator.keyboard.getLayoutMap().then((m) => { layout = m; }).catch(() => {}); } catch { /* unsupported */ }
const NAMES = { Space: 'Espace', ShiftLeft: 'Shift G', ShiftRight: 'Shift D', ControlLeft: 'Ctrl G', ControlRight: 'Ctrl D', AltLeft: 'Alt G', AltRight: 'Alt D', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Tab: 'Tab', Enter: 'Entrée', Backquote: '²' };

// saved values -> valid settings (wrong type or NaN -> default, numbers clamped, unknown preset -> Doux)
export function sanitize(s) {
  const v = { ...DEFAULTS };
  if (!s || typeof s !== 'object') return v;
  for (const k in DEFAULTS) if (typeof s[k] === typeof DEFAULTS[k] || (k === 'q' && (s.q === null || typeof s.q === 'number'))) v[k] = s[k];
  for (const k in RANGES) v[k] = Number.isFinite(v[k]) ? clamp(v[k], RANGES[k][0], RANGES[k][1]) : DEFAULTS[k];
  if (v.q !== null && !(Number.isInteger(v.q) && v.q >= 0 && v.q <= 2)) v.q = null;
  v.mosqPreset = sanitizePreset(v.mosqPreset);
  return v;
}

function load() {
  let v = { ...DEFAULTS }; const binds = clone(BINDS);
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    v = sanitize(s);
    for (const a in binds) if (Array.isArray(s.binds?.[a])) binds[a] = [0, 1].map((i) => (typeof s.binds[a][i] === 'string' ? s.binds[a][i] : ''));
  } catch { /* corrupt or no storage: defaults */ }
  return { v, binds };
}

export const Settings = {
  ...load(),
  save() { try { localStorage.setItem(KEY, JSON.stringify({ ...this.v, binds: this.binds })); } catch { /* no storage */ } bus.emit('settings'); },
  set(k, val) { this.v[k] = val; this.save(); },
  // a key belongs to one action only: binding it steals it from any other slot
  bind(action, slot, code) {
    if (code) for (const a in this.binds) this.binds[a] = this.binds[a].map((c) => (c === code ? '' : c));
    this.binds[action][slot] = code; this.rebuild(); this.save();
  },
  rebuild() { this.map = new Map(); for (const a in this.binds) for (const c of this.binds[a]) if (c) this.map.set(c, a); },
  action(code) { return this.map.get(code); },
  held(keys, action) { return this.binds[action].some((c) => c && keys.has(c)); },
  resetKeys() { this.binds = clone(BINDS); this.rebuild(); this.save(); },
  resetAll() { Object.assign(this.v, DEFAULTS); this.binds = clone(BINDS); this.rebuild(); this.save(); },
  label(code) {
    if (!code) return '—';
    if (NAMES[code]) return NAMES[code];
    const l = layout && layout.get(code); if (l) return l.toUpperCase();
    return code.replace(/^(Key|Digit|Numpad)/, (m) => (m === 'Numpad' ? 'Pav. ' : ''));
  },
};
Settings.rebuild();
