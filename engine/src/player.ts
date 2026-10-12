// Junta tudo: cena + build (áudio analisado) → um frame em qualquer tempo t.
import { Renderer, type Caster } from "./core/renderer";
import { gridToBitmap, normalMap, type Bitmap } from "./core/pixels";
import { composeSkin, poseKey } from "./skins/animate";
import { getSkin } from "./skins";
import { SETS } from "./sets";
import type { Drawable, SetInstance } from "./sets/types";
import { Timeline, type Framer } from "./scene/timeline";
import type { Scene, Build } from "./scene/types";
import { Overlay } from "./ui/overlay";
import { WeatherFx } from "./sets/weather";
import { DEFAULT_LOOK, type Light, type Look } from "./core/renderer";

export const W = 180, H = 320;

interface Sprite { tex: WebGLTexture; normal: WebGLTexture; bmp: Bitmap }

/** Caixa de cada personagem na tela final (px da tela baixa), pra clicar/arrastar no editor. */
export interface Box { id: string; x: number; y: number; w: number; h: number }

export class Player {
  readonly r: Renderer;
  tl!: Timeline;
  set!: SetInstance;
  scene!: Scene;
  private setKey = "";
  private fx: WeatherFx;
  private ui = new Overlay(W, H);
  private sprites = new Map<string, Sprite>();
  private skyDrawn = false;
  /** força a câmera (debug: ?cam=x,y,zoom) */
  cameraOverride?: { x: number; y: number; zoom: number };
  /** false = não desenha legenda/balões/cards (o editor pode esconder) */
  showUI = true;
  /** texto de depuração no canto (ex.: tempo na folha de frames do check) */
  stamp?: string;
  /** caixas dos personagens no último frame */
  boxes: Box[] = [];

  constructor(canvas: HTMLCanvasElement, scene: Scene, build: Build) {
    this.r = new Renderer(canvas, { width: W, height: H, floorY: 200 });
    this.fx = new WeatherFx(this.r);
    this.load(scene, build);
  }

  /** Troca a cena/linha do tempo (o editor chama a cada edição). Cenários já criados são reaproveitados. */
  load(scene: Scene, build: Build) {
    this.scene = scene;
    this.tl = new Timeline(scene, build);
    this.setKey = "";
    this.activate(this.tl.setAt(0).set);
  }

  /** Cenários criados (um por definição): trocar de cena no meio do vídeo não recria nada. */
  private sets = new Map<string, { inst: SetInstance; look: Look }>();

  /** Deixa `def` como cenário ativo (cria na primeira vez) e aplica o visual dele + o da cena. */
  private activate(def: Scene["set"]) {
    const key = JSON.stringify(def);
    if (key === this.setKey) return;
    let entry = this.sets.get(key);
    if (!entry) {
      const factory = SETS[def.kind];
      if (!factory) throw new Error(`cenário "${def.kind}" não existe`);
      this.r.look = structuredClone(DEFAULT_LOOK);
      const inst = factory(this.r, def, {
        time: (ref) => this.tl.time(ref),
        sky: (t) => { this.skyDrawn = true; this.fx.sky(t, this.tl.env(t)); },
      });
      Object.assign(this.r.look, inst.look ?? {});
      entry = { inst, look: structuredClone(this.r.look) };
      this.sets.set(key, entry);
    }
    this.set = entry.inst;
    this.setKey = key;
    this.r.floorY = this.set.floorY;
    this.r.look = structuredClone(entry.look);
    this.baseFog = this.r.look.fogMax;
    const l = this.scene.look ?? {};
    if (l.levels !== undefined) this.r.look.levels = l.levels;
    if (l.dither !== undefined) this.r.look.dither = l.dither;
    if (l.bloom !== undefined) this.r.look.bloom = l.bloom;
    if (l.exposure !== undefined) this.r.look.exposure = l.exposure;
  }
  private baseFog = 0;
  private fade = 0;

  /** Onde cada personagem está (pra câmera enquadrar). */
  private framer: Framer = (id, t) => {
    const def = this.scene.actors[id];
    if (!def) return null;
    const st = this.tl.actor(id, t), skin = getSkin(def.skin);
    const ground = this.set.surface?.(st.x, st.z, t) ?? { lift: 0, water: false };
    const p = this.r.project(st.x, -(ground.lift + st.lift), st.z);
    return { x: p.x, footY: p.y + st.sink, h: skin.h * skin.scale };
  };

  private sprite(skinId: string, key: string, make: () => ReturnType<typeof composeSkin>): Sprite {
    const k = `${skinId}:${key}`;
    let s = this.sprites.get(k);
    if (!s) {
      const skin = getSkin(skinId);
      const grid = make();
      const bmp = gridToBitmap(grid, skin.palette);
      s = { bmp, tex: this.r.texture(bmp), normal: this.r.texture(normalMap(grid, skin.normals)) };
      this.sprites.set(k, s);
    }
    return s;
  }

