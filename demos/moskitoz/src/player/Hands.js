// First-person viewmodel: cartoon "Mickey" white gloves (toon shaded + inked outline), gadgets, springy animation.
import * as THREE from 'three';
import { Spring, lerp, clamp, damp } from '../core/core.js';
import { gomme, inkHull, part, flat, sphere, torus, capsule, roundedBox } from '../render/Style.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SIGNAL } from '../level/Biomes.js';
import { makeGloves, makeTwinAcid, ghostHandGeometry, POSES } from './ViewModel.js';

const toon = (color) => gomme(color, { ao: 1, rim: 0.15 });
const white = toon(0xe4e7f2);
const black = new THREE.MeshBasicMaterial({ color: SIGNAL.ink });

// mesh + constant-width ink hull (cartoon line)
function inked(geo, mat = white) {
  const g = new THREE.Group();
  g.add(inkHull(geo, SIGNAL.ink, 2.6), new THREE.Mesh(geo, mat));
  return g;
}
const seg = (r, len) => { const g = new THREE.CapsuleGeometry(r, len, 6, 12); g.rotateX(Math.PI / 2); return g; };

// ---- held items ----
// Every item is built in the camera-aligned frame with its ORIGIN at the centre of the closed fist (grip axis vertical, muzzle / head
// toward -z). The hand is rolled a quarter turn (palm inward, thumb up) and the item's mount counter-rolls, so a grip axis that is
// vertical in this frame runs through the knuckle line of the fist. Pitch / yaw come from GRIPS below and carry the item with the hand.
// tools/hands-view.html?w=<weapon>&v=fps|side|top|front shows each one.
const rodMat = () => toon(0x4b3a7a);
const rod = (h = 0.12, y = -0.01) => { const r = inked(new THREE.CylinderGeometry(0.024, 0.024, h, 12), rodMat()); r.position.y = y; return r; };

