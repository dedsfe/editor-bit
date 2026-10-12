// Renderer 2.5D: sprites com normal map iluminados por luzes pontuais/direcionais,
// sombra projetada no chão, neblina por profundidade, bloom, god rays e dithering.
// Tudo numa resolução baixa (ex.: 180×320); quem amplia é o CSS (preview) ou o ffmpeg (export).
//
// Mundo 3D (unidade = pixel da tela baixa):
//   X → direita, Y → baixo (altura acima do chão é Y negativo), Z → em direção à câmera.
//   Projeção oblíqua: telaY = floorY + Z * depthScale + Y
// Um ponto no chão mais perto da câmera aparece mais embaixo na tela.
import { program, uniforms, texture, upload, target, type Target } from "./gl";
import type { Bitmap, RGB } from "./pixels";

export const MAX_LIGHTS = 8;
export const MAX_CASTERS = 12;

export interface Light {
  /** posição no mundo; se `directional`, é a direção de onde a luz VEM (ex.: lua) */
  x: number; y: number; z: number;
  radius: number;
  color: RGB; // 0..1
  intensity: number;
  directional?: boolean;
  castShadows?: boolean;
}

export interface Caster {
  bitmap: Bitmap; // só o alpha importa
  x: number; z: number; // pé no mundo
  w: number; h: number; // tamanho na tela (px)
  flipX?: boolean;
}

export interface Camera { x: number; y: number; zoom: number }
export interface Rect { x: number; y: number; w: number; h: number }

export interface Look {
  exposure: number;
  bloom: number;          // força do bloom
  bloomThreshold: number; // a partir de que brilho (HDR) começa a vazar
  /** níveis por canal (0 = sem quantizar). 6 ≈ 216 cores, bem 8-bit */
  levels: number;
  dither: boolean;
  fogColor: RGB;
  fogNear: number; // Z onde a neblina começa (quanto menor o Z, mais longe)
  fogFar: number;  // Z onde a neblina chega no máximo
  fogMax: number;
  ambient: RGB;
  /** god rays: de onde saem (mundo), com o mesmo parallax do objeto que brilha; força 0 desliga */
  rays: { x: number; y: number; strength: number; decay: number; parallax?: number };
}

export const DEFAULT_LOOK: Look = {
  exposure: 1, bloom: 0.9, bloomThreshold: 0.85, levels: 0, dither: true,
  fogColor: [0.1, 0.12, 0.22], fogNear: 0, fogFar: -200, fogMax: 0,
  ambient: [0.05, 0.06, 0.12],
  rays: { x: 0, y: 0, strength: 0, decay: 0.95 },
};

export interface DrawOpts {
  normal?: WebGLTexture;
  z?: number;
  emissive?: number;
  tint?: [number, number, number, number];
  flipX?: boolean;
  uv?: [number, number, number, number];
  /** 0 = parado na tela (céu), 1 = anda junto com o mundo; entre os dois = parallax */
  parallax?: number;
  /** neblina fixa pra camadas sem luz (0..1); billboards/chão usam a profundidade */
  fog?: number;
  /** brilho especular (água, coisa molhada) */
  specular?: number;
  /** sobe o desenho N px (pulo, balanço do barco) */
  lift?: number;
  /** esconde N px de baixo, como se estivesse afundando no chão/água */
  sink?: number;
  /** linha do mundo onde a camada de parallax encosta (ex.: topo do chão), pra não descolar no zoom */
  anchorY?: number;
}

