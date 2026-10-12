// Editor OQJF v2: edita projetos/<id>.json, que é exatamente a cena que a engine renderiza.
import { Undo2, Redo2, Keyboard, Clapperboard, Download, Play, Pause, ZoomIn, ZoomOut, Film } from "lucide-react";
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
import { CUE_META, SOUNDS, setSounds, anchorAt, makeCue, shiftRef, round, type AddItem } from "./cues";
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
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [zoom, setZoom] = useState(22);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState("Abrindo…");
  const [external, setExternal] = useState<Scene | null>(null);
  const [exporting, setExporting] = useState("");
  const mixer = useRef(new Mixer());
  const diskMtime = useRef(0);

  // ---- biblioteca de sons (sons/manifest.json)
  const [, setSoundsLoaded] = useState(0);
  useEffect(() => { api.listSounds().then((l) => { setSounds(l); setSoundsLoaded(l.length); }).catch(() => {}); }, []);

  // ---- abrir projeto
  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => {});
    api.loadProject(projectId).then(({ scene, mtime }) => {
      hist.reset(scene);
      diskMtime.current = mtime;
      setTime(0);
      setSelection({ kind: "none" });
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
    const used = [...new Set((scene.cues ?? []).flatMap((c) => (c.type === "sound" && SOUNDS.some((s) => s.id === c.sound) ? [c.sound] : [])))];
    await mixer.current.prepare(scene.audio, [...new Set(build.lines.map((l) => l.source))], used);
    const t0 = time >= build.duration - 0.05 ? 0 : time;
    mixer.current.play(scene, build, t0, SOUNDS);
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
  // quem o "+" sugere: o selecionado, senão quem está falando agora, senão o primeiro
  const speakingNow = build?.lines.find((l) => time >= l.clipStart && time <= l.clipStart + l.clipDur)?.speaker;
  const mainActor = selection.kind === "actor" ? selection.id : speakingNow ?? actorIds[0];
  const addCue = (type: CueType, actor = mainActor, variant?: string) => {
    if (!scene || !build || !tl) return;
    const other = actorIds.find((a) => a !== actor && !scene.actors[a].extra) ?? actor;
    const cue = makeCue(type, anchorAt(time, build), { actor, other, t: time, tl, variant });
    edit((s) => ({ ...s, cues: [...(s.cues ?? []), cue] }));
    setSelection({ kind: "cue", index: (scene.cues ?? []).length });
    setStatus(`${CUE_META[type].label} adicionado em ${time.toFixed(2)} s`);
  };
  const cameraPreset = (actor: string | null, shot: "close" | "medium" | "wide", smooth = true) => {
    if (!scene || !build) return;
    const cue = actor ? { type: "camera" as const, at: anchorAt(time, build), actor, shot, dur: smooth ? 0.6 : 0 }
      : { type: "camera" as const, at: anchorAt(time, build), shot: "wide" as const, dur: smooth ? 0.8 : 0 };
    edit((s) => ({ ...s, cues: [...(s.cues ?? []), cue] }));
    setSelection({ kind: "cue", index: (scene.cues ?? []).length });
  };
  const follow = (smooth = true) => {
    if (!scene || !build) return;
    edit((s) => ({ ...s, cues: followSpeaker(s, build, { shot: "medium", dur: smooth ? 0.5 : 0 }) }));
    setSelection({ kind: "none" });
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
  /** O que acontece quando escolhe uma opção no "+" de uma trilha. */
  const onAdd = (item: AddItem, actor: string, smooth: boolean) => {
    if (item.kind === "cue") addCue(item.type, actor, item.variant);
    else if (item.kind === "shot") cameraPreset(item.shot === "wide" ? null : actor, item.shot, smooth);
    else if (item.kind === "follow") follow(smooth);
    else if (item.kind === "whisper" && scene) void transcribe(scene.lines.map((l) => l.id), false);
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
        setSelection({ kind: "none" });
      }
      if (e.key === "Escape") { setSelection({ kind: "none" }); setHelp(false); }
      if (e.key === "?") setHelp((h) => !h);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  // estado exposto pra testes automáticos (scripts/editor-test.mjs)
  (window as unknown as { __editor: unknown }).__editor = { scene, build, dirty: hist.dirty, canUndo: hist.canUndo, canRedo: hist.canRedo, status };

  if (!scene || !build || !tl) return <div className="loading">{status}</div>;

  const panel = selection.kind !== "none";

  return (
    <div className="app">
      <header>
        <strong className="brand"><span className="logo"><Film size={16} strokeWidth={2.4} /></span>OQJF <small>studio</small></strong>
        <select className="project" value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Projeto">
          {projects.map((p) => <option key={p}>{p}</option>)}
        </select>
        <span className="name">{scene.name ?? scene.id}</span>
        <span className="spacer" />
        <button className="icon" disabled={!hist.canUndo} onClick={hist.undo} title="Desfazer (Cmd+Z)" aria-label="Desfazer"><Undo2 size={17} /></button>
        <button className="icon" disabled={!hist.canRedo} onClick={hist.redo} title="Refazer (Cmd+Shift+Z)" aria-label="Refazer"><Redo2 size={17} /></button>
        <span className="saved" title="Salva sozinho 1 s depois de cada mudança">{saving ? "salvando…" : hist.dirty ? "editando…" : "salvo"}</span>
        <button className={`ghost ${selection.kind === "scene" ? "on" : ""}`} onClick={() => setSelection(selection.kind === "scene" ? { kind: "none" } : { kind: "scene" })} title="Ajustes da cena"><Clapperboard size={15} /> Cena</button>
        <button className="icon" onClick={() => setHelp((h) => !h)} title="Atalhos (?)" aria-label="Atalhos"><Keyboard size={17} /></button>
        <button className="export" disabled={!!exporting} onClick={exportMp4}><Download size={15} strokeWidth={2.4} /> {exporting || "Exportar"}</button>
      </header>

      {external && (
        <div className="banner">O arquivo mudou fora do editor.
          <button onClick={() => { hist.set(external); hist.markSaved(); setExternal(null); }}>Carregar do disco</button>
          <button onClick={() => setExternal(null)}>Manter o meu</button></div>
      )}

      {help && (
        <div className="help" onClick={() => setHelp(false)}>
          <div><kbd>Espaço</kbd> play / pause</div>
          <div><kbd>←</kbd> <kbd>→</kbd> 1 frame · <kbd>Shift</kbd> 1 s</div>
          <div><kbd>⌘Z</kbd> desfazer · <kbd>⌘⇧Z</kbd> refazer</div>
          <div><kbd>Delete</kbd> apaga o selecionado · <kbd>Esc</kbd> fecha</div>
          <div><b>+</b> na trilha = adicionar no cursor</div>
        </div>
      )}

      <main className={panel ? "with-panel" : ""}>
        <Preview scene={scene} build={build} time={time}
          selectedActor={selection.kind === "actor" ? selection.id : undefined}
          onSelectActor={(id) => setSelection({ kind: "actor", id })} onMoveActor={moveActor} />
        {panel && (
          <Inspector scene={scene} build={build} tl={tl} time={time} selection={selection} edit={edit}
            onSelect={setSelection} onTranscribe={transcribe} cameraPreset={cameraPreset} onClose={() => setSelection({ kind: "none" })} />
        )}
      </main>

      <div className="transport">
        <button className="play" onClick={play} aria-label={playing ? "Pausar" : "Tocar"}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
        <span className="clock">{clock(time)} <span className="muted">/ {clock(build.duration)}</span></span>
        <span className="status">{status}</span>
        <span className="spacer" />
        <button className="icon" onClick={() => setZoom((z) => Math.max(8, z / 1.4))} aria-label="Diminuir zoom"><ZoomOut size={17} /></button>
        <button className="icon" onClick={() => setZoom((z) => Math.min(90, z * 1.4))} aria-label="Aumentar zoom"><ZoomIn size={17} /></button>
      </div>
      <Timeline scene={scene} build={build} tl={tl} time={time} zoom={zoom} selection={selection} defaultActor={mainActor}
        onSeek={seek} onSelect={setSelection} onMoveLine={moveLine} onMoveCue={moveCue} onAdd={onAdd} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
