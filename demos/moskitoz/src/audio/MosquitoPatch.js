// Mosquito buzz, pure part (no three, no Web Audio; tested by node --test). Spec §7.
// Per-type voices, the 4 presets, bus gain, pitch (telegraph + cartoon Doppler), nearest-N choice and stable voice slots.
export const MAX_VOICES = 4;
export const RETARGET = 0.1; // s between two voice reassignments
export const SWAP = 0.08; // s fade-out when a voice changes mosquito
export const SOUND_C = 60; // cartoon "speed of sound" (m/s): Doppler audible at mosquito speeds
export const MOSQ_BASE = 0.4; // bus calibration: a Doux bug at 1.5 m sits around the music peaks, under the hits
export const DEFAULT_PRESET = 'doux';

// f0 Hz, wingbeat AM Hz, level; growl = square sub-octave (tyrant)
export const VOICE_TYPES = {
  swarmling: { f0: 880, am: 70, lvl: 0.3 },
  speedbug: { f0: 720, am: 60, lvl: 0.42 },
  kamikaze: { f0: 600, am: 50, lvl: 0.5 },
  healer: { f0: 560, am: 44, lvl: 0.45 },
  mosquito: { f0: 520, am: 42, lvl: 0.5 },
  splitter: { f0: 480, am: 36, lvl: 0.55 },
  spitter: { f0: 460, am: 38, lvl: 0.5 },
  shield: { f0: 400, am: 30, lvl: 0.55 },
  heavy: { f0: 190, am: 22, lvl: 0.75 },
  tyrant: { f0: 95, am: 14, lvl: 0.9, growl: true },
};
export const PRESETS = {
  doux: { name: 'Doux', gain: 0.5, lp: 1800, q: 1.2, vib: 0.015, vibRate: 6, am: 0.25, pitch: 1, dop: 1, rise: 0.14 },
  realiste: { name: 'Réaliste', gain: 1, lp: 6500, q: 3.2, vib: 0.008, vibRate: 9, am: 0.15, pitch: 1.12, dop: 1, rise: 0.12 },
  cartoon: { name: 'Cartoon', gain: 0.9, lp: 3600, q: 1.8, vib: 0.06, vibRate: 7, am: 0.4, pitch: 1, dop: 2, rise: 0.28 },
  coupe: { name: 'Coupé', gain: 0 },
};
export const PRESET_IDS = Object.keys(PRESETS);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const sanitizePreset = (id) => (typeof id === 'string' && Object.hasOwn(PRESETS, id) ? id : DEFAULT_PRESET);
// synth values for live voices: Coupé has none, it borrows Doux's (its bus is muted anyway)
export const patchOf = (id) => { const P = PRESETS[sanitizePreset(id)]; return P.gain > 0 ? P : PRESETS[DEFAULT_PRESET]; };
export const busGain = (vol, id) => clamp(Number.isFinite(vol) ? vol : 0, 0, 1) * PRESETS[sanitizePreset(id)].gain * MOSQ_BASE;

// tele 0..1 = attack wind-up, vr = radial speed (m/s, + = moving away)
export function voiceFreq(type, id, tele = 0, vr = 0) {
  const T = VOICE_TYPES[type] || VOICE_TYPES.mosquito, P = patchOf(id);
  const dop = 1 - clamp((vr * P.dop) / SOUND_C, -0.15, 0.15);
  return T.f0 * P.pitch * (1 + P.rise * clamp(tele, 0, 1)) * dop;
}
// 0..1: how far the enemy is into its attack wind-up (1 while it charges)
export function telegraph(e) {
  if (e.state === 'charge') return 1;
  if (e.state !== 'windup') return 0;
  const w = e.def && e.def.windup;
  return w > 0 ? clamp(1 - e.stateT / w, 0, 1) : 1;
}
// a voice only follows a flying bug: dead, glued or stunned ones fall silent
export const audible = (e) => !e.dying && !(e.glueT > 0) && !(e.stunT > 0);
export function pickNearest(list, n, dist) {
  const c = [];
  for (const e of list) if (audible(e)) c.push([dist(e), e]);
  c.sort((a, b) => a[0] - b[0]);
  return c.slice(0, n).map((x) => x[1]);
}
// a slot keeps its bug while it stays chosen; newcomers take the free slots in order
export function assignSlots(slots, chosen) {
  const keep = new Set(chosen), next = slots.map((e) => (e && keep.has(e) ? e : null)), placed = new Set(next);
  let i = 0;
  for (const e of chosen) {
    if (placed.has(e)) continue;
    while (i < next.length && next[i]) i++;
    if (i >= next.length) break;
    next[i++] = e;
  }
  return next;
}
