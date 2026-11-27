// Set dressing on the "Gomme & Encre" kit: windows + light shafts, pictures, mirror, clock, small props.
// (Baseboards and the sky now come with the room shell in Level.js; the full prop kit per biome arrives in phase 6.)
import * as THREE from 'three';
import { rng } from '../core/core.js';
import { gomme } from '../render/Style.js';

const stdMat = (color, o = {}) => gomme(color, o.side ? { side: o.side } : {});

// group in a wall's local frame: x along the wall, y up, z pointing into the room
export function wallFrame(level, i) {
  level._frames ||= [];
  if (level._frames[i]) return level._frames[i];
  const { w, d } = level;
  const defs = [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]];
  const [x, z, ry, len] = defs[i];
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.userData.len = len;
  level.group.add(g); return (level._frames[i] = g);
}

let shaftTex = null;
function shaftTexture() {
  if (shaftTex) return shaftTex;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 128);
  const m = c.createLinearGradient(0, 0, 64, 0); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.25, 'rgba(0,0,0,0)'); m.addColorStop(0.75, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)');
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = m; c.fillRect(0, 0, 64, 128);
  return (shaftTex = new THREE.CanvasTexture(cv));
}

export function windowAt(level, wall, along, y, w, h, color = 0xcfe8ff, shaft = false) {
  const f = wallFrame(level, wall), fr = stdMat(0xf4f0e6, { roughness: 0.4 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
  glass.position.set(along, y, 0.02); f.add(glass);
  const t = 0.1;
  for (const [bw, bh, bx, by] of [[w + 2 * t, t, 0, h / 2 + t / 2], [w + 2 * t, t, 0, -h / 2 - t / 2], [t, h, -w / 2 - t / 2, 0], [t, h, w / 2 + t / 2, 0], [t * 0.7, h, 0, 0], [w, t * 0.7, 0, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.12), fr); b.position.set(along + bx, y + by, 0.06); f.add(b);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.08, 0.3), fr); sill.position.set(along, y - h / 2 - 0.12, 0.15); f.add(sill);
  if (shaft) {
    const L = level.h * 1.5, geo = new THREE.PlaneGeometry(w * 0.95, L); geo.translate(0, -L / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shaftTexture(), color, transparent: true, forceSinglePass: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(along, y + h / 2, 0.05); m.rotation.x = -0.75; f.add(m);
  }
}

function artTexture(seed) {
  const r = rng(seed), cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const c = cv.getContext('2d');
  const h0 = Math.floor(r() * 360), g = c.createLinearGradient(0, 0, 0, 96);
  g.addColorStop(0, `hsl(${h0},60%,70%)`); g.addColorStop(1, `hsl(${h0 + 40},55%,45%)`); c.fillStyle = g; c.fillRect(0, 0, 128, 96);
  c.fillStyle = `hsl(${h0 + 180},80%,75%)`; c.beginPath(); c.arc(30 + r() * 70, 26 + r() * 14, 12 + r() * 8, 0, 7); c.fill();
  for (let i = 0; i < 3; i++) { c.fillStyle = `hsl(${h0 + 90 + i * 30},45%,${25 + i * 10}%)`; c.beginPath(); c.moveTo(-10, 96); for (let x = 0; x <= 140; x += 20) c.lineTo(x, 50 + i * 12 + r() * 22); c.lineTo(140, 96); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function picture(level, wall, along, y, w, h, seed = 1) {
  const f = wallFrame(level, wall);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, h + 0.24, 0.08), stdMat(0x3a2718, { roughness: 0.5 })); fr.position.set(along, y, 0.04); f.add(fr);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: artTexture(seed) })); art.position.set(along, y, 0.09); f.add(art);
}
export function mirror(level, wall, along, y, w, h) {
  const f = wallFrame(level, wall);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.07), stdMat(0xd8b24a, { metalness: 0.8, roughness: 0.3 })); fr.position.set(along, y, 0.035); f.add(fr);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xbfe8ff })); m.position.set(along, y, 0.08); f.add(m);
}

export function duck(level, x, y, z) {
  const g = new THREE.Group(), yel = stdMat(0xffd21f, { roughness: 0.3 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), yel); body.scale.set(1, 0.8, 1.25); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), yel); head.position.set(0, 0.28, 0.2); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), stdMat(0xff7a1a)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.26, 0.4); g.add(beak);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), stdMat(0x111111)); e.position.set(s * 0.08, 0.34, 0.33); g.add(e); }
  g.position.set(x, y + 0.22, z); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); level.group.add(g);
}
export function plant(level, x, z, s = 1) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * s, 0.32 * s, 0.7 * s, 16), stdMat(0xb5562f, { roughness: 0.8 })); pot.position.y = 0.35 * s; g.add(pot);
  const leaf = stdMat(0x2f9a45, { roughness: 0.5 });
  for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 10, 8), leaf); l.scale.set(0.5, 1.5, 0.15); const a = (i / 9) * 6.28; l.position.set(Math.cos(a) * 0.25 * s, 1.15 * s, Math.sin(a) * 0.25 * s); l.rotation.set(Math.sin(a) * 0.6, -a, Math.cos(a) * 0.6); g.add(l); }
  g.position.set(x, 0, z); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); level.group.add(g);
  level.colliders.push({ min: new THREE.Vector3(x - 0.45 * s, 0, z - 0.45 * s), max: new THREE.Vector3(x + 0.45 * s, 0.7 * s, z + 0.45 * s), ramp: null });
}
export function pendant(level, x, z, drop = 2.2) {
  const g = new THREE.Group(), h = level.h;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, drop, 6), stdMat(0x111111)); cord.position.y = h - drop / 2; g.add(cord);
  const shade2 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.6, 24, 1, true), stdMat(0x2a6f5c, { side: THREE.DoubleSide, roughness: 0.4, metalness: 0.3 })); shade2.position.y = h - drop - 0.1; g.add(shade2);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffe9b0 })); bulb.position.y = h - drop - 0.15; g.add(bulb);
  g.position.set(x, 0, z); level.group.add(g);
}
export function clock(level, wall, along, y, r = 0.8) {
  const f = wallFrame(level, wall), cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#fbf6e8'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 4;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; c.beginPath(); c.moveTo(64 + Math.sin(a) * 50, 64 - Math.cos(a) * 50); c.lineTo(64 + Math.sin(a) * 58, 64 - Math.cos(a) * 58); c.stroke(); }
  c.lineWidth = 6; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 28); c.stroke(); c.lineWidth = 4; c.beginPath(); c.moveTo(64, 64); c.lineTo(92, 74); c.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.06, r + 0.06, 0.08, 28), stdMat(0xc0392b, { roughness: 0.3 })); rim.rotation.x = Math.PI / 2; rim.position.set(along, y, 0.04); f.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ map: t })); face.position.set(along, y, 0.09); f.add(face);
}
export function tileBand(level, wall, along, y, w, h, tex) {
  const f = wallFrame(level, wall);
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 1.2, uv.getY(i) * h / 1.2);
  const m = new THREE.Mesh(g, tex); m.position.set(along, y, 0.03); m.receiveShadow = true; f.add(m);
}
