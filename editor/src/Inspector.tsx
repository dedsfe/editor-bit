// Inspetor: edita o que está selecionado (cena, personagem, fala, legenda ou cue).
import { useState } from "react";
import type { Build, Cue, LineDef, Scene, TimeRef, Weather } from "../../engine/src/scene/types.ts";
import type { Timeline as TL } from "../../engine/src/scene/timeline";
import { SKINS } from "../../engine/src/skins";
import { SETS } from "../../engine/src/sets";
import { CUE_META, round, type Field } from "./cues";
import { parseRef, sameStyle, type RefParts } from "../../engine/src/scene/time.ts";
import type { Selection } from "./Timeline";

type Edit = (fn: (s: Scene) => Scene, key?: string) => void;

interface Props {
  scene: Scene;
  build: Build;
  tl: TL;
  time: number;
  selection: Selection;
  edit: Edit;
  onSelect: (s: Selection) => void;
  onTranscribe: (lineIds: string[], useText: boolean) => Promise<void>;
  cameraPreset: (actor: string | null, shot: "close" | "medium" | "wide") => void;
}

const Num = ({ label, value, min, max, step, onChange, hint }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; hint?: string }) => (
  <label className="field">
    <span>{label}{hint && <i> · {hint}</i>}</span>
    <div className="num">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <input type="number" min={min} max={max} step={step} value={round(value)} onChange={(e) => onChange(+e.target.value)} />
    </div>
  </label>
);

/** Editor de TimeRef: preso a uma fala (início/fim + deslocamento) ou tempo fixo. */
function TimeField({ label, value, scene, tl, onChange }: { label: string; value: TimeRef | undefined; scene: Scene; tl: TL; onChange: (v: TimeRef | undefined) => void }) {
  const abs = value === undefined ? undefined : tl.time(value);
  const p = value === undefined ? null : parseRef(value, (id) => scene.lines.some((l) => l.id === id));
  const line = p && typeof p === "object" ? p.line : "";
  const put = (np: number | RefParts) => onChange(sameStyle(value, np));
  return (
    <div className="field">
      <span>{label} {abs !== undefined && <i>· em {Number.isFinite(abs) ? abs.toFixed(2) : "?"} s</i>}</span>
      <div className="time-ref">
        <select value={value === undefined ? "__none" : line || "__abs"} onChange={(e) => {
          const v = e.target.value;
          if (v === "__none") return onChange(undefined);
          if (v === "__abs") return put(Number.isFinite(abs!) ? abs! : 0);
          const l = tl.build.lines.find((b) => b.id === v)!;
          put({ line: v, at: "start", offset: (Number.isFinite(abs!) ? abs! : l.voiceStart) - l.voiceStart });
        }}>
          {label !== "Começa" && <option value="__none">automático</option>}
          <option value="__abs">tempo fixo</option>
          {scene.lines.map((l) => <option key={l.id} value={l.id}>fala {l.id}</option>)}
        </select>
        {p && typeof p === "object" && (
          <select value={p.at} onChange={(e) => put({ ...p, at: e.target.value as "start" | "end" })}>
            <option value="start">início</option><option value="end">fim</option>
          </select>
        )}
        {p !== null && (
          <input type="number" step={0.05} value={round(typeof p === "number" ? p : p.offset)}
            onChange={(e) => put(typeof p === "number" ? +e.target.value : { ...p, offset: +e.target.value })} />
        )}
      </div>
    </div>
  );
}

