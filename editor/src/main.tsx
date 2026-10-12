// Editor OQJF v2: edita projetos/<id>.json, que é exatamente a cena que a engine renderiza.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Analysis, Build, CueType, Scene } from "../../engine/src/scene/types.ts";
import { layout } from "../../engine/src/scene/layout.ts";
import { followSpeaker } from "../../engine/src/scene/auto.ts";
import { Timeline as TL } from "../../engine/src/scene/timeline";
import { Player } from "../../engine/src/player";
import * as api from "./api";
import { useHistory } from "./history";
import { Mixer } from "./audio";
import { CUE_META, anchorAt, makeCue, shiftRef, round } from "./cues";
import { Preview } from "./Preview";
import { Timeline, type Selection } from "./Timeline";
import { Inspector } from "./Inspector";
import "./style.css";

const params = new URLSearchParams(location.search);
const clock = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, "0")}`;

function App() {
  const [projectId, setProjectId] = useState(params.get("p") ?? "ep01");
  const [projects, setProjects] = useState<string[]>([]);
  const hist = useHistory<Scene>();
  const scene = hist.value;
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: "scene" });
  const [zoom, setZoom] = useState(22);
  const [smooth, setSmooth] = useState(true);
  const [camActor, setCamActor] = useState("");
  const [status, setStatus] = useState("Abrindo…");
  const [external, setExternal] = useState<Scene | null>(null);
  const [exporting, setExporting] = useState("");
  const mixer = useRef(new Mixer());
  const diskMtime = useRef(0);

  // ---- abrir projeto
  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => {});
    api.loadProject(projectId).then(({ scene, mtime }) => {
      hist.reset(scene);
      diskMtime.current = mtime;
      setTime(0);
      setSelection({ kind: "scene" });
      setStatus(`Aberto: projetos/${projectId}.json`);
      history.replaceState(null, "", `?p=${projectId}`);
    }).catch((e) => setStatus(String(e)));
  }, [projectId]);

  // ---- análise dos áudios (lip-sync, onde a voz começa/termina), só do que falta
  useEffect(() => {
    if (!scene) return;
    const missing = [...new Set(scene.lines.map((l) => l.source ?? l.id))].filter((s) => !analyses[s]);
    if (!missing.length) return;
    api.analyzeSources(scene.audio, missing).then((a) => setAnalyses((o) => ({ ...o, ...a }))).catch((e) => setStatus(String(e)));
  }, [scene, analyses]);

  const build: Build | null = useMemo(() => {
    if (!scene) return null;
    try { return layout(scene, analyses); } catch { return null; }
  }, [scene, analyses]);
  const tl = useMemo(() => (scene && build ? new TL(scene, build) : null), [scene, build]);

  // ---- mudança feita fora do editor (ex.: a IA mexeu no JSON): recarrega sozinho se não tem edição pendente
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const { mtime } = await api.projectMtime(projectId);
        if (mtime <= diskMtime.current) return;
        const { scene: disk, mtime: m } = await api.loadProject(projectId);
        diskMtime.current = m;
        if (hist.dirty) setExternal(disk);
        else { hist.set(disk); hist.markSaved(); setStatus("Arquivo mudou fora do editor: recarregado (Cmd+Z desfaz)"); }
      } catch { /* servidor reiniciando */ }
    }, 1500);
    return () => clearInterval(iv);
  }, [projectId, hist.dirty]);

  const edit = useCallback((fn: (s: Scene) => Scene, key?: string) => { hist.set(fn, key); }, [hist.set]);

  const save = useCallback(async () => {
    if (!scene) return;
    try {
      const r = await api.saveProject(scene);
      diskMtime.current = r.mtime;
      hist.markSaved();
      setExternal(null);
      setStatus(`Salvo em ${r.saved}`);
    } catch (e) { setStatus(String(e)); }
  }, [scene]);

  // ---- autosave: 1 s depois da última mudança o arquivo já está gravado (a IA sempre vê o estado atual)
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!scene || !hist.dirty) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try { await save(); } finally { setSaving(false); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [scene, hist.dirty]);

  // ---- play/pause
  const stop = useCallback(() => { mixer.current.stop(); setPlaying(false); }, []);
  const play = useCallback(async () => {
    if (!scene || !build) return;
    if (playing) return stop();
    await mixer.current.prepare(scene.audio, [...new Set(build.lines.map((l) => l.source))]);
    const t0 = time >= build.duration - 0.05 ? 0 : time;
    mixer.current.play(scene.audio, build, t0);
    setPlaying(true);
  }, [scene, build, playing, time]);
  useEffect(() => {
    if (!playing || !build) return;
    let raf = 0;
    const tick = () => {
      const t = mixer.current.time;
      if (t >= build.duration) { stop(); setTime(build.duration); return; }
      setTime(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, build]);
  const seek = (t: number) => { if (playing) stop(); setTime(t); };

  // ---- adicionar coisas no cursor
  const actorIds = scene ? Object.keys(scene.actors) : [];
  const mainActor = camActor || (selection.kind === "actor" ? selection.id : actorIds[0]);
  const addCue = (type: CueType) => {
    if (!scene || !build || !tl) return;
    const other = actorIds.find((a) => a !== mainActor) ?? mainActor;
    const cue = makeCue(type, anchorAt(time, build), { actor: mainActor, other, t: time, tl });
    edit((s) => ({ ...s, cues: [...(s.cues ?? []), cue] }));
    setSelection({ kind: "cue", index: (scene.cues ?? []).length });
    setStatus(`${CUE_META[type].label} adicionado em ${time.toFixed(2)} s`);
  };
  const cameraPreset = (actor: string | null, shot: "close" | "medium" | "wide") => {
    if (!scene || !build) return;
    const cue = actor ? { type: "camera" as const, at: anchorAt(time, build), actor, shot, dur: smooth ? 0.6 : 0 }
      : { type: "camera" as const, at: anchorAt(time, build), shot: "wide" as const, dur: smooth ? 0.8 : 0 };
    edit((s) => ({ ...s, cues: [...(s.cues ?? []), cue] }));
    setSelection({ kind: "cue", index: (scene.cues ?? []).length });
  };
  const follow = () => {
    if (!scene || !build) return;
    edit((s) => ({ ...s, cues: followSpeaker(s, build, { shot: "medium", dur: smooth ? 0.5 : 0 }) }));
    setSelection({ kind: "scene" });
    setStatus("Câmera segue quem fala: cues de câmera gerados (marcados como auto)");
  };
  const transcribe = async (ids: string[], useText: boolean) => {
    if (!scene) return;
    for (const [i, id] of ids.entries()) {
      const line = scene.lines.find((l) => l.id === id)!;
      setStatus(`Whisper ${i + 1}/${ids.length}: ${id}…`);
      const r = await api.transcribe(scene.audio, line.source ?? line.id);
      edit((s) => ({ ...s, lines: s.lines.map((l) => (l.id === id ? { ...l, words: r.words, ...(useText || !l.text ? { text: r.text } : {}) } : l)) }));
    }
    setStatus(`Whisper: ${ids.length} fala(s) transcrita(s)`);
  };

  // ---- arrastos
  const moveLine = (id: string, mode: "move" | "in" | "out", d: number, key: string) => edit((s) => {
    if (!build) return s;
    // na 1ª vez que arrasta, as falas "emendadas" ganham início fixo (senão mover uma empurraria todas)
    const lines = s.lines.map((l) => (l.start === undefined ? { ...l, start: build.lines.find((b) => b.id === l.id)!.clipStart } : l));
    const b = build.lines.find((x) => x.id === id)!, a = analyses[b.source];
    return {
      ...s, lines: lines.map((l) => {
        if (l.id !== id) return l;
        if (mode === "move") return { ...l, start: round(Math.max(0, b.clipStart + d)) };
        if (mode === "in") {
          const dd = Math.max(-b.trimIn, Math.min(d, b.clipDur - 0.1));
          return { ...l, start: round(b.clipStart + dd), trimIn: round(b.trimIn + dd) };
        }
        return { ...l, trimOut: round(Math.min(a.dur, Math.max(b.trimIn + 0.1, b.trimIn + b.clipDur + d))) };
      }),
    };
  }, key);
  const moveCue = (index: number, d: number, key: string) => {
    const orig = scene?.cues?.[index];
    if (!orig) return;
    // sempre a partir do cue original do começo do arrasto
    const base = dragBase.current?.key === key ? dragBase.current.cue : (dragBase.current = { key, cue: orig }).cue;
    edit((s) => ({
      ...s, cues: s.cues!.map((c, i) => {
        if (i !== index) return c;
        const n = { ...c, at: shiftRef(base.at, d) } as typeof c & { until?: typeof c.at };
        const u = (base as { until?: typeof c.at }).until;
        if (u !== undefined) n.until = shiftRef(u, d);
        delete n.auto;
        return n;
      }),
    }), key);
  };
  const dragBase = useRef<{ key: string; cue: NonNullable<Scene["cues"]>[number] } | null>(null);
  const moveActor = (id: string, x: number, z: number, key: string) =>
    edit((s) => ({ ...s, actors: { ...s.actors, [id]: { ...s.actors[id], x, z } } }), key);

  // ---- export pelo botão: o navegador renderiza com o Player da engine e o servidor codifica
  const exportMp4 = async () => {
    if (!scene || !build || exporting) return;
    stop();
    try {
      setExporting("Preparando áudio…");
      const { job, total } = await api.exportStart(scene);
      const canvas = document.createElement("canvas");
      const player = new Player(canvas, scene, build);
      const size = 180 * 320 * 4, BATCH = 30;
      for (let f = 0; f < total; f += BATCH) {
        const n = Math.min(BATCH, total - f), buf = new Uint8Array(size * n);
        for (let i = 0; i < n; i++) { player.render((f + i) / build.fps); buf.set(player.r.read(), i * size); }
        await api.exportFrames(job, buf);
        setExporting(`Renderizando ${Math.round(((f + n) / total) * 100)}%`);
      }
      setExporting("Codificando MP4…");
      const r = await api.exportFinish(job);
      player.r.gl.getExtension("WEBGL_lose_context")?.loseContext();
      setStatus(`MP4 pronto: ${r.out} (${r.frames} frames)`);
      (window as unknown as { __lastExport: string }).__lastExport = r.out;
    } catch (e) { setStatus(`Export falhou: ${e}`); }
    finally { setExporting(""); }
  };

  // ---- atalhos
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).matches("input[type=text],input:not([type]),textarea,input[type=number]");
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); e.shiftKey ? hist.redo() : hist.undo(); return; }
      if (mod && e.key.toLowerCase() === "y" && !typing) { e.preventDefault(); hist.redo(); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); return; }
      if (typing) return;
      if (e.code === "Space") { e.preventDefault(); void play(); }
      if (e.key === "ArrowRight") seek(Math.min(time + (e.shiftKey ? 1 : 1 / 30), build?.duration ?? 0));
      if (e.key === "ArrowLeft") seek(Math.max(time - (e.shiftKey ? 1 : 1 / 30), 0));
      if ((e.key === "Delete" || e.key === "Backspace") && selection.kind === "cue") {
        edit((s) => ({ ...s, cues: s.cues!.filter((_, i) => i !== selection.index) }));
        setSelection({ kind: "scene" });
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  // estado exposto pra testes automáticos (scripts/editor-test.mjs)
  (window as unknown as { __editor: unknown }).__editor = { scene, build, dirty: hist.dirty, canUndo: hist.canUndo, canRedo: hist.canRedo, status };

  if (!scene || !build || !tl) return <div className="loading">{status}</div>;

  const btn = (type: CueType, label?: string) => <button key={type} onClick={() => addCue(type)}>{label ?? CUE_META[type].label}</button>;

  return (
    <div className="app">
      <header>
        <strong className="brand">OQJF · editor</strong>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((p) => <option key={p}>{p}</option>)}</select>
        <span className="name">{scene.name ?? scene.id}</span>
        <button disabled={!hist.canUndo} onClick={hist.undo} title="Desfazer (Cmd+Z)">↶ Desfazer</button>
        <button disabled={!hist.canRedo} onClick={hist.redo} title="Refazer (Cmd+Shift+Z)">↷ Refazer</button>
        <span className="saved" title="Salva sozinho 1 s depois de cada mudança (Cmd+S força)">{saving ? "salvando…" : hist.dirty ? "editando…" : "✓ salvo"}</span>
        <span className="spacer" />
        <button className="export" disabled={!!exporting} onClick={exportMp4}>{exporting || "Exportar MP4"}</button>
      </header>

      {external && (
        <div className="banner">O arquivo mudou fora do editor (ex.: a IA editou).
          <button onClick={() => { hist.set(external); hist.markSaved(); setExternal(null); }}>Carregar a versão do disco</button>
          <button onClick={() => setExternal(null)}>Manter a minha</button></div>
      )}

      <div className="tools">
        <div className="group"><span>Câmera</span>
          <select value={mainActor} onChange={(e) => setCamActor(e.target.value)}>{actorIds.map((a) => <option key={a} value={a}>{scene.actors[a].name ?? a}</option>)}</select>
          <button onClick={() => cameraPreset(mainActor, "close")}>Close no rosto</button>
          <button onClick={() => cameraPreset(mainActor, "medium")}>Plano médio</button>
          <button onClick={() => cameraPreset(null, "wide")}>Plano geral</button>
          <label className="check"><input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} /> suave</label>
          <button onClick={follow} title="Gera um enquadramento por fala, alternando entre quem fala">🎥 Câmera segue quem fala</button>
          {btn("shake", "Tremor")}
        </div>
        <div className="group"><span>Clima</span>{btn("weather", "Keyframe de clima")}{btn("lightning", "⚡ Relâmpago")}</div>
        <div className="group"><span>Ações</span>{btn("walk")}{btn("sink")}{btn("reach")}{btn("hold")}{btn("face")}</div>
        <div className="group"><span>Tela</span>{btn("hook", "Gancho")}{btn("bubble", "Balão")}{btn("thought", "Pensamento")}{btn("counter")}{btn("card", "Card")}</div>
        <div className="group"><span>Legenda</span>
          <button onClick={() => transcribe(scene.lines.map((l) => l.id), false)}>Whisper: tempo de todas</button>
        </div>
      </div>

      <main>
        <Preview scene={scene} build={build} time={time}
          selectedActor={selection.kind === "actor" ? selection.id : undefined}
          onSelectActor={(id) => setSelection({ kind: "actor", id })} onMoveActor={moveActor} />
        <Inspector scene={scene} build={build} tl={tl} time={time} selection={selection} edit={edit}
          onSelect={setSelection} onTranscribe={transcribe} cameraPreset={cameraPreset} />
      </main>

      <div className="transport">
        <button className="play" onClick={play}>{playing ? "❚❚" : "▶"}</button>
        <span className="clock">{clock(time)} / {clock(build.duration)}</span>
        <button onClick={() => setSelection({ kind: "scene" })}>Cena</button>
        <span className="spacer" />
        <label>zoom <input type="range" min={8} max={80} value={zoom} onChange={(e) => setZoom(+e.target.value)} /></label>
      </div>
      <Timeline scene={scene} build={build} tl={tl} time={time} zoom={zoom} selection={selection}
        onSeek={seek} onSelect={setSelection} onMoveLine={moveLine} onMoveCue={moveCue} />
      <footer>{status} · Espaço play · ←/→ frame · Cmd+Z/Cmd+Shift+Z · Cmd+S · Delete apaga cue</footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
