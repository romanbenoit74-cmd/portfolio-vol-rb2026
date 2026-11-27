// Fully procedural audio: pooled SFX (max 16 voices) + dynamic sequenced music + mosquito bus (MosquitoVoices.js).
import { Settings } from '../core/Settings.js';
import { MosquitoVoices } from './MosquitoVoices.js';
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioManager {
  constructor() {
    this.ctx = null; this.voices = 0; this.intensity = 0; this.track = null;
    this.step = 0; this.nextT = 0; this.bar = 0;
  }
  init() {
    if (this.ctx) { this.resume(); return; }
    const c = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = c.createGain(); this.master.gain.value = 0.8;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.gain.value = 0.32; this.mus.connect(this.master);
    const len = c.sampleRate, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    // mosquitoes: own bus + 3D voices (MosquitoVoices), outside the music and SFX volumes
    this.mosq = new MosquitoVoices(c, this.master);
    this.applyVolumes();
    setInterval(() => this.tick(), 30);
  }
  applyVolumes() {
    if (!this.ctx) return;
    const v = Settings.v; this.master.gain.value = 0.8 * v.master; this.sfx.gain.value = 0.9 * v.sfx; this.mus.gain.value = 0.32 * v.music;
    this.mosq.set(v.mosq, v.mosqPreset);
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  // per frame: enemies + camera + listener velocity; null = every mosquito voice fades out (menu, pause, end)
  mosquitoes(list, cam, vel) { if (this.mosq) this.mosq.update(list, cam, vel); }
  previewMosquito() { if (this.mosq) this.mosq.preview(); }

  // ---- primitives ----
  _v(dur) { if (this.voices >= 16) return false; this.voices++; setTimeout(() => this.voices--, dur * 1000 + 60); return true; }
  osc(type, f0, f1, dur, vol = 0.3, o = {}) {
    if (!this.ctx || !this._v(dur + (o.delay || 0))) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const os = c.createOscillator(), g = c.createGain();
    os.type = type; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = os; if (o.filter) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filter; os.connect(f); n = f; }
    n.connect(g); g.connect(o.dest || this.sfx); os.start(t); os.stop(t + dur + 0.05);
  }
  noise(dur, vol, f0, f1, o = {}) {
    if (!this.ctx || !this._v(dur + (o.delay || 0))) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = o.type || 'lowpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.dest || this.sfx); s.start(t); s.stop(t + dur + 0.05);
  }

  play(name, v = 1) {
    if (!this.ctx) return;
    switch (name) {
      case 'swipe': this.noise(0.14, 0.35 * v, 3500, 500, { type: 'bandpass', q: 0.8 }); break;
      case 'hiss': this.noise(0.2, 0.22, 7000, 3500, { type: 'highpass' }); break;
      case 'ult': this.osc('sawtooth', 120, 900, 0.7, 0.3, { filter: 2500, att: 0.1 }); this.noise(0.7, 0.3, 500, 6000, { type: 'bandpass', att: 0.2 }); [60, 64, 67, 72].forEach((n, i) => this.osc('triangle', mtof(n), mtof(n), 0.5, 0.2, { delay: 0.25 + i * 0.07 })); break;
      case 'coin': { const n = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16][Math.min(v, 9)]; this.osc('triangle', mtof(81 + n), mtof(81 + n), 0.09, 0.14, { filter: 5000 }); this.osc('sine', mtof(93 + n), mtof(93 + n), 0.12, 0.07, { delay: 0.03 }); break; }
      case 'chest': [67, 71, 74, 79].forEach((m, i) => this.osc('triangle', mtof(m), mtof(m), 0.22, 0.2, { delay: i * 0.06 })); this.noise(0.3, 0.2, 900, 3000, { type: 'bandpass' }); break;
      case 'pickup': this.osc('triangle', 520, 1040, 0.18, 0.25, { filter: 4000 }); this.osc('sine', 1040, 1560, 0.22, 0.18, { delay: 0.08 }); break;
      case 'hatch': this.osc('sawtooth', 70, 35, 0.9, 0.35, { filter: 300 }); this.noise(0.5, 0.35, 900, 120); this.osc('square', 220, 110, 0.15, 0.2, { delay: 0.05, filter: 1200 }); break;
      case 'whoosh': this.noise(1.2, 0.3, 300, 5000, { type: 'bandpass', q: 0.6, att: 0.4 }); break;
      case 'slap': this.noise(0.1, 0.7 * v, 3200, 900, { type: 'bandpass', q: 0.9 }); this.osc('sine', 320, 110, 0.09, 0.35); break;
      case 'clap': this.noise(0.14, 1.0 * v, 2200, 700, { type: 'bandpass', q: 0.7 }); this.osc('sine', 140, 40, 0.22, 0.6); this.noise(0.05, 0.6, 7000, 3000, { type: 'highpass' }); break;
      case 'flick': this.osc('square', 1400, 380, 0.05, 0.22, { filter: 3500 }); this.noise(0.04, 0.35, 5000, 2000, { type: 'highpass' }); this.osc('sine', 200, 90, 0.07, 0.2, { delay: 0.02 }); break;
      case 'punch': this.osc('sine', 160, 40, 0.16, 0.7 * v); this.noise(0.09, 0.4 * v, 2500, 300); break;
      case 'power': this.osc('sine', 110, 25, 0.4, 0.9 * v); this.noise(0.3, 0.6 * v, 4000, 100); this.osc('sawtooth', 300, 60, 0.25, 0.2, { filter: 800 }); break;
      case 'charge': this.osc('sawtooth', 90, 420, 0.5, 0.16, { filter: 900, att: 0.3 }); this.noise(0.5, 0.12, 300, 3000, { type: 'bandpass', att: 0.4 }); break;
      case 'hit': this.osc('square', 1700 * v, 900, 0.07, 0.16, { filter: 4000 }); break;
      case 'crit': this.osc('triangle', 900, 1800, 0.18, 0.35); this.osc('triangle', 1350, 2700, 0.2, 0.25, { delay: 0.04 }); break;
      case 'death': this.osc('sawtooth', 760, 70, 0.55, 0.22, { filter: 1800 }); this.osc('sawtooth', 780, 75, 0.55, 0.12, { filter: 1500, delay: 0.01 }); break;
      case 'hurt': this.osc('sine', 130, 45, 0.25, 0.8); this.noise(0.18, 0.4, 900, 150); break;
      case 'sting': this.osc('square', 2400, 1500, 0.05, 0.1); break;
      case 'jump': this.osc('sine', 220, 440, 0.12, 0.18); break;
      case 'djump': this.osc('sine', 330, 700, 0.14, 0.2); break;
      case 'land': this.osc('sine', 90, 35, 0.14, 0.5 * v); this.noise(0.08, 0.15 * v, 800, 200); break;
      case 'roll': this.noise(0.4, 0.2, 700, 250, { type: 'bandpass' }); break;
      case 'dash': this.noise(0.22, 0.4, 5000, 400, { type: 'bandpass', q: 0.6 }); break;
      case 'salto': this.noise(0.5, 0.2, 400, 2500, { type: 'bandpass' }); break;
      case 'boing': this.osc('sine', 140, 620, 0.28, 0.3); this.osc('triangle', 280, 900, 0.18, 0.12, { delay: 0.03 }); break;
      case 'crack': this.noise(0.12, 0.35, 2600, 900, { type: 'bandpass', q: 1.2 }); this.osc('square', 180, 120, 0.06, 0.12, { filter: 1200 }); break;
      case 'crumble': this.noise(0.45, 0.45, 1400, 200, { type: 'bandpass', q: 0.7 }); this.osc('sine', 90, 40, 0.3, 0.4); break;
      case 'wall': this.osc('square', 200, 500, 0.1, 0.16, { filter: 1500 }); break;
      case 'zap': this.noise(0.25, 0.4, 6000, 1500, { type: 'bandpass', q: 2 }); this.osc('square', 900, 200, 0.2, 0.15); break;
      case 'spray': this.noise(0.9, 0.3, 6000, 2500, { type: 'highpass' }); break;
      case 'trap': this.osc('sine', 300, 120, 0.2, 0.3); this.noise(0.15, 0.2, 1200, 300); break;
      case 'squirt': this.noise(0.07, 0.22 * v, 2600, 5200, { type: 'bandpass', q: 1.4 }); this.osc('sine', 700 * v, 380, 0.05, 0.08); break;
      case 'gush': this.noise(0.3, 0.45, 1800, 5000, { type: 'bandpass', q: 0.9 }); this.osc('sine', 260, 120, 0.2, 0.25); break;
      case 'sizzle': this.noise(0.25, 0.12 * v, 8000, 4000, { type: 'highpass' }); break;
      case 'finger': this.osc('square', 1800, 200, 0.18, 0.2, { filter: 5000 }); this.osc('sine', 90, 30, 0.35, 0.7); this.noise(0.2, 0.5, 6000, 400, { type: 'bandpass', q: 0.7 }); break;
      case 'stretch': this.osc('triangle', 180, 720, 0.22, 0.25, { filter: 2500 }); this.noise(0.18, 0.15, 900, 3000, { type: 'bandpass' }); break;
      case 'snap': this.osc('square', 520, 140, 0.08, 0.25, { filter: 2200 }); this.noise(0.06, 0.4, 3000, 800, { type: 'bandpass' }); break;
      case 'stun': this.osc('triangle', 500, 200, 0.2, 0.2); break;
      case 'combo': this.osc('triangle', 660 + 110 * v, 1320 + 110 * v, 0.2, 0.25); break;
      case 'milestone': [67, 72, 76, 79, 84, 88].forEach((m, i) => this.osc('triangle', mtof(m), mtof(m), 0.4, 0.24, { delay: i * 0.07 })); this.osc('sawtooth', 130, 260, 0.8, 0.16, { filter: 1500 }); break;
      case 'levelup': [72, 76, 79, 84].forEach((m, i) => this.osc('triangle', mtof(m), mtof(m), 0.3, 0.22, { delay: i * 0.08 })); break;
      case 'wave': this.osc('sawtooth', 110, 110, 0.5, 0.2, { filter: 500 }); this.osc('sawtooth', 165, 165, 0.5, 0.15, { filter: 500, delay: 0.15 }); break;
      case 'boss': this.osc('sawtooth', 55, 40, 1.4, 0.5, { filter: 400, att: 0.3 }); this.noise(1.2, 0.3, 200, 60); break;
      case 'ui': this.osc('sine', 600, 900, 0.07, 0.15); break;
      case 'invuln': this.osc('sine', 300, 1200, 0.5, 0.25); break;
    }
  }

  // ---- music ----
  setTrack(name) {
    if (!this.ctx || this.track === name) { this.track = name; return; }
    this.track = name; this.step = 0; this.bar = 0; this.nextT = this.ctx.currentTime + 0.1;
    if (name === 'victory') this.fanfare();
  }
  fanfare() {
    const seq = [[67, 0], [72, 0.18], [76, 0.36], [79, 0.54], [84, 0.9], [79, 1.2], [84, 1.4]];
    seq.forEach(([m, d]) => {
      this.osc('sawtooth', mtof(m), mtof(m), 0.5, 0.18, { delay: d, filter: 2500, dest: this.mus });
      this.osc('triangle', mtof(m - 12), mtof(m - 12), 0.5, 0.2, { delay: d, dest: this.mus });
    });
  }
  tick() {
    if (!this.ctx || !this.track || this.track === 'victory' || this.track === 'none') return;
    const c = this.ctx;
    while (this.nextT < c.currentTime + 0.15) {
      this.musicStep(this.nextT, this.step);
      const bpm = this.track === 'boss' ? 132 : this.track === 'menu' ? 60 : 98 + this.intensity * 52;
      this.nextT += 60 / bpm / 4;
      this.step = (this.step + 1) % 16; if (this.step === 0) this.bar++;
    }
  }
  n(type, f, t, dur, vol, o = {}) {
    const c = this.ctx, os = c.createOscillator(), g = c.createGain();
    os.type = type; os.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = os; if (o.filter) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.filter; os.connect(fl); node = fl; }
    node.connect(g); g.connect(this.mus); os.start(t); os.stop(t + dur + 0.05);
  }
  drum(t, kind, vol = 0.5) {
    const c = this.ctx;
    if (kind === 'kick') {
      const os = c.createOscillator(), g = c.createGain(); os.frequency.setValueAtTime(140, t); os.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); os.connect(g); g.connect(this.mus); os.start(t); os.stop(t + 0.25);
    } else {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1800;
      const g = c.createGain(); g.gain.setValueAtTime(vol * (kind === 'hat' ? 0.4 : 0.8), t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'hat' ? 0.05 : 0.15));
      s.connect(f); f.connect(g); g.connect(this.mus); s.start(t); s.stop(t + 0.2);
    }
  }
  musicStep(t, s) {
    const I = this.intensity;
    if (this.track === 'menu') {
      if (s === 0 && this.bar % 2 === 0) {
        const ch = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]][(this.bar / 2) % 4 | 0];
        ch.forEach((m) => this.n('triangle', mtof(m), t, 3.6, 0.09, { att: 0.8, filter: 1200 }));
        this.n('sine', mtof(ch[0] - 12), t, 3.8, 0.16, { att: 0.5 });
      }
      if (s % 4 === 2 && Math.random() < 0.3) this.n('sine', mtof([69, 72, 76, 79][(Math.random() * 4) | 0]), t, 1.4, 0.08, { att: 0.02 });
      return;
    }
    if (this.track === 'boss') {
      const root = [45, 41, 43, 40][this.bar % 4];
      if (s % 4 === 0) this.drum(t, 'kick', 0.7);
      if (s === 4 || s === 12) this.drum(t, 'snare', 0.7);
      if (s % 2 === 0) this.drum(t, 'hat', 0.4);
      if ([0, 3, 6, 8, 11, 14].includes(s)) this.n('sawtooth', mtof(root - 12), t, 0.2, 0.28, { filter: 500 });
      if (s === 0 || s === 6 || s === 10) [0, 3, 7].forEach((iv) => this.n('sawtooth', mtof(root + 12 + iv), t, 0.55, 0.07, { filter: 1800, att: 0.03 }));
      if (s === 0) this.n('sawtooth', mtof(root + 24), t, 1.6, 0.05, { filter: 2500, att: 0.4 });
      return;
    }
    // gameplay: layers unlock with intensity
    const root = [45, 45, 41, 43][this.bar % 4];
    if (s % 8 === 0 || (I > 0.2 && s % 4 === 0)) this.drum(t, 'kick', 0.55);
    if (I > 0.45 && s % 2 === 1) this.drum(t, 'hat', 0.3);
    if (I > 0.6 && (s === 4 || s === 12)) this.drum(t, 'snare', 0.5);
    if ([0, 3, 6, 8, 10, 12, 14].includes(s)) this.n('sawtooth', mtof(root - 12 + (s > 8 ? 7 : 0)), t, 0.16, 0.2, { filter: 400 + I * 700 });
    if (I > 0.75) this.n('square', mtof(root + 24 + [0, 3, 7, 10][s % 4]), t, 0.09, 0.05, { filter: 2500 });
    if (s === 0) this.n('triangle', mtof(root), t, 1.6, 0.08, { att: 0.3, filter: 900 });
  }
}
