// Movement tuning of the player (no three.js: shared by Player.js, the level generator's reach rules and node --test).
export const CFG = {
  maxHp: 100, walk: 5, sprint: 8, crouch: 2.4, eyeStand: 1.7, eyeCrouch: 1.05,
  gravity: 9.81 * 1.8, // 1.8x "arcade" gravity: same 4m / 2.5m apex heights, snappier air-time
  jumpH: 4, djH: 2.5, coyote: 0.12, buffer: 0.12,
  rollDur: 0.5, rollSpeed: 11, rollCd: 0.9, dashSpeed: 20, dashDur: 0.18, dashCd: 1.5, saltoDur: 0.65,
};
