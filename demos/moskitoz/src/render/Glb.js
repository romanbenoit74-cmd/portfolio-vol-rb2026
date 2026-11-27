// Imported .glb models (e.g. from an image-to-3D pipeline) dressed in the game's "Gomme & Encre" look: every mesh gets the toon material
// (its own texture / vertex colours kept) and a constant-width ink outline. A type listed in assets/models/manifest.json (see glbFit.js) uses its
// .glb instead of the procedural model; anything missing or broken silently falls back to the procedural one.
// Needs three/addons loaders/GLTFLoader.js and utils/SkeletonUtils.js in vendor/addons (loaded on demand, so the game runs without them).
import * as THREE from 'three';
import { gomme, inkHull } from './Style.js';
import { fitScale, groundOffset, parseManifest, pickClip } from './glbFit.js';

const models = new Map(); // type -> { scene, clips, entry, scale, off }

export const GLB = {
  has: (type) => models.has(type),
  get size() { return models.size; },
  /** Loads the manifest and every listed model. Never throws: returns the list of types that are ready. */
  async preload(base = './assets/models/') {
    try {
      const r = await fetch(base + 'manifest.json'); if (!r.ok) return [];
      const manifest = parseManifest(await r.json()), types = Object.keys(manifest); if (!types.length) return [];
      const [{ GLTFLoader }, { clone }] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/utils/SkeletonUtils.js')]);
      GLB._clone = clone; const loader = new GLTFLoader();
      await Promise.all(types.map(async (t) => {
        const e = manifest[t];
        try {
          const g = await loader.loadAsync(base + e.file), box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3());
          const scale = fitScale(size, e.size); models.set(t, { scene: g.scene, clips: g.animations || [], entry: e, scale, off: groundOffset(box.min, box.max, e.lift, scale) });
        } catch (err) { console.warn('[glb]', t, e.file, err && err.message); }
      }));
    } catch (err) { console.warn('[glb] preload', err && err.message); }
    return [...models.keys()];
  },
  clear() { models.clear(); },

  /** Same contract as Models.buildModel: { body, mat, update(t, frozen, flapMul), dispose() }; null if the type has no .glb. */
  make(type, castShadow = true) {
    const T = models.get(type); if (!T || !GLB._clone) return null;
    const root = GLB._clone(T.scene), mats = new Map(), body = new THREE.Group(), pivot = new THREE.Group();
    const matFor = (src, hasColors) => {
      const k = src && src.uuid; if (!mats.has(k)) mats.set(k, gomme(src && src.color ? '#' + src.color.getHexString() : '#FFFFFF', { rim: 0.38, shadow: 0.6, ao: 1, params: { map: (src && src.map) || null, vertexColors: hasColors } }));
      return mats.get(k);
    };
    const meshes = []; root.traverse((o) => { if (o.isMesh) meshes.push(o); }); // collected first: the ink hulls added below are meshes too
    for (const o of meshes) {
      const src = Array.isArray(o.material) ? o.material[0] : o.material;
      o.material = matFor(src, !!o.geometry.getAttribute('color')); o.castShadow = castShadow; o.receiveShadow = false;
      if (!o.isSkinnedMesh) o.add(inkHull(o.geometry)); // a skinned mesh would leave its outline behind: no hull on those
    }
    root.scale.multiplyScalar(T.scale); root.position.set(T.off.x, T.off.y, T.off.z); pivot.rotation.y = T.entry.yaw; pivot.add(root); body.add(pivot);
    const main = [...mats.values()][0] || gomme('#FFFFFF'), rest = [...mats.values()].slice(1);
    let mixer = null; const k = pickClip(T.clips.map((c) => c.name));
    if (k >= 0) { mixer = new THREE.AnimationMixer(root); mixer.clipAction(T.clips[k]).play(); }
    let last = null;
    return {
      body, mat: main,
      update(t, frozen = false, flapMul = 1) {
        const dt = last == null ? 0 : Math.min(0.1, Math.max(0, t - last)); last = t;
        body.position.y = Math.sin(t * 2.3) * 0.05; body.rotation.x = Math.sin(t * 1.7) * 0.05; body.rotation.z = Math.sin(t * 1.3) * 0.04;
        if (mixer) mixer.update(frozen ? 0 : dt * flapMul);
        for (const m of rest) { m.emissive.copy(main.emissive); m.emissiveIntensity = main.emissiveIntensity; } // the hit flash is driven on `mat` only
      },
      dispose() { if (mixer) mixer.stopAllAction(); main.dispose(); rest.forEach((m) => m.dispose()); },
    };
  },
};