const VS = `#version 300 es
in vec2 aPos;
uniform vec4 uRect;     // x, y, w, h em px de mundo
uniform vec2 uRes;
uniform vec4 uUV;
uniform bool uFlipX;
uniform vec3 uCam;      // centro x, y, zoom
uniform float uParallax;
uniform float uAnchorY;  // >= 0: a camada "senta" nessa linha do mundo (morros no horizonte)
out vec2 vUV;
out vec2 vWorld;
void main() {
  vec2 p = uRect.xy + aPos * uRect.zw;
  vWorld = p;
  float zoom = 1.0 + (uCam.z - 1.0) * uParallax;
  vec2 center = mix(uRes * 0.5, uCam.xy, uParallax);
  vec2 s = (p - center) * zoom + uRes * 0.5;
  if (uAnchorY >= 0.0) s.y = (p.y - uAnchorY) * zoom + (uAnchorY - uCam.y) * uCam.z + uRes.y * 0.5;
  vec2 uv = vec2(uFlipX ? 1.0 - aPos.x : aPos.x, aPos.y);
  vUV = uUV.xy + uv * uUV.zw;
  gl_Position = vec4(s / uRes * 2.0 - 1.0, 0.0, 1.0) * vec4(1, -1, 1, 1);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vWorld;
out vec4 outColor;

uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform sampler2D uCasterAtlas;
uniform int uMode;          // 0 = billboard (em pé), 1 = chão, 2 = sem luz (céu/fogo)
uniform bool uHasNormal;
uniform bool uFlipX;
uniform float uZ;
uniform float uFloorY;
uniform float uDepthScale;
uniform vec3 uAmbient;
uniform float uEmissive;
uniform vec4 uTint;
uniform float uSpecular;    // brilho especular (água molhada reflete luz)
uniform float uFog;         // < 0 = usa profundidade
uniform vec3 uFogColor;
uniform vec3 uFogParams;    // near, far, max

uniform int uLightCount;
uniform vec4 uLightPos[${MAX_LIGHTS}];   // xyz, w = raio (<0 = direcional)
uniform vec4 uLightColor[${MAX_LIGHTS}]; // rgb * intensidade, w = projeta sombra

uniform int uCasterCount;
uniform vec4 uCaster[${MAX_CASTERS}];      // x, z, w, h
uniform vec4 uCasterUV[${MAX_CASTERS}];

float casterAlpha(int c, vec3 G, vec3 L) {
  vec4 cs = uCaster[c];
  vec3 C = vec3(cs.x, 0.0, cs.y);
  // o personagem vira um "cartão" de frente pra luz: a sombra estica pro lado certo
  vec2 toL = L.xz - C.xz;
  if (dot(toL, toL) < 1e-4) return 0.0;
  vec2 n2 = normalize(toL);
  vec3 n = vec3(n2.x, 0.0, n2.y);
  vec3 D = L - G;
  float den = dot(D, n);
  if (abs(den) < 1e-4) return 0.0;
  float t = dot(C - G, n) / den;
  if (t <= 0.0 || t >= 1.0) return 0.0;
  vec3 Q = G + t * D;
  vec3 tang = vec3(n.z, 0.0, -n.x);
  float u = 0.5 + dot(Q - C, tang) / cs.z;
  float v = (Q.y + cs.w) / cs.w;
  if (u < 0.0 || u > 1.0 || v < 0.0 || v > 1.0) return 0.0;
  float a = texture(uCasterAtlas, uCasterUV[c].xy + vec2(u, v) * uCasterUV[c].zw).a;
  return a * mix(1.0, 0.45, 1.0 - v); // longe do pé a sombra clareia
}

vec3 fog(vec3 c, float z) {
  float f = uFog >= 0.0 ? uFog : clamp((uFogParams.x - z) / (uFogParams.x - uFogParams.y), 0.0, 1.0) * uFogParams.z;
  return mix(c, uFogColor, f);
}

void main() {
  vec4 albedo = texture(uAlbedo, vUV);
  if (albedo.a < 0.5) discard;
  vec3 base = albedo.rgb * uTint.rgb;

  if (uMode == 2) {
    outColor = vec4(fog(base * (1.0 + uEmissive), uZ), uTint.a);
    return;
  }

  vec3 P, N;
  if (uMode == 0) {
    P = vec3(vWorld.x, vWorld.y - (uFloorY + uZ * uDepthScale), uZ);
    N = uHasNormal ? texture(uNormal, vUV).xyz * 2.0 - 1.0 : vec3(0, 0, 1);
    if (uFlipX) N.x = -N.x;
  } else {
    P = vec3(vWorld.x, 0.0, (vWorld.y - uFloorY) / uDepthScale);
    // chão com normal map (ondas): xy do mapa = inclinação em X e em Z
    vec3 tn = uHasNormal ? texture(uNormal, vUV).xyz * 2.0 - 1.0 : vec3(0, 0, 1);
    N = vec3(tn.x, -tn.z, tn.y);
  }
  N = normalize(N);

  vec3 light = uAmbient;
  vec3 spec = vec3(0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    if (i >= uLightCount) break;
    vec4 lp = uLightPos[i];
    vec3 Lpos; float atten;
    if (lp.w < 0.0) {
      Lpos = P + normalize(lp.xyz) * 4000.0;
      atten = 1.0;
    } else {
      Lpos = lp.xyz;
      float d = length(Lpos - P) / lp.w;
      atten = clamp(1.0 - d * d, 0.0, 1.0);
      atten *= atten;
    }
    if (atten <= 0.0) continue;
    vec3 Ldir = normalize(Lpos - P);
    // billboard: "wrap" leve pra silhueta não sumir; chão: resposta mais macia
    float diff = uMode == 0 ? max((dot(N, Ldir) + 0.25) / 1.25, 0.0) : sqrt(max(dot(N, Ldir), 0.0));
    float shadow = 1.0;
    if (uMode == 1 && uLightColor[i].w > 0.5) {
      float occ = 0.0;
      for (int c = 0; c < ${MAX_CASTERS}; c++) {
        if (c >= uCasterCount) break;
        occ = max(occ, casterAlpha(c, P, Lpos));
      }
      shadow = 1.0 - 0.9 * occ;
    }
    light += uLightColor[i].rgb * diff * atten * shadow;
    if (uSpecular > 0.0) {
      vec3 V = normalize(vec3(0.0, -0.55, 1.0)); // câmera olha de cima e de frente
      float sp = pow(max(dot(N, normalize(Ldir + V)), 0.0), 28.0);
      spec += uLightColor[i].rgb * sp * atten * shadow * uSpecular;
    }
  }
  outColor = vec4(fog(base * light + base * uEmissive + spec, P.z), uTint.a);
}`;

