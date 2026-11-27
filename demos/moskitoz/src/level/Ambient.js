// Ambient motes per biome (recipe `ambient`): one Points draw call, round soft dots computed in the
// shader (no texture), wrapped inside the room so they never run out. Purely decorative.
import * as THREE from 'three';
import { rng } from '../core/core.js';

// Each biome recipe file may export `ambient: { n, color, size, rise, sway, glow }`: count, colour, size (m), rise (m/s, negative
// falls), sway (m), additive glow (volcano embers, garden pollen…). No entry, no motes.
export function buildAmbient(level) {
  const A = level.ambientDef || (level.kit && level.kit.recipes.ambient); // ambientDef: a hand-built room's own motes
  if (!A) return null;
  const { w, d, h } = level, r = rng(((level.seedV ?? 1) ^ 0xa3b1) >>> 0), n = A.n, pos = new Float32Array(n * 3), seed = new Float32Array(n); // own rng: the layout never shifts
  for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * w; pos[i * 3 + 1] = r() * h; pos[i * 3 + 2] = (r() - 0.5) * d; seed[i] = r() * 100; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uColor: { value: new THREE.Color(A.color) }, uSize: { value: A.size }, uRise: { value: A.rise }, uSway: { value: A.sway }, uBox: { value: new THREE.Vector3(w, h, d) }, uScale: { value: 600 } },
    vertexShader: `uniform float uT, uSize, uRise, uSway, uScale; uniform vec3 uBox; attribute float seed; varying float vFade;
      void main() {
        vec3 p = position; p.y = mod(p.y + uT * uRise * (0.6 + 0.4 * fract(seed)), uBox.y);
        p.x += sin(uT * 0.7 + seed) * uSway; p.z += cos(uT * 0.6 + seed * 1.3) * uSway;
        vFade = smoothstep(0.0, 1.5, p.y) * (1.0 - smoothstep(uBox.y - 1.5, uBox.y, p.y)) * (0.55 + 0.45 * sin(uT * 3.0 + seed * 7.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * uScale / -mv.z;
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vFade;
      void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(uColor, (1.0 - smoothstep(0.15, 0.5, d)) * vFade); }`,
    transparent: true, depthWrite: false, blending: A.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.userData.dyn = true;
  level.mats.push(mat); level.group.add(pts);
  return (t) => { mat.uniforms.uT.value = t; };
}
