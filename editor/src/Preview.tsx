// Preview 9:16 com o Player DE VERDADE da engine (o mesmo que exporta). Arraste personagens pra posicionar.
import { useEffect, useRef, useState } from "react";
import { Player } from "../../engine/src/player";
import type { Build, Scene } from "../../engine/src/scene/types.ts";

interface Props {
  scene: Scene;
  build: Build;
  time: number;
  selectedActor?: string;
  onSelectActor: (id: string) => void;
  onMoveActor: (id: string, x: number, z: number, key: string) => void;
}

export function Preview({ scene, build, time, selectedActor, onSelectActor, onMoveActor }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<Player>(null);
  const [error, setError] = useState("");
  const [, redraw] = useState(0);

  useEffect(() => {
    if (!canvas.current) return;
    try {
      if (!player.current) player.current = new Player(canvas.current, scene, build);
      else player.current.load(scene, build);
      setError("");
    } catch (e) { setError(String(e)); }
  }, [scene, build]);

  useEffect(() => {
    try { player.current?.render(Math.floor(time * build.fps) / build.fps); redraw((n) => n + 1); } catch (e) { setError(String(e)); }
  }, [time, scene, build]);

  const box = player.current?.boxes.find((b) => b.id === selectedActor);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = player.current;
    if (!p) return;
    const r = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * 180, sy = ((e.clientY - r.top) / r.height) * 320;
    const hit = [...p.boxes].reverse().find((b) => sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h);
    if (!hit) return;
    onSelectActor(hit.id);
    const def = scene.actors[hit.id];
    const zoom = p.r.camera.zoom, x0 = e.clientX, y0 = e.clientY, key = `drag-actor-${hit.id}-${Date.now()}`;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - x0) / r.width) * 180 / zoom, dy = ((ev.clientY - y0) / r.height) * 320 / zoom;
      onMoveActor(hit.id, Math.round(def.x + dx), Math.round(def.z + dy / p.r.depthScale), key);
    };
    const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  return (
    <div className="preview">
      <div className="canvas-wrap" onPointerDown={down}>
        <canvas ref={canvas} />
        {box && <div className="sel-box" style={{ left: `${(box.x / 180) * 100}%`, top: `${(box.y / 320) * 100}%`, width: `${(box.w / 180) * 100}%`, height: `${(box.h / 320) * 100}%` }} />}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
