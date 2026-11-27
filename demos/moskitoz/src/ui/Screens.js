// Full-screen UI in the sticker language (spec §4): menu with mode cards, leaderboards, controls, pause, settings (Jeu /
// Audio / Touches) and end of run. Every screen is laid out on a fixed 1280x720 stage scaled to the window (--s), like the
// concept mockups, so no text is ever cut at any 16:9 size. The UI only reads the game state and calls game intents.
import { MODES, dayKey, floorInfo, floorLabel, nextUnlock } from '../tower/Tower.js';
import { ITEMS } from '../economy/Items.js';
import { TYPES } from '../enemies/Mosquito.js';
import { LB } from '../tower/Leaderboard.js';
import { ACTIONS, Settings } from '../core/Settings.js';
import { PRESETS, PRESET_IDS } from '../audio/MosquitoPatch.js';
import { I } from './Icons.js';
import { fmtInt, fmtTime } from './format.js';
import { Iris, roll } from './Transitions.js';
import { Profile } from '../economy/Profile.js';
import { dailyLoadout } from '../economy/Loadout.js';
import { item } from '../economy/Items.js';
import { BIOMES } from '../level/Biomes.js';
import { Armory } from './Armory.js';
import { Account } from '../net/Account.js';
import { accountScreen, STATUS_TEXT } from './AccountScreen.js';
import { multiScreen, takeInvite } from './LobbyScreen.js';

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const mBadge = (m) => (m == null ? '—' : m === 0 ? 'Pur' : 'M' + m); // spec §9: Menace, « Pur » at 0
const small = (ico) => ico.replace('class="ico ', 'style="width:18px;height:18px" class="ico ');
const TIPS = {
  kamikaze: 'Ils explosent au contact : reculez, dashez ou frappez de loin.', spitter: 'Bougez sans cesse : leurs crachats se voient venir.', heavy: 'Lents mais brutaux : frappez puis reculez.',
  speedbug: 'Rapides : frappez au moment où ils foncent.', tyrant: 'Boss : dashez entre ses attaques, gardez de la hauteur.', swarmling: 'Essaim : adossez-vous à un mur, utilisez le clap.',
  shield: 'Frappez-le dans le dos ou avec la raquette.', healer: 'Tuez le soigneur en priorité.', splitter: 'Il se divise : gardez de la place.', mosquito: 'Ne restez pas immobile au corps à corps.',
};
const PRESET_DESC = {
  doux: 'Filtre adouci, −6 dB : on entend arriver les moustiques sans fatigue. Réglage par défaut.',
  realiste: 'Aigu fin et nerveux, fidèle au vrai moustique. Pour les puristes.',
  cartoon: 'Vibrato exagéré, Doppler ×2 et grosse montée avant chaque piqûre.',
  coupe: 'Plus aucun bourdonnement. Les attaques restent visibles à l’écran.',
};
const QUALITY = [['Basse', 'Sans antialiasing, pour les petites machines.'], ['Moyenne', 'Antialiasing ×4 : le bon réglage pour la plupart des PC.'], ['Haute', 'Plus le halo des lumières vives (lave, acide, ultra).']];

export class Screens {
  constructor(game, hud) {
    this.g = game; this.hud = hud; this.root = document.getElementById('screen'); this.kind = null; this.lbMode = 'tower'; this.lbCat = 'depth'; this.setTab = 'jeu'; this.armory = new Armory(this);
    addEventListener('keydown', (e) => this.key(e));
    Account.onChange((s) => { const dot = this.root.querySelector('.m-sync'); if (dot) { dot.dataset.s = s; dot.title = STATUS_TEXT[s]; } }); // live sync badge on the menu
  }
  key(e) {
    if (!this.kind || e.repeat) return;
    const typing = document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text';
    if (e.code === 'Enter' && !typing) {
      if (this.kind === 'menu') this.go(() => this.g.startRun('tower'));
      else if (this.kind === 'home') this.go(() => this.solo());
      else if (this.kind === 'end' && this.retry) this.go(this.retry);
      else if (this.kind === 'pause') this.go(() => this.g.resume());
    } else if (e.code === 'Escape' && this.back) { e.preventDefault(); this.go(this.back); }
  }
  go(fn) { this.g.audio.init(); this.g.audio.play('ui'); fn(); }
  // one screen: backdrop + scaled stage; binds = { selector: (el, event) => … } on click
  show(kind, bg, html, binds = {}, back = null) {
    if (this.capOff) this.capOff();
    const fresh = this.kind !== kind; this.kind = kind; this.back = back; this.retry = null;
    this.root.innerHTML = `<div class="bg ${bg}"></div><div class="stage${fresh ? ' in' : ''}">${html}</div>`;
    this.root.classList.remove('hidden');
    for (const [sel, fn] of Object.entries(binds)) this.root.querySelectorAll(sel).forEach((b) => b.addEventListener('click', (ev) => this.go(() => fn(b, ev))));
    return this.root.querySelector('.stage');
  }
  hide() { if (this.capOff) this.capOff(); this.kind = null; this.back = null; this.retry = null; this.root.classList.add('hidden'); this.root.innerHTML = ''; }

