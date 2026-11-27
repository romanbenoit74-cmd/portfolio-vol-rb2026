import"./modulepreload-polyfill-P2Xu9kJm.js";import{D as e,G as t,I as n,L as r,M as i,U as a,W as o,a as s,f as c,g as l,i as ee,j as te,m as ne,n as u,p as re,u as ie}from"./vecto-C9mCmiAl.js";var d={ligne:{n:`Ligne rouge (actuelle)`,mode:0,p:{duree:[1400,300,4e3,50]}},course:{n:`#2 Course des deux bouts`,mode:1,p:{duree:[1400,300,4e3,50],aplats:[.3,0,.6,.01],rencontre:[.5,0,1,.01],epaisseur:[0,0,6,.5]}},comete:{n:`#3 Comète`,mode:2,p:{duree:[1800,300,5e3,50],aplats:[.25,0,.6,.01],tete:[.03,.005,.15,.005],queue:[.25,0,1,.01],halo:[10,0,30,1],epaisseur:[1,0,6,.5]}},iris:{n:`#41 Iris`,mode:3,p:{duree:[1400,300,4e3,50],centreX:[.5,0,1,.01],centreY:[.85,0,1,.01],flou:[.01,0,.2,.005],lisere:[3,0,20,1],tenue:[.1,0,.5,.01]}},squash:{n:`#46 Squash et stretch`,mode:4,p:{duree:[1200,300,4e3,50],ecrase:[.3,0,.7,.01],etire:[.4,0,1,.01],rebond:[.5,0,1,.01],saut:[1.6,0,3,.05]}},smear:{n:`#45 Smear`,mode:5,p:{duree:[700,200,3e3,50],longueur:[.8,0,2,.02],angle:[0,-180,180,5],distance:[1.6,.2,4,.05],rouge:[.5,0,1,.01]}},flash:{n:`#102 Flash magnésium`,mode:6,p:{duree:[1e3,200,4e3,50],intensite:[1,0,1.5,.01],decroissance:[.3,.02,.5,.01],fumee:[.6,0,1,.01]}},rideau:{n:`#143 Rideau de scène`,mode:7,p:{duree:[2e3,500,5e3,50],plis:[9,2,30,1],drape:[.5,0,1,.01],tenue:[.12,0,.5,.01],ombre:[.6,0,1,.01]}},explosion:{n:`#63 Explosion / recomposition`,mode:8,p:{duree:[1800,400,5e3,50],rayon:[1.2,.1,3,.05],taille:[3,1,8,.5],tourbillon:[1.5,-6,6,.1],tenue:[.1,0,.5,.01]}},tire:{n:`#162 Tire l'écran`,mode:9,p:{duree:[1600,300,5e3,50],angle:[180,-180,180,5],plis:[6,0,20,1],ombre:[.7,0,1,.01],toile:[.012,0,.1,.002]}},encre:{n:`#21 Tache d'encre`,mode:10,p:{duree:[2200,500,6e3,50],taille:[.75,.2,1.5,.01],etalement:[1,0,3,.05],irregularite:[.6,0,1.5,.01],rouge:[1,0,1,.01],gouttes:[.6,0,1,.01]}},projecteur:{n:`#101 Projecteur`,mode:11,p:{duree:[1800,300,5e3,50],rayon:[.38,.05,1,.01],bord:[.25,0,1,.01],noir:[.92,0,1,.01],trajet:[.9,0,2,.02],souris:[0,0,1,1],cone:[.6,0,1,.01]}},paravent:{n:`#161 Paravent`,mode:12,p:{duree:[2600,800,6e3,50],objets:[4,0,6,1],rythme:[1,.5,2,.05],hauteur:[1.05,.5,1.3,.01]}}},f={sensibilite:[1,.1,4,.1],inertie:[.85,0,.98,.01]},p=`v5-transitions`,m=(e,t,n)=>Math.min(Math.max((n-e)/(t-e),0),1),h=e=>e*e*(3-2*e),ae=`
uniform sampler2D uPleinA, uTraitA, uPleinB, uTraitB;
uniform vec4 uRectA, uRectB;
uniform vec2 uRes, uSouris;
uniform float uK, uT, uE, uP[6];
uniform int uMode;
uniform vec3 uSquash, uRouge, uCreme, uFond;
varying vec2 vS;
#define PI 3.14159265
float entre(float a, float b, float k) { return clamp((k - a) / (b - a), 0., 1.); }
float ease(float t) { return t * t * (3. - 2. * t); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruit(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * bruit(p); p *= 2.03; a *= .5; } return v; }
vec4 lit(sampler2D t, vec2 uv) { return (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) ? vec4(0.) : texture2D(t, uv); }
// le trait épaissi de ep pixels (on garde l'échantillon le plus couvrant, donc sa position le long de la boucle)
vec4 traitEp(sampler2D t, vec2 uv, vec2 px, float ep) {
  vec4 c = lit(t, uv);
  if (ep < .5) return c;
  for (int i = 0; i < 8; i++) { float a = float(i) * PI / 4.; vec4 o = lit(t, uv + vec2(cos(a), sin(a)) * px * ep); if (o.a > c.a) c = o; }
  return c;
}
// pose peinte (proportion plein) par-dessus le trait (couverture l, couleur cl), prémultiplié : comme vecto.js
vec4 pose(vec4 p, float plein, float l, vec3 cl) { float ap = p.a * plein; return vec4(p.rgb * ap + cl * l * (1. - ap), ap + l * (1. - ap)); }
vec4 entier(sampler2D pl, sampler2D tr, vec2 uv) { return pose(lit(pl, uv), 1., lit(tr, uv).a, uRouge); }
float ligneMasque(vec4 t, float trace) { return t.a * (1. - smoothstep(-.015, .015, t.r - (trace * 1.06 - .03))); }
vec4 comete(sampler2D pl, sampler2D tr, vec2 uv, vec2 px, float h, float efface, float plein) {
  float te = uP[1], qu = max(uP[2], .001), R = uP[3];
  vec4 p = lit(pl, uv), t = traitEp(tr, uv, px, uP[4]);
  float d = h - t.r; // > 0 : la tête est déjà passée
  float reste = mix(smoothstep(-.008, .008, d), smoothstep(-.008, .008, -d), efface);
  float queue = d > 0. ? exp(-3. * d / qu) : 0., tete = 1. - smoothstep(0., te, abs(d));
  float l = t.a * max(max(reste, queue * efface), tete);
  vec4 c = pose(p, plein, l, mix(uRouge, uCreme, clamp(max(tete, queue * .7), 0., 1.)));
  float halo = 0.;
  if (R > 0.) for (int i = 0; i < 12; i++) {
    float a = float(i) * PI / 3. + (i < 6 ? 0. : PI / 6.), r = i < 6 ? R : R * .5;
    vec4 o = lit(tr, uv + vec2(cos(a), sin(a)) * px * r);
    halo = max(halo, o.a * (1. - smoothstep(0., te, abs(h - o.r))) * (i < 6 ? .45 : .85));
  }
  return c + vec4(uCreme * halo, halo) * (1. - c.a);
}
void main() {
  vec2 s = vS, asp = vec2(uRes.x / uRes.y, 1.);
  float k = uK, a = entre(0., .5, k), b = entre(.5, 1., k);
  bool enA = k < .5;
  vec2 uA = (s - uRectA.xy) / uRectA.zw, uB = (s - uRectB.xy) / uRectB.zw;
  vec2 pxA = 1. / (uRectA.zw * uRes), pxB = 1. / (uRectB.zw * uRes);
  vec4 c = enA ? entier(uPleinA, uTraitA, uA) : entier(uPleinB, uTraitB, uB);
  vec3 fond = uFond, col = vec3(0.);
  bool fini = false;

  if (uMode == 0) { // la ligne rouge de vecto.js, pour comparer
    if (enA) c = pose(lit(uPleinA, uA), 1. - ease(entre(0., .16, k)), ligneMasque(lit(uTraitA, uA), 1. - ease(entre(.16, .5, k))), uRouge);
    else c = pose(lit(uPleinB, uB), ease(entre(.84, 1., k)), ligneMasque(lit(uTraitB, uB), ease(entre(.5, .84, k))), uRouge);
  } else if (uMode == 1) { // #2 : visible entre lo et hi le long de la boucle ; A se referme sur m, B s'ouvre depuis m
    float f = uP[0], m = uP[1], dz = .012;
    if (enA) { float q = ease(entre(f, 1., a)); vec4 t = traitEp(uTraitA, uA, pxA, uP[2]);
      float lo = mix(-2. * dz, m + dz, q), hi = mix(1. + 2. * dz, m - dz, q);
      c = pose(lit(uPleinA, uA), 1. - ease(entre(0., f, a)), t.a * smoothstep(lo - dz, lo + dz, t.r) * (1. - smoothstep(hi - dz, hi + dz, t.r)), uRouge);
    } else { float q = ease(entre(0., 1. - f, b)); vec4 t = traitEp(uTraitB, uB, pxB, uP[2]);
      float lo = mix(m + dz, -2. * dz, q), hi = mix(m - dz, 1. + 2. * dz, q);
      c = pose(lit(uPleinB, uB), ease(entre(1. - f, 1., b)), t.a * smoothstep(lo - dz, lo + dz, t.r) * (1. - smoothstep(hi - dz, hi + dz, t.r)), uRouge);
    }
  } else if (uMode == 2) { // #3
    float f = uP[0], te = uP[1];
    if (enA) c = comete(uPleinA, uTraitA, uA, pxA, mix(-te, 1. + te + uP[2], ease(entre(f, 1., a))), 1., 1. - ease(entre(0., f, a)));
    else c = comete(uPleinB, uTraitB, uB, pxB, mix(-te, 1. + te, entre(0., 1. - f, b)), 0., ease(entre(1. - f, 1., b)));
  } else if (uMode == 3) { // #41
    float tn = uP[4] * .5, ferme = enA ? ease(entre(0., .5 - tn, k)) : 1. - ease(entre(.5 + tn, 1., k));
    vec2 ctr = uRectA.xy + vec2(uP[0], uP[1]) * uRectA.zw;
    float R = 1.8 * (1. - ferme), d = length((s - ctr) * asp);
    col = (c.rgb + fond * (1. - c.a)) * (1. - smoothstep(R - uP[2] - 1e-4, R, d));
    col = mix(col, uRouge, (1. - smoothstep(0., max(uP[3], .5) / uRes.y, abs(d - R))) * step(.0005, R) * step(.5, uP[3]));
    fini = true;
  } else if (uMode == 4) { // #46 : échelle et saut calculés en JS (uSquash = sx, sy, montée), autour des pieds
    vec2 u = enA ? uA : uB;
    u = vec2((u.x - .5) / uSquash.x + .5, (u.y - uSquash.z) / uSquash.y);
    c = enA ? entier(uPleinA, uTraitA, u) : entier(uPleinB, uTraitB, u);
  } else if (uMode == 5) { // #45 : A part en accélérant, B arrive en freinant ; la traînée suit la vitesse
    float an = radians(uP[1]), t = enA ? a : b;
    vec2 dir = vec2(cos(an), sin(an));
    float off = enA ? uP[2] * t * t * t : -uP[2] * pow(1. - t, 3.);
    float L = uP[0] * clamp(3. * (enA ? t * t : (1. - t) * (1. - t)), 0., 1.);
    vec4 R = enA ? uRectA : uRectB;
    vec2 conv = vec2(R.w / (R.z * asp.x), 1.), u0 = (s - R.xy) / R.zw - dir * conv * off;
    vec4 acc = vec4(0.), tete = vec4(0.); float ws = 0.;
    for (int i = 0; i < 24; i++) {
      float f = float(i) / 23.; vec2 u = u0 + dir * conv * L * f;
      vec4 o = enA ? entier(uPleinA, uTraitA, u) : entier(uPleinB, uTraitB, u);
      if (i == 0) tete = o;
      o.rgb = mix(o.rgb, uRouge * o.a, f * uP[3]);
      float w = 1. - f * .8; acc += o * w; ws += w;
    }
    vec4 tr = acc / ws; tr *= min(1.6, 1. / max(tr.a, 1e-4)) * entre(0., .02, L);
    c = tete + tr * (1. - tete.a);
  } else if (uMode == 6) { // #102
    float fl = enA ? pow(entre(.44, .5, k), 2.) : 1. - ease(entre(.5, .5 + uP[1], k));
    float sm = uP[2] * entre(.5, .58, k) * (1. - entre(.62, 1., k));
    float n = fbm(s * asp * 3. + vec2(uT * .05, -uT * .12 - k * 1.2));
    col = mix(c.rgb + fond * (1. - c.a), uCreme * .45, sm * smoothstep(.4, .85, n));
    col = mix(col, vec3(1.), clamp(fl * uP[0], 0., 1.));
    fini = true;
  } else if (uMode == 7) { // #143 : o = ouverture ; en s'ouvrant, le bas du rideau est tiré sur le côté (drapé)
    float tn = uP[2] * .5, o = enA ? 1. - ease(entre(0., .5 - tn, k)) : ease(entre(.5 + tn, 1., k));
    float x = s.x < .5 ? s.x : 1. - s.x, w = .506 * (1. - o) * (1. - uP[1] * o * (1. - s.y));
    col = c.rgb + fond * (1. - c.a);
    col *= 1. - uP[3] * .7 * (1. - smoothstep(0., .04, x - w)) * step(w, x) * step(.001, w);
    if (x < w) {
      float xl = x / w, ph = cos(xl * uP[0] * 2. * PI);
      col = uRouge * (.55 + .35 * ph) * (1. - .35 * smoothstep(.85, 1., xl)) + uCreme * .07 * pow(max(ph, 0.), 12.);
    }
    float yv = .9 + o * .14 - .025 * abs(sin(s.x * asp.x * 12.)); // le lambrequin festonné descend avec le rideau
    if (s.y > yv) col = s.y < yv + .008 ? uCreme * .8 : uRouge * (.42 + .12 * cos(s.x * asp.x * 60.));
    fini = true;
  } else if (uMode == 8) { // #63 : la pose nette s'efface au profit des points (dessinés à part)
    c *= 1. - entre(0., .12, uE);
  } else if (uMode == 9) { // #162 : A est une toile tirée par son bord ; elle glisse et fronce, B est derrière
    float an = radians(uP[0]);
    vec2 n = vec2(cos(an), sin(an)), pp = vec2(-n.y, n.x), q = (s - .5) * asp;
    float ext = .5 * (abs(n.x) * asp.x + abs(n.y)) + .15, e = mix(-ext, ext, ease(entre(.03, .97, k)));
    float dd = dot(q, n) - e - .02 * sin(dot(q, pp) * 9. + k * 7.) * sin(PI * k);
    if (dd > 0.) {
      float fr = exp(-dd * 7.), pli = .5 + .5 * sin(dd * uP[1] * 25. + dot(q, pp) * 2.);
      vec2 ss = (q - n * (e + ext) * .55 - n * fr * .04 * sin(dd * uP[1] * 25.)) / asp + .5;
      vec4 cA = entier(uPleinA, uTraitA, (ss - uRectA.xy) / uRectA.zw);
      col = cA.rgb + (fond + uP[3]) * (1. - cA.a);
      col *= 1. - uP[2] * fr * pli * .8 * step(.5, uP[1]);
      col = mix(col, uCreme, (1. - smoothstep(0., 2.5 / uRes.y, dd)) * .9);
    } else {
      vec4 cB = entier(uPleinB, uTraitB, uB);
      col = (cB.rgb + fond * (1. - cB.a)) * (1. - uP[2] * .8 * exp(dd * 22.));
    }
    fini = true;
  } else if (uMode == 10) { // #21 : la goutte tombe, s'étale en couvrant A, puis sèche par plaques sur B
    vec2 d = (s - (uRectA.xy + vec2(.5, .58) * uRectA.zw)) * asp;
    float dist = length(d), g = entre(.1, .45, k), R = uP[0] * (1. - pow(1. - g, 1. + uP[1] * 3.));
    float edge = R * (1. + uP[2] * (fbm(normalize(d + 1e-5) * 2.5 + 3.1) - .5) * 1.3);
    float enc = 1. - smoothstep(edge - 1.5 / uRes.y, edge, dist);
    for (int i = 0; i < 10; i++) {
      float fi = float(i); if (fi >= uP[4] * 10.) break;
      float an = hash(vec2(fi, 1.3)) * 2. * PI, sz = (.012 + .025 * hash(vec2(fi, 3.3))) * g;
      vec2 pc = vec2(cos(an), sin(an)) * R * (1.1 + .6 * hash(vec2(fi, 7.1)));
      enc = max(enc, 1. - smoothstep(sz - .002, sz, length(d - pc)));
    }
    float dry = entre(.55, .95, k);
    enc *= step(dry, fbm(s * asp * 6.) * .55 + (1. - clamp(dist / max(edge, 1e-4), 0., 1.)) * .45 + .001);
    float fall = entre(0., .1, k);
    if (k < .1) enc = max(enc, 1. - smoothstep(.025, .03, length((d - vec2(0., (1. - fall * fall) * 1.2)) * vec2(1., .6))));
    vec3 ink = mix(vec3(.015), uRouge, uP[3]) * (.85 + .3 * fbm(s * asp * 9.));
    col = mix(c.rgb + fond * (1. - c.a), ink, enc);
    fini = true;
  } else if (uMode == 11) { // #101 : le rond de lumière quitte A, la bascule se fait dans le noir, il revient sur B
    vec2 base = uRectA.xy + vec2(.5, .55) * uRectA.zw;
    float off = enA ? uP[3] * ease(a) : -uP[3] * (1. - ease(b));
    vec2 ctr = mix(base + vec2(off / asp.x, 0.), uSouris, uP[4]);
    float rr = uP[0] * (1. - .8 * sin(PI * k)), d = length((s - ctr) * asp);
    float light = 1. - smoothstep(rr * (1. - uP[1]), rr, d);
    col = (c.rgb + fond * (1. - c.a)) * (1. - uP[2] + uP[2] * light);
    float h = clamp((1.15 - s.y) / (1.15 - ctr.y), 0., 1.), wd = rr * mix(.08, 1., h);
    float beam = (1. - smoothstep(wd * .8, wd, abs(s.x - ctr.x) * asp.x)) * step(ctr.y, s.y);
    col += uCreme * (beam * .06 + light * .04) * uP[5];
    fini = true;
  } else if (uMode == 12) { // #161 : le paravent entre, les habits volent par-dessus, il repart
    vec4 R = uRectA; float H = R.w * uP[2], W = R.w * .8;
    float xin = 1. - ease(entre(0., .2, k)), xout = ease(entre(.8, 1., k));
    vec2 pc = vec2(R.x + R.z * .5 + (1.3 * (xout - xin)) / asp.x, R.y), lp = (s - pc) * asp;
    col = c.rgb + fond * (1. - c.a);
    if (abs(lp.x) < W * .5) {
      float pw = W / 3., xi = lp.x + W * .5, idx = floor(xi / pw), u = fract(xi / pw);
      float top = H + pw * .35 * sqrt(max(0., 1. - pow(2. * u - 1., 2.))), bas = .02 * R.w, bw = .012;
      if (lp.y > 0. && lp.y < top) {
        if (lp.y < bas) { if (abs(u - .15) < .05 || abs(u - .85) < .05) col = uRouge * .6; }
        else {
          float bord = step(u * pw, bw) + step((1. - u) * pw, bw) + step(top - lp.y, bw) + step(lp.y, bas + bw);
          vec3 pan = uCreme * (mod(idx, 2.) < .5 ? .82 : 1.);
          pan = mix(pan, uRouge, .25 * step(.92, fract(atan(lp.y - bas, (u - .5) * pw) * 3.)) * step(top * .62, lp.y));
          pan = mix(pan, uRouge, .3 * step(abs(abs(u - .5) * pw - pw * .3), .003));
          col = mix(pan, uRouge * .8, clamp(bord, 0., 1.));
        }
      }
    }
    for (int i = 0; i < 6; i++) {
      float fi = float(i); if (fi >= uP[0]) break;
      float tau = (k - .2 - fi * .085 / uP[1]) / (.4 / uP[1]);
      if (tau < 0. || tau > 1.4) continue;
      float side = mod(fi, 2.) < .5 ? -1. : 1.;
      vec2 pos = pc + vec2(((hash(vec2(fi, 2.)) - .5) * W * .4 + side * (.25 + .3 * hash(vec2(fi, 5.))) * tau) / asp.x, H + .02 + .9 * tau - 1.1 * tau * tau);
      float rot = tau * (4. + 4. * hash(vec2(fi, 9.))) * side;
      vec2 lq = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * ((s - pos) * asp);
      float sh = mod(fi, 3.);
      float m = sh < .5 ? step(length(lq / vec2(.05, .022)), 1.) + step(length((lq - vec2(0., .018)) / vec2(.026, .022)), 1.) // chapeau
        : sh < 1.5 ? step(max(abs(lq.x) / .045, abs(lq.y) / .032), 1.) // chemise
        : step(abs(lq.x), .02 * (1. - (lq.y + .05) / .1)) * step(abs(lq.y), .05); // cravate
      col = mix(col, mod(fi, 2.) < .5 ? uRouge : uCreme, clamp(m, 0., 1.));
    }
    fini = true;
  }
  if (!fini) col = c.rgb + fond * (1. - c.a);
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`,g=document.getElementById(`scene`),_=new ie({canvas:g,antialias:!1});_.setPixelRatio(Math.min(devicePixelRatio,2));var oe=new ne,v=new n,y=e=>new l(e),b={uPleinA:{value:null},uTraitA:{value:null},uPleinB:{value:null},uTraitB:{value:null},uRectA:{value:new t},uRectB:{value:new t},uRes:{value:new a},uSouris:{value:new a(.5,.5)},uK:{value:0},uT:{value:0},uE:{value:0},uP:{value:[0,0,0,0,0,0]},uMode:{value:0},uSquash:{value:new o(1,1,0)},uRouge:{value:y(s.rouge)},uCreme:{value:y(s.creme)},uFond:{value:y(s.noir)}},x=new e(new te(2,2),new r({uniforms:b,depthTest:!1,depthWrite:!1,fragmentShader:ae,vertexShader:`varying vec2 vS; void main() { vS = uv; gl_Position = vec4(position.xy, 0., 1.); }`}));x.frustumCulled=!1,v.add(x);var S=150,C=300,w=S*C,T=new Float32Array(w*2),E=new Float32Array(w*3);for(let e=0;e<w;e++)T[2*e]=(e%S+.5)/S,T[2*e+1]=(Math.floor(e/S)+.5)/C,E.set([Math.random(),Math.random(),Math.random()],3*e);var D=new re().setAttribute(`position`,new c(new Float32Array(w*3),3)).setAttribute(`aUv`,new c(T,2)).setAttribute(`aAlea`,new c(E,3));function O(e,t,n){let a=new r({transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uRect:e,uPlein:t,uTrait:n,uRes:b.uRes,uE:b.uE,uP:b.uP,uRouge:b.uRouge,uDpr:{value:_.getPixelRatio()}},vertexShader:`
      attribute vec2 aUv; attribute vec3 aAlea; uniform vec4 uRect; uniform vec2 uRes; uniform float uE, uP[6], uDpr; varying vec2 vUv;
      void main() {
        vUv = aUv;
        vec2 asp = vec2(uRes.x / uRes.y, 1.), ctr = uRect.xy + .5 * uRect.zw, d = (aUv - .5) * uRect.zw * asp;
        vec2 p = d + normalize(d + (aAlea.xy - .5) * .5 + 1e-4) * uP[0] * (.3 + aAlea.z) * uE;
        float tw = uP[2] * uE * (.6 + aAlea.z);
        p = mat2(cos(tw), sin(tw), -sin(tw), cos(tw)) * p;
        gl_Position = vec4((ctr + p / asp) * 2. - 1., 0., 1.);
        gl_PointSize = uP[1] * uDpr * (1. + .6 * uE);
      }`,fragmentShader:`
      uniform sampler2D uPlein, uTrait; uniform vec3 uRouge; uniform float uE; varying vec2 vUv;
      void main() {
        if (length(gl_PointCoord - .5) > .5) discard;
        vec4 p = texture2D(uPlein, vUv); float t = texture2D(uTrait, vUv).a;
        if (max(p.a, t) < .4) discard;
        gl_FragColor = vec4(mix(p.a > t ? p.rgb : uRouge, uRouge, uE * .5), clamp(uE / .12, 0., 1.));
        #include <colorspace_fragment>
      }`}),o=new i(D,a);return o.frustumCulled=!1,o.renderOrder=1,v.add(o),o}var se=O(b.uRectA,b.uPleinA,b.uTraitA),k=O(b.uRectB,b.uPleinB,b.uTraitB),A={},j=`course`,M={},N=e=>Object.fromEntries(Object.entries(e).map(([e,[t]])=>[e,t]));function ce(){A=Object.fromEntries(Object.entries(d).map(([e,t])=>[e,N(t.p)])),M=N(f)}ce();try{let e=JSON.parse(localStorage.getItem(p))||{};for(let t in d)Object.assign(A[t],e.valeurs?.[t]);Object.assign(M,e.molette),e.choix in d&&(j=e.choix)}catch{}var P=()=>{try{localStorage.setItem(p,JSON.stringify({valeurs:A,molette:M,choix:j,A:I.value,B:L.value}))}catch{}},le=document.getElementById(`etat`),F=e=>{le.textContent=e},I=document.getElementById(`poseA`),L=document.getElementById(`poseB`);for(let e of[I,L])e.append(...u.map(e=>new Option(e,e)));var R={};try{R=JSON.parse(localStorage.getItem(p))||{}}catch{}I.value=u.includes(R.A)?R.A:`coeur`,L.value=u.includes(R.B)?R.B:`parapluie`;function z(e,t,n,r){let i=document.createElement(`fieldset`);i.append(Object.assign(document.createElement(`legend`),{textContent:e}));for(let[e,[,a,o,s]]of Object.entries(t)){let t=document.createElement(`label`),c=Object.assign(document.createElement(`output`),{value:n[e]}),l=Object.assign(document.createElement(`input`),{type:`range`,min:a,max:o,step:s,value:n[e]});l.addEventListener(`input`,()=>{n[e]=+l.value,c.value=l.value,r?.(),P()}),t.append(e,c,l),i.append(t)}return i}var ue=document.getElementById(`curseurs`),de=document.getElementById(`liste`),fe=Object.entries(d).map(([e,t])=>{let n=Object.assign(document.createElement(`button`),{textContent:t.n});return n.addEventListener(`click`,()=>{j=e,B(),$(),P()}),de.append(n),[e,n]});function B(){for(let[e,t]of fe)t.setAttribute(`aria-pressed`,e===j);ue.replaceChildren(z(d[j].n,d[j].p,A[j]),z(`#184 Molette (quand elle pilote)`,f,M))}var pe={},V=async e=>pe[e]??=ee(e),H=null,U=null;async function W(){F(`Chargement des poses…`),[H,U]=await Promise.all([V(I.value),V(L.value)]),b.uPleinA.value=H.plein,b.uTraitA.value=H.trait,b.uPleinB.value=U.plein,b.uTraitB.value=U.trait,K(),F(``)}for(let e of[I,L])e.addEventListener(`change`,()=>{W(),P()});function G(e,t){let n=innerWidth,r=innerHeight,i=n>700?340:0,a=.72,o=a*(e.l/e.h)*(r/n);t.set((n-i)/2/n-o/2,.1,o,a)}function K(){_.setSize(innerWidth,innerHeight,!1),_.getDrawingBufferSize(b.uRes.value),H&&(G(H,b.uRectA.value),G(U,b.uRectB.value))}addEventListener(`resize`,K),addEventListener(`pointermove`,e=>b.uSouris.value.set(e.clientX/innerWidth,1-e.clientY/innerHeight));var q=e=>{let t=document.getElementById(e);return t.addEventListener(`click`,()=>t.setAttribute(`aria-pressed`,t.getAttribute(`aria-pressed`)!==`true`)),()=>t.getAttribute(`aria-pressed`)===`true`},me=q(`ralenti`),J=q(`molette`),Y=document.getElementById(`k`),he=document.getElementById(`kSortie`),X=0,Z=0,Q=null;function $(){X>=1&&!J()&&([I.value,L.value]=[L.value,I.value],W(),P()),X=Z=0,Q=J()?null:performance.now()}document.getElementById(`rejouer`).addEventListener(`click`,$),Y.addEventListener(`input`,()=>{Q=null,X=Z=+Y.value}),g.addEventListener(`wheel`,e=>{J()&&(e.preventDefault(),Q=null,Z=Math.min(Math.max(Z+e.deltaY/1500*M.sensibilite,0),1))},{passive:!1}),document.getElementById(`copier`).addEventListener(`click`,async()=>{let e=JSON.stringify({transition:j,...A[j],...J()?{molette:M}:{}},null,1);try{await navigator.clipboard.writeText(e),F(`Valeurs copiées.`)}catch{console.log(e),F(`Copie refusée : valeurs écrites dans la console.`)}}),document.getElementById(`defaut`).addEventListener(`click`,()=>{A[j]=N(d[j].p),M=N(f),B(),P(),F(`Valeurs par défaut remises.`)});function ge(e,[t,n,r,i]){let a=(e,t,n)=>e+(t-e)*n;if(e<.5){let r=e*2;if(r<.35){let e=h(r/.35);return[1+.6*t*e,1-t*e,0]}let o=h(m(.35,.55,r));return[a(1+.6*t,1-.4*n,o),a(1-t,1+n,o),i*m(.4,1,r)**2]}let o=e*2-1;if(o<.4){let e=o/.4;return[1-.4*n,1+n,i*(1-e*e)]}let s=m(.4,1,o),c=Math.exp(-s*(8-6*r))*Math.cos(s*Math.PI*(1+5*r))*(1-s);return[1+.6*t*c,1-t*c,0]}B(),await W(),_.setAnimationLoop(e=>{if(!H)return;let t=d[j],n=A[j],r=Object.keys(t.p).filter(e=>e!==`duree`).map(e=>n[e]);Q===null?J()&&(X+=(Z-X)*(1-M.inertie)):(X=Math.min((e-Q)/(n.duree*(me()?4:1)),1),X>=1&&(Q=null)),Y.value=X,he.value=X.toFixed(3),b.uK.value=X,b.uT.value=e/1e3,b.uMode.value=t.mode;for(let e=0;e<6;e++)b.uP.value[e]=r[e]??0;t.mode===4&&b.uSquash.value.set(...ge(X,r));let i=(r[3]??0)/2;b.uE.value=t.mode===8?X<.5?h(m(0,.5-i,X)):1-h(m(.5+i,1,X)):0,se.visible=t.mode===8&&X<.5,k.visible=t.mode===8&&X>=.5,_.render(v,oe)});