// Multiplayer screen (spec 2026-10-04 §2): hub (create / join by code / friends), then the room (players, ready, mode, start).
import { Account } from '../net/Account.js';
import { RoomClient } from '../net/RoomClient.js';
import { Friends, Presence } from '../net/Friends.js';
import { CODE_RE, MODES } from '../net/protocol.js';
import { bus } from '../core/core.js';
import { I } from './Icons.js';
import { LobbyScene } from './LobbyScene.js';
import { EMOTES } from './lobbyPose.js';

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const MODE_NAME = { coop: 'Coop', arena: 'Arène', br: 'Battle Royale' };
const MODE_CARD = { // the multi screen's mode cards: colour, icon, pitch
  coop: ['#B8F53A', 'glove', 'La Tour à plusieurs : on monte ensemble, on se relève ensemble.'],
  arena: ['#FF5B4A', 'target', 'Chacun pour soi au milieu de l’essaim : le plus de moustiques gagne.'],
  br: ['#9B6BFF', 'crown', 'La salle rétrécit, les moustiques pleuvent : le dernier debout gagne.'],
};
const ERR = {
  exists: 'Ce code est déjà utilisé.', 'no-room': 'Aucun salon avec ce code.', started: 'La partie a déjà commencé.', full: 'Salon complet.', network: 'Connexion impossible.',
  players: 'Nombre de joueurs incompatible avec ce mode.', 'not-ready': 'Tous les joueurs doivent être prêts.', unknown: 'Pseudo inconnu.', self: 'C’est toi !', replaced: 'Connecté ailleurs.',
};
const head = (title) => `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">${title}</h2></div>`;
let client = null, invite = null, stage = null; // stage: the 3D lobby, lives as long as the room screen

export const setInvite = (code) => { invite = code; };
export const takeInvite = () => { const c = invite; invite = null; return c; };

export function multiScreen(s, back, joinCode = null) {
  if (client && client.room) return roomView(s, back);
  if (!Account.user) {
    s.show('multi', 'bg-menu', `${head('Multijoueur')}<div class="stk w-card"><span class="av">${I.glove()}</span><h2 class="disp">Connecte-toi</h2><p>Le jeu en ligne demande un compte pour retrouver ta progression et tes amis.</p><button class="btn primary" data-acc>Compte</button></div>`,
      { '[data-back]': () => back(), '[data-acc]': () => s.account(() => multiScreen(s, back, joinCode)) }, back);
    return;
  }
  if (joinCode) { enter(s, back, joinCode, false); return; }
  hub(s, back);
}

async function enter(s, back, code, create, mode = null) {
  client = new RoomClient();
  try {
    await (create ? client.create() : client.join(code));
    if (create && mode && client.room && client.room.mode !== mode) client.setMode(mode); // the card picked on the multi screen
  } catch (e) { client = null; bus.emit('toast', { text: ERR[e.message] || ERR.network, kind: 'ach' }); return hub(s, back); }
  const redraw = () => { if (s.kind === 'room' || s.kind === 'multi') roomView(s, back); };
  for (const ev of ['joined', 'left', 'lobby', 'host', 'start', 'end']) client.on(ev, redraw);
  client.on('error', (e) => bus.emit('toast', { text: ERR[e] || e, kind: 'ach' }));
  client.on('kicked', () => bus.emit('toast', { text: 'Tu as été exclu du salon.', kind: 'ach' }));
  client.on('emote', (m) => { if (stage) stage.emote(m.from, m.e); });
  client.on('start', (m) => { if (m.mode === 'coop') { closeStage(); s.g.startCoop(client); } else if (m.mode === 'arena') { closeStage(); s.g.startArena(client); } else if (m.mode === 'br') { closeStage(); s.g.startBattle(client); } });
  client.on('close', () => { client = null; Presence.set(null); closeStage(); if (s.kind === 'room') { bus.emit('toast', { text: 'Salon fermé.', kind: 'ach' }); hub(s, back); } });
  Presence.set(client.room.code);
  roomView(s, back);
}