  keysHelp() {
    if (this.g.touch) {
      const rows = [['Joystick', 'se déplacer'], ['Double tap joystick', 'dash en l’air · roulade au sol'], ['Glisser à droite', 'viser'], ['FRAPPE', 'claque → poing → CLAP · maintenir : power punch'], ['SAUT', 'saut · ×2 double saut · au mur : saut mural'],
        ['POUVOIR', 'pouvoir des mains'], ['OUVRIR', 'coffre de butin à proximité']];
      return `<div class="keys-help">${rows.map(([k, t]) => `<div><span class="kc">${esc(k)}</span>${esc(t)}</div>`).join('')}</div>`;
    }
    const K = (a) => Settings.label(Settings.binds[a][0]);
    const rows = [[`${K('forward')} ${K('left')} ${K('back')} ${K('right')}`, 'se déplacer'], [K('jump'), 'saut · ×2 double saut · au mur : saut mural'], [K('sprint'), 'sprint · en l’air : dash'],
      [K('crouch'), 's’accroupir · en sprint : roulade'], ['Clic', 'claque → poing → CLAP à deux mains'], ['Clic droit', 'pichenette, longue portée'], ['Maintenir', 'power punch (débloqué en route)'],
      [`${K('w1')} / ${K('w2')}`, 'mains / arme · molette'], [K('power'), 'pouvoir des mains'], [K('invuln'), 'invulnérabilité'], [K('ultra'), 'ultra'], ['Échap', 'pause'], ['Retomber', 'sur un moustique : écrasement']];
    return `<div class="keys-help">${rows.map(([k, t]) => `<div><span class="kc">${esc(k)}</span>${esc(t)}</div>`).join('')}</div>`;
  }

