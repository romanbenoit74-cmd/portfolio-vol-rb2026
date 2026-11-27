import { dayKey } from './Tower.js';
import { Account } from '../net/Account.js';
// Local leaderboards (localStorage). Three rankings: depth (floors), score, time (completed runs only).
const KEY = 'mosq-tower-lb-v1', NAME = 'mosq-tower-name', PID = 'mosq-pid', API = '/api/scores';
// private player id: lets the server recognise our own runs (to rename them / highlight them), never shown to anyone
const pid = () => { try { let p = localStorage.getItem(PID); if (!p) { p = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem(PID, p); } return p; } catch { return 'anon-' + Math.random().toString(36).slice(2); } };

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* no storage */ } }

export const LB = {
  name() { if (Account.user) return Account.user.pseudo; try { return localStorage.getItem(NAME) || 'JOUEUR'; } catch { return 'JOUEUR'; } },
  hasName() { if (Account.user) return true; try { return !!localStorage.getItem(NAME); } catch { return true; } }, // no storage: never block the menu on the welcome screen
  setName(name) { try { localStorage.setItem(NAME, name); } catch { /* */ } },
  add(e) {
    try { localStorage.setItem(NAME, e.name); } catch { /* */ }
    const en = { ...e, id: String(Date.now()) + Math.random().toString(36).slice(2, 6), pid: pid(), date: Date.now(), day: dayKey() }, a = load(); a.push(en); save(a.slice(-500)); return en;
  },
  rename(id, name) { try { localStorage.setItem(NAME, name); } catch { /* */ } const a = load(), e = a.find((x) => x.id === id); if (e) { e.name = name; save(a); LB.submit(e); } },
  // ---- online board (Cloudflare worker, see _worker.js); every call quietly does nothing when the site has no API (local play)
  remote: {}, stamp: {},
  submit(e) { try { fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(e), keepalive: true }).catch(() => {}); } catch { /* */ } },
  async fetchTop(mode, cat) { // -> true when fresh online rows are cached in LB.remote[mode|cat]
    const key = mode + '|' + cat; if (LB.stamp[key] && Date.now() - LB.stamp[key] < 8000) return false;
    LB.stamp[key] = Date.now();
    try {
      const r = await fetch(`${API}?mode=${mode}&cat=${cat}&pid=${encodeURIComponent(pid())}${mode === 'daily' ? '&day=' + dayKey() : ''}`);
      if (!r.ok) return false; const j = await r.json(); if (!Array.isArray(j.rows)) return false;
      LB.remote[key] = j.rows; return true;
    } catch { return false; }
  },
  top(mode, cat, n = 10) {
    let a = load().filter((e) => e.mode === mode && (mode !== 'daily' || e.day === dayKey()));
    if (cat === 'time') a = a.filter((e) => e.result === 'victory').sort((x, y) => x.time - y.time);
    else if (cat === 'score') a = a.sort((x, y) => y.score - x.score);
    else a = a.sort((x, y) => y.cleared - x.cleared || x.time - y.time);
    return a.slice(0, n);
  },
};
const gk = (mode) => 'mosq-ghost-' + mode + (mode === 'daily' ? '-' + dayKey() : '');
const better = (a, b) => !b || a.cleared > b.cleared || (a.cleared === b.cleared && a.time < b.time);
LB.best = (mode) => LB.top(mode, 'depth', 1)[0] || null;
LB.rank = (mode, cat, e) => { const l = LB.top(mode, cat, 500), k = l.findIndex((x) => x.id === e.id); return { rank: k + 1, above: k > 0 ? l[k - 1] : null, n: l.length }; };
LB.ghost = (mode) => { try { return JSON.parse(localStorage.getItem(gk(mode))); } catch { return null; } };
LB.saveGhost = (mode, r) => { if (better(r, LB.ghost(mode))) try { localStorage.setItem(gk(mode), JSON.stringify(r)); } catch { /* */ } };
export { fmtTime } from '../ui/format.js';
