// Wire format of a coop match (pure): my player state at 20 Hz, the host's mosquito snapshot at 10 Hz, and how a guest
// reconciles its puppets with a snapshot. Numbers are rounded to the centimetre: the messages stay far below the size limits.
const r2 = (x) => Math.round(x * 100) / 100;
export const FLAG = { stun: 1, slow: 2, glue: 4, poison: 8, windup: 16 };

/** Player state -> [x, y, z, yaw, pitch, pose, hp, weapon, down 0/1]. */
export const encodePlayer = (p) => [r2(p.x), r2(p.y), r2(p.z), r2(p.yaw), r2(p.pitch), p.pose || 'idle', Math.round(p.hp), p.weapon || 'hands', p.down ? 1 : 0];
export function decodePlayer(a) {
  if (!Array.isArray(a) || a.length < 9 || a.slice(0, 5).some((v) => !Number.isFinite(v))) return null;
  return { x: a[0], y: a[1], z: a[2], yaw: a[3], pitch: a[4], pose: String(a[5]), hp: a[6], weapon: String(a[7]), down: a[8] === 1 };
}

/** Live mosquitoes (objects with id, type, pos{x,y,z}, yaw, hp, maxHp, flags) -> arrays [id, typeIndex, x, y, z, yaw, hp%, flags]. */
export const encodeEnemies = (list, order) => list.map((e) => [e.id, order.indexOf(e.type), r2(e.pos.x), r2(e.pos.y), r2(e.pos.z), r2(e.yaw), Math.max(0, Math.min(100, Math.round((e.hp / e.maxHp) * 100))), e.flags | 0]);
export function decodeEnemies(arr, order) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const a of arr) {
    if (!Array.isArray(a) || a.length < 8 || a.some((v) => !Number.isFinite(v)) || !order[a[1]]) continue;
    out.push({ id: a[0], type: order[a[1]], x: a[2], y: a[3], z: a[4], yaw: a[5], hp: a[6] / 100, flags: a[7] });
  }
  return out;
}
/** What a guest must do to match a snapshot: ids to create (with their data), keep (update) and drop (gone from the host). */
export function reconcile(known, snap) {
  const seen = new Set(snap.map((s) => s.id));
  return { add: snap.filter((s) => !known.has(s.id)), keep: snap.filter((s) => known.has(s.id)), drop: [...known].filter((id) => !seen.has(id)) };
}
/** A hit on a mosquito as sent to the host: only what the host needs to apply it. */
export function encodeHit(id, amount, o = {}) {
  const h = { id, a: r2(amount) };
  for (const k of ['crit', 'stomp', 'shock']) if (o[k]) h[k] = 1;
  for (const k of ['stun', 'poison', 'glue']) if (o[k]) h[k] = r2(o[k]);
  if (o.kb) h.kb = [r2(o.kb.x), r2(o.kb.y), r2(o.kb.z)];
  if (o.from) h.from = [r2(o.from.x), r2(o.from.y), r2(o.from.z)];
  return h;
}
export function decodeHit(h) {
  if (!h || !Number.isFinite(h.id) || !Number.isFinite(h.a) || h.a < 0 || h.a > 5000) return null; // 5000: nothing in the game hits harder
  const o = { crit: !!h.crit, stomp: !!h.stomp, shock: !!h.shock };
  for (const k of ['stun', 'poison', 'glue']) if (Number.isFinite(h[k])) o[k] = h[k];
  const v = (a) => (Array.isArray(a) && a.length === 3 && a.every(Number.isFinite) ? { x: a[0], y: a[1], z: a[2] } : null);
  if (v(h.kb)) o.kb = v(h.kb);
  if (v(h.from)) o.from = v(h.from);
  return { id: h.id, amount: h.a, opts: o };
}
