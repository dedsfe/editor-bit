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

# Option 22 cols (Jesus centered, 1 extra '.' on left and right):
# In 22 cols:
# Head lines have 1 dot prepended, 1 dot appended:
# Row 0: ".......HHHHHH........."
# Eyes: x = 8, x = 12, y = 4
# Mouth: [9, 6], [10, 6]
# Let's draft a 22-col rock and seated Jesus:
c22 = [
    ".......HHHHHH.........", # 0
    "......HHHHHHHH........", # 1
    ".....HHHSSSSSHH.......", # 2
    ".....HHSSSSSSSH.......", # 3
    ".....HSSESSSESH.......", # 4
    ".....HSSSSSSSSHH......", # 5
    ".....HHHHSSHHHHH......", # 6
    ".....HHHHHHHHHHH......", # 7
    ".......HHHHHHH........", # 8
    "........WSSWW.........", # 9
    "......WWRRWWWWWW......", # 10
    ".....WWWRRRWWWWWW.....", # 11
    ".....WWWWRRRWWWWW.....", # 12
    ".....WW.LLLLLL.WW.....", # 13 belt at waist, arms at sides
    "...P.WWW.SSSS.RRWW.P..", # 14 hands resting in lap (SSSS)
    "..PPPWWWWWWWWWRRW.PPP.", # 15 thighs / lap resting on stone
    ".PPPPWWWWWWWWWRRW.PPPP", # 16 knees bent, robe draped
    ".PPPPWWWWWWWWWRRR.PPPP", # 17 robe folding down over knees
    "PPPPP.WWWWWWWRRR.PPPPP", # 18 lower tunic, rock beneath
    "PPPPP..WWWWWWWW..PPPPP", # 19 hem of tunic
    "PPPPP...SS....SS.PPPPP", # 20 ankles/feet
    ".PPPP..DDD...DDD.PPPP.", # 21 sandals on stone/ground
    "..PPP.DDDD...DDDD.PPP.", # 22 sandals base
    "...PP.............PP..", # 23 stone base
]

render_grid(c22, "c22_preview.png")

# Now let's refine 20-col version:
c20 = [
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
    "....WW.LLLLLL.WW....", # 13 belt, arms at sides
    "..P.WWW.SSSS.RRWW.P.", # 14 hands resting in lap (SSSS)
    ".PPPWWWWWWWWWRRW.PPP", # 15 thighs / lap on stone
    "PPPPWWWWWWWWWRRWPPPP", # 16 knees bent, robe draped
    "PPPPWWWWWWWWWRRRPPPP", # 17 robe folding over knees
    "PPPP.WWWWWWWRRR.PPPP", # 18 lower tunic, rock flanking
    "PPPPP.WWWWWWWW.PPPPP", # 19 hem of tunic
    "PPPPP..SS....SSPPPPP", # 20 ankles/feet
    ".PPP..DDD...DDD.PPP.", # 21 sandals
    "..PP.DDDD...DDDD.PP.", # 22 sandals base
]

render_grid(c20, "c20_preview.png")

