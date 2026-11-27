// "Gomme & Encre" render kit (spec §3.4), ported from concept/js/kit.js.
// Materials: gomme (2-tone toon + world-space motifs + floor AO + fresnel rim + optional hatch hole), flat (unlit),
// ink hull (back faces pushed out in clip space: constant width in pixels, thinner far away, biome ink colour).
// Geometry: rounded boxes / cylinders (cached for fixed kit sizes, uncached for room props that die with their floor).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAT_SCALE } from './StyleRules.js';
import { SIGNAL } from '../level/Biomes.js';

export const TAU = Math.PI * 2;
// shared by every ink material: the size of the buffer the scene is drawn into (set by Game.resize)
export const INK = { res: { value: new THREE.Vector2(1280, 720) } };
// shared by every gomme material: hue of the shadow band (StyleRules.shadeTint, set per room by Game.applyLighting)
export const SHADE = { tint: { value: new THREE.Color(1, 1, 1) } };

/**
 * Toon "gomme" material.
 * o.pattern: none|grid|planks|checker|stripes|dots (world-space, anti-aliased), o.color2 / o.line / o.lineA / o.scale / o.width
 * o.rim: 0..1 fresnel rim (enemies, pickups, hands), o.rimColor
 * o.shadow: lit/shadow ratio (default 0.58), o.edge: terminator position (-1..1)
 * o.ao: darkening at floor level (1 = none), o.aoH: height of the fade, o.floorY
 * o.hole: shared Vector3 (x, z, radius) — pixels inside the hatch circle are discarded
 * o.params: extra MeshToonMaterial parameters (map, vertexColors, polygonOffset…)
 */
export function gomme(color, o = {}) {
  const pattern = o.pattern || 'none';
  const m = new THREE.MeshToonMaterial({ color, transparent: !!o.transparent, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.emissiveIntensity ?? 1, ...o.params });
  const u = {
    uShadow: { value: o.shadow ?? 0.58 }, uEdge: { value: o.edge ?? 0.12 },
    uRim: { value: o.rim ?? 0 }, uRimColor: { value: new THREE.Color(o.rimColor ?? '#ffffff') },
    uAO: { value: o.ao ?? 0.8 }, uAOH: { value: o.aoH ?? 1.1 }, uFloorY: { value: o.floorY ?? 0 },
    uScale: { value: o.scale ?? PAT_SCALE[pattern] }, uLine: { value: new THREE.Color(o.line ?? '#000000') }, uLineA: { value: o.lineA ?? 0.14 },
    uWidth: { value: o.width ?? 0.035 }, uColor2: { value: new THREE.Color(o.color2 ?? color) },
    uHole: { value: o.hole || new THREE.Vector3() }, uShadeTint: SHADE.tint,
  };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGWPos; varying vec3 vGWNrm;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 gw = vec4( transformed, 1.0 ); vec3 gn = objectNormal;
        #ifdef USE_INSTANCING
          gw = instanceMatrix * gw; gn = mat3( instanceMatrix ) * gn;
        #endif
        vGWPos = ( modelMatrix * gw ).xyz; vGWNrm = normalize( mat3( modelMatrix ) * gn );`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vGWPos; varying vec3 vGWNrm;
        uniform float uShadow, uEdge, uRim, uAO, uAOH, uFloorY, uScale, uLineA, uWidth;
        uniform vec3 uRimColor, uLine, uColor2, uHole, uShadeTint;
        vec2 gPlane() { vec3 n = abs( normalize( vGWNrm ) ); if ( n.y >= n.x && n.y >= n.z ) return vGWPos.xz; if ( n.x >= n.z ) return vGWPos.zy; return vGWPos.xy; }
        float gLine( float c, float w ) { float d = abs( fract( c + 0.5 ) - 0.5 ); float fw = fwidth( c ); return 1.0 - smoothstep( w - fw, w + fw, d ); }`)
      .replace('void main() {', `void main() {
        #ifdef GOMME_HOLE
          if ( uHole.z > 0.0 && distance( vGWPos.xz, uHole.xy ) < uHole.z ) discard;
        #endif`)
      .replace('#include <gradientmap_pars_fragment>', `
        vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
          float dotNL = dot( normal, lightDirection ); float fw = fwidth( dotNL ) + 0.002;
          return mix( uShadow * uShadeTint, vec3( 1.0 ), smoothstep( uEdge - fw, uEdge + fw, dotNL ) );
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec2 c = gPlane() / uScale; vec3 col = diffuseColor.rgb;
          #if defined( PAT_GRID )
            col = mix( col, uLine, max( gLine( c.x, uWidth ), gLine( c.y, uWidth ) ) * uLineA );
          #elif defined( PAT_PLANKS )
            float row = floor( c.y ); float jx = c.x * 0.22 + fract( row * 0.618 );
            col *= 1.0 - 0.045 * mod( row, 2.0 );
            col = mix( col, uLine, max( gLine( c.y, uWidth ), gLine( jx, uWidth * 0.22 ) ) * uLineA );
          #elif defined( PAT_CHECKER )
            float s = sin( c.x * PI ) * sin( c.y * PI ); float f = fwidth( s ) + 1e-4;
            col = mix( col, uColor2, smoothstep( -f, f, s ) );
          #elif defined( PAT_STRIPES )
            float s = sin( c.x * PI ); float f = fwidth( s ) + 1e-4;
            col = mix( col, uColor2, smoothstep( -f, f, s ) );
          #elif defined( PAT_DOTS )
            vec2 cc = c; cc.x += 0.5 * mod( floor( cc.y ), 2.0 ); float d = length( fract( cc ) - 0.5 ); float f = fwidth( d ) + 1e-4;
            col = mix( col, uColor2, 1.0 - smoothstep( 0.2 - f, 0.2 + f, d ) );
          #endif
          col *= mix( uAO, 1.0, smoothstep( 0.0, uAOH, vGWPos.y - uFloorY ) );
          diffuseColor.rgb = col;
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float fres = 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) );
        totalEmissiveRadiance += uRimColor * smoothstep( 0.6, 0.82, fres ) * uRim;`);
  };
  m.defines = { ...m.defines };
  if (pattern !== 'none') m.defines['PAT_' + pattern.toUpperCase()] = '';
  if (o.hole) m.defines.GOMME_HOLE = '';
  m.customProgramCacheKey = () => 'gomme-' + pattern + (o.hole ? '-hole' : '');
  return m;
}
/** Unlit colour (water, glass, lamps, screens, sky). Still fogged unless o.fog = false. o.hole: hatch circle, as in gomme. */
export function flat(color, o = {}) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: !!o.transparent, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.depthWrite ?? true, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: o.fog ?? true });
  if (o.hole) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uHole = { value: o.hole };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvHWP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHWP; uniform vec3 uHole;').replace('void main() {', 'void main() {\n  if ( uHole.z > 0.0 && distance( vHWP.xz, uHole.xy ) < uHole.z ) discard;');
    };
    m.customProgramCacheKey = () => 'flat-hole';
  }
  return m;
}

