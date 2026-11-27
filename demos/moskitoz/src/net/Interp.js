// Smooths a remote player's 20 Hz states: samples the buffer `delay` ms in the past and interpolates between the two states around it.
// Position and pitch are linear, yaw takes the shortest way round. No extrapolation: past the last state, the last state holds.
const lerp = (a, b, k) => a + (b - a) * k;
const lerpAngle = (a, b, k) => a + ((((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * k;

export class Interp {
  constructor(delay = 100, keep = 1000) { this.delay = delay; this.keep = keep; this.buf = []; }
  push(t, s) {
    const b = this.buf;
    if (b.length && t <= b[b.length - 1].t) return; // old or duplicate
    b.push({ t, s });
    while (b.length > 2 && b[1].t < t - this.keep) b.shift();
  }
  sample(now) {
    const b = this.buf; if (!b.length) return null;
    const t = now - this.delay, last = b[b.length - 1];
    if (t <= b[0].t) return { ...b[0].s };
    if (t >= last.t) return { ...last.s };
    let i = 1; while (b[i].t < t) i++;
    const a = b[i - 1], c = b[i], k = (t - a.t) / (c.t - a.t);
    return { ...c.s, x: lerp(a.s.x, c.s.x, k), y: lerp(a.s.y, c.s.y, k), z: lerp(a.s.z, c.s.z, k), yaw: lerpAngle(a.s.yaw, c.s.yaw, k), pitch: lerp(a.s.pitch, c.s.pitch, k) };
  }
}