function makeRacket() { // handle in the fist, oval head standing above it, turned a little so the net reads from behind
  const g = new THREE.Group();
  const grip = inked(capsule(0.021, 0.2, 4, 12), toon(0x4b3a7a)); grip.position.y = 0.06; g.add(grip); // wrapped grip
  g.add(new THREE.Mesh(mergeGeometries([-0.02, 0.05, 0.12].map((y) => new THREE.TorusGeometry(0.022, 0.006, 6, 18).rotateX(Math.PI / 2).translate(0, y, 0))), toon(0xb8a8ff)));
  const cap = inked(sphere(0.027, 14, 10), toon(0xffc62e)); cap.position.y = -0.07; g.add(cap); // pommel
  const dark = toon(0x2a2438), shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.016, 0.07, 10), dark); shaft.position.y = 0.2; g.add(shaft); // tiny parts: no ink
  const head = new THREE.Group(); head.position.y = 0.355; head.rotation.y = 0.75; g.add(head);
  head.add(new THREE.Mesh(mergeGeometries([-1, 1].map((s) => new THREE.CylinderGeometry(0.008, 0.01, 0.07, 8).rotateZ(-s * 0.5).translate(s * 0.02, -0.115, 0))), dark)); // throat
  const ring = inked(torus(0.125, 0.019, 10, 32), toon(0xffc62e)); ring.scale.set(0.85, 1.05, 1); head.add(ring);
  const inner = new THREE.Mesh(torus(0.106, 0.005, 6, 32), flat(SIGNAL.sky)); inner.scale.set(0.85, 1.05, 1); head.add(inner);
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
  c.strokeStyle = '#8ff'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 8, 0); c.lineTo(i * 8, 64); c.moveTo(0, i * 8); c.lineTo(64, i * 8); c.stroke(); }
  const net = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), color: 0x66ccff, transparent: true, forceSinglePass: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  net.scale.set(0.85, 1.05, 1); head.add(net);
  // electric arcs crackling on the frame (flicker in Hands.update, wilder during the Grande Claque)
  const bolt = new THREE.ShapeGeometry(new THREE.Shape([[0, 0], [0.016, 0.032], [0.005, 0.032], [0.018, 0.066], [-0.008, 0.027], [0.004, 0.027], [-0.006, 0]].map(([x, y]) => new THREE.Vector2(x, y)))), boltMat = flat(SIGNAL.acid, { side: THREE.DoubleSide });
  const sparks = [0.3, 2.2, 4.1].map((a) => { const l = new THREE.Mesh(bolt, boltMat); l.position.set(Math.cos(a) * 0.118, Math.sin(a) * 0.145, 0.004); l.rotation.z = a - Math.PI / 2; head.add(l); return l; });
  g.userData.net = net; g.userData.sparks = sparks;
  return g;
}
const lathe2 = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const flatShape = (pts) => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));
const merged = (list) => mergeGeometries(list);
function makeSpray() { // aerosol can gripped round the middle: shaped can, white label with a green leaf, steel shoulder, button and spout
  const g = new THREE.Group(), red = toon(0xe03a2c), steel = toon(0xd4dce6);
  const can = inked(lathe2([[0, -0.07], [0.034, -0.07], [0.039, -0.06], [0.039, 0.1], [0.033, 0.12], [0.018, 0.135], [0, 0.135]]), red); can.position.y = 0.0; g.add(can);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.0395, 0.0395, 0.08, 20, 1, true), toon(0xfff6e8)); label.position.y = 0.02; g.add(label);
  const stripes = new THREE.Mesh(merged([0.064, -0.024].map((y) => new THREE.CylinderGeometry(0.0398, 0.0398, 0.008, 20, 1, true).translate(0, y, 0))), red); g.add(stripes);
  const leaf = new THREE.Mesh(flatShape([[0, -0.022], [0.012, -0.006], [0.01, 0.012], [0, 0.024], [-0.01, 0.012], [-0.012, -0.006]]), toon(0x46c27a)); leaf.position.set(0, 0.02, -0.0402); leaf.rotation.y = Math.PI; g.add(leaf); // facing the muzzle side
  const shoulder = inked(new THREE.TorusGeometry(0.033, 0.006, 6, 20).rotateX(Math.PI / 2), steel); shoulder.position.y = 0.118; g.add(shoulder);
  const button = inked(new THREE.CylinderGeometry(0.014, 0.016, 0.026, 12), white); button.position.y = 0.146; g.add(button);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.02, 8).rotateX(Math.PI / 2), toon(0x2a2438)); spout.position.set(0, 0.152, -0.016); g.add(spout);
  return g;
}
function makeTrap() { // glue puck on the open palm: honey disc with a darker rim, sticky bubbles and drips over the edge
  const g = new THREE.Group(), honey = toon(0xffd23c), rim = toon(0xe8a21c);
  const d = inked(new THREE.CylinderGeometry(0.1, 0.095, 0.025, 24), honey); d.position.y = 0.07; g.add(d);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.097, 0.009, 6, 28).rotateX(Math.PI / 2), rim); ring.position.y = 0.083; g.add(ring);
  g.add(new THREE.Mesh(merged([[0.03, 0.02, 0.014], [-0.04, -0.01, 0.01], [0.0, -0.05, 0.012], [-0.02, 0.05, 0.008], [0.055, -0.03, 0.009]].map(([x, z, r]) => new THREE.SphereGeometry(r, 8, 6).translate(x, 0.085, z))), toon(0xfff0a0)));
  g.add(new THREE.Mesh(merged([0.6, 2.4, 4.1].map((a) => new THREE.CapsuleGeometry(0.008, 0.018, 3, 6).translate(Math.cos(a) * 0.1, 0.058, Math.sin(a) * 0.1))), honey)); // drips
  return g;
}

