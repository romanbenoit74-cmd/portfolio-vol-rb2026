// 3D lobby (spec 2026-10-04 §6): every player is a pair of floating hands in their skin, a pseudo sticker above, emotes on demand.
// One small WebGL canvas of its own (the game canvas stays idle behind the menu). The scene outlives the room screen redraws:
// roomView() calls mount(el) + sync(room) each time, dispose() frees everything when the player leaves.
import * as THREE from 'three';
import { makeGloves } from '../player/ViewModel.js';
import { skinOf } from '../economy/Items.js';
import { layout, extent, emotePose, EMOTES } from './lobbyPose.js';

const H0 = 230, H_ROW = 120; // canvas height in CSS px: one row of players, plus a little more per extra row
const FACE = new THREE.Euler(-0.28, Math.PI, 0); // hands turned to the viewer, fingers tipped up a little

/** The pseudo as a sticker: white pill, ink outline, ♛ for the host, ✓ once ready. */
function label(text, host, ready) { return sticker((host ? '♛ ' : '') + text + (ready && !host ? ' ✓' : '')); }
/** A name sticker as a camera-facing sprite (also used in matches, src/player/RemotePlayers.js). */
export function sticker(s) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), f = '700 44px "Lilita One", "Nunito", sans-serif';
  x.font = f; const w = Math.ceil(x.measureText(s).width) + 44; c.width = w; c.height = 76;
  x.font = f; x.textBaseline = 'middle'; x.textAlign = 'center';
  x.fillStyle = '#FFFFFF'; x.strokeStyle = '#2A2045'; x.lineWidth = 7;
  x.beginPath(); x.roundRect(4, 4, w - 8, 68, 30); x.fill(); x.stroke();
  x.fillStyle = '#2A2045'; x.fillText(s, w / 2, 40);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  const k = Math.min(1, 0.82 / (w / 76 * 0.2)); // a long pseudo shrinks instead of overlapping its neighbour
  sp.scale.set(w / 76 * 0.2 * k, 0.2 * k, 1); sp.renderOrder = 5; sp.userData.key = s;
  return sp;
}
export const freeSprite = (sp) => { if (sp) { sp.material.map.dispose(); sp.material.dispose(); } };

export class LobbyScene {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0); this.renderer.toneMapping = THREE.NoToneMapping;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(14, 2, 0.1, 80); // long lens: the sleeves stay behind their own hands instead of fanning out sideways
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9a94c8, 1.6));
    const sun = new THREE.DirectionalLight(0xfff6e6, 1.7); sun.position.set(1.5, 3, 3); this.scene.add(sun);
    this.dom = this.renderer.domElement; this.dom.className = 'lobby-canvas';
    this.ent = new Map(); // player id -> { g, gloves, name, skin, emote }
    this.n = 0; this.H = H0; this.t = 0; this.last = 0; this.raf = 0; this.dead = false; this.w = 0;
    this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
  }
  /** Put the canvas in the (freshly rendered) stage element. */
  mount(el) { if (this.dom.parentNode !== el) el.appendChild(this.dom); this.resize(el.clientWidth || 520); }
  resize(w) {
    if (w === this.w) return; this.w = w;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); this.renderer.setSize(w, this.H, false);
    this.dom.style.width = w + 'px'; this.dom.style.height = this.H + 'px'; this.cam.aspect = w / this.H; this.frame();
  }
  /** Camera that keeps the whole group in view whatever the player count. */
  frame() {
    const e = extent(Math.max(1, this.n)), fov = this.cam.fov * Math.PI / 180, hw = e.w / 2 + 0.2;
    const dist = Math.max(hw / (Math.tan(fov / 2) * this.cam.aspect), (e.h + 0.3) / (2 * Math.tan(fov / 2))) + 0.4;
    this.cam.position.set(0, 0.2 + dist * 0.07 + e.d * 0.5, dist); this.cam.lookAt(0, 0.1 + (e.h - 1.1) * 0.5, -e.d * 0.45); this.cam.updateProjectionMatrix();
  }

  /** room = RoomClient.room: players (id -> { name, ready, loadout }), host, you. */
  sync(room) {
    const list = [...room.players.values()];
    for (const [id, en] of this.ent) if (!room.players.has(id)) { this.scene.remove(en.g); freeSprite(en.name); this.ent.delete(id); } // glove geometry and materials are shared with the game: keep them
    const spots = layout(list.length);
    list.forEach((p, i) => {
      let en = this.ent.get(p.id);
      if (!en) {
        const g = new THREE.Group(), gloves = makeGloves();
        for (const h of Object.values(gloves.hands)) { h.base.set(h.side * 0.17, 0, 0); h.s = 0.9; }
        // seen head-on, so the depth is flattened (z 0.5): the sleeves stay tucked behind the hands
        const hands = new THREE.Group(); hands.rotation.copy(FACE); hands.scale.set(1.5, 1.5, 0.5); hands.add(gloves.root); g.add(hands);
        en = { g, gloves, hands, name: null, skin: null, emote: null, phase: Math.random() * 6 }; this.ent.set(p.id, en); this.scene.add(g);
      }
      const sk = skinOf(p.loadout && p.loadout.hands).id;
      if (en.skin !== sk) { en.skin = sk; en.gloves.setSkin(skinOf(sk)); }
      const key = (p.id === room.host ? '♛ ' : '') + p.name + (p.ready && p.id !== room.host ? ' ✓' : '');
      if (!en.name || en.name.userData.key !== key) {
        if (en.name) { en.g.remove(en.name); freeSprite(en.name); }
        en.name = label(p.name, p.id === room.host, p.ready); en.name.position.set(0, 0.46, 0); en.g.add(en.name);
      }
      const sp = spots[i]; en.y0 = sp.y; en.g.position.set(sp.x, sp.y, sp.z);
    });
    if (list.length !== this.n) {
      this.n = list.length; this.H = H0 + (Math.ceil(Math.max(1, this.n) / 6) - 1) * H_ROW;
      if (this.w) { const w = this.w; this.w = 0; this.resize(w); } else this.frame();
    }
  }
  /** A player does an emote (from the server relay). */
  emote(id, kind) { const en = this.ent.get(id); if (en && Object.hasOwn(EMOTES, kind)) en.emote = { kind, t0: this.t }; }

  loop(now) {
    if (this.dead) return; this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now; this.t += dt;
    if (document.hidden || !this.dom.isConnected) return; // nothing to draw while the screen is elsewhere
    for (const en of this.ent.values()) {
      let o = emotePose();
      if (en.emote) { const k = (this.t - en.emote.t0) / EMOTES[en.emote.kind].dur; if (k >= 1) en.emote = null; else o = emotePose(en.emote.kind, k); }
      for (const side of ['L', 'R']) {
        const h = en.gloves.hands[side], p = o[side];
        h.off.set(...p.off); h.rot.set(...p.rot);
        if (h.pose !== p.pose) en.gloves.set(p.pose, side);
      }
      en.gloves.update(dt, this.t + en.phase, { bob: 0 });
      en.g.position.y = en.y0 + Math.sin(this.t * 1.7 + en.phase) * 0.012; // gentle float
    }
    this.renderer.render(this.scene, this.cam);
  }
  dispose() {
    this.dead = true; cancelAnimationFrame(this.raf);
    for (const en of this.ent.values()) freeSprite(en.name);
    this.ent.clear(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.dom.remove();
  }
}
