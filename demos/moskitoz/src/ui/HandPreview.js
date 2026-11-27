// Live 3D preview of a hand skin (Armory, spec 2026-10-04 §6): both gloves, turning slowly, in a pose you can change.
// One small WebGL canvas; the Armory remounts it after every redraw and disposes it when it closes.
import * as THREE from 'three';
import { makeGloves } from '../player/ViewModel.js';

export const PREVIEW_POSES = [['idle', 'Repos'], ['fist', 'Poing'], ['open', 'Ouvertes'], ['grab', 'Saisie']];
const W = 330, H = 250;

export class HandPreview {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); this.renderer.setClearColor(0x000000, 0); this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); this.renderer.setSize(W, H, false);
    this.dom = this.renderer.domElement; this.dom.className = 'hand-preview'; this.dom.style.width = '100%'; this.dom.style.height = '100%';
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(34, W / H, 0.05, 20); this.cam.position.set(0, 0.18, 0.72); this.cam.lookAt(0, 0.02, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9a94c8, 1.6));
    const sun = new THREE.DirectionalLight(0xfff6e6, 1.7); sun.position.set(1.5, 3, 3); this.scene.add(sun);
    this.gloves = makeGloves();
    for (const h of Object.values(this.gloves.hands)) { h.base.set(h.side * 0.17, 0, 0); h.s = 1.15; }
    this.grp = new THREE.Group(); this.grp.add(this.gloves.root); this.grp.position.z = -0.25; this.scene.add(this.grp);
    // drag to turn the hands to any angle (yaw all the way round, pitch up to straight above / below), wheel to zoom, double-click to reset
    this.yaw = Math.PI; this.pitch = -0.3; this.zoom = 0.72; this.free = false; this.drag = null;
    this.grp.rotation.order = 'YXZ'; this.dom.style.touchAction = 'none'; this.dom.style.cursor = 'grab';
    const d = this.dom;
    d.addEventListener('pointerdown', (e) => { this.drag = { x: e.clientX, y: e.clientY }; this.free = true; d.setPointerCapture(e.pointerId); d.style.cursor = 'grabbing'; });
    d.addEventListener('pointermove', (e) => { if (!this.drag) return; this.yaw += (e.clientX - this.drag.x) * 0.012; this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch + (e.clientY - this.drag.y) * 0.012)); this.drag = { x: e.clientX, y: e.clientY }; });
    const up = () => { this.drag = null; d.style.cursor = 'grab'; };
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
    d.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom = Math.max(0.42, Math.min(1.3, this.zoom * (e.deltaY > 0 ? 1.08 : 0.92))); }, { passive: false });
    d.addEventListener('dblclick', () => this.reset());
    this.t = 0; this.last = 0; this.dead = false; this.raf = requestAnimationFrame((n) => this.loop(n));
  }
  mount(el) { if (this.dom.parentNode !== el) el.appendChild(this.dom); }
  /** skin = an item of SKINS; pose = a name of ViewModel.POSES. */
  show(skin, pose = 'idle') { this.gloves.setSkin(skin); this.gloves.set(pose); }
  pose(name) { this.gloves.set(name); }
  /** Back to the front view with the slow automatic sway. */
  reset() { this.yaw = Math.PI; this.pitch = -0.3; this.zoom = 0.72; this.free = false; }
  loop(now) {
    if (this.dead) return; this.raf = requestAnimationFrame((n) => this.loop(n));
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now; this.t += dt;
    if (document.hidden || !this.dom.isConnected) return;
    this.grp.rotation.set(this.free ? this.pitch : -0.3, this.free ? this.yaw : Math.PI + Math.sin(this.t * 0.8) * 0.55, 0);
    this.cam.position.z += (this.zoom - this.cam.position.z) * Math.min(1, dt * 10);
    this.gloves.update(dt, this.t, { bob: 0 });
    this.renderer.render(this.scene, this.cam);
  }
  dispose() { this.dead = true; cancelAnimationFrame(this.raf); this.renderer.dispose(); this.renderer.forceContextLoss(); this.dom.remove(); }
}
