"""Generate Huaishuli favicons from the site avatar illustration.

Source image: src/assets/images/avatar.avif — a 1024x1024 square illustration
that already carries its own rounded corners and transparent edge, so every
favicon is just a LANCZOS downscale of that artwork (no extra mask, no crop).
The light/dark variants share the same artwork, so one illustration serves
both colour schemes.

Usage:
    python deploy-tools/brand-assets.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "assets" / "images" / "avatar.avif"
OUT = ROOT / "public" / "favicon"
SIZES = [32, 128, 180, 192, 512]
SQUARE = 1024


def master_image() -> Image.Image:
    """Open the avatar and normalise it to a 1024px square RGBA canvas."""
    img = Image.open(SRC).convert("RGBA")
    if img.size != (SQUARE, SQUARE):
        # 非正方形时按中心裁成正方形，避免比例被拉伸
        side = min(img.size)
        left = (img.width - side) // 2
        top = (img.height - side) // 2
        img = img.crop((left, top, left + side, top + side))
    return img.resize((SQUARE, SQUARE), Image.LANCZOS)


def icon(img: Image.Image, size: int) -> Image.Image:
    """Downscale to one favicon size and quantise to keep the files small."""
    small = img.resize((size, size), Image.LANCZOS)
    return small.quantize(colors=256, method=Image.Quantize.FASTOCTREE)


master = master_image()

for size in SIZES:
    out = icon(master, size)
    out.save(OUT / f"huaishuli-light-{size}.png", optimize=True)
    out.save(OUT / f"huaishuli-dark-{size}.png", optimize=True)

icon(master, 32).save(OUT / "huaishuli-32.png", optimize=True)
icon(master, 192).save(OUT / "huaishuli-192.png", optimize=True)

print("generated:", sorted(p.name for p in OUT.glob("huaishuli*")))
