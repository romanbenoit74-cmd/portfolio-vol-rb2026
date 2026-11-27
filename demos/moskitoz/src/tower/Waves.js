// Wave composition (pure, no three.js): the enemy budget of a floor spent on the types available at step s, seeded.
// Shared by the tower, the sprint, the daily challenge and the hunt; node-testable (economy balance, tools/balance.mjs).
export const sEff = (mode, i) => (mode.base != null ? mode.base + (i * mode.span) / (mode.n - 1) : (i * 99) / (mode.n - 1)); // difficulty / unlock step (0..99)

/** Daily challenge budget multiplier: a gentle first floor (the player has just been handed their gear), reaching the full 1.35 on the last floor. */
export const dailyHard = (i, n) => 1.05 + 0.3 * (n > 1 ? i / (n - 1) : 1);

export const COST = { mosquito: 1, speedbug: 1.2, swarmling: 1.6, heavy: 3.5, spitter: 2, kamikaze: 1.2, shield: 2.5, splitter: 3, healer: 2.5 };
export const ORDER = ['mosquito', 'speedbug', 'swarmling', 'heavy', 'spitter', 'kamikaze', 'shield', 'splitter', 'healer'];
// wave composition: budget spent on the enemy types available at step s (seeded)
export function composeWave(s, r, boss, mul) {
  const types = ORDER.slice(0, Math.min(9, 1 + Math.floor(s / 9)));
  let budget = (5 + s * 0.6) * (boss ? 0.45 : 1) * mul;
  const counts = {};
  while (budget >= 1) {
    const w = types.map((t, k) => (k === types.length - 1 ? 1.8 : 1) * (t === 'healer' && (counts.healer || 0) >= 1 + Math.floor(s / 30) || t === 'kamikaze' && (counts.kamikaze || 0) >= 2 + Math.floor(s / 12) ? 0 : 1));
    let x = r() * w.reduce((a, b) => a + b, 0), pick = types[0];
    for (let k = 0; k < types.length; k++) { x -= w[k]; if (x <= 0) { pick = types[k]; break; } }
    if (COST[pick] > budget + 1.5) pick = 'mosquito';
    counts[pick] = (counts[pick] || 0) + 1; budget -= COST[pick];
  }
  const wave = Object.entries(counts).map(([t, n]) => [t, n]);
  if (boss) wave.unshift(['tyrant', 1]);
  return wave;
}

