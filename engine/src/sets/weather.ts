// Clima genérico (vale pra qualquer cenário): chuva, raio desenhado no céu e o clarão do relâmpago.
// O cenário só reage ao clima (ondas, céu, nuvens); quem desenha chuva e raio é este módulo.
import type { Renderer, Light } from "../core/renderer";
import type { Env } from "../scene/timeline";
import { flashEnv } from "../scene/timeline";
import { hash } from "../core/noise";
import { paint } from "./types";

export class WeatherFx {
  private rain: WebGLTexture;
  private bolts = new Map<number, WebGLTexture>();

  constructor(private r: Renderer) {
    this.rain = r.texture(paint(2, 6, (x, y) => ((y < 3 ? x === 1 : x === 0) ? [200, 214, 255] : null)));
  }

  /** Luz do clarão (vem de cima e da frente, branco-azulada). */
  lights(env: Env): Light[] {
    if (env.flash <= 0) return [];
    return [{ x: 0.15, y: -1, z: 0.7, radius: 0, color: [0.8, 0.86, 1], intensity: env.flash * 2.2, directional: true, castShadows: false }];
  }

  /** Raio no céu (desenhar logo depois do céu, antes do chão). */
  sky(t: number, env: Env) {
    for (const s of env.strikes) {
      const k = flashEnv(t - s);
      if (k > 0.15) this.r.unlit(this.bolt(s), { x: 0, y: 0, w: this.r.w, h: 132 }, { parallax: 0, emissive: 2.5 * k });
    }
  }

  /** Chuva em espaço de tela (não depende da câmera); o vento inclina. */
  front(t: number, env: Env) {
    const rain = env.rain ?? 0;
    if (rain <= 0.01) return;
    const n = Math.round(130 * rain), slant = 0.12 + 0.2 * (env.wind ?? 1);
    for (let i = 0; i < n; i++) {
      const sp = 230 + hash(i, 3) * 90;
      const y = ((t * sp + hash(i, 2) * 400) % 380) - 30;
      const x = ((hash(i, 1) * 260 - y * slant) % 260 + 260) % 260 - 40;
      this.r.unlit(this.rain, { x: Math.round(x), y: Math.round(y), w: 2, h: 6 },
        { parallax: 0, tint: [0.75, 0.8, 1, 0.45 + env.flash * 0.5], emissive: env.flash });
    }
  }

  /** x do raio na tela (pra apontar os god rays). */
  boltX(s: number) { return 40 + hash(Math.round(s * 100), 1) * 100; }

  private bolt(ts: number) {
    const key = Math.round(ts * 100);
    let tex = this.bolts.get(key);
    if (!tex) {
      const px = new Set<string>();
      const walk = (x: number, y: number, len: number, seed: number) => {
        for (let i = 0; i < len && y < 130; i++) {
          px.add(`${Math.round(x)},${y}`);
          x += (hash(i, seed, key) - 0.5) * 3;
          y += 1;
          if (hash(i, seed + 1, key) > 0.96 && len > 30) walk(x, y, len / 3, seed + i + 7);
        }
      };
      walk(this.boltX(ts), 0, 130, 11);
      tex = this.r.texture(paint(this.r.w, 132, (x, y) => (px.has(`${x},${y}`) ? [235, 240, 255] : null)));
      this.bolts.set(key, tex);
    }
    return tex;
  }
}