  render(t: number) {
    const active = this.tl.setAt(t);
    this.activate(active.set);
    this.fade = active.fade;
    const { r, tl, scene, set } = this;
    const env = tl.env(t);
    set.setEnv?.(env);
    Object.assign(r.camera, this.cameraOverride ?? tl.camera(t, this.framer));

    const actors = Object.entries(scene.actors).map(([id, def]) => {
      const st = tl.actor(id, t);
      const skin = getSkin(def.skin);
      const spr = this.sprite(def.skin, poseKey(st.pose), () => composeSkin(skin, st.pose));
      const ground = set.surface?.(st.x, st.z, t) ?? { lift: 0, water: false };
      return { id, st, skin, spr, ground, extra: !!def.extra, lift: ground.lift + st.lift, w: skin.w * skin.scale, h: skin.h * skin.scale };
    }).filter((a) => !a.st.hidden);
    // sombra: personagens principais primeiro (o renderer tem limite de MAX_CASTERS)
    const casters: Caster[] = [...actors].sort((a, b) => +a.extra - +b.extra).map((a) => ({
      bitmap: a.spr.bmp, x: a.st.x, z: a.st.z, w: a.w, h: a.h, flipX: a.st.facing < 0,
    }));

    // segurar: luz quente no meio das mãos
    const lights: Light[] = [...set.lights(t), ...this.fx.lights(env)];
    if (env.fog !== undefined) r.look.fogMax = env.fog;
    else r.look.fogMax = this.baseFog;
    const hands = tl.holds(t).flatMap((hd) => {
      const a = actors.find((x) => x.id === hd.actor), b = actors.find((x) => x.id === hd.target);
      if (!a || !b) return [];
      const x = (a.st.x + b.st.x) / 2, z = (a.st.z + b.st.z) / 2 + 1;
      const handY = (o: typeof a) => -(o.lift + o.h - 11 * o.skin.scale - o.st.sink);
      const y = (handY(a) + handY(b)) / 2;
      lights.push({ x, y, z: z + 6, radius: 64, color: [1, 0.78, 0.45], intensity: 1.7 * hd.k * hd.glow, castShadows: false });
      return [{ x, y, z, k: hd.k * hd.glow }];
    });

    // clarão do relâmpago clareia a sombra também (sem acumular de um frame pro outro)
    const ambient = r.look.ambient;
    r.look.ambient = ambient.map((v, i) => v + env.flash * [0.25, 0.27, 0.36][i]) as typeof ambient;
    r.begin(lights, casters);
    r.look.ambient = ambient;
    this.skyDrawn = false;
    set.back(t);
    if (!this.skyDrawn) this.fx.sky(t, env);
    const items: Drawable[] = [...set.props(t)];
    for (const a of actors) {
      items.push({
        z: a.st.z,
        draw: () => r.billboard(a.spr.tex, a.st.x, a.st.z, a.w, a.h, {
          normal: a.spr.normal, flipX: a.st.facing < 0, lift: a.lift, sink: a.st.sink,
        }),
      });
      // quem está na água ganha um anel de espuma no pé (metade atrás, metade na frente)
      if (a.ground.water && a.st.lift < 2) {
        for (const side of [-1, 1]) items.push({ z: a.st.z + side * 0.01, draw: () => this.foam(a.st.x, a.st.z, a.ground.lift, t, side, a.st.sink > 0) });
      }
    }
    items.sort((a, b) => a.z - b.z).forEach((d) => d.draw());
    for (const h of hands)
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) r.dot(h.x + dx - 1, h.y + dy - 1, h.z, [1, 0.85, 0.55], { emissive: 2.4 * h.k });
    set.front(t);
    this.fx.front(t, env);

    this.boxes = actors.map((a) => {
      const p = r.project(a.st.x, -(a.lift - a.st.sink), a.st.z);
      const tl0 = r.toScreen(p.x - a.w / 2, p.y - a.h), br = r.toScreen(p.x + a.w / 2, p.y);
      return { id: a.id, x: tl0.x, y: tl0.y, w: br.x - tl0.x, h: br.y - tl0.y };
    });
    this.drawUI(t, actors);
    r.end(this.ui.bmp);
  }

  private foam(x: number, z: number, lift: number, t: number, side: number, splash: boolean) {
    const n = splash ? 18 : 12, rx = splash ? 13 : 10;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + t * 1.5;
      if (Math.sign(Math.sin(a)) !== side) continue;
      const wob = Math.sin(t * 6 + k * 1.7) * (splash ? 1.5 : 0.6);
      const y = -lift - (splash ? Math.abs(Math.sin(t * 9 + k)) * 2 : 0);
      this.r.dot(x + Math.cos(a) * (rx + wob), y, z + Math.sin(a) * 3, [0.78, 0.86, 0.95], { emissive: 0.15 });
    }
  }

  private drawUI(t: number, actors: { id: string; st: { x: number; z: number; sink: number }; h: number; lift: number }[]) {
    const { ui, tl, r } = this;
    ui.clear();
    if (this.fade > 0) ui.rect(0, 0, W, H, [0, 0, 0, Math.round(255 * Math.min(1, this.fade))]);
    if (!this.showUI) return this.drawStamp();
    const head = (id: string) => {
      const a = actors.find((a) => a.id === id);
      if (!a) return { x: W / 2, y: H / 2 };
      const p = r.project(a.st.x, -(a.h + a.lift - a.st.sink), a.st.z);
      return r.toScreen(p.x, p.y);
    };
    let card = false;
    for (const c of tl.active(t)) {
      if (c.type === "hook") ui.hook(c.text, 28, c.color);
      else if (c.type === "bubble" || c.type === "thought") {
        const p = head(c.actor);
        ui.bubble(c.text, p.x, p.y, c.type === "thought" ? "thought" : "speech");
      } else if (c.type === "counter") ui.counter(c.label, c.value, c.total, 64, c.color);
      else if (c.type === "card") {
        ui.card(c.text, c.color, Math.min(1, (t - tl.span(c).t) / 0.25));
        card = true;
      }
    }
    const cap = card ? null : tl.caption(t, W - 16);
    if (cap) {
      const color = Object.entries(this.scene.actors).find(([id]) => id === cap.speaker)?.[1].skin;
      ui.caption(cap.text, this.scene.look?.captionY ?? 236, color ? getSkin(color).color : undefined);
    }
    this.drawStamp();
  }

  private drawStamp() {
    if (this.stamp) this.ui.text(this.stamp, 3, 3, { color: [255, 216, 74, 255] });
  }
}
