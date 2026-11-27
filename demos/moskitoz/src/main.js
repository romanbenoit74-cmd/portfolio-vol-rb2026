import { Game } from './core/Game.js';
import { Account } from './net/Account.js';
import { setInvite } from './ui/LobbyScreen.js';
import { GLB } from './render/Glb.js';

const invited = new URLSearchParams(location.search).get('room');
if (invited && /^[A-Za-z]{4}$/.test(invited)) setInvite(invited.toUpperCase()); // https://moskitoz.win/?room=ABCD
Account.init(); // before the Game: restores the session so the first menu already shows the pseudo
GLB.preload(); // optional .glb models listed in assets/models/manifest.json (never blocks nor fails the game)
new Game();
