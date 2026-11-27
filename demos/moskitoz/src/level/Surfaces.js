// Parkour surfaces (no three: shared by Player.js, Level.js, Reach.js and node --test).
// Every parkour box has a kind; its rim colour tells the player what it does before they land on it.
import { CFG } from '../player/Moves.js';

// function colours (spec §5 for fixed / moving, signal colours for the rest; 'wall' uses the biome accent).
// Movement plates: bounce (straight up, acid like the jump bonus), launch (up and forward, violet), speed (forward dash, gold like haste).
export const KIND_COLOR = { fixed: '#3AC8B4', moving: '#FFB020', bounce: '#B8F53A', ice: '#4FC3FF', crumble: '#FF5B4A', launch: '#9B6BFF', speed: '#FFC62E' };

export const SURF = {
  bounceH: 7, // apex of the feet above a bounce pad (the double jump is still available on the way up)
  iceGrip: 1.6, // ground acceleration on ice (14 everywhere else): the player slides
  crumble: { hold: 0.6, gone: 3, back: 0.35 }, // seconds: shaking under the feet, missing, popping back
  kick: { contact: 3, rise: CFG.jumpH * 0.81 }, // wall jump: contact height used by the reach rules, feet rise (0.9 x jump speed)
  pad: { size: 2.4, h: 0.3 }, // movement plates: square, low enough to walk onto (Physics STEP 0.45)
  launch: { h: 5.5, push: 11 }, // propulseur: feet apex above the plate, forward speed (m/s)
  speed: { hop: 0.6, push: 18 }, // accélérateur: small hop that carries an 18 m/s dash (air momentum is kept)
};

/** Launch speed for a jump whose feet apex is h metres higher. */
export const launchV = (h) => Math.sqrt(2 * CFG.gravity * h);
/** Bounce height for a pad whose top is at y in a room of height h: the head must stay under the ceiling. */
export const bounceHeight = (y, h) => Math.max(3, Math.min(SURF.bounceH, h - y - 1.8 - 0.4));

// crumbling platform phases: [next phase, seconds before it] ('idle' waits for a load instead)
const NEXT = { shake: ['gone', SURF.crumble.hold], gone: ['back', SURF.crumble.gone], back: ['idle', SURF.crumble.back] };
/**
 * Crumbling platform state machine, in place. s = { phase: 'idle'|'shake'|'gone'|'back', t }; loaded: someone stands on it.
 * 'gone' disables the collider, 'back' re-enables it while it pops in.
 */
export function crumbleStep(s, dt, loaded) {
  s.t += dt;
  const n = NEXT[s.phase];
  if (s.phase === 'idle' ? loaded : s.t >= n[1]) { s.phase = n ? n[0] : 'shake'; s.t = 0; }
}
export const solid = (s) => s.phase !== 'gone';
