from PIL import Image

palette = {
    'H': (107, 68, 35),
    'S': (242, 201, 160),
    'E': (40, 24, 14),
    'M': (34, 10, 14),
    'W': (250, 248, 240),
    'R': (215, 38, 61),
    'L': (90, 58, 30),
    'T': (122, 78, 42),
    'D': (74, 46, 23),
    'P': (128, 120, 110)
}

def render_grid(grid, filename):
    h = len(grid)
    w = max(len(r) for r in grid)
    for i, r in enumerate(grid):
        assert len(r) == w, f"Row {i} has length {len(r)}, expected {w}"
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in palette:
                img.putpixel((x, y), palette[c] + (255,))
            elif c != '.':
                raise ValueError(f"Unknown char {c} at {x},{y}")
    img.resize((w * 16, h * 16), Image.NEAREST).save(filename)
    print(f"Rendered {filename}: {w}x{h}")

# Let's design 20 columns:
# Notice how the rock should hug and support the body, without gaps!
# And the rock has a realistic stone shape (rounded top, textured, solid base).
v4 = [
    "......HHHHHH........", # 0
    ".....HHHHHHHH.......", # 1
    "....HHHSSSSSHH......", # 2
    "....HHSSSSSSSH......", # 3
    "....HSSESSSESH......", # 4
    "....HSSSSSSSSHH.....", # 5
    "....HHHHSSHHHHH.....", # 6
    "....HHHHHHHHHHH.....", # 7
    "......HHHHHHH.......", # 8
    ".......WSSWW........", # 9
    ".....WWRRWWWWWW.....", # 10
    "....WWWRRRWWWWWW....", # 11
    "....WWWWRRRWWWWW....", # 12
    "....WW.LLLLLL.WW....", # 13  belt (LLLLLL) with arms on sides (WW)
    "...PPWW.SSSS.RRW.PP.", # 14  hands (SSSS) in lap, sleeves meeting, rock top behind (PP)
    "..PPPWWWWWWWWWRRPPP.", # 15  thighs resting on stone surface
    ".PPPPWWWWWWWWWRRPPPP", # 16  knees and draped tunic over stone
    "PPPPPWWWWWWWWWRRPPPP", # 17  robe folds over seated thighs
    "PPPPP.WWWWWWWRR.PPPP", # 18  lower legs dropping down, rock behind
    "PPPPP.WWWWWWWRR.PPPP", # 19  hem of tunic, rock behind
    ".PPPP..SS....SS.PPP.", # 20  ankles/skin
    ".PPPP.DDD...DDD.PPP.", # 21  sandals resting on ground
    "..PP.DDDD...DDDD.PP.", # 22  soles of sandals
]

render_grid(v4, "v4_preview.png")