function hub(s, back) {
  const st = s.show('multi', 'bg-menu', `${head('Multijoueur')}
    <div class="multi-wrap"><div class="m-modes three">${Object.keys(MODES).map((m) => { const [c, ico, txt] = MODE_CARD[m]; return `<button class="mode" data-make="${m}" style="--c:${c}"><span class="hd">${I[ico]()}</span><span class="bd"><span class="h3">${MODE_NAME[m]}</span><span class="p">${txt}</span><span class="rec">${MODES[m].min} à ${MODES[m].max} joueurs · créer le salon</span></span></button>`; }).join('')}</div>
    <div class="stk w-card lobby-hub"><h2 class="disp">Rejoindre</h2>
      <div class="row"><input id="lb-code" maxlength="4" autocomplete="off" spellcheck="false" placeholder="CODE" aria-label="Code du salon"><button class="btn" data-join>Rejoindre</button></div>
      <span class="err" id="lb-err" aria-live="polite"></span>
      <h3 class="disp">Amis</h3><div id="lb-friends" class="lobby-list">Chargement…</div>
      <div class="row"><input id="lb-add" maxlength="14" autocomplete="off" spellcheck="false" placeholder="Pseudo d’un ami" aria-label="Pseudo d’un ami"><button class="btn" data-add>Ajouter</button></div></div></div>`,
  { '[data-back]': () => back(), '[data-make]': (b) => enter(s, back, null, true, b.dataset.make), '[data-join]': () => joinTyped() }, back);
  const code = st.querySelector('#lb-code'), err = st.querySelector('#lb-err'), add = st.querySelector('#lb-add');
  const joinTyped = () => { const c = code.value.trim().toUpperCase(); if (!CODE_RE.test(c)) { err.textContent = 'Le code a 4 lettres.'; return; } enter(s, back, c, false); };
  code.addEventListener('input', () => { code.value = code.value.toUpperCase(); });
  for (const el of [code, add]) el.addEventListener('keydown', (e) => e.stopPropagation());
  code.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinTyped(); });
  const draw = async () => {
    const l = await Friends.list(), box = st.querySelector('#lb-friends'); if (!box) return;
    const row = (p, extra) => `<div class="lobby-row"><span class="nm">${esc(p.pseudo)}</span>${extra}</div>`;
    box.innerHTML = [
      ...l.received.map((p) => row(p, `<button class="btn" data-accept="${esc(p.pseudo)}">Accepter</button>`)),
      ...l.friends.map((p) => row(p, `<span class="dot${p.online ? ' on' : ''}"></span>${p.room ? `<button class="btn" data-go="${p.room}">Rejoindre</button>` : ''}<button class="btn icon" data-del="${esc(p.pseudo)}" aria-label="Retirer">×</button>`)),
      ...l.sent.map((p) => row(p, '<span class="hint">En attente…</span>')),
    ].join('') || '<span class="hint">Ajoute des amis par leur pseudo.</span>';
    box.querySelectorAll('[data-accept]').forEach((b) => b.addEventListener('click', async () => { await Friends.add(b.dataset.accept); draw(); }));
    box.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { await Friends.remove(b.dataset.del); draw(); }));
    box.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => enter(s, back, b.dataset.go, false)));
  };
  st.querySelector('[data-add]').addEventListener('click', async () => {
    const r = await Friends.add(add.value.trim()); err.textContent = r.ok ? '' : ERR[r.error] || ERR.network; if (r.ok) add.value = ''; draw();
  });
  draw();
}

function roomView(s, back) {
  const r = client.room, me = r.you, host = r.host === me, playing = r.status === 'playing';
  const players = [...r.players.values()];
  const rows = players.map((p) => `<div class="lobby-row"><span class="nm">${p.id === r.host ? I.crown() : ''}${esc(p.name)}${p.id === me ? ' (toi)' : ''}</span>${p.ready || p.id === r.host ? `<span class="ok">${I.check()}</span>` : ''}${p.ping != null ? `<span class="hint">${p.ping} ms</span>` : ''}${host && p.id !== me && !playing ? `<button class="btn icon" data-kick="${p.id}" aria-label="Exclure">×</button>` : ''}</div>`).join('');
  const me2 = r.players.get(me), link = `${location.origin}/?room=${r.code}`;
  const need = MODES[r.mode], count = players.length, okCount = count >= need.min && count <= need.max;
  const body = playing
    ? `<p class="lobby-play">Partie lancée : <b>${MODE_NAME[r.mode]}</b> · graine <b>${r.seed}</b></p>${host ? '<button class="btn" data-end>Terminer la partie</button>' : ''}`
    : `<div class="lobby-modes">${Object.keys(MODES).map((m) => `<button class="btn${r.mode === m ? ' primary' : ''}" ${host ? `data-mode="${m}"` : 'disabled'}>${MODE_NAME[m]} <span class="hint">${MODES[m].min}–${MODES[m].max}</span></button>`).join('')}</div>
      <div class="lobby-count${okCount ? '' : ' bad'}">${count} joueur${count > 1 ? 's' : ''} · ${MODE_NAME[r.mode]} ${need.min}–${need.max}</div>`;
  const action = playing ? '' : host ? '<button class="btn primary" data-start>Lancer</button>' : `<button class="btn${me2 && me2.ready ? ' primary' : ''}" data-ready>${me2 && me2.ready ? 'Prêt ✔' : 'Je suis prêt'}</button>`;
  const st = s.show('room', 'bg-menu', `${head('Salon')}<div class="stk w-card lobby-room lr2"><div class="lr-left"><div class="lobby-stage"></div><div class="lobby-emotes">${Object.entries(EMOTES).map(([k, e]) => `<button class="btn" data-emote="${k}">${e.label}</button>`).join('')}</div>
      <div class="lobby-list lobby-players">${rows}</div></div>
      <div class="lr-right"><h2 class="disp lobby-code">${r.code}</h2><button class="btn" data-copy>Copier le lien d’invitation</button>${body}<div class="lobby-actions">${action}<button class="btn coral" data-leave>Quitter</button></div></div></div>`,
  {
    '[data-emote]': (b) => client.emote(b.dataset.emote),
    '[data-back]': () => leave(s, back), '[data-leave]': () => leave(s, back),
    '[data-copy]': () => { try { navigator.clipboard.writeText(link); bus.emit('toast', { text: 'Lien copié : ' + link, kind: 'good' }); } catch { bus.emit('toast', { text: link, kind: 'good' }); } },
    '[data-kick]': (b) => client.kick(+b.dataset.kick), '[data-mode]': (b) => client.setMode(b.dataset.mode), '[data-start]': () => client.start(),
    '[data-ready]': () => client.setReady(!(me2 && me2.ready)), '[data-end]': () => client.end(),
  }, () => leave(s, back));
  if (!stage) stage = new LobbyScene();
  stage.mount(st.querySelector('.lobby-stage')); stage.sync(r);
}

const closeStage = () => { if (stage) { stage.dispose(); stage = null; } };
function leave(s, back) { if (client) { client.close(); client = null; } Presence.set(null); closeStage(); back(); }