// arsenal v2: vacuum cannon and citronella launcher are held by a pistol grip; the swatter by its handle
function makeAspi() { // retro vacuum blaster: lavender tank with a dome window, side vents, ribbed chrome nozzle, acid mouth, gauge
  const g = new THREE.Group(), lav = toon(0xb98cff), lavD = toon(0x7a52c8), chrome = toon(0xe9e0ff), dark = toon(0x2e2a48);
  g.add(rod(0.14, -0.005));
  const tank = inked(new THREE.CapsuleGeometry(0.07, 0.16, 4, 14).rotateX(Math.PI / 2), lav); tank.position.set(0, 0.115, 0.01); g.add(tank);
  const dome = inked(new THREE.SphereGeometry(0.045, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat('#DDF7FF')); dome.position.set(0, 0.178, 0.03); g.add(dome);
  const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 5, 14, 4.5), flat(SIGNAL.acid)); swirl.rotation.x = -Math.PI / 2; swirl.position.set(0, 0.19, 0.03); g.add(swirl);
  g.add(new THREE.Mesh(merged([-0.03, 0, 0.03].flatMap((z) => [-1, 1].map((s) => new THREE.BoxGeometry(0.012, 0.012, 0.022).translate(s * 0.069, 0.115, 0.06 + z)))), dark)); // vents
  const noz = inked(new THREE.CylinderGeometry(0.04, 0.06, 0.26, 14).rotateX(Math.PI / 2), chrome); noz.position.set(0, 0.115, -0.22); g.add(noz);
  g.add(new THREE.Mesh(merged([-0.15, -0.21, -0.27].map((z, i) => new THREE.TorusGeometry(0.056 - i * 0.006, 0.008, 6, 18).translate(0, 0.115, z))), lavD)); // ribs
  const mouth = inked(new THREE.TorusGeometry(0.06, 0.018, 8, 18), toon(0x2e2a48)); mouth.position.set(0, 0.115, -0.35); g.add(mouth);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 18), flat(SIGNAL.acid)); lip.position.set(0, 0.115, -0.362); g.add(lip);
  // back end (what the player sees): chrome ring, dark fan grill, acid power light
  const back = inked(new THREE.TorusGeometry(0.058, 0.012, 8, 22), chrome); back.position.set(0, 0.115, 0.15); g.add(back);
  const fan = new THREE.Mesh(merged([new THREE.CircleGeometry(0.05, 20), new THREE.BoxGeometry(0.09, 0.012, 0.004).translate(0, 0, 0.004), new THREE.BoxGeometry(0.012, 0.09, 0.004).translate(0, 0, 0.004)]), dark); fan.position.set(0, 0.115, 0.152); g.add(fan);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), flat(SIGNAL.acid)); light.position.set(0.04, 0.16, 0.13); g.add(light);
  const gauge = inked(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 14).rotateX(Math.PI / 2), white); gauge.position.set(0.05, 0.16, -0.05); gauge.rotation.y = -0.6; g.add(gauge);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.016, 0.002), flat(SIGNAL.coral)); needle.position.set(0, 0.004, -0.007); needle.rotation.z = -0.6; gauge.add(needle);
  return g;
}
function makeTapette() { // fly swatter: looped handle with a grip, wire neck, rounded red head with a raised rim and punched holes
  const g = new THREE.Group(), red = toon(0xff5b4a), redD = toon(0xc8382e);
  const handle = inked(new THREE.CylinderGeometry(0.016, 0.013, 0.42, 10), toon(0xffe0dc)); handle.position.y = 0.17; g.add(handle);
  const grip = inked(new THREE.CapsuleGeometry(0.02, 0.1, 3, 10), toon(0x4b3a7a)); grip.position.y = 0.0; g.add(grip);
  const loop = inked(new THREE.TorusGeometry(0.022, 0.006, 6, 16), toon(0x4b3a7a)); loop.position.y = -0.085; g.add(loop);
  g.add(new THREE.Mesh(merged([-1, 1].map((s) => new THREE.CylinderGeometry(0.005, 0.005, 0.07, 6).rotateZ(-s * 0.35).translate(s * 0.012, 0.41, 0))), toon(0x9aa8b4))); // wire neck
  const head = inked(roundedBox(0.3, 0.26, 0.02, 0.05), gomme(0xff5b4a, { ao: 1, rim: 0.2, pattern: 'grid', color2: '#C8382E', scale: 0.03 })); head.position.y = 0.55; g.add(head);
  const frame = new THREE.Mesh(merged([[0, 0.12, 0.3, 0.025], [0, -0.12, 0.3, 0.025], [0.14, 0, 0.025, 0.26], [-0.14, 0, 0.025, 0.26]].map(([x, y, w, h]) => roundedBox(w, h, 0.03, 0.01).translate(x, y, 0))), redD); frame.position.y = 0.55; g.add(frame);
  return g;
}
function makeCitro() { // citronella launcher: lime barrel with darker rings, a lemon-slice muzzle and a glowing wick, leaf on top
  const g = new THREE.Group(), lime = toon(0x8ae05a), limeD = toon(0x5cb83a), lemon = toon(0xffe45a);
  g.add(rod(0.14, -0.005));
  const tube = inked(new THREE.CylinderGeometry(0.055, 0.065, 0.36, 16).rotateX(Math.PI / 2), lime); tube.position.set(0, 0.125, -0.09); g.add(tube);
  g.add(new THREE.Mesh(merged([0.05, -0.04, -0.13].map((z) => new THREE.TorusGeometry(0.063, 0.009, 6, 18).translate(0, 0.125, z))), limeD));
  const band = inked(new THREE.CylinderGeometry(0.072, 0.072, 0.05, 18).rotateX(Math.PI / 2), lemon); band.position.set(0, 0.125, -0.25); g.add(band);
  const slice = new THREE.Mesh(merged([0, 1, 2, 3, 4, 5].map((i) => new THREE.BoxGeometry(0.004, 0.06, 0.002).rotateZ((i * Math.PI) / 6).translate(0, 0, 0))), white); slice.position.set(0, 0.125, -0.276); g.add(slice); // lemon segments
  const wick = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb030 })); wick.position.set(0, 0.125, -0.3); wick.scale.set(1, 1.5, 1); g.add(wick); g.userData.flame = wick;
  // back end (what the player sees): drum with three loaded candles
  const drum = inked(new THREE.CylinderGeometry(0.068, 0.068, 0.03, 18).rotateX(Math.PI / 2), limeD); drum.position.set(0, 0.125, 0.1); g.add(drum);
  g.add(new THREE.Mesh(merged([0, 1, 2].map((i) => new THREE.CylinderGeometry(0.014, 0.014, 0.02, 10).rotateX(Math.PI / 2).translate(Math.cos(i * 2.094 + 0.5) * 0.034, 0.125 + Math.sin(i * 2.094 + 0.5) * 0.034, 0.12))), toon(0xffe45a)));
  g.add(new THREE.Mesh(merged([0, 1, 2].map((i) => new THREE.SphereGeometry(0.006, 6, 5).translate(Math.cos(i * 2.094 + 0.5) * 0.034, 0.125 + Math.sin(i * 2.094 + 0.5) * 0.034, 0.131))), toon(0x8a5a34))); // wicks
  const leaf = inked(new THREE.SphereGeometry(0.03, 10, 6).scale(1, 0.35, 1.8), toon(0x46c27a)); leaf.position.set(0.015, 0.19, 0.02); leaf.rotation.y = 0.5; g.add(leaf);
  return g;
}

