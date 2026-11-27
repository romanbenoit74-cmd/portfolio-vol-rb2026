// The loot chests of a match, in the world: toy chests that open when you press [G] (pad: R3 / Back) next to them. A closed chest shows a
// "?"; once opened it shows what it holds, and [G] again swaps it with the weapon (or hand power) you carry in that slot, so the chest then
// holds yours. Opening and swaps are broadcast (`chest` events) so every player sees the same chests.
import * as THREE from 'three';
import { contactShadow, flat, gomme, part, put, rbox } from '../render/Style.js';
import { SIGNAL } from '../level/Biomes.js';
import { item } from '../economy/Items.js';
import { sticker, freeSprite } from '../ui/LobbyScene.js';
import { lootPlan, nearestChest, CHEST_RANGE } from './Loot.js';
import { bus } from '../core/core.js';

const INK = SIGNAL.ink;
const nameOf = (id) => (id ? item(id).name : 'vide');

export class LootChests {
  /** hooks: { send(evt, data) } to broadcast, `game` for the player / run / audio. */
  constructor(game, level, seed, count, hooks) {
    this.g = game; this.hooks = hooks; this.level = level; this.list = []; this.t = 0; this.near = null;
    const plan = lootPlan(seed, count, level.w, level.d, (x, z) => level.isFree(x, 0.6, z, 1.1));
    this.mats = [gomme('#9B6BFF', { rim: 0.2, ao: 1 }), gomme(SIGNAL.gold, { rim: 0.4, ao: 1 }), gomme('#FFFFFF', { ao: 1 })];
    for (const c of plan) this.list.push(this.build(c));
    this.el = document.createElement('div'); this.el.className = 'loot-prompt'; this.el.hidden = true; document.body.appendChild(this.el);
  }
  build(c) {
    const [violet, gold, white] = this.mats, root = new THREE.Group(), P = (gm, m, px = 2.2) => part(gm, m, { ink: INK, px });
    put(root, P(rbox(1.5, 0.85, 1.0, 0.14), violet), 0, 0.45, 0);
    for (const x of [-0.5, 0.5]) put(root, P(rbox(0.14, 0.86, 1.06, 0.05), gold, 1.8), x, 0.46, 0);
    put(root, P(rbox(0.3, 0.3, 0.1, 0.05), white, 1.6), 0, 0.5, 0.52);
    const glow = put(root, new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), flat('#FFE27A', { transparent: true, opacity: 0, depthWrite: false })), 0, 0.88, 0, -Math.PI / 2);
    const hinge = new THREE.Group(); put(root, hinge, 0, 0.88, -0.5);
    put(hinge, P(rbox(1.6, 0.3, 1.1, 0.14), violet), 0, 0.12, 0.5);
    put(hinge, P(rbox(0.26, 0.24, 0.1, 0.05), gold, 1.8), 0, 0.02, 1.06);
    put(root, contactShadow(1.05, 0.25, INK), 0, 0.01, 0);
    root.position.set(c.x, 0, c.z); root.rotation.y = Math.atan2(-c.x, -c.z); this.g.scene.add(root);
    const e = { i: c.i, x: c.x, z: c.z, item: c.item, opened: false, k: 0, root, hinge, glow, tag: null, tagText: '' };
    this.label(e); return e;
  }
  label(e) {
    const text = e.opened ? nameOf(e.item) : '? ? ?'; if (e.tagText === text) return;
    if (e.tag) { e.root.remove(e.tag); freeSprite(e.tag); }
    e.tag = sticker(text); e.tag.scale.multiplyScalar(2.6); e.tag.position.y = 1.9; e.root.add(e.tag); e.tagText = text;
  }

  // ---- network: another player opened / swapped a chest ----
  onEvent(d) {
    const e = this.list.find((c) => c.i === d.i); if (!e) return;
    if (d.a === 'open') e.opened = true;
    if (d.a === 'swap') { e.opened = true; e.item = typeof d.it === 'string' && item(d.it) ? d.it : null; }
    this.label(e);
  }

  // ---- me: [G] ----
  interact() {
    const g = this.g, p = g.player; if (!g.live || p.dead || !this.near) return;
    const e = this.near, a = g.audio;
    if (!e.opened) { e.opened = true; a.play('chest'); this.hooks.send('chest', { i: e.i, a: 'open' }); this.label(e); return; }
    if (!e.item) return;
    const got = e.item, prev = g.equipLoot(got); e.item = prev || null;
    a.play('levelup', 0.8); this.hooks.send('chest', { i: e.i, a: 'swap', it: e.item || '' }); this.label(e);
    bus.emit('toast', { text: `${nameOf(got)} équipé${prev ? ` · ${nameOf(prev)} reste dans le coffre` : ''}`, kind: 'good' });
  }
  /** Slot the chest's content would replace, for the prompt. */
  slotName(id) { return item(id).slot === 'arme' ? 'ton arme' : 'ton pouvoir'; }

  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    for (const e of this.list) {
      if (e.opened && e.k < 1) { e.k = Math.min(1, e.k + dt / 0.5); e.hinge.rotation.x = -e.k * 1.9; e.glow.material.opacity = e.k * 0.85; }
      if (e.tag) e.tag.position.y = 1.9 + Math.sin(this.t * 2 + e.i) * 0.06;
    }
    const near = g.live && !p.dead ? nearestChest(this.list, p.pos.x, p.pos.z, CHEST_RANGE) : null;
    this.near = near;
    const tap = !!g.touch; // phone: the OUVRIR / PRENDRE button replaces [G]
    const text = !near ? '' : !near.opened ? (tap ? 'Coffre' : 'G · Ouvrir le coffre') : near.item ? (tap ? `${nameOf(near.item)} (remplace ${this.slotName(near.item)})` : `G · Prendre ${nameOf(near.item)} (remplace ${this.slotName(near.item)})`) : 'Coffre vide';
    if (text !== this.shown) { this.shown = text; this.el.hidden = !text; this.el.textContent = text; }
  }
  dispose() {
    for (const e of this.list) { e.root.removeFromParent(); freeSprite(e.tag); e.glow.material.dispose(); e.glow.geometry.dispose(); }
    this.mats.forEach((m) => m.dispose()); this.el.remove(); this.list.length = 0;
  }
}