const QUAD_VS = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main() { vUV = aPos; gl_Position = vec4(aPos * 2.0 - 1.0, 0, 1); }`;

// só o que passa do limite vaza pro bloom
const BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uTex; uniform float uThreshold;
void main() {
  vec3 c = texture(uTex, vUV).rgb;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(c * max(l - uThreshold, 0.0) / max(l, 1e-4), 1);
}`;

const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uTex; uniform vec2 uDir;
void main() {
  vec3 c = texture(uTex, vUV).rgb * 0.227;
  c += (texture(uTex, vUV + uDir * 1.38).rgb + texture(uTex, vUV - uDir * 1.38).rgb) * 0.316;
  c += (texture(uTex, vUV + uDir * 3.23).rgb + texture(uTex, vUV - uDir * 3.23).rgb) * 0.070;
  o = vec4(c, 1);
}`;

const COMPOSITE_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uScene, uBloom, uBright, uOverlay;
uniform float uExposure, uBloomAmt, uLevels;
uniform bool uDither;
uniform vec4 uRays; // x, y (uv), força, decaimento
const float BAYER[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main() {
  vec3 c = texture(uScene, vUV).rgb;
  c += texture(uBloom, vUV).rgb * uBloomAmt;
  if (uRays.z > 0.0) {
    vec2 d = (vUV - uRays.xy) / 28.0;
    vec2 uv = vUV; float w = 1.0; vec3 r = vec3(0);
    for (int i = 0; i < 28; i++) { uv -= d; r += texture(uBright, uv).rgb * w; w *= uRays.w; }
    c += r / 28.0 * uRays.z;
  }
  c *= uExposure;
  c = c / (1.0 + max(c - 1.0, 0.0)); // só comprime o que estoura; o resto fica fiel à paleta
  c = clamp(c, 0.0, 1.0);
  if (uLevels > 1.0) {
    ivec2 p = ivec2(gl_FragCoord.xy) & 3;
    float b = uDither ? BAYER[p.y * 4 + p.x] / 16.0 - 0.5 : 0.0;
    c = clamp(floor(c * (uLevels - 1.0) + 0.5 + b) / (uLevels - 1.0), 0.0, 1.0);
  }
  vec4 ov = texture(uOverlay, vec2(vUV.x, 1.0 - vUV.y));
  o = vec4(mix(c, ov.rgb, ov.a), 1);
}`;