const inkCache = new Map();
/** Back-face hull material pushed out in clip space: constant width in pixels, thinner far away. Works on InstancedMesh too. */
export function inkMat(color = SIGNAL.ink, px = 2.4) {
  const key = color + '|' + px;
  if (inkCache.has(key)) return inkCache.get(key);
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor: { value: new THREE.Color(color) }, uPx: { value: px } }]);
  u.uRes = INK.res;
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, fog: true,
    vertexShader: `uniform vec2 uRes; uniform float uPx;
      #include <common>
      #include <fog_pars_vertex>
      void main() {
        vec4 p = vec4( position, 1.0 ); vec3 nrm = normal;
        #ifdef USE_INSTANCING
          p = instanceMatrix * p; nrm = mat3( instanceMatrix ) * nrm;
        #endif
        vec4 mvPosition = modelViewMatrix * p;
        vec4 clip = projectionMatrix * mvPosition;
        vec3 n = normalize( normalMatrix * nrm );
        vec2 nc = ( projectionMatrix * vec4( n, 0.0 ) ).xy; nc = normalize( nc + vec2( 1e-5 ) );
        float px = uPx * mix( 1.0, 0.62, smoothstep( 7.0, 38.0, -mvPosition.z ) );
        clip.xy += nc * px * 2.0 / uRes * clip.w;
        gl_Position = clip;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uColor;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4( uColor, 1.0 );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  inkCache.set(key, m);
  return m;
}
/** Position-only clone with averaged normals, so hard-edged meshes don't split their outline at corners. */
export function smoothed(geo) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', geo.getAttribute('position').clone());
  if (geo.index) g.setIndex(geo.index.clone());
  const m = mergeVertices(g, 1e-3); m.computeVertexNormals(); g.dispose();
  return m;
}
const smoothCache = new WeakMap();
export function smoothGeo(geo) {
  if (!smoothCache.has(geo)) smoothCache.set(geo, smoothed(geo));
  return smoothCache.get(geo);
}
/** Ink hull for a moving mesh (added as its child). */
export function inkHull(geo, color = SIGNAL.ink, px = 2.4) {
  const h = new THREE.Mesh(smoothGeo(geo), inkMat(color, px));
  h.castShadow = false; h.receiveShadow = false; h.raycast = () => {};
  return h;
}
/** One authored part: the mesh plus its ink hull as a child. o.ink = colour or false, o.px = line width, o.cast / o.receive. */
export function part(geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true;
  if (o.ink !== false) { const h = inkHull(geo, o.ink || SIGNAL.ink, o.px ?? 2.4); m.add(h); m.userData.hull = h; }
  return m;
}
/** Place helper: position / rotation / scale in one call. */
export function put(parent, mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
  if (typeof s === 'number') mesh.scale.setScalar(s); else mesh.scale.set(s[0], s[1], s[2]);
  parent.add(mesh); return mesh;
}
/** Static outlines of a whole room in one draw call: entries = [{ geo, matrix }] (matrix = mesh -> group). */
export function mergeInk(entries, color = SIGNAL.ink, px = 2.4) {
  const gs = entries.map(({ geo, matrix }) => smoothed(geo).applyMatrix4(matrix));
  const m = new THREE.Mesh(mergeGeometries(gs), inkMat(color, px));
  gs.forEach((g) => g.dispose());
  m.castShadow = false; m.receiveShadow = false; m.raycast = () => {};
  return m;
}

// ---------------------------------------------------------------- geometry
/** Uncached rounded box (room props: random sizes, disposed with their floor). */
export const roundedBox = (w, h, d, r, seg = 3) => (r > 0 ? new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)) : new THREE.BoxGeometry(w, h, d));
/** Uncached cylinder with rounded top/bottom edges (lathe). rt/rb: top/bottom radius, bv: bevel radius. */
export function roundedCyl(rt, rb, h, bv = 0.06, radial = 28) {
  bv = Math.min(bv, rt * 0.9, rb * 0.9, h / 2 - 1e-3);
  const pts = [new THREE.Vector2(0, -h / 2)];
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i / 5) * (Math.PI / 2); pts.push(new THREE.Vector2(rb - bv + Math.cos(a) * bv, -h / 2 + bv + Math.sin(a) * bv)); }
  for (let i = 0; i <= 5; i++) { const a = (i / 5) * (Math.PI / 2); pts.push(new THREE.Vector2(rt - bv + Math.cos(a) * bv, h / 2 - bv + Math.sin(a) * bv)); }
  pts.push(new THREE.Vector2(0, h / 2));
  return new THREE.LatheGeometry(pts, radial);
}
const geoCache = new Map();
const cached = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
// cached versions: fixed kit sizes shared by many objects (never dispose these)
export const rbox = (w, h, d, r = 0.08, seg = 3) => cached(`rb${w}|${h}|${d}|${r}|${seg}`, () => roundedBox(w, h, d, r, seg));
export const rcyl = (rt, rb, h, bv = 0.06, radial = 28) => cached(`rc${rt}|${rb}|${h}|${bv}|${radial}`, () => roundedCyl(rt, rb, h, bv, radial));
export const lathe = (pts, radial = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), radial);
export const sphere = (r, ws = 28, hs = 20) => cached(`sp${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
export const capsule = (r, len, cs = 8, rs = 20) => cached(`cp${r}|${len}|${cs}|${rs}`, () => new THREE.CapsuleGeometry(r, len, cs, rs));
export const torus = (R, r, rs = 16, ts = 40, arc = TAU) => cached(`to${R}|${r}|${rs}|${ts}|${arc}`, () => new THREE.TorusGeometry(R, r, rs, ts, arc));
export const cone = (r, h, rs = 24) => cached(`co${r}|${h}|${rs}`, () => new THREE.ConeGeometry(r, h, rs));

// ---------------------------------------------------------------- scene helpers
let blobTex = null;
/** Soft contact shadow disc (for hovering things that shouldn't cost a shadow-map caster). */
export function contactShadow(r = 0.5, opacity = 0.28, color = SIGNAL.ink) {
  if (!blobTex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(cv);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: blobTex, color, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
}
