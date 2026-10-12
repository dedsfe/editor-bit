// Preview no navegador (play/pause/scrub) e modo export (?export=1) usado pelo scripts/export.mjs.
import { Player } from "./player";
import type { Scene, Build } from "./scene/types";

const params = new URLSearchParams(location.search);
const id = params.get("scene") ?? "mvp-fogueira";
const sceneRes = await fetch(`/projetos/${id}.json`);
if (!sceneRes.ok) throw new Error(`cena "${id}" não existe em projetos/`);
const scene: Scene = await sceneRes.json();

const res = await fetch(`/build/${id}.json`);
if (!res.ok) throw new Error(`sem build pra "${id}": rode npm run build -- ${id}`);
const build: Build = await res.json();

const canvas = document.querySelector("canvas")!;
const player = new Player(canvas, scene, build);
const w = window as unknown as Record<string, unknown>;
const cam = params.get("cam")?.split(",").map(Number);
if (cam?.length === 3) player.cameraOverride = { x: cam[0], y: cam[1], zoom: cam[2] };

if (params.has("export")) {
  document.body.classList.add("export");
  // devolve N frames (RGBA cru, de baixo pra cima) em base64
  w.__frames = (start: number, n: number, stamp = false) => {
    const size = player.r.w * player.r.h * 4;
    const all = new Uint8Array(size * n);
    for (let i = 0; i < n; i++) {
      if (stamp) player.stamp = `${((start + i) / build.fps).toFixed(1)}S`;
      player.render((start + i) / build.fps);
      all.set(player.r.read(), i * size);
    }
    let s = "";
    for (let i = 0; i < all.length; i += 0x8000) s += String.fromCharCode(...all.subarray(i, i + 0x8000));
    return btoa(s);
  };
  w.__time = (ref: Parameters<typeof player.tl.time>[0]) => player.tl.time(ref);
  w.__duration = build.duration;
  w.__fps = build.fps;
  w.__ready = true;
} else if (params.has("t")) {
  player.render(Number(params.get("t")));
  document.body.dataset.ready = "1";
} else {
  const audio = new Audio(build.audio);
  const play = document.querySelector<HTMLButtonElement>("#play")!;
  const scrub = document.querySelector<HTMLInputElement>("#scrub")!;
  const time = document.querySelector<HTMLSpanElement>("#time")!;
  scrub.max = String(build.duration);
  let t = 0;
  play.onclick = () => (audio.paused ? audio.play() : audio.pause());
  audio.onplay = () => (play.textContent = "❚❚");
  audio.onpause = () => (play.textContent = "▶");
  audio.onended = () => { audio.currentTime = 0; };
  scrub.oninput = () => { t = Number(scrub.value); audio.currentTime = t; };
  addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); play.click(); } });
  const loop = () => {
    if (!audio.paused) t = audio.currentTime;
    // trava no frame do vídeo (30 fps) pra ficar igual ao export
    player.render(Math.floor(t * build.fps) / build.fps);
    scrub.value = String(t);
    time.textContent = `${t.toFixed(2)} / ${build.duration.toFixed(2)}`;
    requestAnimationFrame(loop);
  };
  loop();
  document.body.dataset.ready = "1";
}
