// Browser side of a room (spec 2026-10-04 §2): one WebSocket, a local mirror of the room (`room`) and events.
// Events: joined(p) left(id) lobby(room) host(id, snap) start(msg) end state(msg) snap(msg) evt(msg) emote(msg) kicked error(code) close(code).
import { makeCode } from './protocol.js';

const defaultOrigin = () => (typeof location === 'undefined' ? '' : (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);

export class RoomClient {
  constructor({ origin = defaultOrigin(), WS = globalThis.WebSocket, headers = null } = {}) {
    this.origin = origin; this.WS = WS; this.headers = headers; this.ws = null; this.room = null; this.l = new Map();
  }
  on(t, f) { if (!this.l.has(t)) this.l.set(t, new Set()); this.l.get(t).add(f); return () => this.l.get(t).delete(f); }
  emit(t, ...a) { const s = this.l.get(t); if (s) [...s].forEach((f) => f(...a)); }

  /** Resolves with `room` once the server's welcome arrives; rejects with Error(code): no-room, exists, started, full, network. */
  connect(code, create = false) {
    return new Promise((ok, no) => {
      const url = `${this.origin}/api/rooms/${code}/ws${create ? '?create=1' : ''}`;
      const ws = this.headers ? new this.WS(url, { headers: this.headers }) : new this.WS(url);
      this.ws = ws; let joined = false;
      ws.onmessage = (e) => {
        let m; try { m = JSON.parse(e.data); } catch { return; }
        if (!joined) { if (m.t === 'welcome') { joined = true; this.apply(m); ok(this.room); } else if (m.t === 'err') no(new Error(m.e)); return; }
        this.handle(m);
      };
      ws.onclose = (e) => { if (!joined) no(new Error('network')); else { this.room = null; this.emit('close', e.code); } };
      ws.onerror = () => {};
    });
  }
  join(code) { return this.connect(code, false); }
  async create() { // a random code can already be in use: try a few
    for (let i = 0; i < 6; i++) { try { return await this.connect(makeCode(), true); } catch (e) { if (e.message !== 'exists') throw e; } }
    throw new Error('exists');
  }

  players(list) { return new Map(list.map((p) => [p.id, p])); }
  apply(m) {
    this.room = { code: m.code, you: m.you, host: m.host, mode: m.mode, status: m.status, seed: m.seed || 0, players: this.players(m.players) };
  }
  handle(m) {
    const r = this.room; if (!r) return;
    switch (m.t) {
      case 'joined': r.players.set(m.p.id, m.p); this.emit('joined', m.p); break;
      case 'left': r.players.delete(m.id); this.emit('left', m.id); break;
      case 'lobby': Object.assign(r, { mode: m.mode, status: m.status, host: m.host, players: this.players(m.players) }); this.emit('lobby', r); break;
      case 'host': r.host = m.id; this.emit('host', m.id, m.snap); break;
      case 'start': Object.assign(r, { status: 'playing', mode: m.mode, seed: m.seed, host: m.host, players: this.players(m.players) }); this.emit('start', m); break;
      case 'end': r.status = 'lobby'; this.emit('end'); break;
      case 'ping': this.send('pong', { ts: m.ts }); break;
      case 'state': case 'snap': case 'evt': case 'emote': case 'kicked': this.emit(m.t, m); break;
      case 'err': this.emit('error', m.e); break;
      default: break;
    }
  }

  send(t, o = {}) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ t, ...o })); }
  setReady(ready) { this.send('ready', { ready }); }
  setMode(mode) { this.send('mode', { mode }); }
  start() { this.send('start'); }
  end() { this.send('end'); }
  kick(id) { this.send('kick', { id }); }
  sendState(s) { this.send('state', { s }); }
  sendSnap(s) { this.send('snap', { s }); }
  sendEvent(k, d, to) { this.send('evt', { k, d, to }); }
  emote(e) { this.send('emote', { e }); }
  close() { if (this.ws) { try { this.ws.close(1000); } catch { /* */ } } }
}
