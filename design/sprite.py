from PIL import Image
import sys

# Jesus 8-bit: cada letra = 1 pixel. Mesmo formato vira [String] no SwiftUI depois.
JESUS = [
    "......HHHHHH........",
    ".....HHHHHHHH.......",
    "....HHHSSSSSHH......",
    "....HHSSSSSSSH......",
    "....HSSESSSESH......",
    "....HSSSSSSSSHH.....",
    ".TT.HHHHSSHHHHH.....",
    "T..THHHHHHHHHHH.....",
    "T..T..HHHHHHH.......",
    "...T...WSSWW........",
    "...T.WWRRWWWWWW.....",
    "...TWWWRRRWWWWWW....",
    "...SWWWWRRRWWWWW....",
    "...TWWWWWRRRWWWWS...",
    "...T.WLLLLLLLLLW....",
    "...T.WWWWWWRRRWW....",
    "...T.WWWWWWWRRRW....",
    "...T.WWWWWWWRRRR....",
    "...T.WWWWWWWWRRR....",
    "...T.WWWWWWWWRRR....",
    "...T.WWWWWWWWWRR....",
    "...T..SS....SS......",
    "...T.DDD...DDD......",
]

PAL = {
    "H": (107, 68, 35), "S": (242, 201, 160), "E": (40, 24, 14),
    "W": (250, 248, 240), "R": (215, 38, 61), "L": (90, 58, 30),
    "T": (122, 78, 42), "D": (74, 46, 23),
}

def scene(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    sky = [(255, 183, 107), (255, 155, 113), (232, 118, 120)]  # pôr do sol em faixas (dithering 8-bit)
    for y in range(h):
        for x in range(w):
            band = min(y * len(sky) // int(h * 0.6), len(sky) - 1)
            px[x, y] = sky[band]
    # sol
    cx, cy, r = int(w * 0.75), int(h * 0.30), 5
    for y in range(h):
        for x in range(w):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                px[x, y] = (255, 236, 150)
    # colinas + chão
    for x in range(w):
        hill = int(h * 0.58 + 3 * ((x // 6) % 3))
        for y in range(hill, h):
            px[x, y] = (196, 140, 86) if y < int(h * 0.72) else (222, 178, 112)
    return img

def frame(blink=False):
    W, H = 48, 36
    img = scene(W, H)
    px = img.load()
    ox, oy = 14, H - len(JESUS) - 2
    for y, row in enumerate(JESUS):
        for x, c in enumerate(row):
            if c == ".":
                continue
            if blink and c == "E":
                c = "S"
            px[ox + x, oy + y] = PAL[c]
    return img.resize((W * 12, H * 12), Image.NEAREST)

out = sys.argv[1]
frames = [frame()] * 1 + [frame(blink=True)]
frame().save(out + ".png")
frames[0].save(out + ".gif", save_all=True, append_images=[frames[1]],
               duration=[2200, 150], loop=0)