function CueFields({ cue, index, scene, tl, edit }: { cue: Cue; index: number; scene: Scene; tl: TL; edit: Edit }) {
  const meta = CUE_META[cue.type];
  const rec = cue as unknown as Record<string, unknown>;
  const set = (k: string, v: unknown, key?: string) => edit((s) => ({
    ...s, cues: s.cues!.map((c, i) => {
      if (i !== index) return c;
      const n = { ...c } as Record<string, unknown>;
      if (v === undefined) delete n[k]; else n[k] = v;
      return n as unknown as Cue;
    }),
  }), key ?? `cue-${index}-${k}`);
  const actorIds = Object.keys(scene.actors);
  const field = (f: Field) => {
    const v = rec[f.key];
    const toggle = "optional" in f && f.optional && (
      <input type="checkbox" checked={v !== undefined} title="usar este valor"
        onChange={(e) => set(f.key, e.target.checked ? defaultFor(f) : undefined)} />
    );
    switch (f.kind) {
      case "number":
        return <div key={f.key} className="opt">{toggle}{v === undefined && f.optional ? <span className="muted">{f.label}</span> :
          <Num label={f.label} hint={f.hint} value={(v as number) ?? f.min} min={f.min} max={f.max} step={f.step} onChange={(n) => set(f.key, n)} />}</div>;
      case "text":
        return <label key={f.key} className="field"><span>{f.label}</span>
          {f.long ? <textarea value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value)} /> : <input value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value)} />}</label>;
      case "actor":
        return <label key={f.key} className="field"><span>{f.label}</span>
          <select value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value || undefined)}>
            {f.optional && <option value="">—</option>}
            {actorIds.map((a) => <option key={a} value={a}>{scene.actors[a].name ?? a}</option>)}
          </select></label>;
      case "select":
        return <label key={f.key} className="field"><span>{f.label}</span>
          <select value={v === undefined ? "" : String(v)} onChange={(e) => {
            const opt = f.options.find((o) => String(o[0]) === e.target.value);
            set(f.key, opt ? opt[0] : undefined);
          }}>
            {f.optional && <option value="">—</option>}
            {f.options.map(([val, label]) => <option key={String(val)} value={String(val)}>{label}</option>)}
          </select></label>;
      case "color":
        return <div key={f.key} className="opt">{toggle}<label className="field"><span>{f.label}</span>
          <input type="color" disabled={v === undefined} value={(v as string) ?? "#ffffff"} onChange={(e) => set(f.key, e.target.value)} /></label></div>;
      case "until":
        return <TimeField key={f.key} label="Até" value={rec.until as TimeRef | undefined} scene={scene} tl={tl} onChange={(t) => set("until", t)} />;
    }
  };
  return (
    <>
      <h3><span className="tag" style={{ background: meta.color }} />{meta.label}</h3>
      <TimeField label="Começa" value={cue.at} scene={scene} tl={tl} onChange={(t) => set("at", t ?? 0)} />
      {meta.fields.map(field)}
      {cue.auto && <p className="muted">Gerado por “{cue.auto === "follow" ? "câmera segue quem fala" : cue.auto}”. Editar aqui transforma em manual.</p>}
      <div className="row-btns">
        <button onClick={() => edit((s) => ({ ...s, cues: [...s.cues!, structuredClone(cue)] }))}>Duplicar</button>
        <button className="danger" onClick={() => edit((s) => ({ ...s, cues: s.cues!.filter((_, i) => i !== index) }))}>Apagar</button>
      </div>
    </>
  );
}

function defaultFor(f: Field): unknown {
  if (f.kind === "number") return f.key === "zoom" ? 1.8 : f.key === "x" ? 90 : f.key === "y" ? 190 : (f.min + f.max) / 2;
  if (f.kind === "color") return f.key === "color" ? "#8fd0ff" : "#ffffff";
  return undefined;
}

const WEATHER: [keyof Weather, string][] = [["rain", "Chuva"], ["wind", "Vento"], ["fog", "Neblina"], ["lightning", "Relâmpagos automáticos"], ["daylight", "Hora (0 noite → 1 amanhecer)"], ["waves", "Ondas"], ["swell", "Onda gigante"]];