function makeBomb() { // the ultra: a big can, nozzle up, held low on the body
  const g = new THREE.Group(), b = new THREE.Group(); b.position.y = 0.06; g.add(b);
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#d7262d'; c.fillRect(0, 0, 128, 10); c.fillRect(0, 54, 128, 10);
  c.fillStyle = '#111'; c.font = 'bold 17px Impact, Arial'; c.textAlign = 'center'; c.fillText('ANTI', 64, 28); c.fillText('MOUSTIQUES', 64, 46);
  const lab = new THREE.CanvasTexture(cv); lab.colorSpace = THREE.SRGBColorSpace;
  const red = toon(0xe8352a), yel = toon(0xffd23c);
  const body = inked(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 20), red, 1.07); b.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0615, 0.0615, 0.17, 20, 1, true), new THREE.MeshBasicMaterial({ map: lab })); band.position.y = 0.01; band.rotation.y = Math.PI; b.add(band);
  const sh = inked(new THREE.CylinderGeometry(0.03, 0.06, 0.06, 20), red, 1.1); sh.position.y = 0.2; b.add(sh);
  const cap = inked(new THREE.CylinderGeometry(0.028, 0.028, 0.06, 16), yel, 1.12); cap.position.y = 0.26; b.add(cap);
  const noz = inked(new THREE.BoxGeometry(0.02, 0.014, 0.04), toon(0x222233), 1.2); noz.position.set(0, 0.29, -0.02); b.add(noz);
  return g;
}

