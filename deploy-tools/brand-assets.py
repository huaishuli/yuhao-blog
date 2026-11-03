"""Generate Huaishuli brand favicons (light + dark variants) from the letter H."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"D:\My_task_dsh\My-web_1\public\favicon")
FONT = r"C:\Windows\Fonts\segoeuib.ttf"
SIZES = [32, 128, 180, 192, 512]

LIGHT_TOP, LIGHT_BOTTOM = (111, 232, 205), (23, 158, 130)
DARK_TOP, DARK_BOTTOM = (30, 60, 55), (12, 28, 26)
LIGHT_LETTER = (255, 255, 255)
DARK_LETTER = (125, 240, 214)


def gradient(size, top, bottom):
    img = Image.new("RGB", (size, size), top)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(size - 1, 1)
        c = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (size, y)], fill=c)
    return img


def rounded_mask(size):
    mask = Image.new("L", (size * 4, size * 4), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=round(size * 4 * 0.24), fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def letter_layer(size, color):
    layer = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    d = ImageDraw.Draw(layer)
    font = ImageFont.truetype(FONT, round(size * 0.62))
    bbox = d.textbbox((0, 0), "H", font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), "H", font=font, fill=color)
    return layer


def build(size, top, bottom, letter):
    base = gradient(size, top, bottom).convert("RGBA")
    base.putalpha(rounded_mask(size))
    base.alpha_composite(letter_layer(size, letter))
    return base


for size in SIZES:
    build(size, LIGHT_TOP, LIGHT_BOTTOM, LIGHT_LETTER).save(OUT / f"huaishuli-light-{size}.png")
    build(size, DARK_TOP, DARK_BOTTOM, DARK_LETTER).save(OUT / f"huaishuli-dark-{size}.png")

build(32, LIGHT_TOP, LIGHT_BOTTOM, LIGHT_LETTER).save(OUT / "huaishuli-32.png")
build(192, LIGHT_TOP, LIGHT_BOTTOM, LIGHT_LETTER).save(OUT / "huaishuli-192.png")
print("generated:", sorted(p.name for p in OUT.glob("huaishuli*")))
