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
    assert all(len(r) == w for r in grid), f"Inconsistent row lengths: {[len(r) for r in grid]}"
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in palette:
                img.putpixel((x, y), palette[c] + (255,))
            elif c != '.':
                raise ValueError(f"Unknown char {c} at {x},{y}")
    img.resize((w * 16, h * 16), Image.NEAREST).save(filename)
    print(f"Rendered {filename}: {w}x{h}")

# Let's test a refined 20x24 version:
# Hands in lap:
# Belt is at row 14.
# Hands are resting on the lap below the belt (row 15).
# Robe folds across the lap and legs (rows 16-20).
# Feet emerge at rows 21-22.
# The stone supports Jesus under his seat and extends to the ground on the sides and behind.
v1 = [
    "......HHHHHH........", # 0
    ".....HHHHHHHH.......", # 1
    "....HHHSSSSSHH......", # 2
    "....HHSSSSSSSH......", # 3
    "....HSSESSSESH......", # 4
    "....HSSSSSSSSHH.....", # 5
    "....HHHHSSHHHHH.....", # 6
    "....HHHHHHHHHHH.....", # 7
    "......HHHHHHH.......", # 8
    ".......WSSWW........", # 9  neck
    ".....WWRRWWWWWW.....", # 10 shoulders
    "....WWWRRRWWWWWW....", # 11 chest
    "....WWWWRRRWWWWW....", # 12 arms
    "....WWWWRRRWWWWW....", # 13 forearms inward
    ".....WLLLLLLLLLW....", # 14 belt
    "..PP.WWWSSSSWWWP....", # 15 hands folded in lap (SSSS), stone behind
    ".PPP.WWWWWRRWW.PPP..", # 16 lap / thighs spread
    ".PPPWWWWWWWRRW.PPP..", # 17 knees / draped robe
    "PPPPWWWWWWWRRRPPPP..", # 18 robe drape
    "PPPP.WWWWWWRR.PPPPP.", # 19 legs / robe folds
    "PPPPP.WWWWWWR.PPPPP.", # 20 hem of robe
    "PPPPP..SS..SS.PPPPP.", # 21 ankles / skin
    ".PPP..DDD..DDD..PPP.", # 22 sandals
    "....................", # 23
]

render_grid(v1, "v1_preview.png")

