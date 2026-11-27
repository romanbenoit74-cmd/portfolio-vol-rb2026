// Combo / score system. No persistent progression: everything is scored per run.
import { bus } from '../core/core.js';

export class Rewards {
  constructor(game) {
    this.g = game; this.reset();
    bus.on('enemy:killed', (e) => this.onKill(e));
    for (const ev of ['player:doublejump', 'player:walljump', 'player:dash']) bus.on(ev, () => { this.chain++; });
  }
  reset() { this.combo = 0; this.comboT = 0; this.chain = 0; }
  get mult() { return Math.min(5, 1 + Math.floor(this.combo / 3)); } // 3 kills within 5s => x2
  update(dt) {
    if (this.g.player.onGround) this.chain = 0;
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; bus.emit('combo:end'); } }
  }
  onKill({ enemy, stomp, pos }) {
    if (enemy.type === 'tyrant') bus.emit('boss:down', { enemy });
    const run = this.g.run; if (!run || enemy.suicide) return;
    this.combo++; this.comboT = 5; run.bestCombo = Math.max(run.bestCombo, this.combo);
    const m = this.mult, d = enemy.def;
    const style = this.chain >= 2 ? 1 + 0.25 * Math.min(this.chain, 6) : 1; // parkour style: kills after dash / double jump / wall jump chains
    const pts = Math.round(d.pts * 100 * m * (stomp ? 1.5 : 1) * style * (run.scoreMul || 1)); // stomp "headshot" +50%, Menace score ×
    run.score += pts; run.kills++;
    bus.emit('reward', { pts, mult: m, combo: this.combo, pos, stomp, style: style > 1 ? this.chain : 0 });
  }
}