export function Inspector({ scene, build, tl, time, selection, edit, onSelect, onTranscribe, cameraPreset }: Props) {
  const [busy, setBusy] = useState("");

  if (selection.kind === "cue") {
    const cue = scene.cues?.[selection.index];
    if (!cue) return <aside className="inspector"><p className="muted">Nada selecionado.</p></aside>;
    return <aside className="inspector"><CueFields cue={cue} index={selection.index} scene={scene} tl={tl} edit={edit} /></aside>;
  }

  if (selection.kind === "actor") {
    const id = selection.id, a = scene.actors[id];
    if (!a) return <aside className="inspector" />;
    const set = (patch: Partial<typeof a>, key?: string) => edit((s) => ({ ...s, actors: { ...s.actors, [id]: { ...s.actors[id], ...patch } } }), key);
    return (
      <aside className="inspector">
        <h3>{a.name ?? id}</h3>
        <label className="field"><span>Nome</span><input value={a.name ?? ""} onChange={(e) => set({ name: e.target.value }, `actor-name-${id}`)} /></label>
        <label className="field"><span>Skin</span>
          <select value={a.skin} onChange={(e) => set({ skin: e.target.value })}>{Object.values(SKINS).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <Num label="Posição inicial X" value={a.x} min={-60} max={300} step={1} onChange={(n) => set({ x: n }, `actor-x-${id}`)} />
        <Num label="Profundidade inicial" value={a.z} min={-40} max={120} step={1} onChange={(n) => set({ z: n }, `actor-z-${id}`)} />
        <label className="field"><span>Olhando para</span>
          <select value={a.facing ?? 1} onChange={(e) => set({ facing: +e.target.value as 1 | -1 })}><option value={1}>Direita</option><option value={-1}>Esquerda</option></select></label>
        <h4>Câmera neste personagem (no cursor)</h4>
        <div className="row-btns">
          <button onClick={() => cameraPreset(id, "close")}>Close no rosto</button>
          <button onClick={() => cameraPreset(id, "medium")}>Plano médio</button>
          <button onClick={() => cameraPreset(id, "wide")}>Plano geral</button>
        </div>
        <p className="muted">Arraste o personagem no preview pra mudar a posição inicial.</p>
      </aside>
    );
  }

  if (selection.kind === "line" || selection.kind === "caption") {
    const def = scene.lines.find((l) => l.id === selection.id);
    const b = build.lines.find((l) => l.id === selection.id);
    if (!def || !b) return <aside className="inspector" />;
    const set = (patch: Partial<LineDef>, key?: string) => edit((s) => ({ ...s, lines: s.lines.map((l) => (l.id === def.id ? { ...l, ...patch } : l)) }), key);
    const whisper = def.words?.map((w) => w.w).join(" ");
    const run = async (useText: boolean) => { setBusy("Transcrevendo…"); try { await onTranscribe([def.id], useText); } finally { setBusy(""); } };
    return (
      <aside className="inspector">
        <h3>Fala {def.id}</h3>
        <label className="field"><span>Legenda (o que foi falado)</span>
          <textarea value={def.text} onChange={(e) => set({ text: e.target.value }, `text-${def.id}`)} /></label>
        <label className="check"><input type="checkbox" checked={def.caption !== false} onChange={(e) => set({ caption: e.target.checked ? undefined : false })} /> mostrar legenda</label>
        <div className="row-btns">
          <button disabled={!!busy} onClick={() => run(false)}>{busy || "Whisper: só o tempo das palavras"}</button>
          <button disabled={!!busy} onClick={() => run(true)}>Whisper: texto + tempo</button>
        </div>
        {whisper && <p className="muted">Whisper ouviu: “{whisper}”{def.words!.length === def.text.split(/\s+/).filter(Boolean).length ? " · legenda troca de página no tempo das palavras ✓" : " · nº de palavras diferente: legenda usa tempo proporcional"}</p>}
        <label className="field"><span>Quem fala</span>
          <select value={b.speaker} onChange={(e) => set({ speaker: e.target.value })}>{Object.keys(scene.actors).map((a) => <option key={a} value={a}>{scene.actors[a].name ?? a}</option>)}</select></label>
        <h4>Áudio ({def.source ?? def.id})</h4>
        <Num label="Começa na timeline (s)" value={b.clipStart} min={0} max={build.duration} step={0.01} onChange={(n) => set({ start: round(n) }, `start-${def.id}`)} />
        <Num label="Aparar começo (s)" value={b.trimIn} min={0} max={b.trimIn + b.clipDur - 0.05} step={0.01} onChange={(n) => set({ trimIn: round(n) }, `in-${def.id}`)} />
        <Num label="Volume" value={def.volume ?? 1} min={0} max={2} step={0.05} onChange={(n) => set({ volume: n }, `vol-${def.id}`)} />
        {def.start !== undefined && <button onClick={() => set({ start: undefined })}>Voltar a emendar automático</button>}
        <p className="muted">Voz em {b.voiceStart.toFixed(2)}–{b.voiceEnd.toFixed(2)} s · cursor em {time.toFixed(2)} s</p>
      </aside>
    );
  }

  // ---- cena
  const setKind = Object.keys(SETS);
  const params = Object.entries(scene.set).filter(([k, v]) => k !== "kind" && typeof v === "number") as [string, number][];
  const w = scene.weather ?? {};
  return (
    <aside className="inspector">
      <h3>Cena</h3>
      <label className="field"><span>Nome</span><input value={scene.name ?? ""} onChange={(e) => edit((s) => ({ ...s, name: e.target.value }), "scene-name")} /></label>
      <label className="field"><span>Cenário</span>
        <select value={scene.set.kind} onChange={(e) => edit((s) => ({ ...s, set: { kind: e.target.value } }))}>{setKind.map((k) => <option key={k}>{k}</option>)}</select></label>
      {params.map(([k, v]) => <Num key={k} label={k} value={v} min={-80} max={260} step={1} onChange={(n) => edit((s) => ({ ...s, set: { ...s.set, [k]: n } }), `set-${k}`)} />)}
      <h4>Clima no começo</h4>
      {WEATHER.map(([k, label]) => <Num key={k} label={label} value={w[k] ?? 0} min={0} max={1} step={0.05} onChange={(n) => edit((s) => ({ ...s, weather: { ...s.weather, [k]: n } }), `w-${k}`)} />)}
      <h4>Tempo</h4>
      <Num label="Antes da 1ª fala (s)" value={scene.intro ?? 1} min={0} max={10} step={0.1} onChange={(n) => edit((s) => ({ ...s, intro: n }), "intro")} />
      <Num label="Depois da última (s)" value={scene.outro ?? 1.5} min={0} max={20} step={0.1} onChange={(n) => edit((s) => ({ ...s, outro: n }), "outro")} />
      <Num label="Pausa entre falas (s)" value={scene.gap ?? 0.3} min={0} max={3} step={0.05} onChange={(n) => edit((s) => ({ ...s, gap: n }), "gap")} />
      <h4>Câmera inicial</h4>
      {(["x", "y", "zoom"] as const).map((k) => {
        const cam = scene.camera ?? { x: 90, y: 160, zoom: 1 };
        return <Num key={k} label={k} value={cam[k]} min={k === "zoom" ? 0.8 : -60} max={k === "zoom" ? 4 : 320} step={k === "zoom" ? 0.05 : 1}
          onChange={(n) => edit((s) => ({ ...s, camera: { ...cam, [k]: n } }), `cam-${k}`)} />;
      })}
      <h4>Visual</h4>
      <Num label="Legenda: altura (px)" value={scene.look?.captionY ?? 236} min={150} max={290} step={1} onChange={(n) => edit((s) => ({ ...s, look: { ...s.look, captionY: n } }), "capY")} />
      <Num label="8-bit: níveis de cor (0 = desligado)" value={scene.look?.levels ?? 0} min={0} max={16} step={1} onChange={(n) => edit((s) => ({ ...s, look: { ...s.look, levels: n } }), "levels")} />
      <p className="muted">{scene.lines.length} falas · {(scene.cues ?? []).length} cues · {build.duration.toFixed(1)} s</p>
    </aside>
  );
}
