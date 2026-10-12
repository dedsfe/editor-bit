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

# Let's explore:
# Jesus seated on rock.
# Notice: "mãos no colo" (hands in lap).
# When sitting, arms come down from shoulders (y=10..12) and forearms rest inward onto lap (y=13..15).
# Hands in lap:
# Belt at y=13. Hands resting just below belt at y=14 or 15.
# Or hands resting on knees/lap: e.g. hands folded together:
# "....WWWWSSSSWWWW...." or ".....WWSSSSWW......"
# Red sash:
# In jesus-parado, the red sash goes from Jesus's left shoulder (right side of viewer? No, viewer's left is Jesus's right).
# In jesus-parado:
# Row 10: x=7,8 is RR.
# Row 11: x=7,8,9 is RRR.
# Row 12: x=8,9,10 is RRR.
# Row 13: x=9,10,11 is RRR.
# Row 14: belt is LLLLLLLLL.
# Row 15: sash at x=12,13,14 is RRR.
# Row 16: sash at x=13,14,15 is RRR.
# Row 17: sash at x=13,14,15,16 is RRRR.
# Row 18: sash at x=14,15,16 is RRR.
# Row 19: sash at x=14,15,16 is RRR.
# Row 20: sash at x=15,16 is RR.
# It flows diagonally from upper-center to lower-right!

# Let's try v2 where the rock is solid and connected behind/under Jesus:
v2 = [
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
    "...PWWWWSSSSRRWWP...", # 15 hands (SSSS) in lap, sash (RR) continuing, stone peeking behind
    "..PPWWWWWWWWWRRWPP..", # 16 lap/thighs over stone
    ".PPPWWWWWWWWWRRWPPP.", # 17 thighs / knees
    "PPPPWWWWWWWWWRRRPPPP", # 18 tunic draped over knees, stone on sides
    "PPPP.WWWWWWWRRR.PPPP", # 19 tunic falling between legs, stone visible
    "PPPPPWWWWWWWWWWPPPPP", # 20 hem of tunic
    "PPPPP..SS....SSPPPPP", # 21 feet
    ".PPPP.DDD....DDPPPP.", # 22 sandals on ground
]

render_grid(v2, "v2_preview.png")

