// Menu do "+" de cada trilha: só as opções daquela trilha, e (quando precisa) pra quem.
import { useEffect, useRef, useState } from "react";
import type { Scene } from "../../engine/src/scene/types.ts";
import type { AddItem } from "./cues";

interface Props {
  scene: Scene;
  items: AddItem[];
  color: string;
  defaultActor: string;
  showSmooth?: boolean;
  /** onde abrir (tela) */
  at: { x: number; y: number; up: boolean };
  onPick: (item: AddItem, actor: string, smooth: boolean) => void;
  onClose: () => void;
}

export function AddMenu({ scene, items, color, defaultActor, showSmooth, at, onPick, onClose }: Props) {
  const [actor, setActor] = useState(defaultActor);
  const [smooth, setSmooth] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const out = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => addEventListener("pointerdown", out), 0);
    addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", out); removeEventListener("keydown", esc); };
  }, [onClose]);
  const needsActor = items.some((i) => "actor" in i && i.actor);
  // só quem fala + quem não é figurante aparece primeiro; figurantes ficam no fim
  const people = Object.entries(scene.actors).sort(([, a], [, b]) => +!!a.extra - +!!b.extra);

  return (
    <div className="menu" ref={ref} role="menu"
      style={{ borderTopColor: color, left: at.x, ...(at.up ? { bottom: innerHeight - at.y + 30 } : { top: at.y }) }}>
      {needsActor && (
        <div className="menu-actors">
          <span>Pra quem</span>
          <select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Pra quem">
            {people.map(([id, a]) => <option key={id} value={id}>{a.name ?? id}</option>)}
          </select>
        </div>
      )}
      {items.map((it) => (
        <button key={it.label} role="menuitem" onClick={() => { onPick(it, actor, smooth); onClose(); }}>
          <span>{it.label}</span>
          {it.hint && <small>{it.hint}</small>}
        </button>
      ))}
      {showSmooth && (
        <label className="menu-foot"><input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} /> transição suave (desligado = corte seco)</label>
      )}
    </div>
  );
}