  // ---------------------------------------------------------------- menu
  // first launch: a single field, the pseudo is the whole "account" (kept in localStorage, used by the leaderboards)
  welcome() {
    const st = this.show('welcome', 'bg-menu', `<div class="m-logo"><span class="disp word">moski<em>TOZ</em></span><span class="tag">La Tour · 100 étages · une seule vie</span></div>
      <div class="stk w-card"><span class="av">${I.glove()}</span><h2 class="disp">Crée ton profil</h2><p>Choisis un pseudo : il apparaîtra dans les classements.</p>
        <input id="pseudo" maxlength="14" autocomplete="off" spellcheck="false" placeholder="Ton pseudo" aria-label="Pseudo"><span class="err" id="pseudo-err" aria-live="polite"></span>
        <button class="btn primary" data-ok>C’est parti</button><button class="btn" data-acc>J’ai déjà un compte</button></div>`, { '[data-acc]': () => this.account(() => this.menu()) });
    const inp = st.querySelector('#pseudo'), err = st.querySelector('#pseudo-err');
    const ok = () => { const v = inp.value.trim().slice(0, 14); if (v.length < 2) { err.textContent = '2 caractères minimum.'; inp.focus(); return; } LB.setName(v); this.go(() => this.menu()); };
    st.querySelector('[data-ok]').addEventListener('click', ok);
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); });
    setTimeout(() => inp.focus(), 50);
  }
  // home: two doors, Solo (the tower modes) and Multi (modes with friends, then the room)
  menu() {
    if (!LB.hasName()) return this.welcome();
    const card = (id, c, ico, title, desc, foot, sel) => `<button class="mode${sel ? ' sel' : ''}" data-${id} style="--c:${c}"><span class="hd">${ico}</span><span class="bd"><span class="h3">${title}</span><span class="p">${desc}</span><span class="rec">${foot}</span></span>${sel ? '<span class="kcorner kc dark">Entrée</span>' : ''}</button>`;
    const best = LB.best('tower');
    this.show('home', 'bg-menu', `<div class="m-logo"><span class="disp word">moski<em>TOZ</em></span><span class="tag">La Tour · 100 étages · une seule vie</span></div>
      <div class="m-bug">${I.mosq('#5A6F9C')}</div>
      <button class="stk m-profile" data-acc aria-label="Compte" title="Compte et synchronisation"><span class="av">${I.glove()}</span><span><b>${esc(LB.name())}<i class="m-sync" data-s="${Account.status}" title="${STATUS_TEXT[Account.status]}"></i></b><span class="bal">${I.coin()}<span class="num">${fmtInt(Profile.get().coins)}</span></span></span></button>
      <div class="m-modes two">
        ${card('solo', '#B8F53A', I.tower(), 'Solo', 'La Tour, le Sprint, le Défi du jour et la Chasse : toi contre les moustiques.', `${I.trophy()}${best ? 'Record : ' + plural(best.cleared, 'étage') : 'Pas encore de record'}`, true)}
        ${card('multi', '#4FC3FF', I.target(), 'Multi', 'Coop, Arène ou Battle Royale : choisis le mode, crée ton salon, invite tes amis.', `${I.glove()}2 à 16 joueurs`)}
      </div>
      <div class="m-foot"><button class="btn gold" data-arm>${I.jumeaux()}Armurerie</button>
        <button class="btn" data-lb>${I.trophy()}Classements</button><button class="btn" data-set>${I.gear()}Réglages</button>
        <button class="btn icon" data-help aria-label="Commandes" title="Commandes">${I.mouse()}</button><button class="btn icon" data-dev aria-label="Mode développeur" title="Mode développeur">${I.lock()}</button>
        <span class="hint">Même tour pour tout le monde : mêmes étages, mêmes moustiques, mêmes déblocages.</span></div>`,
    { '[data-solo]': () => this.solo(), '[data-multi]': () => this.multi(() => this.menu()), '[data-arm]': () => this.armory.open(() => this.menu()), '[data-lb]': () => this.leaderboards(() => this.menu()), '[data-acc]': () => this.account(() => this.menu()), '[data-set]': () => this.settings(() => this.menu()), '[data-help]': () => this.help(() => this.menu()), '[data-dev]': () => (this.devOk ? this.devPanel() : this.devLock()) });
    const invited = takeInvite(); if (invited && Account.user) setTimeout(() => this.multi(() => this.menu(), invited), 0); // arrived through a ?room=CODE link
  }
  solo() {
    const day = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const dl = dailyLoadout(dayKey()), chip = (id) => `<span class="lo-chip">${I[id]()}${item(id).name}</span>`;
    const hunts = Object.values(Profile.get().stats.hunt), hrec = hunts.length ? `Record : vague ${Math.max(...hunts)}` : 'Pas encore de record';
    const rec = (id, label) => { const b = LB.best(id); return b ? `${label} : ${plural(b.cleared, 'étage')}` : 'Pas encore de record'; };
    const mode = (id, c, ico, title, desc, r, sel, soon) => `<button class="mode${sel ? ' sel' : ''}"${soon ? ' disabled' : ` data-mode="${id}"`} style="--c:${c}">${soon ? '<span class="soon">Bientôt</span>' : ''}
      <span class="hd">${ico}</span><span class="bd"><span class="h3">${title}</span><span class="p">${desc}</span>${id === 'daily' ? `<span class="lo-chips">${chip(dl.weapon)}${dl.power ? chip(dl.power) : ''}</span>` : ''}<span class="rec">${I.trophy()}${r}</span></span>${sel ? '<span class="kcorner kc dark">Entrée</span>' : ''}</button>`;
    this.show('menu', 'bg-menu', `<div class="m-logo"><span class="disp word">moski<em>TOZ</em></span><span class="tag">La Tour · 100 étages · une seule vie</span></div>
      <div class="m-bug">${I.mosq('#5A6F9C')}</div>
      <button class="stk m-profile" data-acc aria-label="Compte" title="Compte et synchronisation"><span class="av">${I.glove()}</span><span><b>${esc(LB.name())}<i class="m-sync" data-s="${Account.status}" title="${STATUS_TEXT[Account.status]}"></i></b><span class="bal">${I.coin()}<span class="num">${fmtInt(Profile.get().coins)}</span></span></span></button>
      <div class="s-head m-back"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Solo</h2></div>
      <div class="m-modes">
        ${mode('tower', '#B8F53A', I.tower(), MODES.tower.name, '100 étages · environ 70 min · un boss tous les 10 étages', rec('tower', 'Record'), true)}
        ${mode('sprint', '#4FC3FF', I.stopwatch(), MODES.sprint.name, '25 étages · environ 20 min · pour un run rapide', rec('sprint', 'Record'))}
        ${mode('daily', '#FF5B4A', I.calendar(day.slice(0, 2)), MODES.daily.name, `10 étages · très dur · ${day} · même tour et même arme pour tout le monde`, rec('daily', 'Record du jour'))}
        ${mode('hunt', '#FFC62E', I.target(), 'Chasse', 'Vagues infinies dans un biome déjà atteint : farme tes pièces et teste ton arsenal.', hrec)}
      </div>
      <div class="m-foot"><button class="btn gold" data-arm>${I.jumeaux()}Armurerie</button>
        <button class="btn" data-lb>${I.trophy()}Classements</button><button class="btn" data-set>${I.gear()}Réglages</button>
        <button class="btn icon" data-help aria-label="Commandes" title="Commandes">${I.mouse()}</button><button class="btn icon" data-dev aria-label="Mode développeur" title="Mode développeur">${I.lock()}</button>
        <span class="hint">Même tour pour tout le monde : mêmes étages, mêmes moustiques, mêmes déblocages.</span></div>`,
    { '[data-mode]': (b) => (b.dataset.mode === 'hunt' ? this.hunt(() => this.solo()) : this.g.startRun(b.dataset.mode)), '[data-arm]': () => this.armory.open(() => this.solo()), '[data-lb]': () => this.leaderboards(() => this.solo()), '[data-back]': () => this.menu(), '[data-acc]': () => this.account(() => this.solo()), '[data-set]': () => this.settings(() => this.solo()), '[data-help]': () => this.help(() => this.solo()), '[data-dev]': () => (this.devOk ? this.devPanel() : this.devLock()) }, () => this.menu());
  }
  account(back) { accountScreen(this, back); }
  multi(back, code = null) { multiScreen(this, back, code); }
  // ---------------------------------------------------------------- developer mode (password-gated; local convenience, not security)
  devLock() {
    const st = this.show('devlock', 'bg-set', `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Développeur</h2></div>
      <div class="stk w-card"><span class="av">${I.lock()}</span><h2 class="disp">Mot de passe</h2><p>Accès réservé : choisir l'étage, tester toutes les armes et tous les pouvoirs.</p>
        <input id="dvpw" type="password" maxlength="24" autocomplete="off" aria-label="Mot de passe"><span class="err" id="dvpw-err" aria-live="polite"></span>
        <button class="btn primary" data-ok>Entrer</button></div>`, { '[data-back]': () => this.menu() }, () => this.menu());
    const inp = st.querySelector('#dvpw'), err = st.querySelector('#dvpw-err');
    const ok = () => { if (inp.value === '123456789') { this.devOk = true; this.go(() => this.devPanel()); } else { err.textContent = 'Mot de passe incorrect.'; inp.select(); } };
    st.querySelector('[data-ok]').addEventListener('click', ok);
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); else if (e.key === 'Escape') this.menu(); });
    setTimeout(() => inp.focus(), 50);
  }
  devPanel() {
    const dv = (this.dv ||= { n: 99, weapon: 'jumeaux', power: 'doigt', god: true, calm: false });
    // first floor of each biome in the tower (themeIdx 1..20), as displayed on the HUD (99 = top)
    const first = {}; for (let i = 0; i < MODES.tower.n; i++) { const t = floorInfo(MODES.tower, i).themeIdx; if (!(t in first)) first[t] = i; }
    const bcard = (b, k) => { const fl = 99 - first[k + 1]; return `<button class="dv-b" data-fl="${fl}" style="--w:${b.wall};--f:${b.floor};--a:${b.accent}"><span class="sw"></span><b>${b.name}</b><span class="r">étage ${fl}</span></button>`; };
    const seg = (key, list, cur) => `<div class="seg" role="group" data-k="${key}"><button data-v="" aria-pressed="${cur === null}">Aucun</button>${list.map((x) => `<button data-v="${x.id}" aria-pressed="${cur === x.id}">${x.name}</button>`).join('')}</div>`;
    const tog = (key, label, on) => `<button class="btn dv-t" data-t="${key}" aria-pressed="${on}">${label}</button>`;
    const st = this.show('dev', 'bg-lb', `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Développeur</h2><p class="sub">Choisis un biome ou un étage, une arme et un pouvoir. Rien n'est enregistré (ni score, ni pièces, ni biomes).</p></div>
      <div class="dv-grid">${BIOMES.map(bcard).join('')}</div>
      <div class="dv-ctl">
        <div class="dv-row"><span class="lbl">Étage</span><input id="dvn" type="number" min="0" max="99" value="${dv.n}"><input id="dvr" type="range" min="0" max="99" value="${dv.n}"><span class="note">99 = haut de la tour, 0 = rez-de-chaussée</span></div>
        <div class="dv-row"><span class="lbl">Arme</span>${seg('weapon', ITEMS.filter((x) => x.slot === 'arme'), dv.weapon)}</div>
        <div class="dv-row"><span class="lbl">Pouvoir</span>${seg('power', ITEMS.filter((x) => x.slot === 'pouvoir'), dv.power)}</div>
        <div class="dv-row"><span class="lbl">Options</span>${tog('god', 'Invincible', dv.god)}${tog('calm', 'Sans moustiques', dv.calm)}<span class="note">En jeu : ← → arme · ↑ ↓ pouvoir · Pg↑ Pg↓ étage</span></div>
      </div>
      <div class="s-foot"><button class="btn primary big" data-go>Y aller</button></div>`, { '[data-back]': () => this.menu(), '[data-go]': () => this.g.startRun('tower', { dev: { i: 99 - dv.n, weapon: dv.weapon, power: dv.power, god: dv.god, calm: dv.calm } }) }, () => this.menu());
    const n = st.querySelector('#dvn'), r = st.querySelector('#dvr');
    const setN = (v) => { dv.n = Math.max(0, Math.min(99, Math.round(+v) || 0)); n.value = r.value = dv.n; };
    n.addEventListener('input', () => setN(n.value)); r.addEventListener('input', () => setN(r.value));
    n.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') st.querySelector('[data-go]').click(); });
    st.querySelectorAll('.dv-b').forEach((b) => b.addEventListener('click', () => { setN(b.dataset.fl); this.g.audio.play('ui'); }));
    st.querySelectorAll('.seg[data-k] button').forEach((b) => b.addEventListener('click', () => { const g = b.parentElement; dv[g.dataset.k] = b.dataset.v || null; g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); this.g.audio.play('ui'); }));
    st.querySelectorAll('.dv-t').forEach((b) => b.addEventListener('click', () => { dv[b.dataset.t] = !dv[b.dataset.t]; b.setAttribute('aria-pressed', dv[b.dataset.t]); this.g.audio.play('ui'); }));
  }

  // Chasse: pick a biome already reached in the tower (spec §9); each shows its local wave record
  hunt(back) {
    const P = Profile.get(), top = P.stats.biome;
    const card = (b, k) => {
      const n = k + 1, open = n <= top, r = P.stats.hunt[n];
      return `<button class="hb${open ? '' : ' lock'}"${open ? ` data-b="${n}"` : ' disabled'} style="--w:${b.wall};--f:${b.floor};--a:${b.accent}"><span class="sw"></span><b>${open ? b.name : '???'}</b><span class="r">${open ? (r ? `Vague ${r}` : 'Aucun record') : small(I.lock()) + 'À atteindre'}</span></button>`;
    };
    this.show('hunt', 'bg-lb', `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Chasse</h2><p class="sub">Vagues infinies dans un biome déjà atteint. Pièces normales, record local, pouvoir des mains toujours actif.</p></div>
      <div class="hunt-grid">${BIOMES.map(card).join('')}</div>
      <div class="s-foot"><button class="btn gold" data-arm>${I.jumeaux()}Armurerie</button><span class="note">Atteins de nouveaux biomes dans la Tour ou le Sprint pour les ouvrir ici.</span></div>`,
    { '[data-back]': back, '[data-b]': (b) => this.g.startRun('hunt', { biome: +b.dataset.b }), '[data-arm]': () => this.armory.open(() => this.hunt(back)) }, back);
  }
  help(back) {
    this.show('help', 'bg-set', `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Commandes</h2></div>
      <div class="stk h-card">${this.keysHelp()}<p>Les touches se changent dans Réglages → Touches. Les zones vertes au sol soignent.</p></div>
      <div class="s-foot"><button class="btn primary" data-back>Retour</button></div>`, { '[data-back]': back }, back);
  }

  // ---------------------------------------------------------------- leaderboards
  leaderboards(back, me = null) {
    const heads = { depth: 'Étage atteint (puis temps)', score: 'Meilleur score', time: 'Tour terminée le plus vite' };
    const rkey = this.lbMode + '|' + this.lbCat, online = !!LB.remote[rkey], rows = online ? LB.remote[rkey] : LB.top(this.lbMode, this.lbCat);
    const table = rows.length ? rows.map((r, i) => `<tr class="${(me && r.id === me) || r.me ? 'me' : ''}"><td class="n">${i + 1}</td><td>${esc(r.name)}</td><td class="n">${r.cleared}</td><td class="n">${fmtInt(r.score)}</td><td class="n">${fmtTime(r.time)}</td><td class="n">${mBadge(r.menace)}</td><td>${r.result === 'victory' ? I.trophy().replace('class="ico ', 'style="width:22px;height:22px" class="ico ') : ''}</td></tr>`).join('')
      : `<tr><td colspan="7" class="empty">Aucune partie enregistrée${this.lbCat === 'time' ? ' (seules les tours terminées comptent)' : ''}.</td></tr>`;
    const redraw = () => this.leaderboards(back, me);
    LB.fetchTop(this.lbMode, this.lbCat).then((fresh) => { if (fresh && this.kind === 'lb' && rkey === this.lbMode + '|' + this.lbCat) redraw(); });
    this.show('lb', 'bg-lb', `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Classements</h2><p class="sub">Même tour pour tout le monde : les scores sont comparables.</p></div>
      <div class="lb-filters"><div class="seg" role="group" aria-label="Mode">${Object.values(MODES).filter((m) => !m.hunt && !m.coop && !m.arena).map((m) => `<button data-m="${m.id}" aria-pressed="${m.id === this.lbMode}">${m.name}</button>`).join('')}</div><span class="sp"></span>
        <div class="seg" role="group" aria-label="Classement">${[['depth', 'Étage'], ['score', 'Score'], ['time', 'Temps']].map(([c, n]) => `<button data-c="${c}" aria-pressed="${c === this.lbCat}">${n}</button>`).join('')}</div></div>
      <div class="stk lb-card"><h4>${heads[this.lbCat]}</h4><table class="lb"><tr><th>#</th><th>Joueur</th><th>Étages</th><th>Score</th><th>Temps</th><th>Menace</th><th></th></tr>${table}</table></div>
      <div class="lb-foot"><button class="btn primary" data-back>Retour</button><span class="note">${online ? 'Classement en ligne · tous les joueurs' : 'Classement local (hors ligne)'} · le Défi du jour repart à zéro chaque jour.</span></div>`,
    { '[data-m]': (b) => { this.lbMode = b.dataset.m; redraw(); }, '[data-c]': (b) => { this.lbCat = b.dataset.c; redraw(); }, '[data-back]': back }, back);
  }

  // ---------------------------------------------------------------- pause
  pause() {
    this.show('pause', 'bg-dim', `<div class="stk p-card"><h2 class="disp">Pause</h2>
        <div class="p-btns"><button class="btn primary big" data-res>Reprendre${this.g.touch ? '' : ' <span class="kc dark">Entrée</span>'}</button><button class="btn" data-set>${I.gear()}Réglages</button><button class="btn coral" data-quit>Abandonner</button></div>
        <div class="p-keys">${this.keysHelp()}</div></div>`,
    { '[data-res]': () => this.g.resume(), '[data-set]': () => this.settings(() => this.pause()), '[data-quit]': () => this.g.toMenu() });
  }

  // ---------------------------------------------------------------- settings
  settings(back, tab = this.setTab) {
    this.setTab = tab;
    const S = Settings, V = S.v, pct = (x) => Math.round(x * 100) + ' %';
    const slider = (k, ico, label, lo, hi, step, fmt, isNew) => `<label class="srow">${I[ico]()}<span class="t">${label}${isNew ? '<span class="tag">Nouveau</span>' : ''}</span><output data-o="${k}">${fmt(V[k])}</output>
      <input type="range" data-k="${k}" min="${lo}" max="${hi}" step="${step}" value="${V[k]}" style="--v:${(((V[k] - lo) / (hi - lo)) * 100).toFixed(1)}%"></label>`;
    const toggle = (k, ico, label, sub) => `<div class="trow">${I[ico]()}<span>${label}<small>${sub}</small></span><button class="tg" role="switch" data-tg="${k}" aria-checked="${!!V[k]}" aria-label="${label}"></button></div>`;
    const FMT = { sens: (x) => x.toFixed(2).replace('.', ',') + '×', fov: (x) => Math.round(x) + '°', bright: pct, shake: pct, master: pct, music: pct, sfx: pct, mosq: pct };
    let panel = '';
    if (tab === 'jeu') {
      const q = this.g.post.quality;
      panel = `<div class="s-cols"><div class="s-col">${slider('sens', 'mouse', 'Sensibilité souris', 0.2, 3, 0.05, FMT.sens)}${slider('fov', 'eye', 'Champ de vision', 60, 110, 1, FMT.fov)}
          ${slider('bright', 'sun', 'Luminosité', 0.5, 1.6, 0.05, FMT.bright)}${slider('shake', 'shake', 'Secousses de caméra', 0, 1, 0.05, FMT.shake)}</div>
        <div class="s-col"><h4>Qualité graphique</h4><div class="seg" role="group" aria-label="Qualité">${QUALITY.map(([n], i) => `<button data-q="${i}" aria-pressed="${q === i}">${n}</button>`).join('')}</div>
          <p class="pdesc">${QUALITY[q][1]} La qualité baisse toute seule si les images par seconde chutent.</p>
          ${toggle('invertY', 'mouse', 'Axe Y inversé', 'Pour les pilotes d’avion.')}${toggle('reduceMotion', 'shake', 'Mouvements réduits', 'Moins d’animations dans l’interface.')}</div></div>`;
    } else if (tab === 'audio') {
      panel = `<div class="s-cols"><div class="s-col">${slider('master', 'speaker', 'Volume général', 0, 1, 0.05, FMT.master)}${slider('music', 'note', 'Musique', 0, 1, 0.05, FMT.music)}
          ${slider('sfx', 'boom', 'Effets sonores', 0, 1, 0.05, FMT.sfx)}${slider('mosq', 'mosq', 'Moustiques', 0, 1, 0.05, FMT.mosq, true)}</div>
        <div class="s-col"><h4>Bourdonnement des moustiques</h4><div class="seg" role="group" aria-label="Son des moustiques">${PRESET_IDS.map((id) => `<button data-mp="${id}" aria-pressed="${V.mosqPreset === id}">${PRESETS[id].name}</button>`).join('')}</div>
          <p class="pdesc">${PRESET_DESC[V.mosqPreset]}</p>
          <div class="trow">${I.phones()}<span>Son 3D<small>Chaque moustique est placé autour de toi. Casque conseillé.</small></span></div>
          <div class="trow">${I.speaker()}<span>Tester le bourdonnement<small>Un moustique passe de gauche à droite.</small></span><button class="btn" data-hear>Écouter</button></div></div></div>`;
    } else {
      const keyBtn = (a, i) => `<button class="kc${S.binds[a][i] ? '' : ' none'}" data-a="${a}" data-i="${i}">${esc(S.label(S.binds[a][i]))}</button>`;
      panel = `<div class="keys">${ACTIONS.map(([a, n]) => `<div class="krow"><span>${n}</span>${keyBtn(a, 0)}${keyBtn(a, 1)}</div>`).join('')}</div>
        <p class="khint">Clique sur une touche puis appuie sur la nouvelle · Suppr : effacer · Échap : annuler.</p>`;
    }
    const redraw = () => this.settings(back, this.setTab);
    const stage = this.show('set', 'bg-set', `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Réglages</h2></div>
      <div class="s-tabs" role="tablist">${[['jeu', 'Jeu'], ['audio', 'Audio'], ['touches', 'Touches']].map(([k, n]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      <div class="stk s-panel">${panel}</div>
      <div class="s-foot"><button class="btn primary" data-back>Retour</button>${tab === 'touches' ? '<button class="btn" data-rk>Touches par défaut</button>' : '<button class="btn" data-ra>Par défaut</button>'}<span class="note">Enregistré automatiquement.</span></div>`,
    { '[data-back]': back, '[data-tab]': (b) => { this.setTab = b.dataset.tab; redraw(); },
      '[data-q]': (b) => { const n = +b.dataset.q; this.g.setQuality(n, true); S.set('q', n); redraw(); },
      '[data-tg]': (b) => { S.set(b.dataset.tg, !S.v[b.dataset.tg]); redraw(); },
      '[data-mp]': (b) => { S.set('mosqPreset', b.dataset.mp); this.g.audio.previewMosquito(); redraw(); },
      '[data-hear]': () => this.g.audio.previewMosquito(),
      '[data-rk]': () => { S.resetKeys(); redraw(); },
      '[data-ra]': () => { S.resetAll(); this.g.setQuality(1); this.g.autoQ = undefined; redraw(); },
      '[data-a]': (b) => {
        b.textContent = 'Appuie…'; b.classList.add('wait');
        const on = (ev) => {
          ev.preventDefault(); ev.stopImmediatePropagation();
          if (ev.code !== 'Escape') S.bind(b.dataset.a, +b.dataset.i, ev.code === 'Delete' || ev.code === 'Backspace' ? '' : ev.code);
          redraw();
        };
        addEventListener('keydown', on, true); this.capOff = () => { removeEventListener('keydown', on, true); this.capOff = null; };
      } }, back);
    stage.querySelectorAll('input[type=range]').forEach((r) => {
      const lo = +r.min, hi = +r.max, out = stage.querySelector(`[data-o="${r.dataset.k}"]`);
      r.addEventListener('input', () => { const v = +r.value; S.set(r.dataset.k, v); r.style.setProperty('--v', (((v - lo) / (hi - lo)) * 100).toFixed(1) + '%'); out.textContent = FMT[r.dataset.k](v); });
      r.addEventListener('change', () => { if (['master', 'music', 'sfx'].includes(r.dataset.k)) this.g.audio.play('ui'); if (r.dataset.k === 'mosq') this.g.audio.previewMosquito(); });
    });
  }

  // ---------------------------------------------------------------- end of run (auto-saved once, record comparison, death recap, one-key retry)
  end(run) {
    if (run.mode.arena) { this.arenaEnd(run); Iris.open(700); return; }
    if (run.mode.coop) { this.coopEnd(run); Iris.open(700); return; } // no personal record or board for a team run
    if (run.mode.hunt) { this.endView(run, null, null); Iris.open(700); return; } // Chasse: local record only, no board
    const id = run.mode.id, prev = LB.best(id);
    const entry = LB.add({ name: LB.name(), mode: id, cleared: run.cleared, score: run.score, time: run.time, result: run.result, kills: run.kills, menace: run.menace });
    LB.saveGhost(id, { cleared: run.cleared, time: run.time, splits: run.splits });
    LB.submit(entry); LB.stamp = {}; // share the run, and refetch the boards next time they are opened
    this.endView(run, entry, prev);
    Iris.open(700);
  }
  // Arena: the final ranking, then back to the room (the host closes the match for everybody)
  arenaEnd(run) {
    const g = this.g, co = g.coop, c = co && co.c, won = run.result === 'victory';
    const br = !!(co && co.br), list = !co ? [] : br ? co.standings().map((e) => ({ id: e.id, rank: e.place, txt: `${e.wins} manche${e.wins > 1 ? 's' : ''} · ${e.kills} kill${e.kills > 1 ? 's' : ''}` })) : co.board.ranking();
    const rows = list.map((e) => `<div class="lobby-row${e.id === co.you ? ' me' : ''}"><span class="nm">${e.rank === 1 ? I.crown() : ''}${e.rank}. ${esc(co.names.get(e.id) || '?')}${e.id === co.you ? ' (toi)' : ''}</span><b class="num">${e.txt || fmtInt(e.score)}</b></div>`).join('');
    this.show('arenaend', 'bg-menu', `<div class="stk w-card lobby-room"><span class="av">${won ? I.trophy() : I.glove()}</span><h2 class="disp">${won ? (br ? 'Dernier debout : victoire !' : 'Tu gagnes l’Arène !') : (br ? 'Fin du Battle Royale' : 'Fin de l’Arène')}</h2>
      <div class="lobby-list">${rows}</div><p>Moustiques éliminés : <b>${fmtInt(run.kills)}</b> · Pièces : <b>${fmtInt(run.coins)}</b></p>
      <button class="btn primary" data-lobby>Retour au salon</button><button class="btn" data-menu>Menu principal</button></div>`, {
      '[data-lobby]': () => { if (c && c.room && c.room.host === c.room.you) c.end(); g.toMenu(); this.multi(() => this.menu()); },
      '[data-menu]': () => { g.toMenu(); },
    }, () => g.toMenu());
  }
  // Coop: one summary for the team, then back to the room (the host closes the match for everybody)
  coopEnd(run) {
    const g = this.g, c = g.coop && g.coop.c, won = run.result === 'victory';
    const title = won ? 'Tour vaincue !' : run.aborted ? 'Partie terminée' : 'Toute l’équipe est à terre';
    this.show('coopend', 'bg-menu', `<div class="stk w-card"><span class="av">${won ? I.trophy() : I.glove()}</span><h2 class="disp">${title}</h2>
      <p>Étages franchis : <b>${run.cleared}</b> · Moustiques : <b>${fmtInt(run.kills)}</b> · Pièces : <b>${fmtInt(run.coins)}</b> · Score : <b>${fmtInt(run.score)}</b></p>
      <button class="btn primary" data-lobby>Retour au salon</button><button class="btn" data-menu>Menu principal</button></div>`, {
      '[data-lobby]': () => { if (c && c.room && c.room.host === c.room.you) c.end(); g.toMenu(); this.multi(() => this.menu()); },
      '[data-menu]': () => { g.toMenu(); },
    }, () => g.toMenu());
  }
  endView(run, entry, prev) {
    const won = run.result === 'victory', g = this.g, id = run.mode.id, hunt = !!run.mode.hunt, sc = hunt ? null : LB.rank(id, 'score', entry);
    const record = hunt ? !!run.record : !prev || run.cleared > prev.cleared || (run.cleared === prev.cleared && run.time < prev.time);
    const hbest = hunt ? Profile.get().stats.hunt[run.biome] || 0 : 0;
    let hook;
    if (hunt) hook = record ? `Nouveau record : vague ${run.cleared} !` : `Ton record ici : vague ${hbest}. Encore ${plural(hbest - run.cleared + 1, 'vague')}.`;
    else if (record) hook = !prev ? 'Premier run enregistré !' : run.cleared > prev.cleared ? `Nouveau record : +${plural(run.cleared - prev.cleared, 'étage')} !` : 'Nouveau record de temps !';
    else if (prev.cleared > run.cleared) hook = `Encore ${plural(prev.cleared - run.cleared, 'étage')} pour battre ton record (${prev.cleared}).`;
    else hook = `Même étage que ton record, ${(run.time - prev.time).toFixed(1).replace('.', ',')} s de trop.`;
    const gap = sc && sc.above ? sc.above.score - run.score + 1 : 0;
    const scoreLine = !sc ? '' : sc.above ? `Encore ${fmtInt(gap)} point${gap > 1 ? 's' : ''} pour dépasser ${esc(sc.above.name)}.` : sc.n > 1 ? 'Meilleur score du classement !' : '';
    const T = (k) => (TYPES[k] ? TYPES[k].name : k), who = run.lastBy, col = who && TYPES[who] ? hex(TYPES[who].color) : '#FF7A1A';
    const nu = won || hunt ? null : nextUnlock(run.mode, Math.max(0, run.i));
    let right;
    if (won) right = `<div class="who"><span class="ic" style="background:#FFF1C7">${I.trophy()}</span><span><small style="color:var(--acid-deep)">Tour vaincue</small><b>${run.mode.name}</b></span></div>
      <p>Tu as nettoyé chaque étage jusqu’au rez-de-chaussée. Le Défi du jour t’attend avec une tour différente chaque jour.</p>`;
    else {
      const top = Object.entries(run.dmgBy).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => `${T(k)} ${Math.round(v)}`).join(' · ');
      right = `<div class="who"><span class="ic">${I.mosq(col)}</span><span><small>Tué par</small><b>${who ? T(who) : 'Les moustiques'}</b></span></div>
        <p>${who ? TIPS[who] || '' : 'Bouge, saute et frappe : rester immobile ne pardonne pas.'}</p>${top ? `<span class="dmg">Dégâts subis : ${top}</span>` : ''}
        ${nu ? `<span class="next">Prochain déblocage : <b>${nu.u.text}</b> à l’étage ${nu.label}, encore ${plural(nu.floors, 'étage')}.</span>` : ''}`;
    }
    const retry = () => g.startRun(id, { biome: run.biome });
    const where = hunt ? `${BIOMES[run.biome - 1].name} · vague ${run.i + 1}` : won ? 'rez-de-chaussée atteint' : 'chute à l’étage ' + floorLabel(run.mode, run.i);
    const stage = this.show('end', won ? 'bg-win' : 'bg-fin', `<div class="f-title"><span class="disp">${won ? 'VICTOIRE !' : 'PIQUÉ !'}</span>${won ? I.trophy() : I.mosq(col)}</div>
      <span class="tag f-sub">${run.mode.name} · ${where} · ${run.menace ? 'Menace ' + run.menace : 'Pur'}</span>
      ${record ? `<div class="stk f-rec">${prev || hunt ? 'NOUVEAU RECORD !' : 'PREMIER RECORD !'}</div>` : ''}
      <div class="stk f-card"><div class="f-stats">
          <div><span class="num" data-r="cleared">0</span><span class="lbl">${hunt ? 'Vagues franchies' : 'Étages franchis'}</span></div><div><span class="num" data-r="score">0</span><span class="lbl">Score</span></div>
          <div><span class="num" data-r="time">00:00.0</span><span class="lbl">Temps</span></div><div><span class="num" data-r="kills">0</span><span class="lbl">Kills</span></div><div><span class="num" data-r="combo">0</span><span class="lbl">Meilleur combo</span></div></div>
        <div class="f-cols"><div class="f-hook"><div class="f-coins"><span class="pig">${I.piggy()}</span>${run.coins > 0 ? [0, 1, 2, 3].map((k) => `<span class="fly" style="animation-delay:${k * 0.28}s">${I.coin()}</span>`).join('') : ''}
            <span><span class="lbl">Pièces gagnées · gardées à 100 %</span><span class="disp earn num" data-r="coins">+0</span><span class="tot">${I.coin()}Tirelire : <span class="num">${fmtInt(Profile.get().coins)}</span></span></span></div>
          <span class="big${record ? ' rec' : ''}">${hook}</span>${scoreLine ? `<p>${scoreLine}</p>` : ''}${sc ? `<p>Rang au score : ${sc.rank} sur ${sc.n}.</p>` : '<p>La Chasse n’a pas de classement : tes pièces, elles, sont bien à toi.</p>'}</div>
          <div class="f-death">${right}</div></div></div>
      <div class="f-btns"><button class="btn primary big" data-again>Rejouer <span class="kc dark">Entrée</span></button><button class="btn gold" data-arm>${I.jumeaux()}Armurerie</button>${hunt ? '' : `<button class="btn" data-lb>${I.trophy()}Classements</button>`}<button class="btn" data-menu>Menu</button>
        ${hunt ? '' : `<label class="name">Nom<input id="nm" maxlength="14" value="${esc(LB.name())}" spellcheck="false"></label>`}</div>`,
    { '[data-again]': retry, '[data-menu]': () => g.toMenu(), '[data-arm]': () => this.armory.open(() => this.endView(run, entry, prev)), '[data-lb]': () => { this.lbMode = id; this.leaderboards(() => this.endView(run, entry, prev), entry.id); } });
    this.retry = retry;
    const r = (k, v, f) => roll(stage.querySelector(`[data-r="${k}"]`), v, 900, f);
    r('coins', run.coins, (x) => '+' + fmtInt(x)); r('cleared', run.cleared, (x) => String(Math.round(x))); r('score', run.score, fmtInt); r('time', run.time, fmtTime); r('kills', run.kills, (x) => String(Math.round(x))); r('combo', run.bestCombo, (x) => String(Math.round(x)));
    const nm = stage.querySelector('#nm'); if (!nm) return;
    nm.addEventListener('change', () => LB.rename(entry.id, (nm.value || 'JOUEUR').trim().slice(0, 14) || 'JOUEUR'));
    nm.addEventListener('keydown', (e) => { if (e.code === 'Enter') nm.blur(); e.stopPropagation(); });
  }
}
