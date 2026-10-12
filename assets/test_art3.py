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

# Let's test a sitting pose where knees are visibly bent:
# Width: 20 columns
v3 = [
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
    "....WW.LLLLLL.WW....", # 13 belt with arms at sides
    "...PWW.WWSSSS.RRWP..", # 14 forearms bringing hands (SSSS) to center lap
    "..PPWWWWWWWWWWRRWPP.", # 15 lap / thighs spreading out to knees
    ".PPPWWWWWWWWWWRRWPPP", # 16 knees (wide), seated on rock
    ".PP.WWWWWWWWWWRR.PP.", # 17 tunic draping down from knees
    "PPP.WWWWWWWWWWRR.PPP", # 18 lower hem of tunic, rock behind
    "PPPP.WWWWWWWWWW.PPPP", # 19 hem between legs
    "PPPPP..SS....SS.PPPPP", # wait, 21 chars! Let's make sure it's 20
]

# Let's check lengths carefully
