// Mosquito buzz (spec §7): "mosq" bus -> compressor -> master, MAX_VOICES persistent HRTF voices re-targeted every
// RETARGET s to the nearest flying mosquitoes. Positions are fed in camera space (listener at the origin, facing -Z).
// The graph is built once: retargeting, muting and deaths never create nodes, so nothing leaks from floor to floor.
import { MAX_VOICES, RETARGET, SWAP, VOICE_TYPES, assignSlots, busGain, patchOf, pickNearest, sanitizePreset, telegraph, voiceFreq } from './MosquitoPatch.js';

const _p = [0, 0, 0], _v = [0, 0, 0];

// saw + triangle (+ growl) -> wingbeat AM -> formant bandpass + dry -> lowpass -> envelope -> HRTF panner
class Voice {
  constructor(o) {
    const c = o.ctx, N = (n) => { o.nodes++; return n; };
    this.o = o; this.e = null; this.pending = null; this.mode = 'idle'; this.until = 0; this.linked = false; this.fresh = false; this.type = ''; this.f = 0;
    this.saw = N(c.createOscillator()); this.saw.type = 'sawtooth';
    this.tri = N(c.createOscillator()); this.tri.type = 'triangle';
    this.sub = N(c.createOscillator()); this.sub.type = 'square'; // tyrant growl, silent for the others
    const sawG = N(c.createGain()), triG = N(c.createGain()), subLp = N(c.createBiquadFilter());
    sawG.gain.value = 0.55; triG.gain.value = 0.3; subLp.type = 'lowpass'; subLp.frequency.value = 320;
    this.subG = N(c.createGain()); this.subG.gain.value = 0;
    // wingbeat amplitude modulation: gain = (1 - depth) + depth * sin
    this.am = N(c.createGain()); this.amLfo = N(c.createOscillator()); this.amDepth = N(c.createGain());
    this.amLfo.connect(this.amDepth); this.amDepth.connect(this.am.gain);
    // vibrato, depth in Hz for each oscillator
    this.vib = N(c.createOscillator()); this.vibG = [N(c.createGain()), N(c.createGain()), N(c.createGain())];
    [this.saw, this.tri, this.sub].forEach((os, i) => { this.vib.connect(this.vibG[i]); this.vibG[i].connect(os.frequency); });
    this.saw.connect(sawG); sawG.connect(this.am); this.tri.connect(triG); triG.connect(this.am);
    this.sub.connect(subLp); subLp.connect(this.subG); this.subG.connect(this.am);
    this.bp = N(c.createBiquadFilter()); this.bp.type = 'bandpass';
    const dry = N(c.createGain()); dry.gain.value = 0.35;
    this.lp = N(c.createBiquadFilter()); this.lp.type = 'lowpass';
    this.env = N(c.createGain()); this.env.gain.value = 0;
    this.pan = N(c.createPanner()); Object.assign(this.pan, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1.2, maxDistance: 30, rolloffFactor: 1.4 });
    this.am.connect(this.bp); this.am.connect(dry); this.bp.connect(this.lp); dry.connect(this.lp); this.lp.connect(this.env); this.env.connect(this.pan);
    this.setType('mosquito', c.currentTime);
    for (const os of [this.saw, this.tri, this.sub, this.amLfo, this.vib]) os.start();
  }
  // an idle voice is unplugged from the bus: the browser stops rendering its branch
  link(on) { if (on === this.linked) return; this.linked = on; if (on) this.pan.connect(this.o.bus); else this.pan.disconnect(); }
  setType(type, t) {
    this.type = VOICE_TYPES[type] ? type : 'mosquito';
    const T = VOICE_TYPES[this.type];
    this.amLfo.frequency.setValueAtTime(T.am, t); this.subG.gain.setValueAtTime(T.growl ? 0.5 : 0, t);
    this.apply(patchOf(this.o.preset), t, true);
  }
  apply(P, t, now = false) {
    const f = VOICE_TYPES[this.type].f0 * P.pitch, set = (p, v) => (now ? p.setValueAtTime(v, t) : p.setTargetAtTime(v, t, 0.05));
    set(this.am.gain, 1 - P.am); set(this.amDepth.gain, P.am); set(this.vib.frequency, P.vibRate);
    [1, 2.01, 0.5].forEach((k, i) => set(this.vibG[i].gain, f * k * P.vib));
    set(this.bp.Q, P.q); set(this.lp.frequency, P.lp);
  }
  // the voice's next bug (null = fall silent); switching bug fades out over SWAP first
  target(e, t) {
    if (this.mode === 'demo') return;
    if (this.mode === 'idle') { if (e) this.start(e, t); return; }
    if (this.mode === 'on') { if (e === this.e) return; this.fade(t, SWAP); }
    this.pending = e;
  }
  fade(t, dur) { this.env.gain.setTargetAtTime(0, t, dur / 4); this.e = null; this.mode = 'fade'; this.until = t + dur; }
  start(e, t) { this.pending = null; this.e = e; this.mode = 'on'; this.fresh = true; if (e.type !== this.type) this.setType(e.type, t); this.link(true); }
  tick(t) {
    if ((this.mode !== 'fade' && this.mode !== 'demo') || t < this.until) return;
    const e = this.pending; this.pending = null;
    if (e && !e.dying) this.start(e, t); else { this.mode = 'idle'; this.link(false); }
  }
  // per frame while 'on': camera-space position (m), radial speed (m/s), telegraph 0..1
  follow(x, y, z, vr, tele, t) {
    const f = voiceFreq(this.type, this.o.preset, tele, vr), T = VOICE_TYPES[this.type], P = this.pan;
    const set = this.fresh ? (p, v) => p.setValueAtTime(v, t) : (p, v, tc) => p.setTargetAtTime(v, t, tc);
    set(this.saw.frequency, f, 0.03); set(this.tri.frequency, f * 2.01, 0.03); set(this.sub.frequency, f * 0.5, 0.03); set(this.bp.frequency, f * 1.6, 0.05);
    set(P.positionX, x, 0.02); set(P.positionY, y, 0.02); set(P.positionZ, z, 0.02);
    this.env.gain.setTargetAtTime(T.lvl * (1 + 0.35 * tele), t, this.fresh ? SWAP / 4 : 0.03);
    this.fresh = false; this.f = f;
  }
  // death: descending "pfiou", then the voice is free again
  pfiou(t) {
    const f = this.f || VOICE_TYPES[this.type].f0, g = this.env.gain, lvl = VOICE_TYPES[this.type].lvl;
    [[this.saw, 1], [this.tri, 2.01], [this.sub, 0.5]].forEach(([os, k]) => { const p = os.frequency; p.cancelScheduledValues(t); p.setValueAtTime(f * k, t); p.exponentialRampToValueAtTime(f * k * 0.28, t + 0.5); });
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(lvl * 1.3, t + 0.06); g.linearRampToValueAtTime(0, t + 0.55);
    this.e = null; this.mode = 'fade'; this.until = t + 0.6;
  }
  // settings preview: one mosquito crossing from left to right in front of the listener
  demo(t) {
    this.setType('mosquito', t); this.link(true); this.e = null; this.pending = null; this.mode = 'demo'; this.until = t + 1.7;
    const f = voiceFreq('mosquito', this.o.preset), lvl = VOICE_TYPES.mosquito.lvl, P = this.pan, g = this.env.gain;
    [[this.saw, 1], [this.tri, 2.01], [this.sub, 0.5], [this.bp, 1.6]].forEach(([n, k]) => { n.frequency.cancelScheduledValues(t); n.frequency.setValueAtTime(f * k, t); });
    [[P.positionX, -4, 4], [P.positionY, 0.4, 0.4], [P.positionZ, -1.5, -1.5]].forEach(([p, a, b]) => { p.cancelScheduledValues(t); p.setValueAtTime(a, t); p.linearRampToValueAtTime(b, t + 1.6); });
    g.cancelScheduledValues(t); g.setValueAtTime(0, t); g.linearRampToValueAtTime(lvl, t + 0.2); g.setValueAtTime(lvl, t + 1.35); g.linearRampToValueAtTime(0, t + 1.6);
    this.f = f;
  }
}

