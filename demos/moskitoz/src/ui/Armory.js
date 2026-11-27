// Armurerie (spec §9, concept ui-mockups "armurerie"): loadout (Mains / Arme / Pouvoir), Menace and its multipliers,
// filterable item grid, item sheet with buy / equip / remove. Reads and writes the profile only through Profile.
import { ITEMS, SKINS, DEFAULT_SKIN, item, skinOf } from '../economy/Items.js';
import { Profile } from '../economy/Profile.js';
import { menace, menaceMods } from '../economy/Loadout.js';
import { bus } from '../core/core.js';
import { I } from './Icons.js';
import { fmtInt } from './format.js';
import { HandPreview, PREVIEW_POSES } from './HandPreview.js';

// display data (concept): tint, description, controls
const INFO = {
  raquette: ['#D8F1FF', 'Arc de mêlée électrique : électrocute et ralentit tout ce qu’il touche. Sa Grande Claque repousse tout ce qui est devant toi.', 'Clic : frappe en arc · Clic droit : Grande Claque (grandit, repousse et étourdit)'],
  brumi: ['#D6FBE8', 'Nuage toxique à 360° autour de toi. Les moustiques pris dedans sont empoisonnés.', 'Clic : nuage · recharge 4 s'],
  pieges: ['#FFF1C7', 'Disques collants posés au sol : les moustiques qui passent dessus restent englués.', 'Clic : poser un piège'],
  jumeaux: ['#EEFFCF', 'Deux pistolets : le jet vert ralentit, le jet jaune brûle, et les deux sur la même cible font des dégâts bonus.', 'Clic : tir alterné · Clic droit : double giclée'],
  aspi: ['#E9E0FF', 'Maintiens pour aspirer jusqu’à 5 petits moustiques, relâche pour tirer la boule qui explose.', 'Maintenir : aspirer · Relâcher : tirer'],
  tapette: ['#FFE0DC', 'Frappe verticale lente qui écrase les petits moustiques et envoie une onde au sol.', 'Clic : frappe écrasante'],
  citro: ['#FFF1C7', 'Bougies tirées en cloche : elles laissent des zones répulsives qui brûlent.', 'Clic : tir en cloche'],
  doigt: ['#EEFFCF', 'Charge 0,5 s puis tire une balle d’énergie perçante qui traverse toute une ligne de moustiques.', 'F : charger puis relâcher'],
  grappin: ['#FFE3EF', 'Ta main part en élastique : accroche un mur pour te balancer, ou ramène un moustique jusqu’à toi.', 'F : lancer · en l’air : balancier'],
  toile: ['#E4EEFF', 'Tu tires un jet de toile : le moustique touché est englué et assommé 2,5 s (les voisins aussi). Sur un mur, la toile te tire vers elle.', 'F : lancer la toile'],
  tourbillon: ['#D8F1FF', 'Une orbe spirale se forme dans ta paume : elle fore, aspire en vortex puis éclate.', 'F : pousser l’orbe'],
  clap: ['#FFF1C7', 'Clap puis frappe au sol : une onde radiale assomme tout ce qui vole bas.', 'F : clap + frappe'],
  mille: ['#F3F0FF', '1,5 s de claques ultra-rapides en cône, avec images rémanentes. Le combo explose.', 'F : rafale · recharge 12 s'],
  onde: ['#EEFFCF', 'Mains jointes, charge 1 s, puis un rayon large que tu balaies pendant 1,2 s.', 'F : charger · viser pour balayer'],
};
const KEY = { arme: 'weapon', pouvoir: 'power', mains: 'hands' }; // slot -> loadout key
const x2 = (x) => '×' + x.toFixed(2).replace('.', ',');
const stars = (n, max = 3, f = I.star) => `<span class="stars">${Array.from({ length: max }, (_, k) => f(k < n)).join('')}</span>`;
const small = (ico) => ico.replace('class="ico ', 'style="width:20px;height:20px" class="ico ');
const soon = (it) => (it.phase === 'v1' ? 'Arrive à la prochaine mise à jour.' : 'Arrive plus tard (arsenal v2).');

