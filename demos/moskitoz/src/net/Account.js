// Cloud account (spec 2026-10-04 §1): pseudo + password, cookie session (HttpOnly, invisible here) and a profile that follows the
// player. Profile.js stays the local source, so the game works offline. Pushes send DELTAS from a snapshot of the server profile
// (`base`) with a push id: a lost response can be replayed safely, and changes made during a sync are re-applied on top of it.
import { Profile, sanitizeProfile, DEFAULT_PROFILE } from '../economy/Profile.js';
import { mergeProfile, snapshot } from '../economy/Merge.js';

const KEY = 'mosq-account-v1', DEBOUNCE = 4000, RETRY = 30000;
const fresh = () => ({ user: null, rev: 0, base: null, pending: null, importing: false });
let st = fresh(), status = 'guest', timer = 0, inflight = null, again = false, started = false;
const subs = new Set();
const setStatus = (s) => { status = s; subs.forEach((f) => f(s)); };
const load = () => { try { st = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { st = fresh(); } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* no storage */ } };
const isFresh = (p) => JSON.stringify(sanitizeProfile(p)) === JSON.stringify(sanitizeProfile(DEFAULT_PROFILE));

async function call(method, path, body, keepalive = false) {
  try {
    const r = await fetch('/api' + path, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin', keepalive });
    return { status: r.status, data: await r.json().catch(() => ({})) };
  } catch { return { status: 0, data: {} }; }
}
function schedule(ms) {
  if (!st.user) return;
  clearTimeout(timer); timer = setTimeout(() => push(), ms); if (timer.unref) timer.unref();
}
function adopt(profile, rev) { // take the server's profile as ours
  const p = sanitizeProfile(profile); Profile.replace(p);
  st.base = snapshot(p); st.rev = rev; st.pending = null; st.importing = false; save();
}

function push(keepalive = false) {
  if (!st.user) return Promise.resolve({ ok: false });
  if (inflight) { again = true; return inflight; }
  clearTimeout(timer);
  inflight = (async () => {
    if (!st.pending) st.pending = { push: crypto.randomUUID(), profile: Profile.get(), base: st.base, importing: st.importing }; // frozen until it succeeds: a replay is identical
    save(); setStatus('syncing');
    const sent = st.pending, r = await call('PUT', '/profile', sent, keepalive);
    let ok = false;
    if (r.status === 200) {
      const server = sanitizeProfile(r.data.profile), m = mergeProfile(server, Profile.get(), snapshot(sent.profile), { elapsedSec: Infinity }); // + what changed meanwhile
      Profile.replace(m.ok ? m.profile : Profile.get());
      st.base = snapshot(server); st.rev = r.data.rev; st.pending = null; st.importing = false; save(); setStatus('synced'); ok = true;
    } else if (r.status === 401) { st = fresh(); save(); setStatus('guest'); }
    else if (r.status === 422) { st.pending = null; save(); setStatus('refused'); }
    else { setStatus('offline'); schedule(r.status === 409 ? 1000 : RETRY); } // network down / server hiccup: keep `pending`
    inflight = null;
    if (again) { again = false; schedule(0); }
    return { ok };
  })();
  return inflight;
}

async function enter(data) { // answer of register / login: { user, profile, rev, imported }
  st = { ...fresh(), user: data.user, rev: data.rev };
  const local = Profile.get();
  if (!data.imported && !isFresh(local)) { st.base = { coins: 0, coinsEarned: 0, runs: 0 }; st.importing = true; save(); await push(); return { ok: true, imported: true }; } // first link: this browser's progress joins the account
  adopt(data.profile, data.rev); setStatus('synced');
  return { ok: true, droppedLocal: !isFresh(local) }; // the account already had a profile: the guest progress of this browser is not merged
}

export const Account = {
  get user() { return st.user; },
  get status() { return status; },
  onChange(f) { subs.add(f); return () => subs.delete(f); },
  async init() {
    if (started) return; started = true; load();
    Profile.subscribe(() => schedule(DEBOUNCE));
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && st.user) push(true); });
    if (!st.user) return;
    setStatus('syncing');
    const me = await call('GET', '/auth/me');
    if (me.status === 0) { setStatus('offline'); schedule(RETRY); return; }
    if (!me.data.user) { st = fresh(); save(); setStatus('guest'); return; }
    st.user = me.data.user;
    if (st.base) await push();
    else { const g = await call('GET', '/profile'); if (g.status === 200) { adopt(g.data.profile, g.data.rev); setStatus('synced'); } }
  },
  async register(pseudo, password) {
    const r = await call('POST', '/auth/register', { pseudo, password, profile: Profile.get() });
    return r.status === 201 ? enter(r.data) : { ok: false, error: r.data.error || 'network' };
  },
  async login(pseudo, password) {
    const r = await call('POST', '/auth/login', { pseudo, password });
    return r.status === 200 ? enter(r.data) : { ok: false, error: r.data.error || 'network' };
  },
  sync() { return push(); },
  async logout({ force = false } = {}) {
    if (st.user && !force) { await push(); if (status !== 'synced') return { ok: false, error: 'unsynced' }; }
    if (st.user) await call('POST', '/auth/logout');
    this.forget(); Profile.replace(DEFAULT_PROFILE);
    return { ok: true };
  },
  forget() { clearTimeout(timer); st = fresh(); inflight = null; again = false; save(); setStatus('guest'); },
};
