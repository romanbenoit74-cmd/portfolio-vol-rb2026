// Account screen (spec 2026-10-04 §1): log in / create an account, or see the sync state and log out.
import { Account } from '../net/Account.js';
import { bus } from '../core/core.js';
import { I } from './Icons.js';

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
export const STATUS_TEXT = { guest: 'Hors ligne', syncing: 'Synchronisation…', synced: 'Synchronisé', offline: 'Serveur injoignable : nouvel essai automatique', refused: 'Synchronisation refusée par le serveur' };
const ERR = {
  pseudo: 'Pseudo : 3 à 14 caractères (lettres, chiffres, _ ou -).', password: 'Mot de passe : 8 caractères minimum.', taken: 'Ce pseudo est déjà pris.',
  credentials: 'Pseudo ou mot de passe incorrect.', limited: 'Trop d’essais : réessaie dans quelques minutes.', import: 'Le profil de ce navigateur est invalide.', network: 'Pas de connexion au serveur.',
};
const head = `<div class="s-head"><button class="btn icon" data-back aria-label="Retour">${I.back()}</button><h2 class="disp">Compte</h2></div>`;

export function accountScreen(s, back, mode = 'login') {
  return Account.user ? signedIn(s, back) : form(s, back, mode);
}

function form(s, back, mode) {
  const reg = mode === 'register';
  const st = s.show('account', 'bg-menu', `${head}
    <div class="stk w-card"><span class="av">${I.glove()}</span><h2 class="disp">${reg ? 'Créer un compte' : 'Se connecter'}</h2>
      <p>${reg ? 'Pièces, armes et records te suivent sur tous tes appareils. La progression de ce navigateur sera importée.' : 'Retrouve ta progression sur cet appareil.'}</p>
      <input id="acc-pseudo" maxlength="14" autocomplete="username" spellcheck="false" placeholder="Pseudo" aria-label="Pseudo">
      <input id="acc-pass" type="password" maxlength="128" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="Mot de passe" aria-label="Mot de passe">
      <span class="err" id="acc-err" aria-live="polite"></span>
      <button class="btn primary" data-ok>${reg ? 'Créer mon compte' : 'Connexion'}</button>
      <button class="btn" data-mode>${reg ? 'J’ai déjà un compte' : 'Créer un compte'}</button></div>`,
  { '[data-back]': () => back(), '[data-mode]': () => accountScreen(s, back, reg ? 'login' : 'register') }, back);
  const pseudo = st.querySelector('#acc-pseudo'), pass = st.querySelector('#acc-pass'), err = st.querySelector('#acc-err'), ok = st.querySelector('[data-ok]');
  const submit = async () => {
    ok.disabled = true; err.textContent = '';
    const r = await (reg ? Account.register(pseudo.value.trim(), pass.value) : Account.login(pseudo.value.trim(), pass.value));
    if (r.ok) {
      s.g.audio.play('milestone');
      if (r.droppedLocal) bus.emit('toast', { text: 'Ce compte avait déjà un profil : la progression de ce navigateur n’a pas été importée.', kind: 'ach' });
      return back();
    }
    ok.disabled = false; err.textContent = ERR[r.error] || ERR.network; (r.error === 'credentials' ? pass : pseudo).focus();
  };
  ok.addEventListener('click', submit);
  for (const el of [pseudo, pass]) el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); });
  setTimeout(() => pseudo.focus(), 50);
}

function signedIn(s, back) {
  s.show('account', 'bg-menu', `${head}
    <div class="stk w-card"><span class="av">${I.glove()}</span><h2 class="disp">${esc(Account.user.pseudo)}</h2>
      <p class="acc-status" data-s="${Account.status}">${STATUS_TEXT[Account.status]}</p>
      <span class="err" id="acc-err" aria-live="polite"></span>
      <button class="btn" data-sync>Synchroniser maintenant</button>
      <button class="btn coral" data-out>Se déconnecter</button></div>`,
  {
    '[data-back]': () => back(),
    '[data-sync]': async () => { await Account.sync(); signedIn(s, back); },
    '[data-out]': async () => {
      const r = await Account.logout();
      if (r.ok) return s.menu();
      s.root.querySelector('#acc-err').textContent = 'Impossible de synchroniser ta progression : reste connecté et réessaie.';
    },
  }, back);
}
