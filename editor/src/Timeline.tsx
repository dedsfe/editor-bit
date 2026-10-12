// Timeline: vozes, legenda e 4 trilhas (Câmera, Cena, Ações, Tela).
// Cada trilha tem um "+" com as opções dela e pode ser recolhida. Arrastar bloco = mudar o tempo.
import { useState } from "react";
import type { Build, Cue, Scene } from "../../engine/src/scene/types.ts";
import type { Timeline as TL } from "../../engine/src/scene/timeline";
import { CUE_META, TRACKS, extent, summary, type AddItem, type Track } from "./cues";
import { AddMenu } from "./AddMenu";

export type Selection =
  | { kind: "none" }
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
  defaultActor: string;
  onSeek: (t: number) => void;
  onSelect: (s: Selection) => void;
  onMoveLine: (id: string, mode: "move" | "in" | "out", delta: number, key: string) => void;
  onMoveCue: (index: number, delta: number, key: string) => void;
  onAdd: (item: AddItem, actor: string, smooth: boolean) => void;
}

const LABEL_W = 132;
const LANE_H = 20;

/** Arrasto horizontal: chama `move(deltaSegundos)` sempre a partir do ponto inicial. */
function drag(e: React.PointerEvent, zoom: number, move: (d: number) => void) {
  e.stopPropagation();
  const x0 = e.clientX, el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);
  let moved = false;
  const mv = (ev: PointerEvent) => {
    if (!moved && Math.abs(ev.clientX - x0) < 3) return;
    moved = true;
    move(Math.round(((ev.clientX - x0) / zoom) * 100) / 100);
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

const loadCollapsed = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem("oqjf.collapsed") ?? "{}"); } catch { return {}; }
};

export function Timeline(p: Props) {
  const { scene, build, tl, time, zoom, selection, onSeek, onSelect, onMoveLine, onMoveCue } = p;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number; up: boolean } | null>(null);
  const toggle = (id: string) => setCollapsed((c) => {
    const n = { ...c, [id]: !c[id] };
    try { localStorage.setItem("oqjf.collapsed", JSON.stringify(n)); } catch { /* sem storage */ }
    return n;
  });

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
  const isSel = (s: Selection) => JSON.stringify(s) === JSON.stringify(selection);
  const speakers = Object.entries(scene.actors).filter(([id, a]) => !a.extra || build.lines.some((l) => l.speaker === id));
  const ticks = Array.from({ length: Math.ceil(build.duration) + 1 }, (_, i) => i);

  /** Rótulo da trilha: recolher ▸/▾, nome, e o "+" com o menu dela. */
  const label = (id: string, text: string, color?: string, add?: AddItem[], extra?: { showSmooth?: boolean }) => (
    <div className="label">
      <button className="chev" aria-label={`${collapsed[id] ? "Mostrar" : "Recolher"} ${text}`} onClick={() => toggle(id)}>{collapsed[id] ? "▸" : "▾"}</button>
      {color && <span className="dot" style={{ background: color }} />}
      <span className="name">{text}</span>
      {add && <button className="plus" aria-label={`Adicionar em ${text}`} title={`Adicionar em ${text} (no cursor)`} onClick={(e) => {
        if (menu?.id === id) return setMenu(null);
        const r = e.currentTarget.getBoundingClientRect();
        // abre pra cima se não couber embaixo (trilhas do fim da timeline)
        setMenu({ id, x: r.left, y: r.bottom + 4, up: innerHeight - r.bottom < 340 });
      }}>+</button>}
      {add && menu?.id === id && (
        <AddMenu scene={scene} items={add} color={color ?? "#888"} defaultActor={p.defaultActor} showSmooth={extra?.showSmooth}
          at={menu} onPick={p.onAdd} onClose={() => setMenu(null)} />
      )}
    </div>
  );

  const cueBlock = (it: { c: Cue; index: number; t: number; t1: number; lane: number }, color: string, mini: boolean) => {
    const meta = CUE_META[it.c.type];
    const sel = isSel({ kind: "cue", index: it.index });
    const text = summary(it.c, scene);
    return (
      <div key={it.index} className={`block cue ${sel ? "sel" : ""} ${mini ? "mini" : ""}`} title={`${meta.label}: ${text}`}
        style={{ left: x(it.t), width: Math.max(x(it.t1) - x(it.t), mini ? 4 : 14), top: mini ? 2 : 3 + it.lane * LANE_H, borderColor: color, background: `${color}26`, color }}
        onPointerDown={(e) => {
          onSelect({ kind: "cue", index: it.index });
          const key = `cue-${it.index}-${Date.now()}`;
          drag(e, zoom, (d) => onMoveCue(it.index, d, key));
        }}>
        {!mini && <><b>{meta.icon}</b><span>{text}</span></>}
      </div>
    );
  };

  return (
    <div className="timeline">
      <div className="tl-scroll">
        <div className="tl-inner" style={{ width: width + LABEL_W }}>
          <div className="row ruler">
            <div className="label"><span className="name muted">tempo</span></div>
            <div className="lane" style={{ width }} onPointerDown={seekFrom}>
              {ticks.map((s) => <span key={s} className={`tick ${s % 5 ? "" : "major"}`} style={{ left: x(s) }}>{s % 5 ? "" : `${s}s`}</span>)}
            </div>
          </div>

          <div className="group-head">{label("vozes", "Vozes")}</div>
          {!collapsed.vozes && speakers.map(([id, a]) => (
            <div key={id} className="row voice">
              <div className="label sub" onClick={() => onSelect({ kind: "actor", id })}><span className="name">{a.name ?? id}</span></div>
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
                      <span>{def.text}</span>
                      <span className="handle out" onPointerDown={(e) => { onSelect({ kind: "line", id: l.id }); const k = `out-${l.id}-${Date.now()}`; drag(e, zoom, (d) => onMoveLine(l.id, "out", d, k)); }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className={`row ${collapsed.legenda ? "collapsed" : ""}`}>
            {label("legenda", "Legenda", "#9ab4c8", [{ kind: "whisper", label: "Whisper: tempo de todas as falas", hint: "a legenda vira de página no tempo da palavra" }])}
            <div className="lane" style={{ width }}>
              {build.lines.map((l) => {
                const def = scene.lines.find((d) => d.id === l.id)!;
                const sel = isSel({ kind: "caption", id: l.id });
                return (
                  <div key={l.id} className={`block caption ${def.caption === false ? "off" : ""} ${sel ? "sel" : ""} ${collapsed.legenda ? "mini" : ""}`}
                    style={{ left: x(l.voiceStart), width: Math.max(x(l.voiceEnd - l.voiceStart), 10) }}
                    title={def.text} onPointerDown={() => onSelect({ kind: "caption", id: l.id })}>
                    {!collapsed.legenda && def.text}
                  </div>
                );
              })}
            </div>
          </div>

          {TRACKS.map((tr) => {
            const mini = !!collapsed[tr.id];
            const items = lanes(cues.filter((c) => CUE_META[c.c.type].track === (tr.id as Track)));
            const n = mini ? 1 : Math.max(1, ...items.map((i) => i.lane + 1));
            return (
              <div key={tr.id} className={`row ${mini ? "collapsed" : ""}`} style={{ height: mini ? 16 : 6 + n * LANE_H }}>
                {label(tr.id, tr.label, tr.color, tr.add, { showSmooth: tr.id === "camera" })}
                <div className="lane" style={{ width }}>{items.map((it) => cueBlock(it, tr.color, mini))}</div>
              </div>
            );
          })}

          <div className="playhead" style={{ left: LABEL_W + x(time) }} />
        </div>
      </div>
    </div>
  );
}
