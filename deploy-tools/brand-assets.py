"""Generate Huaishuli favicons from the site avatar illustration.

Source image: src/assets/images/avatar.avif (1024x1024, character portrait).
A square head-and-shoulders crop is rendered into every favicon size; the
light/dark variants share the same artwork, so a single illustration serves
both colour schemes.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "assets" / "images" / "avatar.avif"
OUT = ROOT / "public" / "favicon"
SIZES = [32, 128, 180, 192, 512]

# Square crop (left, top, size) on the 1024x1024 avatar: full horns, face centred.
CROP = (350, 100, 400)
CORNER_RADIUS_RATIO = 0.22


def master_image() -> Image.Image:
    img = Image.open(SRC).convert("RGBA")
    if img.width != 1024 or img.height != 1024:
        img = img.resize((1024, 1024), Image.LANCZOS)
    left, top, size = CROP
    img = img.crop((left, top, left + size, top + size)).resize((1024, 1024), Image.LANCZOS)
    img = ImageEnhance.Color(img).enhance(1.08)
    return img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=55, threshold=2))


def rounded(img: Image.Image, size: int) -> Image.Image:
    # Supersampled mask for smooth corners at small sizes.
    mask = Image.new("L", (size * 4, size * 4), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle(
        [0, 0, size * 4 - 1, size * 4 - 1],
        radius=round(size * 4 * CORNER_RADIUS_RATIO),
        fill=255,
    )
    mask = mask.resize((size, size), Image.LANCZOS)
    out = img.resize((size, size), Image.LANCZOS).convert("RGBA")
    out.putalpha(mask)
    return out


master = master_image()

for size in SIZES:
    icon = rounded(master, size)
    icon.save(OUT / f"huaishuli-light-{size}.png", optimize=True)
    icon.save(OUT / f"huaishuli-dark-{size}.png", optimize=True)

rounded(master, 32).save(OUT / "huaishuli-32.png", optimize=True)
rounded(master, 192).save(OUT / "huaishuli-192.png", optimize=True)

print("generated:", sorted(p.name for p in OUT.glob("huaishuli*")))
