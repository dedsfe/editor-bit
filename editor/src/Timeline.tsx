// Timeline: falas (por personagem), legenda, câmera, clima, ações e tela.
// Arrastar bloco = mudar o tempo; bordas das falas = aparar. Tudo passa pelo histórico (Cmd+Z).
import type { Build, Cue, Scene } from "../../engine/src/scene/types.ts";
import type { Timeline as TL } from "../../engine/src/scene/timeline";
import { CUE_META, TRACKS, extent, summary, type Track } from "./cues";

export type Selection =
  | { kind: "scene" }
  | { kind: "actor"; id: string }
  | { kind: "line"; id: string }
  | { kind: "caption"; id: string }
  | { kind: "cue"; index: number };

interface Props {
  scene: Scene;
  build: Build;
  tl: TL;
  time: number;
  zoom: number;
  selection: Selection;
  onSeek: (t: number) => void;
  onSelect: (s: Selection) => void;
  onMoveLine: (id: string, mode: "move" | "in" | "out", delta: number, key: string) => void;
  onMoveCue: (index: number, delta: number, key: string) => void;
}

const LABEL_W = 116;

/** Arrasto horizontal: chama `move(deltaSegundos)` sempre a partir do ponto inicial. */
function drag(e: React.PointerEvent, zoom: number, move: (d: number) => void) {
  e.stopPropagation();
  const x0 = e.clientX, el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);
  let moved = false;
  const mv = (ev: PointerEvent) => {
    const d = (ev.clientX - x0) / zoom;
    if (!moved && Math.abs(ev.clientX - x0) < 3) return;
    moved = true;
    move(Math.round(d * 100) / 100);
  };
  const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); };
  el.addEventListener("pointermove", mv);
  el.addEventListener("pointerup", up);
}

/** Distribui blocos que se sobrepõem em sub-linhas. */
function lanes<T extends { t: number; t1: number }>(items: T[]): (T & { lane: number })[] {
  const ends: number[] = [];
  return [...items].sort((a, b) => a.t - b.t).map((it) => {
    let lane = ends.findIndex((e) => e <= it.t + 0.01);
    if (lane < 0) { lane = ends.length; ends.push(0); }
    ends[lane] = it.t1;
    return { ...it, lane };
  });
}

export function Timeline({ scene, build, tl, time, zoom, selection, onSeek, onSelect, onMoveLine, onMoveCue }: Props) {
  const width = build.duration * zoom + 40;
  const x = (t: number) => t * zoom;
  const seekFrom = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const go = (cx: number) => onSeek(Math.max(0, Math.min(build.duration, (cx - r.left) / zoom)));
    go(e.clientX);
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const mv = (ev: PointerEvent) => go(ev.clientX);
    const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); };
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerup", up);
  };

  const cues = (scene.cues ?? []).map((c, index) => {
    const e = extent(c, tl);
    return { c, index, t: e.t, t1: Math.min(e.t1, build.duration) };
  }).filter((c) => Number.isFinite(c.t));
  const byTrack = (track: Track) => lanes(cues.filter((c) => CUE_META[c.c.type].track === track));
  const isSel = (s: Selection) => JSON.stringify(s) === JSON.stringify(selection);
  const actors = Object.entries(scene.actors);
  const ticks = Array.from({ length: Math.ceil(build.duration) + 1 }, (_, i) => i);

  const cueBlock = (it: { c: Cue; index: number; t: number; t1: number; lane: number }) => {
    const meta = CUE_META[it.c.type];
    const sel = isSel({ kind: "cue", index: it.index });
    return (
      <div key={it.index} className={`block cue ${sel ? "sel" : ""}`} title={`${meta.label}: ${summary(it.c, scene)}`}
        style={{ left: x(it.t), width: Math.max(x(it.t1) - x(it.t), 10), top: 3 + it.lane * 20, borderColor: meta.color, background: `${meta.color}33` }}
        onPointerDown={(e) => {
          onSelect({ kind: "cue", index: it.index });
          const key = `cue-${it.index}-${Date.now()}`;
          drag(e, zoom, (d) => onMoveCue(it.index, d, key));
        }}>
        <span className="tag" style={{ background: meta.color }} />
        {meta.label} · {summary(it.c, scene)}
      </div>
    );
  };

  return (
    <div className="timeline">
      <div className="tl-scroll">
        <div className="tl-inner" style={{ width: width + LABEL_W }}>
          <div className="row ruler">
            <div className="label">tempo</div>
            <div className="lane" style={{ width }} onPointerDown={seekFrom}>
              {ticks.map((s) => <span key={s} className={`tick ${s % 5 ? "" : "major"}`} style={{ left: x(s) }}>{s % 5 ? "" : `${s}s`}</span>)}
            </div>
          </div>

          {actors.map(([id, a]) => (
            <div key={id} className="row voice">
              <div className="label" onClick={() => onSelect({ kind: "actor", id })}>🎙 {a.name ?? id}</div>
              <div className="lane" style={{ width }}>
                {build.lines.filter((l) => l.speaker === id).map((l) => {
                  const def = scene.lines.find((d) => d.id === l.id)!;
                  const sel = isSel({ kind: "line", id: l.id });
                  return (
                    <div key={l.id} className={`block clip ${id} ${sel ? "sel" : ""}`} style={{ left: x(l.clipStart), width: x(l.clipDur) }}
                      title={def.text}
                      onPointerDown={(e) => { onSelect({ kind: "line", id: l.id }); const k = `line-${l.id}-${Date.now()}`; drag(e, zoom, (d) => onMoveLine(l.id, "move", d, k)); }}>
                      <span className="handle in" onPointerDown={(e) => { onSelect({ kind: "line", id: l.id }); const k = `in-${l.id}-${Date.now()}`; drag(e, zoom, (d) => onMoveLine(l.id, "in", d, k)); }} />
                      <span className="voicebar" style={{ left: x(l.voiceStart - l.clipStart), width: x(l.voiceEnd - l.voiceStart) }} />
                      <b>{l.id}</b> {def.text}
                      <span className="handle out" onPointerDown={(e) => { onSelect({ kind: "line", id: l.id }); const k = `out-${l.id}-${Date.now()}`; drag(e, zoom, (d) => onMoveLine(l.id, "out", d, k)); }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="row">
            <div className="label">💬 Legenda</div>
            <div className="lane" style={{ width }}>
              {build.lines.map((l) => {
                const def = scene.lines.find((d) => d.id === l.id)!;
                const sel = isSel({ kind: "caption", id: l.id });
                return (
                  <div key={l.id} className={`block caption ${def.caption === false ? "off" : ""} ${sel ? "sel" : ""}`}
                    style={{ left: x(l.voiceStart), width: Math.max(x(l.voiceEnd - l.voiceStart), 10) }}
                    title={def.text} onPointerDown={() => onSelect({ kind: "caption", id: l.id })}>
                    {def.words ? "✓ " : ""}{def.text}
                  </div>
                );
              })}
            </div>
          </div>

          {TRACKS.map((tr) => {
            const items = byTrack(tr.id);
            const n = Math.max(1, ...items.map((i) => i.lane + 1));
            return (
              <div key={tr.id} className="row" style={{ height: 6 + n * 20 }}>
                <div className="label">{tr.label}</div>
                <div className="lane" style={{ width }}>{items.map(cueBlock)}</div>
              </div>
            );
          })}

          <div className="playhead" style={{ left: LABEL_W + x(time) }} />
        </div>
      </div>
    </div>
  );
}
