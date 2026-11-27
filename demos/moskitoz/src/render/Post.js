// Post-processing (spec §3.4): RenderPass (MSAA) -> Bloom (emissive only, high quality) -> Grade (states + brightness) -> Output.
// No tone mapping, no GTAO, no FXAA: the look comes from the gomme materials and the ink.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uSat: { value: 1.0 },
    uBright: { value: 1.0 },
    uVig: { value: 0.12 },
    uDmg: { value: 0 },
    uSpeed: { value: 0 },
    uFlash: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime,uSat,uBright,uVig,uDmg,uSpeed,uFlash;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      vec3 col;
      if(uSpeed>0.002){ // radial "motion blur" driven by speed / dash
        col = vec3(0.0);
        for(int i=0;i<6;i++){ col += texture2D(tDiffuse, vUv - c*uSpeed*float(i)*0.02).rgb; }
        col /= 6.0;
      } else col = texture2D(tDiffuse, vUv).rgb;
      if(uDmg>0.002){ // chromatic aberration when hurt
        col.r = texture2D(tDiffuse, vUv + c*uDmg*0.05).r;
        col.b = texture2D(tDiffuse, vUv - c*uDmg*0.05).b;
      }
      col *= uBright;
      float lum = dot(col, vec3(0.2126,0.7152,0.0722));
      col = mix(vec3(lum), col, uSat * 1.06); // a touch richer than the raw toon colours
      float v = dot(c,c);
      col *= 1.0 - v*uVig*2.2;
      col = mix(col, col*vec3(1.6,0.35,0.35), clamp(uDmg,0.0,1.0)*smoothstep(0.02,0.35,v));
      col += vec3(1.0,0.9,0.5)*uFlash*0.25;
      gl_FragColor = vec4(max(col,0.0),1.0);
    }`,
};

export class Post {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    renderer.info.autoReset = false; // counted per frame (shadow + scene + passes), reset in render(): see Game.perf
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType }));
    // only the target the scene is drawn into is multisampled; the full-screen passes don't need it (it cost ~6 ms)
    this.sceneTarget = this.composer.readBuffer;
    this.renderPass = new RenderPass(scene, camera);
    // only HDR emissive (lava, acid, ultra: > 1.5) blooms; lit pastel walls stay below the threshold
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.45, 0.35, 1.5);
    this.grade = new ShaderPass(GradeShader);
    this.output = new OutputPass();
    [this.renderPass, this.bloom, this.grade, this.output].forEach((p) => this.composer.addPass(p));
    this.u = this.grade.uniforms;
    this.quality = -1;
    this.setQuality(2);
  }
  // 0 = no MSAA · 1 = MSAA x4 into an 8-bit sRGB target (cheap on integrated GPUs, no banding in dark biomes)
  // 2 = HDR half-float target (MSAA x2: x4 on half floats costs ~8 ms on an AMD APU) + bloom of the emissive only
  setQuality(q) {
    const hdr = q >= 2, samples = q === 1 ? 4 : q === 2 ? 2 : 0, rt = this.sceneTarget, t = rt.texture;
    const type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, cs = hdr ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (rt.samples !== samples || t.type !== type || t.colorSpace !== cs) { rt.samples = samples; t.type = type; t.colorSpace = cs; rt.dispose(); }
    this.quality = q;
    this.bloom.enabled = hdr;
  }
  resize(w, h, pr) {
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
  }
  render(dt, time) {
    this.u.uTime.value = time;
    if (this.composer.readBuffer !== this.sceneTarget) this.composer.swapBuffers(); // RenderPass draws into readBuffer
    this.renderer.info.reset();
    this.composer.render(dt);
  }
}