export class MosquitoVoices {
  constructor(ctx, dest) {
    this.ctx = ctx; this.nodes = 0; this.preset = 'doux'; this.vol = 0; this.on = false; this.next = 0;
    this.bus = ctx.createGain(); this.bus.gain.value = 0;
    const k = (this.comp = ctx.createDynamicsCompressor());
    k.threshold.value = -14; k.knee.value = 10; k.ratio.value = 4; k.attack.value = 0.005; k.release.value = 0.2;
    this.bus.connect(k); k.connect(dest); this.nodes += 2;
    this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(this));
  }
  // Settings: "Moustiques" volume 0..1 + preset id
  set(vol, preset) {
    const t = this.ctx.currentTime, id = sanitizePreset(preset), g = busGain(vol, id), changed = id !== this.preset;
    this.vol = vol; this.preset = id; this.on = g > 0;
    this.bus.gain.setTargetAtTime(g, t, 0.05);
    if (changed) for (const v of this.voices) v.apply(patchOf(id), t);
  }
  // per frame: list = enemies (null: every voice falls silent), cam = THREE camera, vel = listener velocity (m/s)
  update(list, cam, vel) {
    const t = this.ctx.currentTime;
    if (!list || !cam || !this.on) { for (const v of this.voices) { v.target(null, t); v.tick(t); } return; }
    const M = cam.matrixWorldInverse.elements;
    const local = (p, o) => { o[0] = M[0] * p.x + M[4] * p.y + M[8] * p.z + M[12]; o[1] = M[1] * p.x + M[5] * p.y + M[9] * p.z + M[13]; o[2] = M[2] * p.x + M[6] * p.y + M[10] * p.z + M[14]; return o; };
    if (t >= this.next) {
      this.next = t + RETARGET;
      const chosen = pickNearest(list, MAX_VOICES, (e) => Math.hypot(...local(e.pos, _p)));
      assignSlots(this.voices.map((v) => (v.mode === 'on' ? v.e : v.pending)), chosen).forEach((e, i) => this.voices[i].target(e, t));
    }
    for (const v of this.voices) {
      v.tick(t);
      if (v.mode !== 'on') continue;
      const e = v.e;
      if (e.dying) { v.pfiou(t); continue; }
      local(e.pos, _p);
      const rx = e.vel.x - (vel ? vel.x : 0), ry = e.vel.y - (vel ? vel.y : 0), rz = e.vel.z - (vel ? vel.z : 0);
      _v[0] = M[0] * rx + M[4] * ry + M[8] * rz; _v[1] = M[1] * rx + M[5] * ry + M[9] * rz; _v[2] = M[2] * rx + M[6] * ry + M[10] * rz;
      const d = Math.hypot(_p[0], _p[1], _p[2]) || 1;
      v.follow(_p[0], _p[1], _p[2], (_p[0] * _v[0] + _p[1] * _v[1] + _p[2] * _v[2]) / d, telegraph(e), t);
    }
  }
  // settings: let the player hear the chosen preset
  preview() {
    if (!this.on) return;
    const v = this.voices.find((x) => x.mode === 'idle');
    if (v) v.demo(this.ctx.currentTime);
  }
  stats() {
    return { nodes: this.nodes, preset: this.preset, vol: this.vol, bus: +this.bus.gain.value.toFixed(3), linked: this.voices.filter((v) => v.linked).length,
      modes: this.voices.map((v) => v.mode), types: this.voices.map((v) => (v.e ? v.e.type : null)), freqs: this.voices.map((v) => Math.round(v.f)) };
  }
}
