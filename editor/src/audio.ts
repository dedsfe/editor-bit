// Toca as falas no tempo certo (com corte e volume), igual ao mix do export.
import type { Build } from "../../engine/src/scene/types.ts";
import { audioUrl } from "./api";

export class Mixer {
  private ctx?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private playing: AudioBufferSourceNode[] = [];
  private anchor = 0;
  private t0 = 0;

  async prepare(dir: string, sources: string[]) {
    this.ctx ??= new AudioContext();
    await this.ctx.resume();
    await Promise.all(sources.filter((s) => !this.buffers.has(`${dir}/${s}`)).map(async (s) => {
      const r = await fetch(audioUrl(dir, s));
      if (!r.ok) throw new Error(`não abriu o áudio ${s}`);
      this.buffers.set(`${dir}/${s}`, await this.ctx!.decodeAudioData(await r.arrayBuffer()));
    }));
  }

  play(dir: string, build: Build, t: number) {
    this.stop();
    const ctx = this.ctx!;
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
  }

  /** tempo da cena agora (enquanto toca) */
  get time() { return this.ctx ? this.t0 + Math.max(0, this.ctx.currentTime - this.anchor) : this.t0; }

  stop() {
    for (const s of this.playing) { try { s.stop(); } catch { /* já parou */ } s.disconnect(); }
    this.playing = [];
  }
}