export class Armory {
  constructor(screens) { this.s = screens; this.filter = 'tout'; this.sel = 'raquette'; this.prev = null; this.pose = 'idle'; }
  open(back) { this.back = back; this.draw(); }
  /** Close the 3D preview (its WebGL context) when the Armory is left. */
  close() { if (this.prev) { this.prev.dispose(); this.prev = null; } }
  leave(f) { this.close(); f(); }
  draw(flash = null) {
    const scroll = (this.s.root.querySelector('.arm .grid') || {}).scrollTop || 0;
    const P = Profile.get(), lo = P.loadout, M = menace(lo), mm = menaceMods(M), it = item(this.sel), coins = P.coins;
    const own = (i) => P.owned.includes(i.id) || i.id === DEFAULT_SKIN, eqd = (i) => lo[KEY[i.slot]] === i.id, skin = it.slot === 'mains';
    const locked = (i) => i.plan && !own(i) && !P.plans.includes(i.id);
    const lslot = (label, id, ico, c, key) => `<div class="lslot" data-l="${key}"><span class="ic" style="--c:${c}">${ico}</span><span class="t"><small>${label}</small><b>${id ? item(id).name : 'Vide'}</b></span>${id ? (key === 'hands' ? `<span class="lbl">${small(I.check())}</span>` : stars(item(id).menace)) : `<span class="lbl">${small(I.lock())}</span>`}</div>`;
    const card = (i) => {
      const e = eqd(i), o = own(i), l = locked(i), pok = i.plan && !o && P.plans.includes(i.id);
      let foot;
      if (e) foot = '<span class="st eq">Équipé</span>';
      else if (o) foot = `<span class="st own">${I.check()}Possédé</span>`;
      else if (l) foot = `<span class="st plan">${I.plan()}Plan requis</span>`;
      else if (!i.live) foot = '<span class="st">Bientôt</span>';
      else foot = `<span class="st${pok ? ' planok' : coins < i.price ? ' poor' : ''}">${pok ? I.plan() : ''}${I.coin()}<span class="num">${fmtInt(i.price)}</span></span>`;
      const sk = i.slot === 'mains', tint = sk ? i.c.glove : INFO[i.id][0];
      return `<button class="item${e ? ' eq' : ''}${l || !i.live ? ' lock' : ''}${this.sel === i.id ? ' sel' : ''}" data-i="${i.id}"><span class="ic${sk ? ' skin' : ''}" style="--c:${tint}${sk ? `;--sl:${i.c.sleeve}` : ''}">${I[sk ? 'glove' : i.id]()}</span>${l ? `<span class="padlock">${I.lock()}</span>` : ''}<b>${i.name}</b>${sk ? '' : stars(i.menace)}${foot}</button>`;
    };
    const cur = lo[KEY[it.slot]], dM = it.menace - (cur && !skin ? item(cur).menace : 0);
    let act;
    if (eqd(it)) act = skin ? '<span class="st eq">Équipé</span><span class="hint">Tes amis te voient avec ces mains dans les salons.</span>' : `<button class="btn" data-unequip="${it.slot}">Retirer</button><span class="hint">${it.slot === 'arme' ? 'Sans arme, à mains nues : Menace plus basse.' : 'Libère le slot de pouvoir.'}</span>`;
    else if (own(it) && it.live) act = `<button class="btn primary" data-eq="${it.id}">Équiper</button>${skin ? '' : `<span class="hint">Menace ${dM > 0 ? '+' : ''}${dM}</span>`}`;
    else if (!it.live) act = `<button class="btn" disabled>Bientôt</button><span class="hint">${soon(it)}</span>`;
    else if (locked(it)) act = '<button class="btn" disabled>Plan requis</button><span class="hint">Trouve le plan dans un coffre à jouets, sur un étage de boss.</span>';
    else if (coins < it.price) act = `<button class="btn" disabled>${I.coin()}${fmtInt(it.price)}</button><span class="hint">Il te manque ${fmtInt(it.price - coins)} pièces. Le mode Chasse est fait pour ça.</span>`;
    else act = `<button class="btn gold" data-buy="${it.id}">${I.coin()}Acheter ${fmtInt(it.price)}</button>`;
    const tryBtn = it.live ? `<button class="btn try" data-try="${it.id}">Essayer</button>` : '';
    const list = this.filter === 'mains' ? SKINS : ITEMS.filter((i) => this.filter === 'tout' || i.slot === this.filter);
    const info = skin ? [null, 'Un look pour tes deux mains : gants, manche et liseré. Aucun effet sur le jeu.', 'Visible par tes amis dans les salons'] : INFO[it.id];
    const tint = skin ? it.c.glove : INFO[it.id][0];
    const poses = skin ? `<div class="poses" role="group" aria-label="Pose">${PREVIEW_POSES.map(([k, n]) => `<button data-pose="${k}" aria-pressed="${this.pose === k}">${n}</button>`).join('')}</div>` : '';
    const fiche = `<div class="stk fiche"><div class="fh"><h3>${it.name}</h3><span class="meta">${skin ? 'Mains' : it.slot === 'arme' ? 'Arme' : 'Pouvoir'}</span>${skin ? '' : stars(it.menace)}</div>
      <div class="prev${skin ? '' : ' flat'}" style="--c:${tint}">${skin ? '<span class="turn">Glisse pour tourner · molette : zoom · double-clic : recentrer</span>' : I[it.id]()}</div>${poses}
      <p>${info[1]}</p><span class="ctl">${info[2]}</span><div class="act">${act}${tryBtn}</div></div>`;
    const stage = this.s.show('arm', 'bg-arm', `<div class="arm">
      <div class="a-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Armurerie</h2>
        <p class="sub">Chaque objet puissant rend la tour plus dure… et multiplie ton score.</p>
        <div class="stk wallet${flash === 'buy' ? ' bump' : ''}">${I.coin()}<span class="num">${fmtInt(coins)}</span></div></div>
      <div class="a-left"><div class="stk a-panel"><h4>Ton équipement</h4><div class="lslots">
          ${lslot('Mains · skin', lo.hands, I.glove(), skinOf(lo.hands).c.glove, 'hands')}
          ${lslot('Arme · touche 2', lo.weapon, lo.weapon ? I[lo.weapon]() : I.glove(), lo.weapon ? INFO[lo.weapon][0] : '#FFFFFF', 'arme')}
          ${lslot('Pouvoir · touche F', lo.power, lo.power ? I[lo.power]() : I.lock(), lo.power ? INFO[lo.power][0] : '#FFFFFF', 'pouvoir')}</div></div>
        <div class="stk a-panel menace"><h4>Menace</h4><div class="row"><span class="disp mv-n num">${M}</span><span class="pips">${Array.from({ length: 6 }, (_, k) => I.mstar(k < M)).join('')}</span>${M === 0 ? '<span class="tag pur">Pur</span>' : ''}</div>
          <ul><li>Score <b>${x2(mm.score)}</b></li><li>PV des moustiques <b>${x2(mm.hp)}</b></li><li>Taille des vagues <b>${x2(mm.budget)}</b></li></ul></div>
        <button class="btn primary big cta" data-play>Lancer la Tour</button></div>
      <div class="a-right"><div class="top"><div class="seg" role="group" aria-label="Filtrer">${[['tout', 'Tout'], ['arme', 'Armes'], ['pouvoir', 'Pouvoirs'], ['mains', 'Mains']].map(([k, n]) => `<button data-f="${k}" aria-pressed="${this.filter === k}">${n}</button>`).join('')}</div>
        </div>
        <div class="grid">${list.map(card).join('')}</div>${fiche}</div></div>`, {
      '[data-back]': () => this.leave(this.back),
      '[data-play]': () => this.leave(() => this.s.g.startRun('tower')),
      '[data-try]': (b) => { const i = item(b.dataset.try), g = this.s.g, again = () => this.open(this.back); this.close(); g.tryItem(i.slot === 'mains' ? { skin: i.id } : i.slot === 'arme' ? { weapon: i.id } : { power: i.id }, again); },
      '[data-pose]': (b) => { this.pose = b.dataset.pose; if (this.prev) this.prev.pose(this.pose); b.parentNode.querySelectorAll('[data-pose]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); },
      '[data-f]': (b) => { this.filter = b.dataset.f; this.draw(); },
      '[data-i]': (b) => { this.sel = b.dataset.i; this.draw(); },
      '[data-eq]': (b) => this.equip(b.dataset.eq),
      '[data-unequip]': (b) => { Profile.equip(b.dataset.unequip, null); this.draw(); },
      '[data-buy]': (b) => { const i = item(b.dataset.buy); if (Profile.buy(i.id)) { this.s.g.audio.play('chest'); bus.emit('toast', { text: `${i.name} ajouté à ton arsenal`, kind: 'good' }); this.draw('buy'); } },
    }, () => this.leave(this.back));
    const grid = stage.querySelector('.grid'); if (grid) { grid.scrollTop = scroll; if (!scroll && this.sel) stage.querySelector(`[data-i="${this.sel}"]`)?.scrollIntoView({ block: 'nearest' }); }
    if (skin) { if (!this.prev) this.prev = new HandPreview(); this.prev.show(it, this.pose); this.prev.mount(stage.querySelector('.prev')); }
    stage.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('dblclick', () => { const i = item(b.dataset.i); if (Profile.get().owned.includes(i.id) && i.live) this.equip(i.id); }));
    if (flash && flash !== 'buy') stage.querySelector(`[data-l="${flash === 'mains' ? 'hands' : flash}"]`)?.classList.add('swap');
  }
  equip(id) { const i = item(id); Profile.equip(i.slot, id); this.draw(i.slot); }
}