export interface RendererOpts { width: number; height: number; depthScale?: number; floorY: number }

type U = (n: string) => WebGLUniformLocation | null;

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  readonly w: number;
  readonly h: number;
  floorY: number;
  depthScale: number;
  look: Look = structuredClone(DEFAULT_LOOK);
  camera: Camera;

  private prog: WebGLProgram; private u: U;
  private bright: WebGLProgram; private ubr: U;
  private blur: WebGLProgram; private ubl: U;
  private comp: WebGLProgram; private uc: U;
  private scene: Target; private brightRT: Target; private blurA: Target; private blurB: Target;
  private atlasTex: WebGLTexture;
  private overlayTex: WebGLTexture;
  readonly white: WebGLTexture;

  constructor(readonly canvas: HTMLCanvasElement, o: RendererOpts) {
    canvas.width = o.width; canvas.height = o.height;
    const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL2 indisponível");
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("EXT_color_buffer_float indisponível");
    this.gl = gl;
    this.w = o.width; this.h = o.height;
    this.floorY = o.floorY;
    this.depthScale = o.depthScale ?? 0.5;
    this.camera = { x: o.width / 2, y: o.height / 2, zoom: 1 };

    [this.prog, this.u] = this.compile(VS, FS);
    [this.bright, this.ubr] = this.compile(QUAD_VS, BRIGHT_FS);
    [this.blur, this.ubl] = this.compile(QUAD_VS, BLUR_FS);
    [this.comp, this.uc] = this.compile(QUAD_VS, COMPOSITE_FS);
    this.scene = target(gl, this.w, this.h);
    const hw = Math.ceil(this.w / 2), hh = Math.ceil(this.h / 2);
    this.brightRT = target(gl, hw, hh, true);
    this.blurA = target(gl, hw, hh, true);
    this.blurB = target(gl, hw, hh, true);
    this.atlasTex = texture(gl);
    this.overlayTex = texture(gl, { w: 1, h: 1, data: new Uint8Array(4) });
    this.white = texture(gl, { w: 1, h: 1, data: new Uint8Array([255, 255, 255, 255]) });

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.bindVertexArray(gl.createVertexArray());
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  private compile(vs: string, fs: string): [WebGLProgram, U] {
    const gl = this.gl;
    const p = program(gl, vs, fs);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    return [p, uniforms(gl, p)];
  }

  texture(bmp: Bitmap) { return texture(this.gl, bmp); }
  update(t: WebGLTexture, bmp: Bitmap) { upload(this.gl, t, bmp); }

  /** Começa o frame: limpa, sobe câmera, luzes e quem projeta sombra. */
  begin(lights: Light[], casters: Caster[] = []) {
    const { gl, u, look } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.fb);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.prog);
    gl.uniform2f(u("uRes"), this.w, this.h);
    gl.uniform3f(u("uCam"), this.camera.x, this.camera.y, this.camera.zoom);
    gl.uniform1f(u("uFloorY"), this.floorY);
    gl.uniform1f(u("uDepthScale"), this.depthScale);
    gl.uniform3fv(u("uAmbient"), look.ambient);
    gl.uniform3fv(u("uFogColor"), look.fogColor);
    gl.uniform3f(u("uFogParams"), look.fogNear, look.fogFar, look.fogMax);

    const ls = lights.slice(0, MAX_LIGHTS);
    const pos = new Float32Array(MAX_LIGHTS * 4), col = new Float32Array(MAX_LIGHTS * 4);
    ls.forEach((l, i) => {
      pos.set([l.x, l.y, l.z, l.directional ? -1 : l.radius], i * 4);
      col.set([l.color[0] * l.intensity, l.color[1] * l.intensity, l.color[2] * l.intensity, l.castShadows === false ? 0 : 1], i * 4);
    });
    gl.uniform1i(u("uLightCount"), ls.length);
    gl.uniform4fv(u("uLightPos"), pos);
    gl.uniform4fv(u("uLightColor"), col);

    // atlas de sombras: silhuetas lado a lado numa textura só
    const cs = casters.slice(0, MAX_CASTERS);
    const aw = cs.reduce((s, c) => s + c.bitmap.w, 0) || 1;
    const ah = Math.max(1, ...cs.map((c) => c.bitmap.h));
    const atlas = new Uint8Array(aw * ah * 4);
    const cPos = new Float32Array(MAX_CASTERS * 4), cUV = new Float32Array(MAX_CASTERS * 4);
    let ox = 0;
    cs.forEach((c, i) => {
      for (let y = 0; y < c.bitmap.h; y++)
        atlas.set(c.bitmap.data.subarray(y * c.bitmap.w * 4, (y + 1) * c.bitmap.w * 4), (y * aw + ox) * 4);
      cPos.set([c.x, c.z, c.w, c.h], i * 4);
      const bw = c.bitmap.w / aw;
      cUV.set(c.flipX ? [ox / aw + bw, 0, -bw, c.bitmap.h / ah] : [ox / aw, 0, bw, c.bitmap.h / ah], i * 4);
      ox += c.bitmap.w;
    });
    upload(gl, this.atlasTex, { w: aw, h: ah, data: atlas });
    gl.uniform1i(u("uCasterCount"), cs.length);
    gl.uniform4fv(u("uCaster"), cPos);
    gl.uniform4fv(u("uCasterUV"), cUV);
  }

  private draw(mode: number, tex: WebGLTexture, rect: Rect, o: DrawOpts) {
    const { gl, u } = this;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, o.normal ?? this.white);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
    gl.uniform1i(u("uAlbedo"), 0);
    gl.uniform1i(u("uNormal"), 1);
    gl.uniform1i(u("uCasterAtlas"), 2);
    gl.uniform1i(u("uMode"), mode);
    gl.uniform1i(u("uHasNormal"), o.normal ? 1 : 0);
    gl.uniform1i(u("uFlipX"), o.flipX ? 1 : 0);
    gl.uniform1f(u("uZ"), o.z ?? 0);
    gl.uniform1f(u("uEmissive"), o.emissive ?? 0);
    gl.uniform1f(u("uSpecular"), o.specular ?? 0);
    gl.uniform1f(u("uFog"), o.fog ?? (mode === 2 ? 0 : -1));
    gl.uniform1f(u("uParallax"), o.parallax ?? 1);
    gl.uniform1f(u("uAnchorY"), o.anchorY ?? -1);
    gl.uniform4fv(u("uTint"), o.tint ?? [1, 1, 1, 1]);
    gl.uniform4f(u("uRect"), rect.x, rect.y, rect.w, rect.h);
    gl.uniform4fv(u("uUV"), o.uv ?? [0, 0, 1, 1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Algo em pé (personagem, árvore, pedra) com o pé em (x, z) no mundo. */
  billboard(tex: WebGLTexture, x: number, z: number, w: number, h: number, o: DrawOpts = {}) {
    const footY = this.floorY + z * this.depthScale - Math.round(o.lift ?? 0);
    const sink = Math.max(0, Math.min(h - 1, Math.round(o.sink ?? 0)));
    const [u0, v0, du, dv] = o.uv ?? [0, 0, 1, 1];
    this.draw(0, tex, { x: Math.round(x - w / 2), y: Math.round(footY - h + sink), w, h: h - sink },
      { ...o, z, uv: [u0, v0, du, dv * (1 - sink / h)] });
  }
  floor(tex: WebGLTexture, rect: Rect, o: DrawOpts = {}) { this.draw(1, tex, rect, o); }
  unlit(tex: WebGLTexture, rect: Rect, o: DrawOpts = {}) { this.draw(2, tex, rect, o); }

  /** Um pixel solto (partícula) num ponto do mundo. */
  dot(x: number, y: number, z: number, color: RGB, o: { emissive?: number; alpha?: number; size?: number } = {}) {
    const p = this.project(x, y, z), s = o.size ?? 1;
    this.unlit(this.white, { x: Math.round(p.x), y: Math.round(p.y), w: s, h: s },
      { tint: [color[0], color[1], color[2], o.alpha ?? 1], emissive: o.emissive ?? 0, z });
  }

  /** Onde um ponto do mundo aparece (antes da câmera). */
  project(x: number, y: number, z: number) { return { x, y: this.floorY + z * this.depthScale + y }; }

  /** Mundo → pixel da tela final (depois da câmera), igual ao vertex shader. */
  toScreen(x: number, y: number, parallax = 1) {
    const { camera: c } = this;
    const zoom = 1 + (c.zoom - 1) * parallax;
    const cx = this.w / 2 + (c.x - this.w / 2) * parallax, cy = this.h / 2 + (c.y - this.h / 2) * parallax;
    return { x: (x - cx) * zoom + this.w / 2, y: (y - cy) * zoom + this.h / 2 };
  }

  /** Pós-processamento + UI por cima. `overlay` é RGBA do tamanho da tela baixa. */
  end(overlay?: Bitmap) {
    const { gl, look } = this;
    gl.disable(gl.BLEND);
    const pass = (p: WebGLProgram, t: Target | null) => {
      gl.useProgram(p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fb : null);
      gl.viewport(0, 0, t ? t.w : this.w, t ? t.h : this.h);
    };
    const bind = (unit: number, tex: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); };

    pass(this.bright, this.brightRT);
    bind(0, this.scene.tex);
    gl.uniform1i(this.ubr("uTex"), 0);
    gl.uniform1f(this.ubr("uThreshold"), look.bloomThreshold);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    let src = this.brightRT;
    for (const [rt, dir] of [[this.blurA, [1, 0]], [this.blurB, [0, 1]], [this.blurA, [2, 0]], [this.blurB, [0, 2]]] as const) {
      pass(this.blur, rt);
      bind(0, src.tex);
      gl.uniform1i(this.ubl("uTex"), 0);
      gl.uniform2f(this.ubl("uDir"), dir[0] / rt.w, dir[1] / rt.h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      src = rt;
    }

    if (overlay) upload(gl, this.overlayTex, overlay);
    else upload(gl, this.overlayTex, { w: 1, h: 1, data: new Uint8Array(4) });

    pass(this.comp, null);
    const uc = this.uc;
    bind(0, this.scene.tex); bind(1, this.blurB.tex); bind(2, this.brightRT.tex); bind(3, this.overlayTex);
    gl.uniform1i(uc("uScene"), 0); gl.uniform1i(uc("uBloom"), 1);
    gl.uniform1i(uc("uBright"), 2); gl.uniform1i(uc("uOverlay"), 3);
    gl.uniform1f(uc("uExposure"), look.exposure);
    gl.uniform1f(uc("uBloomAmt"), look.bloom);
    gl.uniform1f(uc("uLevels"), look.levels);
    gl.uniform1i(uc("uDither"), look.dither ? 1 : 0);
    const r = look.rays, rs = this.toScreen(r.x, r.y, r.parallax ?? 1);
    gl.uniform4f(uc("uRays"), rs.x / this.w, 1 - rs.y / this.h, r.strength, r.decay);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Pixels finais (RGBA, de baixo pra cima, como o WebGL devolve). */
  read(): Uint8Array {
    const out = new Uint8Array(this.w * this.h * 4);
    this.gl.readPixels(0, 0, this.w, this.h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, out);
    return out;
  }
}
