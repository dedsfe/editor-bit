// Formato de "skin": tudo que define um personagem é DADO. A engine anima qualquer skin do mesmo jeito.
// Um editor visual no futuro só precisa ler/escrever este formato.
import type { Grid, Palette, NormalOpts } from "../core/pixels";

export type Pt = [number, number];

/** Como a camada se mexe nas animações genéricas. */
export type Follow =
  | "head"   // respira (desce 1px) e balança com o passo
  | "body"   // balança com o passo
  | "prop"   // objeto na mão (cajado, rede): balança com o passo e vai pra frente/trás
  | "static"; // não se mexe

export interface Part {
  name: string;
  grid: Grid;       // letras da paleta; '.' = transparente
  at: Pt;           // canto superior esquerdo dentro do quadro da skin
  follows: Follow;
}

export interface Skin {
  id: string;
  name: string;
  /** tamanho do quadro em px do sprite */
  w: number;
  h: number;
  /** quantos px de tela cada px do sprite ocupa */
  scale: number;
  palette: Palette;
  /** camadas na ordem de desenho (primeira fica atrás) */
  parts: Part[];
  /** pés: um grid por pose do ciclo de andar, colados na base do quadro */
  feet: { stand: Grid; step: Grid; pass: Grid };
  /** pixels da boca (coordenadas do quadro, seguem a cabeça) */
  mouth: { half: Pt[]; open: Pt[]; color: string };
  /** pixels dos olhos e a cor que vira quando pisca (pálpebra) */
  eyes: { pixels: Pt[]; lid: string };
  /**
   * Gestos: cada variante troca camadas pelo nome (ou adiciona novas).
   * Ex.: "reach" troca o "corpo" por um corpo com o braço esticado.
   */
  variants?: Record<string, Part[]>;
  /** ajuste do normal map automático */
  normals?: NormalOpts;
  /** cor da legenda/balão desse personagem */
  color?: string;
}
