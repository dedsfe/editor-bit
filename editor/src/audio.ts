// Toca as falas no tempo certo (com corte e volume) e os sons (ambiente/efeitos), igual ao mix do export.
import type { Build, Scene } from "../../engine/src/scene/types.ts";
import { soundPlan, soundGain, voiceRanges, type SoundInfo } from "../../engine/src/scene/sound.ts";
import { audioUrl, soundUrl } from "./api";

export class Mixer {
  private ctx?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private playing: AudioBufferSourceNode[] = [];
  private anchor = 0;
  private t0 = 0;

  private async load(key: string, url: string) {
    if (this.buffers.has(key)) return;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`não abriu o áudio ${key}`);
    this.buffers.set(key, await this.ctx!.decodeAudioData(await r.arrayBuffer()));
  }

  async prepare(dir: string, sources: string[], sounds: string[] = []) {
    this.ctx ??= new AudioContext();
    await this.ctx.resume();
    await Promise.all([
      ...sources.map((s) => this.load(`${dir}/${s}`, audioUrl(dir, s))),
      ...sounds.map((id) => this.load(`som:${id}`, soundUrl(id))),
    ]);
  }

  play(scene: Scene, build: Build, t: number, manifest: SoundInfo[] = []) {
    this.stop();
    const ctx = this.ctx!, dir = scene.audio;
    this.anchor = ctx.currentTime + 0.05;
    this.t0 = t;
    for (const l of build.lines) {
      const end = l.clipStart + l.clipDur;
      const buf = this.buffers.get(`${dir}/${l.source}`);
      if (!buf || end <= t) continue;
      const src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.value = l.volume;
      src.connect(gain).connect(ctx.destination);
      const skip = Math.max(0, t - l.clipStart);
      src.start(this.anchor + Math.max(0, l.clipStart - t), l.trimIn + skip, l.clipDur - skip);
      this.playing.push(src);
    }
    // sons: mesmo plano do export; o volume (fade + abaixar na voz) vira uma curva amostrada a cada 50 ms
    const ranges = voiceRanges(build);
    for (const s of soundPlan(scene, build, manifest)) {
      const buf = this.buffers.get(`som:${s.id}`);
      if (!buf || s.start + s.len <= t) continue;
      const src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = buf;
      src.loop = s.loop;
      src.connect(gain).connect(ctx.destination);
      const from = Math.max(t, s.start), at = this.anchor + (from - t);
      const curve = Float32Array.from({ length: Math.max(2, Math.ceil((s.start + s.len - from) / 0.05) + 1) }, (_, i) => soundGain(s, Math.min(from + i * 0.05, s.start + s.len), ranges));
      gain.gain.setValueCurveAtTime(curve, at, Math.max(0.05, s.start + s.len - from));
      const offset = from - s.start;
      src.start(at, s.loop ? offset % buf.duration : offset);
      src.stop(at + (s.start + s.len - from));
      this.playing.push(src);
    }
  }

  /** tempo da cena agora (enquanto toca) */
  get time() { return this.ctx ? this.t0 + Math.max(0, this.ctx.currentTime - this.anchor) : this.t0; }

  stop() {
    for (const s of this.playing) { try { s.stop(); } catch { /* já parou */ } s.disconnect(); }
    this.playing = [];
  }
}
