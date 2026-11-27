// Shared bits for the biome recipes of phase 9 (same contract as bath/kitchen/garden/volcano: local origin at the bottom
// centre of the generator's box, the visual stays inside it, the collider stays the box).
import { KIND_COLOR } from '../Surfaces.js';
import { mixHex } from '../../render/StyleRules.js';

export { alongX } from './kit.js';
export const NO = { ink: false, cast: false }; // small detail: no outline, no shadow
export const NC = { cast: false };
/** parkour rim colour = what the box does (Surfaces.js): turquoise fixed, orange moving, sky ice, coral crumbling */
export const rimOf = (b) => KIND_COLOR[b.kind || (b.moving ? 'moving' : 'fixed')];
/** parkour function band: a thick inked gum band around the box, lit in its function colour (reads from below and afar) */
export function band(K, g, b) {
  const c = rimOf(b), y = b.h * 0.45;
  K.add(g, K.box(b.w + 0.18, 0.2, b.d + 0.18, 0.09), K.m(c, { rim: 0.35, rimColor: '#FFFFFF', ao: 1, shadow: 0.66 }), 0, y, 0, 0, 0, 0, 1, NC);
  K.add(g, K.box(b.w + 0.2, 0.035, b.d + 0.2, 0.015), K.f(mixHex(c, '#FFFFFF', 0.65)), 0, y + 0.075, 0, 0, 0, 0, 1, NO); // glossy top edge
}
/** sloped box in one material (the slope is the gameplay surface) */
export const ramp = (mat) => (K, g, b) => K.add(g, K.rampGeo(b.w, b.h, b.d, b.ramp), mat(K), 0, b.h / 2, 0);
/** n evenly spaced positions across a length L centred on 0 */
export const spread = (n, L) => Array.from({ length: n }, (_, i) => -L / 2 + ((i + 0.5) * L) / n);
/** a recipe list entry that only fits elongated (wall-like) or squarish boxes */
export const long = (make, k = 1.2) => ({ fits: (b) => Math.max(b.w, b.d) / Math.min(b.w, b.d) >= k, make });
export const square = (make, k = 1.2) => ({ fits: (b) => Math.max(b.w, b.d) / Math.min(b.w, b.d) < k, make });
/** parkour entry: the visual, then the function band */
export const parkour = (make) => ({ make: (K, g, b) => { make(K, g, b); band(K, g, b); } });
