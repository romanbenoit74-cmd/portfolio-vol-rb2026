// Biome prop kit (spec §5). The seeded generator still picks ROLES and axis-aligned collision boxes; a recipe only decides
// what a box looks like, drawn inside its volume, so layout and physics stay identical for everyone. Recipes use materials
// cached per room (Level.batchStatic() merges them into a few draw calls) and register every outline in the room's merged
// ink. Visual variety comes from a separate rng, so the layout rng is never consumed by looks.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { capsule, cone, flat, gomme, lathe, mergeInk, roundedBox, roundedCyl, sphere, torus } from '../../render/Style.js';
import { rng } from '../../core/core.js';

/** Box whose top slopes along ramp.axis (dir > 0: rises toward +axis). Sharp edges: the slope is the gameplay surface. */
export function rampGeo(w, h, d, ramp) {
  const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) <= 0) continue;
    const a = ramp.axis === 'x' ? p.getX(i) / w + 0.5 : p.getZ(i) / d + 0.5;
    p.setY(i, -h / 2 + h * (ramp.dir > 0 ? a : 1 - a));
  }
  g.computeVertexNormals();
  return g;
}

export function makeKit(level, recipes) {
  const pal = level.pal, ink = pal.ink, vr = rng(((level.seedV ?? 1) ^ 0x5bd1e995) >>> 0);
  const K = {
    level, pal, ink, rnd: vr, recipes, dyn: false,
    /** cached lit material (gomme) in this room, outlines use the biome ink */
    m: (color, o = {}) => level.cached('km' + color + JSON.stringify(o), () => gomme(color, { line: ink, ...o })),
    /** cached unlit colour */
    f: (color, o = {}) => level.cached('kf' + color + JSON.stringify(o), () => flat(color, o)),
    /** glowing lava / light: HDR colour (> 1) so only it blooms in high quality */
    glow: (color, k = 2.4) => level.cached('kg' + color + k, () => { const m = new THREE.MeshBasicMaterial({ color }); m.color.multiplyScalar(k); return m; }),
    // geometry (uncached rounded shapes: sizes follow the generator's boxes)
    // 2 segments per bevel: props are many and merged. Thin or tiny details (bevel <= 2 cm, or a side under 5 cm: slots,
    // labels, sheets, binders…) get a plain 12-triangle box: the bevel would not show and repeated details add up.
    box: (w, h, d, r) => ((r ?? 1) <= 0.02 || Math.min(w, h, d) < 0.05 ? new THREE.BoxGeometry(w, h, d) : roundedBox(w, h, d, r ?? Math.min(w, h, d) * 0.14, 2)),
    cyl: (rt, rb, h, bv = 0.06, seg = 24) => roundedCyl(rt, rb, h, Math.min(bv, rt * 0.4, rb * 0.4), seg),
    sphere, cone, torus, capsule, lathe, rampGeo,
    /** add a mesh to parent; o.ink (default true) registers its outline, o.cast (default true) its shadow */
    add(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, o = {}) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
      if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(s[0], s[1], s[2]);
      m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true; parent.add(m);
      if (o.ink !== false) { if (K.dyn) m.userData.ink = true; else level.addOutline(geo, m); }
      return m;
    },
    /** positioned child group (position BEFORE adding parts: outlines are baked from world matrices) */
    sub(parent, x = 0, y = 0, z = 0, ry = 0) { const s = new THREE.Group(); s.position.set(x, y, z); s.rotation.y = ry; parent.add(s); return s; },
    /** a recipe for this role that fits the box shape (seeded visual pick), or null */
    pick(role, b) {
      const list = (recipes[role] || []).filter((x) => !x.fits || x.fits(b));
      return list.length ? list[Math.floor(vr() * list.length)] : null;
    },
    look: (name) => (recipes.looks && recipes.looks[name]) || null,
    /** moving parkour: build detached, then merge by material with a local merged ink hull (few draw calls, moves as one) */
    buildDyn(make, b) {
      const g = new THREE.Group(); K.dyn = true; try { make(K, g, b); } finally { K.dyn = false; }
      g.updateMatrixWorld(true);
      const buckets = new Map(), inks = [];
      g.traverse((o) => {
        if (!o.isMesh) return;
        if (o.userData.ink) inks.push({ geo: o.geometry, matrix: o.matrixWorld.clone() });
        const k = o.material.uuid; if (!buckets.has(k)) buckets.set(k, { mat: o.material, cast: o.castShadow, geos: [] });
        const c = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); for (const a of Object.keys(c.attributes)) if (a !== 'position' && a !== 'normal') c.deleteAttribute(a);
        buckets.get(k).geos.push(c.applyMatrix4(o.matrixWorld));
      });
      const out = new THREE.Group();
      for (const { mat, cast, geos } of buckets.values()) { const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = cast; m.receiveShadow = true; out.add(m); geos.forEach((x) => x.dispose()); }
      if (inks.length) out.add(mergeInk(inks, ink, 2.4));
      return out;
    },
    // ---- set dressing: murals on the walls, decals on the floor (no collision) ----
    decorate() {
      const { w, d, h } = level, murals = recipes.mural || [], sols = recipes.sol || [];
      if (murals.length) for (let wall = 0; wall < 4; wall++) {
        const frame = level.wallFrame(wall), len = frame.userData.len, n = len > 30 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const R = murals[Math.floor(vr() * murals.length)]; if (!R) break;
          const along = (n === 1 ? 0 : (k - 0.5) * len * 0.45) + (vr() - 0.5) * len * 0.2;
          const g = new THREE.Group(); g.position.set(along, 0, 0); frame.add(g); R.make(K, g, { len, h, rnd: vr });
        }
      }
      const [n0, nx] = recipes.solCount || [4, 3], cnt = n0 + Math.floor(vr() * nx);
      for (let k = 0, tries = 0; k < cnt && tries < 60; tries++) {
        const R = sols[Math.floor(vr() * sols.length)]; if (!R) break;
        const x = (vr() - 0.5) * (w - 5), z = (vr() - 0.5) * (d - 5), r = R.r ?? 1.6;
        if (Math.hypot(x, z) < 5 || !level.floorFree(x, z, r)) continue;
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = vr() * Math.PI * 2; level.group.add(g); R.make(K, g, { rnd: vr }); k++;
      }
    },
  };
  return K;
}
/** Long side along local X: rotate the visual group when the generator's box is deeper than wide. */
export function alongX(g, b) { const L = Math.max(b.w, b.d), T = Math.min(b.w, b.d); if (b.d > b.w) g.rotation.y = Math.PI / 2; return { L, T }; }
