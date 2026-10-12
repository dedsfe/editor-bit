// Formato de cena. Uma cena = cenário + personagens + falas (áudio) + "cues" amarrados a falas ou tempos.
// É o MESMO formato do arquivo de projeto do editor (projetos/<id>.json): uma fonte de verdade só.
// Este arquivo só tem tipos, pra rodar até no Node sem build.

/**
 * Tempo absoluto em segundos, ou relativo a uma fala (início/fim da VOZ, não do arquivo).
 * Formato curto em texto: "08-jesus", "08-jesus:end", "08-jesus+0.3", "10-pedro:end-1.3" (ver time.ts).
 */
export type TimeRef = number | string | { line: string; at?: "start" | "end"; offset?: number };

/** Palavra transcrita (tempos em segundos dentro do arquivo de áudio). */
export interface Word { w: string; t0: number; t1: number }

export interface LineDef {
  /** id único da fala (ex.: "03-pedro"); também é o nome do áudio se `source` faltar */
  id: string;
  /** o que foi FALADO (vira legenda) */
  text: string;
  /** quem fala; se faltar, sai do id ("03-pedro" → "pedro") */
  speaker?: string;
  /** pausa antes desta fala, em segundos (padrão: scene.gap). Ignorado se `start` existir */
  gap?: number;
  /** false = sem legenda (ex.: quando já tem balão) */
  caption?: boolean;
  /** arquivo de áudio (sem extensão) quando difere do id (ex.: fala dividida em duas) */
  source?: string;
  /** início do bloco de áudio na timeline (s). Sem isso, a engine emenda depois da fala anterior */
  start?: number;
  /** corte dentro do arquivo (s) */
  trimIn?: number;
  trimOut?: number;
  /** volume (1 = original) */
  volume?: number;
  /** transcrição com tempo por palavra (Whisper), usada pra quebrar a legenda no tempo certo */
  words?: Word[];
}

export interface ActorDef {
  skin: string;
  x: number;
  z: number;
  /** 1 = olhando pra direita (padrão), -1 = esquerda */
  facing?: 1 | -1;
  /** nome mostrado no editor */
  name?: string;
  /** figurante: sem voz (o editor não mostra trilha de voz pra ele) */
  extra?: boolean;
}

/** Clima/hora: tudo de 0 a 1. */
export interface Weather {
  rain: number;
  wind: number;
  fog: number;
  /** frequência de relâmpagos automáticos */
  lightning: number;
  /** 0 = noite, 1 = amanhecer */
  daylight: number;
  /** tamanho das ondas (cenários com água) */
  waves: number;
  /** onda gigante subindo */
  swell: number;
}

export type CameraShot = "close" | "medium" | "wide";

interface Base {
  at: TimeRef;
  /** gerado por um botão automático (ex.: "follow" = câmera segue quem fala); o botão substitui só esses */
  auto?: string;
}
interface Span extends Base { until?: TimeRef }

export type Cue =
  /** andar até x (e z). `hop` = altura do pulo em px (descer/subir no barco) */
  | (Base & { type: "walk"; actor: string; x: number; z?: number; speed?: number; hop?: number })
  | (Base & { type: "face"; actor: string; dir: 1 | -1 })
  /**
   * Câmera: ou valores fixos (x, y, zoom), ou um enquadramento de personagem (actor + shot).
   * dur = 0 → corte seco; dur > 0 → transição suave.
   */
  | (Base & { type: "camera"; x?: number; y?: number; zoom?: number; actor?: string; shot?: CameraShot; dur?: number })
  | (Base & { type: "shake"; amp?: number; dur?: number })
  | (Span & { type: "hook"; text: string; color?: string })
  | (Span & { type: "bubble" | "thought"; actor: string; text: string })
  | (Span & { type: "counter"; label: string; value: number; total?: number; color?: string })
  /** afundar até `depth` px (0 = volta pra superfície) em `dur` segundos */
  | (Base & { type: "sink"; actor: string; depth: number; dur?: number })
  /** gesto da skin (ex.: "reach") até `until` */
  | (Span & { type: "gesture"; actor: string; variant: string })
  /** estender a mão (atalho pra gesture "reach") */
  | (Span & { type: "reach"; actor: string })
  /** `actor` segura `target`: os dois esticam o braço, brilho quente nas mãos e o target sobe pra superfície */
  | (Span & { type: "hold"; actor: string; target: string; glow?: number })
  /** cartão de tela cheia (texto final, CTA) */
  | (Span & { type: "card"; text: string; color?: string })
  /** clima muda pra esses valores em `dur` segundos (keyframe) */
  | (Base & { type: "weather"; dur?: number } & Partial<Weather>)
  /** relâmpago marcado */
  | (Base & { type: "lightning"; strength?: number })
  /** pular no lugar (ex.: tentando ver por cima da multidão) */
  | (Base & { type: "jump"; actor: string; height?: number; times?: number; dur?: number })
  /** subir/descer (árvore, muro): fica a `height` px do chão. `fall` = cai de mau jeito (gravidade + quique) */
  | (Base & { type: "climb"; actor: string; height: number; x?: number; dur?: number; fall?: boolean })
  /** coloca o personagem num lugar na hora (troca de cena) e/ou esconde/mostra */
  | (Base & { type: "place"; actor: string; x?: number; z?: number; facing?: 1 | -1; hidden?: boolean })
  /** figurantes cochichando (bocas mexendo à toa) */
  | (Span & { type: "murmur" })
  /** troca de cenário (ex.: rua de dia → casa à noite), com fade pro preto de `fade` s */
  | (Base & { type: "set"; set: SetDef; fade?: number });

export type CueType = Cue["type"];

export interface SetDef {
  kind: string; // nome do cenário em src/sets (ex.: "campfire")
  [param: string]: unknown;
}

export interface Scene {
  id: string;
  /** nome bonito (editor) */
  name?: string;
  /** pasta dos áudios, relativa à raiz do projeto (ex.: "audio/ep01") */
  audio: string;
  set: SetDef;
  actors: Record<string, ActorDef>;
  lines: LineDef[];
  cues?: Cue[];
  /** clima no começo da cena (os cues "weather" mudam a partir daqui) */
  weather?: Partial<Weather>;
  /** segundos antes da 1ª fala / depois da última */
  intro?: number;
  outro?: number;
  /** pausa padrão entre falas */
  gap?: number;
  camera?: { x: number; y: number; zoom: number };
  look?: { levels?: number; dither?: boolean; bloom?: number; exposure?: number; captionY?: number };
}

/** Análise de um arquivo de áudio (feita uma vez e cacheada). */
export interface Analysis {
  /** duração do arquivo (s) */
  dur: number;
  /** onde a voz começa/termina dentro do arquivo (s) */
  onset: number;
  offset: number;
  /** abertura da boca por frame do arquivo (0 fechada, 1 meia, 2 aberta) */
  mouth: number[];
}

/** Linha do tempo resolvida (gerada por layout() a partir da cena + análises). */
export interface BuildLine {
  id: string;
  speaker: string;
  source: string;
  /** início do bloco na linha do tempo */
  clipStart: number;
  clipDur: number;
  trimIn: number;
  volume: number;
  /** onde a voz começa/termina (absoluto), detectado pelo volume */
  voiceStart: number;
  voiceEnd: number;
  /** abertura da boca por frame, a partir de clipStart */
  mouth: number[];
}

export interface Build {
  scene: string;
  fps: number;
  duration: number;
  audio: string;
  lines: BuildLine[];
}
