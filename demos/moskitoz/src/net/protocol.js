// Wire protocol shared by the browser and the room server (spec 2026-10-04 §2). Messages are JSON text: { t: <type>, … }.
// client -> server: ready{ready} mode{mode} start end kick{id} state{s} snap{s} evt{k,d,to?} emote{e} pong{ts}
// server -> client: welcome joined{p} left{id} lobby host{id,snap} start end state{from,s} snap{s} evt{from,k,d} emote{from,e} ping{ts} kicked err{e}
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I / O: easy to read out loud
export const CODE_RE = /^[A-HJ-NP-Z]{4}$/;
export const makeCode = (rnd = Math.random) => Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(rnd() * CODE_ALPHABET.length)]).join('');

export const MODES = { coop: { min: 2, max: 4 }, arena: { min: 2, max: 8 }, br: { min: 2, max: 16 } };
export const ROOM_MAX = 16;
export const LIMITS = { small: 256, state: 512, evt: 2048, snap: 32768 }; // max characters of one client message, by kind
const KIND = { ready: 'small', mode: 'small', start: 'small', end: 'small', kick: 'small', emote: 'small', pong: 'small', state: 'state', evt: 'evt', snap: 'snap' };

/** Parse and bound a client message; null when it is not one we know. */
export function parseClient(raw) {
  if (typeof raw !== 'string' || raw.length > LIMITS.snap) return null;
  let m; try { m = JSON.parse(raw); } catch { return null; }
  if (!m || typeof m !== 'object' || Array.isArray(m) || !Object.hasOwn(KIND, m.t)) return null;
  return raw.length > LIMITS[KIND[m.t]] ? null : m;
}
