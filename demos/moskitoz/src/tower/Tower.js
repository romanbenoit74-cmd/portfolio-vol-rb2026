// Tower definition: modes, deterministic floor generation (same tower for everyone), unlock schedule, run state.
import { rng } from '../core/core.js';
import { DEFAULT_STATS } from '../player/Player.js';
import { BIOMES } from '../level/Level.js';
import { WEAPON_OF, menace, menaceMods } from '../economy/Loadout.js';
import { composeWave, sEff, dailyHard } from './Waves.js';
import { coopScale } from './Coop.js';

export { sEff };

export const TOWER_SEED = 20240917;

// i = 0 is the first room below the roof. Tower labels run 99 -> 0; Sprint labels 24 -> 0.
export const MODES = {
  tower: { id: 'tower', name: 'La Tour', desc: '100 étages · ~70 min', n: 100, isBoss: (i) => (i + 1) % 10 === 0 },
  sprint: { id: 'sprint', name: 'Sprint', desc: '25 étages · ~20 min', n: 25, isBoss: (i) => i > 0 && i % 8 === 0 },
};
// Défi du jour: 10 floors, same for everyone on a given day, very hard but ramped (steps 55..99, budget ×1.05 → ×1.35, damage ×1.2).
export const dayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
// Coop (2-4): the same tower as La Tour (same seed, same floors), played together; HP and wave budget scale with the team (src/tower/Coop.js).
MODES.coop = { id: 'coop', name: 'Coop', desc: '2 à 4 joueurs · la même tour', n: 100, coop: true, isBoss: (i) => (i + 1) % 10 === 0 };
// Arena (2-8): 5 minutes in one biome, everyone for themselves; mosquitoes keep coming in waves (src/tower/Arena.js, src/net/ArenaSession.js).
MODES.arena = { id: 'arena', name: 'Arène', desc: '2 à 8 joueurs · 5 minutes', n: 1, arena: true, isBoss: (k) => k % 5 === 4 };
// Battle Royale (2-16): the arena with one life and a shrinking safe zone (src/tower/BattleRoyale.js, src/net/BattleSession.js).
MODES.br = { id: 'br', name: 'Battle Royale', desc: '2 à 16 joueurs · dernier debout', n: 1, arena: true, br: true, isBoss: (k) => k % 5 === 4 };
MODES.daily = {
  id: 'daily', name: 'Défi du jour', n: 10, daily: true, base: 55, span: 44, hardAt: (i) => dailyHard(i, 10), dmg: 1.2,
  get desc() { return '10 étages · très dur · ' + new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); },
  isBoss: (i) => i === 4 || i === 9, bossNo: (i) => (i === 9 ? 3 : 1),
};
const dailyThemes = () => { const r = rng(dayKey()), a = Array.from({ length: BIOMES }, (_, k) => k + 1); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a.slice(0, 10); };
const themeOf = (mode, i) => (mode.daily ? dailyThemes()[i] : 1 + Math.min(BIOMES - 1, Math.floor(sEff(mode, i) / 5)));
// next unlock still ahead of floor i: { u, floors, label } or null
export function nextUnlock(mode, i) {
  const s = sEff(mode, i), u = UNLOCKS.find((x) => x.s > s); if (!u) return null;
  for (let j = i + 1; j < mode.n; j++) if (sEff(mode, j) >= u.s) return { u, floors: j - i, label: floorLabel(mode, j) };
  return null;
}
export const floorLabel = (mode, i) => mode.n - 1 - i;

// Fixed unlock schedule, by step. Everyone unlocks the same things at the same floors.
export const UNLOCKS = [
  { s: 5, id: 'power', text: 'Power Punch — maintenir le clic' },
  { s: 15, id: 'handpower', text: 'Pouvoir des mains activé [F]' },
  { s: 25, id: 'range', text: 'Portée d\'attaque +15%' },
  { s: 35, id: 'rate', text: 'Cadence d’arme +20%' },
  { s: 45, id: 'dmg', text: 'Dégâts +20%' },
  { s: 55, id: 'ultra', text: 'ULTRA : bombe anti-moustiques [R]' },
  { s: 65, id: 'powercd', text: 'Recharge du pouvoir −30%' },
  { s: 75, id: 'invuln', text: 'Invulnérabilité 2s [E]' },
  { s: 85, id: 'triple', text: 'Triple saut + recharges −30%' },
];

// lo = run loadout { weapon, power } (spec §9): the equipped weapon is there from the start, the hand power from s15.
export function statsFor(s, lo = null) {
  const st = { ...DEFAULT_STATS, weapons: ['hands'], power: false, ultra: false, handPower: null, rateMul: 1, powerCdMul: 1 };
  const has = (id) => UNLOCKS.some((u) => u.id === id && s >= u.s);
  if (lo && WEAPON_OF[lo.weapon]) st.weapons.push(WEAPON_OF[lo.weapon]);
  if (has('power')) st.power = true;
  if (has('handpower') && lo && lo.power) st.handPower = lo.power;
  if (has('range')) st.rangeMul = 1.15;
  if (has('rate')) st.rateMul = 1.2;
  if (has('dmg')) st.dmgMul = 1.2;
  if (has('ultra')) st.ultra = true;
  if (has('powercd')) st.powerCdMul = 0.7;
  if (has('invuln')) st.invuln = true;
  if (has('triple')) { st.airJumps = 2; st.cdMul = 0.7; }
  return st;
}
export const unlocksBetween = (a, b) => UNLOCKS.filter((u) => u.s > a && u.s <= b);

