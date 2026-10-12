// Ruído determinístico: mesmo tempo → mesmo frame. Essencial pro export bater com o preview.

export function hash(...n: number[]): number {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.floor(v) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}

/** Ruído 1D suave (value noise), saída em 0..1. */
export function noise1(t: number, seed = 0): number {
  const i = Math.floor(t), f = t - i;
  const s = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - s) + hash(i + 1, seed) * s;
}

/** Soma de oitavas, bom pra tremulação de fogo. */
export function fbm1(t: number, seed = 0, oct = 3): number {
  let v = 0, a = 0.5, tot = 0;
  for (let o = 0; o < oct; o++) {
    v += noise1(t * (1 << o), seed + o * 17) * a;
    tot += a;
    a *= 0.5;
  }
  return v / tot;
}

/** Ruído 2D suave (value noise), saída em 0..1. */
export function noise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

export function fbm2(x: number, y: number, seed = 0, oct = 4): number {
  let v = 0, a = 0.5, tot = 0, f = 1;
  for (let o = 0; o < oct; o++) {
    v += noise2(x * f, y * f, seed + o * 31) * a;
    tot += a; a *= 0.5; f *= 2;
  }
  return v / tot;
}
