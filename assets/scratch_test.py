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
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in palette:
                img.putpixel((x, y), palette[c] + (255,))
    img.resize((w * 16, h * 16), Image.NEAREST).save(filename)
    print(f'Rendered {filename}: {w}x{h}')

# Candidate 1: 20x24
# Let's design candidate 1
c1 = [
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
    "....WWWWWRRRWWWW....", # 13
    ".....WLLLLLLLLLW....", # 14 belt
    "...P.WWWSSSSWWWP....", # 15 hands in lap, stone peeking
    "..PPP.WWWWWRWW.PPP..", # 16 lap/thighs
    ".PPPP.WWWWWRRW.PPPP.", # 17 knees
    "PPPPP.WWWWWWRR.PPPPP", # 18 tunic drape
    "PPPPPPWWWWWWWWPPPPPP", # 19 robe falling down
    "PPPPPP.WWWWWW.PPPPPP", # 20 hem of robe
    ".PPPPP..SS..SS.PPPPP", # 21 feet
    "..PPP..DDD..DDD.PPP.", # 22 sandals
    "....................", # 23
]
# Wait, 24 rows or 23 rows?
