// Friends list and presence heartbeat (spec 2026-10-04 §2). Every call quietly degrades when the server is unreachable.
const HEARTBEAT = 60000;
const EMPTY = () => ({ friends: [], sent: [], received: [] });

async function call(method, path, body) {
  try {
    const r = await fetch(path, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    return { status: r.status, data: await r.json().catch(() => ({})) };
  } catch { return { status: 0, data: {} }; }
}

export const Friends = {
  async list() { const r = await call('GET', '/api/friends'); return r.status === 200 ? r.data : EMPTY(); },
  async add(pseudo) { const r = await call('POST', '/api/friends', { pseudo }); return r.status === 200 || r.status === 201 ? { ok: true, status: r.data.status } : { ok: false, error: r.data.error || 'network' }; },
  async remove(pseudo) { await call('DELETE', '/api/friends/' + encodeURIComponent(pseudo)); },
};

let room = null, timer = 0;
export const Presence = {
  get room() { return room; },
  /** Tell the server which room we are in (null = none) and keep doing so every minute. */
  async set(code) {
    room = code || null;
    clearInterval(timer);
    const beat = () => call('POST', '/api/presence', { room });
    timer = setInterval(beat, HEARTBEAT); if (timer.unref) timer.unref();
    await beat();
  },
  stop() { clearInterval(timer); room = null; },
};