// Grip per weapon: roll = how far the glove turns about the forearm (right hand clockwise, left the other way; the arm itself never
// moves), tilt = item pitch about the fist (negative leans it forward), both = pistols in two hands. No entry = flat glove (trap).
const GRIPS = {
  jumeaux: { both: true, roll: 1.3, tilt: 0 },
  racket: { roll: 1.3, tilt: -0.75 }, tapette: { roll: 1.3, tilt: -0.4 },
  spray: { roll: 1.3, tilt: -0.8 }, bomb: { roll: 1.3, tilt: -0.8 },
  aspi: { roll: 1.3, tilt: 0 }, citro: { roll: 1.3, tilt: 0 },
};
const GUN_S = 1.35; // pistols a bit oversized so they read at arm's length
const GRIP_POSE = [0.8, 1.0, 1.02, 0.72, 0]; // pistol grip: only the trigger finger stays a little open
const HOLE = new THREE.Vector3(0, -0.02, -0.07), AXZ = new THREE.Vector3(0, 0, 1); // centre of the closed fist, glove space
// where the fist sits in the counter-rolled (camera-aligned) mount frame
const holeFor = (roll) => HOLE.clone().applyAxisAngle(AXZ, roll);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// pool of fading violet glove silhouettes (Mille Claques afterimages)
function ghostPool(parent, n = 14) {
  const geos = { 1: ghostHandGeometry(1), '-1': ghostHandGeometry(-1) }, list = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), fm = new THREE.MeshBasicMaterial({ color: '#F1ECFF', transparent: true, depthWrite: false }), om = new THREE.MeshBasicMaterial({ color: SIGNAL.violet, transparent: true, depthWrite: false, side: THREE.BackSide });
    const fill = new THREE.Mesh(geos[1], fm), out = new THREE.Mesh(geos[1], om); out.scale.setScalar(1.13);
    g.add(out, fill); g.visible = false; g.renderOrder = 3; g.traverse((o) => { o.frustumCulled = false; }); parent.add(g);
    list.push({ g, fill, out, fm, om, t: 0 });
  }
  let k = 0;
  return {
    spawn(hand) {
      const G = list[k]; k = (k + 1) % list.length;
      const geo = geos[hand.side]; G.fill.geometry = geo; G.out.geometry = geo;
      G.g.position.copy(hand.g.position); G.g.quaternion.copy(hand.g.quaternion); G.g.scale.copy(hand.g.scale);
      G.t = 0; G.g.visible = true;
    },
    update(dt) {
      for (const G of list) {
        if (!G.g.visible) continue;
        G.t += dt; const k2 = G.t / 0.22;
        if (k2 >= 1) { G.g.visible = false; continue; }
        G.fm.opacity = 0.5 * (1 - k2); G.om.opacity = 0.75 * (1 - k2);
      }
    },
  };
}

export class Hands {
  constructor(camera) {
    this.root = new THREE.Group(); camera.add(this.root);
    this.gloves = makeGloves(); this.root.add(this.gloves.root); this.hands = { R: this.gloves.hands.R, L: this.gloves.hands.L };
    this.base = { R: new THREE.Vector3(0.3, -0.27, -0.5), L: new THREE.Vector3(-0.3, -0.27, -0.5) };
    this.sp = {};
    for (const k of ['R', 'L']) {
      this.sp[k] = { p: [0, 1, 2].map((i) => new Spring(this.base[k].getComponent(i), 300, 20)), r: [0, 1, 2].map(() => new Spring(0, 260, 18)), curl: new Spring(0.55, 260, 20), idx: new Spring(0.55, 500, 26), sc: new Spring(1.15, 320, 14) };
    }
    this.racket = makeRacket(); this.spray = makeSpray(); this.trap = makeTrap(); this.bomb = makeBomb(); this.aspi = makeAspi(); this.tapette = makeTapette(); this.citro = makeCitro(); this.twin = makeTwinAcid(); this.twin.attach(this.gloves); this.twin.show(false);
    const flat0 = new THREE.Vector3();
    for (const [id, w] of Object.entries({ racket: this.racket, spray: this.spray, trap: this.trap, bomb: this.bomb, aspi: this.aspi, tapette: this.tapette, citro: this.citro })) {
      w.visible = false; w.position.copy(GRIPS[id] ? holeFor(-GRIPS[id].roll) : HOLE); if (GRIPS[id]) w.rotation.x = GRIPS[id].tilt; this.hands.R.mount.add(w); // tilt the item, never the arm
    }
    for (const k of ['L', 'R']) { const side = k === 'R' ? 1 : -1, gun = this.twin[k].g; gun.position.copy(holeFor(-side * GRIPS.jumeaux.roll)).sub(flat0.set(0, -0.022, -0.042).multiplyScalar(GUN_S)); gun.scale.setScalar(GUN_S); } // pistol handle centre in the fist
    this.ghosts = ghostPool(this.gloves.root);
    // Doigt-Canon charge orb on the index fingertip (acid bubble + two spinning rings), driven by pose 'point' + charge
    this.orb = new THREE.Group(); this.hands.R.fingers[0].userData.tip.add(this.orb); this.orb.visible = false;
    this.orb.add(part(sphere(1, 24, 18), flat(SIGNAL.acid), { ink: SIGNAL.ink, px: 3, cast: false, receive: false }));
    const core = new THREE.Mesh(sphere(0.55, 16, 12), flat(SIGNAL.acidCore)); core.position.set(-0.25, 0.25, 0.45); this.orb.add(core);
    this.orbRings = [0, 1].map((i) => { const r = new THREE.Mesh(torus(1.6, 0.09, 8, 36), flat(i ? SIGNAL.acidCore : SIGNAL.acid)); this.orb.add(r); return r; });
    this.orb.traverse((o) => { o.frustumCulled = false; });
    this.pose = null; // 'point': finger gun held (Doigt-Canon)
    this.anim = { R: null, L: null }; this.charge = 0; this.t = 0; this.weapon = 'hands'; this.eff = 'hands'; this.hol = false; this.holsterT = 0;
    this.grow = new Spring(1, 260, 18); this.growT = 0; // racket size (Grande Claque)
  }
  // kind: jab | slap | flick | clap | power | racket | spray | trap | shoot | swat | lob
  attack(hand, kind, dur = 0.22) { this.anim[hand] = { kind, t: 0, dur }; }
  /** Grande Claque: the racket swells to k times its size for dur seconds (springs back after). */
  growRacket(k, dur) { this.grow.t = k; this.growT = dur; }
  setWeapon(w) { this.weapon = w; this.vis(); }
  /** A hand power (Doigt-Canon, Mille Claques, Clap…) uses bare hands: the held weapon is put away while it plays, then comes back. */
  holster(dur) { this.holsterT = Math.max(this.holsterT, dur); }
  vis() { const w = this.eff = this.hol ? 'hands' : this.weapon; this.racket.visible = w === 'racket'; this.spray.visible = w === 'spray'; this.trap.visible = w === 'trap'; this.bomb.visible = w === 'bomb'; this.aspi.visible = w === 'aspi'; this.tapette.visible = w === 'tapette'; this.citro.visible = w === 'citro'; this.twin.show(w === 'jumeaux'); }
  /** Gauge needle + acid level of the twin pistols, 0..1. */
  setPressure(p) { this.twin.setPressure(p); }
  /** Ink-violet afterimage of a glove (Mille Claques). */
  ghost(k) { this.ghosts.spawn(this.hands[k]); }

