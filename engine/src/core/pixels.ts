// Sprites como grid de letras + paleta. Daqui sai a cor (albedo) e o normal map.

export type Grid = string[];
export type RGB = [number, number, number];
export type Palette = Record<string, RGB>;

export interface Bitmap {
  w: number;
  h: number;
  data: Uint8Array; // RGBA8
}

export function gridToBitmap(grid: Grid, pal: Palette): Bitmap {
  const h = grid.length, w = grid[0].length;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === "." || !pal[c]) continue;
      const i = (y * w + x) * 4;
      [data[i], data[i + 1], data[i + 2]] = pal[c];
      data[i + 3] = 255;
    }
  return { w, h, data };
}

export interface NormalOpts {
  /** quantos px da borda até o "topo" do volume */
  radius?: number;
  /** quanto o volume inclina a normal (0 = chapado) */
  strength?: number;
  /** 0..1: troca de cor também vira um sulco (cabelo x rosto, faixa da roupa) */
  materialEdges?: number;
  /**
   * Ajuste manual: grid do mesmo tamanho com '<' '>' '^' 'v' (normal pra esquerda,
   * direita, cima, baixo), 'o' (chapado, de frente) ou '.' (automático).
   */
  override?: Grid;
}

const MANUAL: Record<string, [number, number, number]> = {
  "<": [-0.8, 0, 0.6], ">": [0.8, 0, 0.6], "^": [0, -0.8, 0.6], v: [0, 0.8, 0.6], o: [0, 0, 1],
};

/**
 * Normal map automático: altura = distância até a borda transparente (bevel),
 * normal = gradiente da altura. Eixo y aponta pra BAIXO (igual à tela).
 */
export function normalMap(grid: Grid, opts: NormalOpts = {}): Bitmap {
  const { radius = 2, strength = 3, materialEdges = 0.35, override } = opts;
  const h = grid.length, w = grid[0].length;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && grid[y][x] !== ".";

  // distância euclidiana até o pixel vazio mais próximo (sprites são pequenos: força bruta ok)
  const height = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!solid(x, y)) continue;
      let best = radius;
      for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
          if (solid(x + dx, y + dy)) continue;
          best = Math.min(best, Math.hypot(dx, dy));
        }
      let hgt = best / radius;
      if (materialEdges > 0) {
        const c = grid[y][x];
        const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(
          ([dx, dy]) => solid(x + dx, y + dy) && grid[y + dy][x + dx] !== c);
        if (edge) hgt *= 1 - materialEdges;
      }
      height[y * w + x] = Math.sqrt(hgt); // ombro arredondado em vez de rampa reta
    }

  const H = (x: number, y: number) => (solid(x, y) ? height[y * w + x] : 0);
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!solid(x, y)) continue;
      let n: [number, number, number];
      const m = override?.[y]?.[x];
      if (m && MANUAL[m]) n = MANUAL[m];
      else {
        const gx = (H(x + 1, y) - H(x - 1, y)) * 0.5;
        const gy = (H(x, y + 1) - H(x, y - 1)) * 0.5;
        n = [-gx * strength, -gy * strength, 1];
      }
      const len = Math.hypot(...n);
      const i = (y * w + x) * 4;
      data[i] = Math.round((n[0] / len * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((n[1] / len * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((n[2] / len * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  return { w, h, data };
}
