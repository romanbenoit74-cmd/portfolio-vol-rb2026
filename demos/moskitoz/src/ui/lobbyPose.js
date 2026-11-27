// Pure maths of the 3D lobby (spec 2026-10-04 §6): where each player's pair of hands floats, and what an emote does to them.
// Kept free of Three.js so it can be tested; LobbyScene.js turns it into meshes.
export const EMOTES = { wave: { label: 'Salut', dur: 1.8 }, fist: { label: 'Poing', dur: 1.3 }, clap: { label: 'Claque', dur: 1.5 } };
export const SLOT_W = 0.85, ROW_MAX = 6, ROW_D = 1.1;
const TAU = Math.PI * 2, IDLE = { off: [0, 0, 0], rot: [0, 0, 0], pose: 'idle' };

/** Floating spots for n players: rows of up to 6, front row first, each row a shallow arc and a little higher than the one before. */
export function layout(n) {
  const out = [], rows = Math.ceil(n / ROW_MAX);
  for (let r = 0; r < rows; r++) {
    const c = Math.min(ROW_MAX, n - r * ROW_MAX);
    for (let k = 0; k < c; k++) { const u = k - (c - 1) / 2; out.push({ x: u * SLOT_W, y: r * 0.75, z: -r * ROW_D - u * u * 0.03 }); }
  }
  return out;
}
/** Half width and depth of the group, to frame the camera. */
export function extent(n) {
  const rows = Math.ceil(n / ROW_MAX), cols = Math.min(n, ROW_MAX);
  return { w: Math.max(1, (cols - 1) * SLOT_W + 0.7), d: Math.max(0, (rows - 1) * ROW_D), h: 1.1 + (rows - 1) * 0.75 };
}

const env = (k) => Math.max(0, Math.min(1, k / 0.12, (1 - k) / 0.12)); // ease in and out so a hand never jumps
/**
 * Offsets of each hand during an emote, k = elapsed / duration in [0, 1).
 * -> { L, R } each { off: [x, y, z], rot: [x, y, z], pose } relative to the resting hand; outside [0, 1) both are at rest.
 */
export function emotePose(kind, k) {
  if (!Object.hasOwn(EMOTES, kind) || !(k >= 0 && k < 1)) return { L: IDLE, R: IDLE };
  const e = env(k), sin = Math.sin;
  if (kind === 'wave') return { L: IDLE, R: { off: [0.04 * e, 0.22 * e, -0.06 * e], rot: [-0.35 * e, 0, 0.6 * sin(k * TAU * 3) * e], pose: 'open' } };
  if (kind === 'fist') {
    const h = { off: [0, (0.08 + 0.1 * sin(k * TAU * 2)) * e, -0.14 * e], rot: [-0.2 * e, 0, 0], pose: 'fist' };
    return { L: h, R: h };
  }
  const c = (1 - Math.cos(k * TAU * 3)) / 2 * e; // clap: 3 beats, hands meet at the centre
  return { L: { off: [0.13 * c, 0.05 * e, -0.08 * e], rot: [0, 0, 0], pose: 'open' }, R: { off: [-0.13 * c, 0.05 * e, -0.08 * e], rot: [0, 0, 0], pose: 'open' } };
}