  update(dt, s) {
    this.t += dt; this.holsterT -= dt;
    const hol = this.holsterT > 0 || !!this.pose; if (hol !== this.hol) { this.hol = hol; this.vis(); }
    for (const k of ['R', 'L']) {
      const side = k === 'R' ? 1 : -1, b = this.base[k], sp = this.sp[k], a = this.anim[k];
      let ox = 0, oy = 0, oz = 0, rx = 0, ry = 0, rz = 0, curl = this.eff === 'jumeaux' || (this.eff !== 'hands' && k === 'R') ? 0.9 : 0.55, idx = null, sc = 1.15, sz = 1;
      // idle: walk sway + breathing
      ox += Math.cos(s.bobPhase) * 0.014 * s.bobAmp * side; oy += Math.abs(Math.sin(s.bobPhase)) * -0.016 * s.bobAmp + Math.sin(this.t * 1.6 + side) * 0.004;
      oz += Math.sin(s.bobPhase * 2) * 0.007 * s.bobAmp;
      rz += -side * 0.06;
      if (this.eff === 'bomb') { curl = 0.95; oy += 0.03; oz += 0.05; rx += 0.05; if (s.spraying) { oz += 0.045 + Math.sin(this.t * 70) * 0.008; oy += Math.sin(this.t * 55) * 0.006; ox += Math.sin(this.t * 63) * 0.005; } }
      const G = GRIPS[this.eff], gp = G && (G.both || k === 'R') ? G : null, h0 = this.hands[k];
      h0.roll = damp(h0.roll || 0, gp ? -side * gp.roll : 0, 16, dt); h0.mount.rotation.z = -h0.roll; // item stays camera-aligned while the glove rolls
      rz += h0.roll; // only the glove turns: arms keep their place at the bottom of the screen
      if (s.sprint) { oz += 0.05; oy -= 0.02; rx -= 0.3; curl = 0.7; }
      if (s.air) { oy += 0.04; rx += 0.2; curl = 0.2; }
      if (this.pose === 'point' && k === 'R') { // finger gun: index out, arm forward, trembling with the charge
        const c = this.charge; curl = 1; idx = -0.15; oz -= 0.04; oy += 0.075; ox -= 0.11; rx += 0.1; ry += 0.12; ox += (Math.random() - 0.5) * 0.012 * c; oy += (Math.random() - 0.5) * 0.012 * c;
      } else if (this.pose === 'beam') { // Onde: palms together in front, trembling while it charges
        const c = this.charge; curl = 0.05; ox += -side * 0.24; oz -= 0.16; oy += 0.05; rz += -side * 1.4; ry += side * 0.2; ox += (Math.random() - 0.5) * 0.01 * (c + 0.4); oy += (Math.random() - 0.5) * 0.01 * (c + 0.4);
      } else if (this.charge > 0 && !this.pose) { // wind-up: both fists pulled back, trembling, growing
        const c = this.charge;
        oz += 0.2 * c; oy -= 0.05 * c; ox += (-side * 0.06 + (Math.random() - 0.5) * 0.014) * c; rx += 0.6 * c; curl = 1; sc += 0.25 * c;
      }
      if (a) {
        a.t += dt; const p = Math.min(1, a.t / a.dur);
        const out = Math.sin(Math.min(1, p * 1.12) * Math.PI), eo = easeOut(p);
        curl = 1;
        if (a.kind === 'jab') { oz -= 0.6 * out; ox -= 0.18 * side * out; oy += 0.07 * out; rx += 0.1 * out; sc += 0.4 * out; sz = 1 + 0.35 * out; }
        else if (a.kind === 'slap') { // backhand sweep, open glove
          curl = 0.05; ox += side * lerp(0.36, -0.6, eo); oz -= 0.32 * out; oy += 0.05 * out; ry += side * lerp(-1.0, 1.0, eo); rz += side * lerp(0.9, -0.3, eo) - 0.6 * side * 0; sc += 0.45 * out; sz = 1 + 0.2 * out;
        } else if (a.kind === 'flick') { // pichenette: index cocked behind thumb, then snaps
          const w = clamp(p / 0.4, 0, 1), sn = clamp((p - 0.4) / 0.14, 0, 1), rc = clamp((p - 0.7) / 0.3, 0, 1);
          curl = 1; idx = p < 0.4 ? lerp(0.55, 2.0, w) : lerp(2.0, -0.35, easeOut(sn)) * (1 - rc) + 0.55 * rc;
          oz += 0.04 * w - 0.22 * Math.sin(sn * Math.PI) * (1 - rc); oy += 0.05 * w; rx += 0.25 * w - 0.5 * Math.sin(sn * Math.PI); ox -= 0.08 * side * w; sc += 0.15 * w;
        } else if (a.kind === 'clap') { // both gloves rise wide, then SLAM together in front of the face, hold, release
          let kk;
          if (p < 0.38) kk = -1.4 * easeOut(p / 0.38);
          else if (p < 0.52) kk = lerp(-1.4, 1, easeIn((p - 0.38) / 0.14));
          else if (p < 0.68) kk = 1;
          else kk = 1 - 2.4 * easeOut((p - 0.68) / 0.32);
          const meet = clamp(kk, 0, 1), wide = Math.max(0, -kk);
          curl = 0.02; ox += side * (-0.285 * meet + 0.32 * wide); oz += -0.1 - 0.2 * meet - 0.05 * wide; oy += -0.02 + 0.08 * wide - 0.04 * meet;
          rz += -side * 1.45; ry += side * (0.25 * meet - 0.35 * wide); rx += 0.1 - 0.25 * wide; sc -= 0.12 - 0.04 * meet; sz = 1 + 0.15 * meet;
        } else if (a.kind === 'mille') { // Mille Claques rush (sheet keyframes): glove cocked across the body, whips out open, snaps back
          const Wp = [side * 0.12, 0.05, 0.1, 0.9, side * 0.4, side * 0.6], Sx = [-side * 0.24, 0.16, -0.36, 1.35, 0, -side * 0.5];
          const [A, B, e] = p < 0.5 ? [Sx, Wp, easeInOut(p / 0.5)] : p < 0.72 ? [Wp, Sx, easeIn((p - 0.5) / 0.22)] : [Sx, Sx, 0];
          const v = A.map((x, i) => lerp(x, B[i], e));
          curl = 0.05; ox += v[0]; oy += v[1]; oz += v[2]; rx += v[3]; ry += v[4]; rz += v[5];
        } else if (a.kind === 'power') { oz -= 0.85 * out; oy += 0.12 * out; ox -= 0.22 * side * out; rx += 0.4 * out; sc += 0.7 * out; sz = 1 + 0.5 * out; }
        else if (a.kind === 'bigracket') { // Grande Claque: cocked high and wide behind the shoulder, then one big flat sweep across
          const w = clamp(p / 0.42, 0, 1), sw = clamp((p - 0.42) / 0.22, 0, 1), back = easeOut(w) * (1 - sw), hit = easeOut(sw) * (1 - clamp((p - 0.75) / 0.25, 0, 1));
          ox += 0.12 * back - 0.1 * hit; oy += 0.08 * back - 0.08 * hit; oz += 0.06 * back - 0.16 * hit; ry += -0.5 * back + 0.3 * hit; rz += 0.7 * back - 1.25 * hit; rx += -0.2 * back + 0.2 * hit; curl = 0.9; // net faces forward: the swing is a wiper arc
        }
        else if (a.kind === 'racket') { oz -= 0.3 * out; ox += side * lerp(0.28, -0.44, eo); ry += lerp(-0.8, 0.9, eo); rz += lerp(0.5, -0.6, eo); curl = 0.85; }
        else if (a.kind === 'spray') { oz -= 0.1 * out; oy += 0.04 * out; rx += 0.2 * out; curl = 0.9; }
        else if (a.kind === 'swat') { const up = Math.min(1, p / 0.55), dn = Math.max(0, (p - 0.55) / 0.2); oy += 0.16 * up - 0.3 * Math.min(1, dn); rx += 1.1 * up - 1.9 * Math.min(1, dn); oz += 0.05 * up - 0.12 * Math.min(1, dn); curl = 1; }
        else if (a.kind === 'lob') { oy += 0.1 * out; rx += 0.6 * out; oz -= 0.08 * out; curl = 0.9; }
        else if (a.kind === 'shoot') { oz += 0.07 * out; oy += 0.03 * out; rx += 0.4 * out; curl = 0.9; }
        else if (a.kind === 'trap') { oy -= 0.12 * out; oz -= 0.2 * out; rx += 0.5 * out; curl = 0.65; }
        if (p >= 1) this.anim[k] = null;
      }
      sp.p[0].t = b.x + ox; sp.p[1].t = b.y + oy; sp.p[2].t = b.z + oz;
      sp.r[0].t = -0.12 + rx; sp.r[1].t = -side * 0.18 + ry; sp.r[2].t = rz; sp.curl.t = curl; sp.idx.t = idx ?? curl; sp.sc.t = sc;
      const fast = a && (a.kind === 'clap' || a.kind === 'mille'); for (const q of sp.p) { q.k = fast ? 900 : 300; q.c = fast ? 48 : 20; }
      const h = this.hands[k], g = h.g;
      g.position.set(sp.p[0].update(dt), sp.p[1].update(dt), sp.p[2].update(dt));
      g.rotation.set(sp.r[0].update(dt), sp.r[1].update(dt), sp.r[2].update(dt));
      const s2 = sp.sc.update(dt); g.scale.set(s2, s2, s2 * sz);
      const c = sp.curl.update(dt), ic = sp.idx.update(dt);
      const tgt = this.pose === 'point' && k === 'R' ? POSES.point : this.eff === 'jumeaux' && !a ? GRIP_POSE : [ic, c, c * 1.05, c * 0.55, 0];
      for (let i = 0; i < 5; i++) h.cur[i] = damp(h.cur[i], tgt[i], 30, dt);
      this.gloves.apply(h);
    }
    this.twin.update(dt);
    const orb = this.orb, on = this.pose === 'point' && this.charge > 0;
    orb.visible = on;
    if (on) { const c = this.charge, t = this.t; orb.scale.setScalar(0.042 * easeOutBack(Math.min(1, c * 1.2)) * (1 + Math.sin(t * 42) * 0.07)); this.orbRings[0].rotation.set(t * 5, t * 3, 0); this.orbRings[1].rotation.set(-t * 4, 0.7, t * 6); }
    this.ghosts.update(dt);
    if ((this.growT -= dt) <= 0) this.grow.t = 1;
    const gs = this.grow.update(dt), big = clamp((gs - 1) / 1.4, 0, 1);
    if (this.citro.visible) this.citro.userData.flame.scale.set(1, 1.5 + Math.sin(this.t * 19) * 0.25, 1); // wick flicker
    if (this.racket.visible) {
      const u = this.racket.userData; this.racket.scale.setScalar(gs);
      u.net.material.opacity = 0.6 + Math.sin(this.t * 30) * 0.3 + big * 0.6;
      for (let i = 0; i < u.sparks.length; i++) { const s = u.sparks[i]; s.visible = Math.sin(this.t * (23 + i * 7) + i * 2) > 0.55 - big * 1.2; s.scale.setScalar(1 + big * 0.8); }
    }
  }
}
