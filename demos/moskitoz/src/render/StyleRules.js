// "Gomme & Encre" pure rules (no three; tested by node --test): bevels, motif scales, legacy texture -> motif, fog range.
export const PAT_SCALE = { grid: 1.0, planks: 0.32, checker: 1.2, stripes: 0.45, dots: 0.55, none: 1 };
export const MOTIFS = Object.keys(PAT_SCALE);

// every box is rounded by 10 % of its smallest side (spec §3.1: at least 8 %); paper-thin slabs stay plain boxes
export const bevel = (w, h, d) => { const m = Math.min(w, h, d); return m < 0.1 ? 0 : 0.1 * m; };

// the old canvas textures become world-space motifs computed in the shader
const TEX_MOTIF = { tiles: 'grid', wood: 'planks', checker: 'checker', carpet: 'dots', plaster: 'stripes', hedge: 'dots' };
export const motifFor = (tex) => TEX_MOTIF[tex] || 'none';

// linear fog: very light, only for depth (starts beyond the room); pal.fog = [near, far] in room sizes
export function fogRange(size, pal) {
  const [a, b] = (pal && pal.fog) || [1.3, 4.2];
  return { near: size * a, far: size * b };
}

// cool shadows (spec §3.1: the shadow is hue-shifted from the warm light): the toon ramp's dark band is tinted with the biome's
// ground light pushed toward blue-violet, normalised to luminance 1 so only the hue moves; k = strength (0 = grey shadows)
export function shadeTint(pal, k = 0.7) {
  const h = mixHex((pal && pal.hemiGround) || '#B9B0D8', '#7C8CFF', 0.5), c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return c.map((v) => 1 + (v / lum - 1) * k);
}

export function mixHex(a, b, t) {
  const p = (h, i) => parseInt(h.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}
