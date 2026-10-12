// Conversa com o servidor local do editor (vite.config.ts).
import type { Analysis, Scene, Word } from "../../engine/src/scene/types.ts";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error ?? `erro ${r.status}`);
  return data as T;
}
const post = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const listProjects = () => call<string[]>("/api/projects");
export const loadProject = (id: string) => call<{ scene: Scene; mtime: number }>(`/api/project/${id}`);
export const projectMtime = (id: string) => call<{ mtime: number }>(`/api/project/${id}/mtime`);
export const saveProject = (scene: Scene) =>
  call<{ saved: string; mtime: number }>(`/api/project/${scene.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scene) });
export const listSources = (dir: string) => call<string[]>(`/api/audio?dir=${encodeURIComponent(dir)}`);
export const audioUrl = (dir: string, source: string) => `/api/audio?dir=${encodeURIComponent(dir)}&source=${encodeURIComponent(source)}`;
export const analyzeSources = (dir: string, sources: string[]) => call<Record<string, Analysis>>("/api/analysis", post({ dir, sources }));
export const transcribe = (dir: string, source: string) => call<{ text: string; words: Word[] }>("/api/transcribe", post({ dir, source }));
export const exportStart = (scene: Scene) => call<{ job: string; total: number }>("/api/export/start", post(scene));
export const exportFrames = (job: string, data: Uint8Array<ArrayBuffer>) =>
  call<{ frames: number }>(`/api/export/${job}/frames`, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: data as BodyInit });
export const exportFinish = (job: string) => call<{ out: string; frames: number }>(`/api/export/${job}/finish`, { method: "POST" });
