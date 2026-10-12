from PIL import Image
import sys

# Jesus em camadas: corpo, cajado (com a mão) e pés ficam separados.
# Animar = mexer as camadas por código, sem desenhar cada frame na mão.
BODY = [
    "......HHHHHH........",
    ".....HHHHHHHH.......",
    "....HHHSSSSSHH......",
    "....HHSSSSSSSH......",
    "....HSSESSSESH......",
    "....HSSSSSSSSHH.....",
    "....HHHHSSHHHHH.....",
    "....HHHHHHHHHHH.....",
    "......HHHHHHH.......",
    ".......WSSWW........",
    ".....WWRRWWWWWW.....",
    "....WWWRRRWWWWWW....",
    "....WWWWRRRWWWWW....",
    "....WWWWWRRRWWWWS...",
    ".....WLLLLLLLLLW....",
    ".....WWWWWWRRRWW....",
    ".....WWWWWWWRRRW....",
    ".....WWWWWWWRRRR....",
    ".....WWWWWWWWRRR....",
    ".....WWWWWWWWRRR....",
    ".....WWWWWWWWWRR....",
]
HEAD_ROWS = 9  # linhas 0-8 = cabeça (balança sozinha na respiração)

STAFF = [(1, 6), (2, 6), (0, 7), (3, 7), (0, 8), (3, 8)] + [(3, y) for y in range(9, 23)]
HAND = (3, 12)

FEET = {
    "stand": ["......SS....SS......", ".....DDD...DDD......"],
    "step":  [".....SS......SS.....", "....DDD......DDD...."],
    "pass":  [".......SSSS.........", "......DDDDDD........"],
}

PAL = {
    "H": (107, 68, 35), "S": (242, 201, 160), "E": (40, 24, 14), "M": (80, 20, 25),
    "W": (250, 248, 240), "R": (215, 38, 61), "L": (90, 58, 30),
    "T": (122, 78, 42), "D": (74, 46, 23),
}

W, H, SCALE = 48, 36, 12


def scene(scroll=0):
    img = Image.new("RGB", (W, H))
    px = img.load()
    sky = [(255, 183, 107), (255, 155, 113), (232, 118, 120)]
    for y in range(H):
        for x in range(W):
            px[x, y] = sky[min(y * 3 // int(H * 0.6), 2)]
    cx, cy, r = int(W * 0.75), int(H * 0.30), 5
    for y in range(H):
        for x in range(W):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                px[x, y] = (255, 236, 150)
    for x in range(W):
        sx = x + scroll // 2  # colinas andam mais devagar (parallax)
        hill = int(H * 0.58 + 3 * ((sx // 6) % 3))
        for y in range(hill, H):
            px[x, y] = (196, 140, 86) if y < int(H * 0.72) else (222, 178, 112)
        if (x + scroll) % 11 == 0:  # pedrinhas no chão andam rápido
            px[x, H - 3] = (176, 130, 80)
    return img


def frame(breathe=0, blink=False, mouth=0, feet="stand", bob=0, staff_dx=0, scroll=0):
    img = scene(scroll)
    px = img.load()
    ox, oy = 14, H - 25

    def put(x, y, c):
        if c != "." and 0 <= ox + x < W and 0 <= oy + y < H:
            px[ox + x, oy + y] = PAL[c]

    for (x, y) in STAFF:
        put(x + staff_dx, y - bob, "T")
    for y in range(HEAD_ROWS, len(BODY)):
        for x, c in enumerate(BODY[y]):
            put(x, y - bob, c)
    for y in range(HEAD_ROWS):
        for x, c in enumerate(BODY[y]):
            if blink and c == "E":
                c = "S"
            put(x, y + breathe - bob, c)
    if mouth >= 1:  # boca abrindo no meio da barba
        put(8, 6 + breathe - bob, "M"); put(9, 6 + breathe - bob, "M")
    if mouth >= 2:
        put(8, 7 + breathe - bob, "M"); put(9, 7 + breathe - bob, "M")
    put(HAND[0] + staff_dx, HAND[1] - bob, "S")
    for i, row in enumerate(FEET[feet]):
        for x, c in enumerate(row):
            put(x, len(BODY) + i, c)
    return img.resize((W * SCALE, H * SCALE), Image.NEAREST)


def idle():
    seq = []
    for i in range(8):
        seq.append((frame(breathe=i % 2, blink=(i == 5)), 350 if i != 5 else 140))
    return seq


def talk():
    pattern = [0, 1, 2, 1, 0, 2, 1, 0, 1, 2, 0, 0]
    return [(frame(mouth=m), 110) for m in pattern]


def walk():
    cycle = [("step", 0, 1), ("pass", 1, 0), ("step", 0, -1), ("pass", 1, 0)]
    seq = []
    for i in range(16):
        feet, bob, sdx = cycle[i % 4]
        seq.append((frame(feet=feet, bob=bob, staff_dx=sdx, scroll=i * 2), 140))
    return seq


def save(name, seq):
    imgs = [f for f, _ in seq]
    imgs[0].save(name, save_all=True, append_images=imgs[1:],
                 duration=[d for _, d in seq], loop=0)


out = sys.argv[1] if len(sys.argv) > 1 else "."
save(f"{out}/idle.gif", idle())
save(f"{out}/talk.gif", talk())
save(f"{out}/walk.gif", walk())
save(f"{out}/demo.gif", idle() + talk() * 2 + walk())
