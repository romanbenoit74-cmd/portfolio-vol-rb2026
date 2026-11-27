// Pure helpers for imported .glb models (no three.js, node-testable): how big to make a model, and what a manifest entry may say.
// assets/models/manifest.json maps a mosquito type to a file: { "mosquito": { "file": "mosquito.glb", "size": 1.2, "yaw": 3.1416, "lift": 0 } }.
// Models are expected to face +Z; `yaw` (radians) turns one that does not. `size` is the largest dimension in model units (the engine then
// applies the type's own scale, like for the procedural models); `lift` raises the model (units, after scaling).
export const DEFAULT_SIZE = 1.2, MAX_SIZE = 6;
export const TYPES = ['mosquito', 'speedbug', 'heavy', 'swarmling', 'spitter', 'kamikaze', 'shield', 'splitter', 'healer', 'tyrant'];

/** Uniform scale that makes the largest side of `size` {x,y,z} equal `target` (1 if the box is degenerate). */
export function fitScale(size, target = DEFAULT_SIZE) {
  const m = Math.max(size.x || 0, size.y || 0, size.z || 0);
  return m > 1e-6 && Number.isFinite(m) ? target / m : 1;
}

/** Offset (model space, before scaling) that centres the box on x/z and puts its bottom at y = 0 + lift. */
export function groundOffset(min, max, lift = 0, scale = 1) {
  return { x: -((min.x + max.x) / 2) * scale, y: -min.y * scale + lift, z: -((min.z + max.z) / 2) * scale };
}

/** Keeps only valid entries; a file must be a plain relative .glb name (no paths out of the folder, no URLs). */
export function parseManifest(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const t of TYPES) {
    const e = raw[t]; if (!e || typeof e !== 'object') continue;
    if (typeof e.file !== 'string' || !/^[\w][\w.-]*\.glb$/i.test(e.file)) continue;
    const size = Number.isFinite(e.size) && e.size > 0 ? Math.min(MAX_SIZE, e.size) : DEFAULT_SIZE;
    const yaw = Number.isFinite(e.yaw) ? e.yaw : 0, lift = Number.isFinite(e.lift) ? Math.max(-2, Math.min(2, e.lift)) : 0;
    out[t] = { file: e.file, size, yaw, lift };
  }
  return out;
}

/** Index of the animation clip to loop: a name like fly / idle / hover wins, else the first one (-1 if none). */
export function pickClip(names) {
  if (!Array.isArray(names) || !names.length) return -1;
  const k = names.findIndex((n) => /fly|hover|idle|flap/i.test(String(n)));
  return k >= 0 ? k : 0;
}