const MODS = [
  { id: 'lowgrav', name: 'Gravité lunaire' },
  { id: 'fast', name: 'Moustiques survoltés' },
  { id: 'tough', name: 'Moustiques blindés' },
];

// M = Menace of the run loadout (budget ×(1 + 0.08·M))
export function floorInfo(mode, i, M = 0, team = 1) {
  const s = sEff(mode, i), seed = (mode.daily ? dayKey() * 31 + 7 : TOWER_SEED) + i * 7919, r = rng(seed);
  const boss = mode.isBoss(i), themeIdx = themeOf(mode, i);
  const prevTheme = i === 0 ? 0 : themeOf(mode, i - 1);
  const bossNo = boss ? (mode.bossNo ? mode.bossNo(i) : mode.id === 'tower' || mode.id === 'coop' ? (i + 1) / 10 - 1 : i / 8 - 1) : -1;
  const waves = [composeWave(s, r, boss, (mode.hardAt ? mode.hardAt(i) : mode.hard || 1) * menaceMods(M).budget * coopScale(team).budget)];
  const mods = [];
  if (s >= 50 && (mode.daily || r() < 0.45)) mods.push(MODS[Math.floor(r() * 3)]);
  return {
    i, s, seed, label: floorLabel(mode, i), themeIdx, boss, bossNo, waves, mods,
    bossHp: boss ? 1 + 0.4 * bossNo + (i === mode.n - 1 ? 0.5 : 0) : 1,
    hand: themeIdx <= 2 && themeIdx !== prevTheme,
    par: (22 + 0.5 * s) * (boss ? 2.5 : 1),
    props: 6 + Math.floor(s / 14),
    pk: 2 + (s > 25 ? 1 : 0) + (s > 60 ? 1 : 0) + (boss ? 1 : 0),
    newBiome: themeIdx !== prevTheme,
    cap: 14 + Math.floor(s / 15),
    interval: Math.max(0.45, 1.15 - s * 0.007),
  };
}

// Chasse (spec §9): endless waves in one arena of a biome already reached; wave k climbs from the biome's step, a
// boss every 5 waves. Hand power always on (it is the test / farm mode). Local record only, no online board.
MODES.hunt = { id: 'hunt', name: 'Chasse', desc: 'vagues infinies · record local', n: 1, hunt: true, isBoss: (k) => k % 5 === 4 };
export const biomeStep = (b) => (b - 1) * 5; // step where the tower reaches biome b
export const huntStats = (b, lo) => statsFor(Math.max(15, biomeStep(b)), lo);
export function huntInfo(b, k, M = 0) {
  const s = Math.min(99, biomeStep(b) + 3 * k), seed = TOWER_SEED ^ (b * 0x9e37 + k * 7919), r = rng(seed), boss = k % 5 === 4, bossNo = Math.floor(k / 5);
  return {
    i: k, s, seed, label: k + 1, themeIdx: b, boss, bossNo, waves: [composeWave(s, r, boss, menaceMods(M).budget)], mods: [],
    bossHp: boss ? 1 + 0.4 * bossNo : 1, hand: false, par: (22 + 0.5 * s) * (boss ? 2.5 : 1), newBiome: false,
    props: 6 + Math.floor(biomeStep(b) / 14), pk: 3, cap: 14 + Math.floor(s / 15), interval: Math.max(0.45, 1.15 - s * 0.007),
  };
}
export const huntArena = (b) => ({ seed: TOWER_SEED ^ (b * 0x51ed), props: 6 + Math.floor(biomeStep(b) / 14), pk: 3 });

export class Run {
  constructor(mode, lo = { weapon: null, power: null }) {
    this.mode = mode; this.i = 0; this.score = 0; this.kills = 0; this.time = 0; this.cleared = 0;
    this.splits = []; this.dmgBy = {}; this.lastBy = null; this.timerOn = false; this.floorT = 0; this.noDamage = true; this.result = null; this.bestCombo = 0;
    this.coins = 0; this.banked = 0; // coins picked up this run (all kept, even on death) / already saved to the profile
    this.loadout = lo; this.menace = menace(lo); this.scoreMul = menaceMods(this.menace).score; // spec §9: score ×(1 + 0.25·M)
  }
  get depth() { return this.cleared; }
  // bonuses awarded when a floor is cleared
  floorBonus(info) {
    const base = 500 + Math.round(20 * info.s), timeB = Math.max(0, Math.round((info.par - this.floorT) * 40)), clean = this.noDamage ? 500 : 0;
    const total = Math.round((base + timeB + clean) * this.scoreMul);
    this.score += total; this.cleared++; this.splits.push(this.time);
    return { base, timeB, clean, total };
  }
}
