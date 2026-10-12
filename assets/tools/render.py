"""Renderiza sprites em grid de letras (formato da engine) para PNG transparente.
Uso: python3 render.py arquivo.json [mais.json...]  -> gera .png (1x) e _preview.png (16x) ao lado."""
import json, sys
from PIL import Image

for path in sys.argv[1:]:
    d = json.load(open(path))
    pal = {k: tuple(v) for k, v in d["palette"].items()}
    grid = d["grid"]
    w, h = max(len(r) for r in grid), len(grid)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in pal:
                img.putpixel((x, y), pal[c] + (255,))
    base = path[:-5]
    img.save(base + ".png")
    img.resize((w * 16, h * 16), Image.NEAREST).save(base + "_preview.png")
    print(base, f"{w}x{h}")
