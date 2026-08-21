from PIL import Image
from collections import deque
import os

src = r"C:\Users\hush\.cursor\projects\d-code-slrxxy\assets\c__Users_hush_AppData_Roaming_Cursor_User_workspaceStorage_936c1c42dc10e525771a291148b61344_images_IMG_8199_20260821-145444_-fc5dbf34-739e-4a29-945d-b240ccdc8b25.png"
out_dir = r"d:\code\slrxxy\public\media"
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, "agent-chick.png")

im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

samples = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3], px[w // 2, 2], px[2, h // 2]]
br = sum(p[0] for p in samples) / len(samples)
bg = sum(p[1] for p in samples) / len(samples)
bb = sum(p[2] for p in samples) / len(samples)
print("bg", br, bg, bb, "size", w, h)


def dist(p):
    return ((p[0] - br) ** 2 + (p[1] - bg) ** 2 + (p[2] - bb) ** 2) ** 0.5


visited = [[False] * w for _ in range(h)]
q = deque()
thresh = 48


def maybe(x, y):
    if 0 <= x < w and 0 <= y < h and not visited[y][x]:
        p = px[x, y]
        warm = p[0] > 228 and p[1] > 205 and p[2] > 160 and p[1] >= p[2] - 8
        if dist(p) < thresh or warm:
            visited[y][x] = True
            q.append((x, y))


for x in range(w):
    maybe(x, 0)
    maybe(x, h - 1)
for y in range(h):
    maybe(0, y)
    maybe(w - 1, y)

while q:
    x, y = q.popleft()
    p = px[x, y]
    d = dist(p)
    if d < thresh * 0.5:
        px[x, y] = (p[0], p[1], p[2], 0)
    elif d < thresh:
        a = int(255 * (d - thresh * 0.5) / (thresh * 0.5))
        px[x, y] = (p[0], p[1], p[2], max(0, min(255, a)))
    else:
        px[x, y] = (p[0], p[1], p[2], 0)
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        maybe(nx, ny)

bbox = im.getbbox()
if bbox:
    pad = 10
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(w, r + pad)
    b = min(h, b + pad)
    im = im.crop((l, t, r, b))

im.thumbnail((512, 512), Image.Resampling.LANCZOS)
im.save(out, "PNG")
print("saved", out, im.size)
