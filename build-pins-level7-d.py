#!/usr/bin/env python3
"""Build Level 7 Phase 1 section D — 10 inspirational Pinterest Pins.

New original illustrations + the approved section-D copy (titles and
descriptions from JoJos_Blocks_Level_7_Phase_1_Content_and_Organic_
Growth_Plan.md). Same 1000x1500 layout and palette as Phase 3
Batches 1-2 and the section-C pack. Run: python3 build-pins-level7-d.py
Output: pinterest-phase3/images/pin-d01-*.jpg ... pin-d10-*.jpg

Destinations: D1 and D4 in the plan link to "Blog article #12", which does
not exist yet — they are re-pointed to live pages instead (D1 to the
Benefits of Coloring article, D4 to My First ABC Book) and the change is
recorded in copy/pin-copy-level7-d.md. D9 links to the Homeschool Routine
article, which is on restructure/dev and goes live with the 7-article
batch deploy — publish D9 only after that article is confirmed live.
Pins D3, D5 and D10 are FREE pins: no price, no book cover in the bottom
band — a FREE badge instead. Nothing is published by this script; the
copy doc + schedule live in copy/pin-copy-level7-d.md.

Prices are the live sale prices (ABC $3.59/$3.99, Animal $4.49/$4.99,
bundle $11.69/$12.99, bundle saving $5.97 — NOT $6.97).
"""
import glob
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent
IMG = BASE / "images"
COVERS = BASE.parent / "dev-repo" / "assets" / "covers"
BLOG_COVERS = BASE.parent / "dev-repo" / "assets" / "blog"

CREAM = (255, 249, 240)
WHITE = (255, 255, 255)
DARK = (43, 38, 32)
CORAL = (228, 87, 46)
TEAL = (31, 138, 122)
GREY = (107, 101, 96)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

W, H = 1000, 1500
ILL_TOP, ILL_BOT = 300, 1060
BAND_TOP = 1060


def find_ill(prefix):
    """Find the generated illustration for a pin (filenames are truncated
    mid-stem by the media pipeline, so match by glob, not exact name)."""
    hits = sorted(glob.glob(str(IMG / f"media-generation-{prefix}-*-0-*.webp")))
    if not hits:
        raise FileNotFoundError(f"no illustration for {prefix}")
    return hits[0]


def text_w(draw, s, f):
    return draw.textbbox((0, 0), s, font=f)[2]


def centered(draw, cx, y, s, f, fill):
    w = text_w(draw, s, f)
    draw.text((cx - w / 2, y), s, font=f, fill=fill)
    return y + (draw.textbbox((0, 0), s, font=f)[3] - draw.textbbox((0, 0), s, font=f)[1])


def fit_font(draw, s, max_w, start, path=FB, min_size=30):
    size = start
    while size > min_size:
        f = ImageFont.truetype(path, size)
        if text_w(draw, s, f) <= max_w:
            return f
        size -= 2
    return ImageFont.truetype(path, min_size)


def cover_crop(img, target_w, target_h, y0=0):
    """Crop (no distortion) to target aspect, starting at y0 in the source."""
    iw, ih = img.size
    target_ratio = target_w / target_h
    src_ratio = iw / ih
    if src_ratio > target_ratio:
        new_w = int(ih * target_ratio)
        x0 = (iw - new_w) // 2
        box = (x0, 0, x0 + new_w, ih)
    else:
        new_h = int(iw / target_ratio)
        y0 = min(max(0, y0), ih - new_h)
        box = (0, y0, iw, y0 + new_h)
    return img.crop(box).resize((target_w, target_h), Image.LANCZOS)


def brand_head(pin, headline, subline):
    d = ImageDraw.Draw(pin)
    bf = ImageFont.truetype(FB, 34)
    brand = "JoJo's Blocks"
    bw = text_w(d, brand, bf)
    bx = (W - bw - 26) // 2
    d.text((bx, 42), brand, font=bf, fill=DARK)
    d.ellipse([bx + bw + 6, 52, bx + bw + 26, 72], fill=CORAL)
    y = 118
    for line in headline:
        hf = fit_font(d, line, W - 80, 68)
        y = centered(d, W / 2, y, line, hf, DARK) + 8
    if subline:
        sf = fit_font(d, subline, W - 100, 34, path=FR)
        centered(d, W / 2, y + 6, subline, sf, TEAL)
    return d


def cta_button(d, tx, y, cta):
    cf = ImageFont.truetype(FB, 34)
    ctw = text_w(d, cta, cf)
    cx0, cy0 = tx, y
    cx1, cy1 = tx + ctw + 52, y + 62
    d.rounded_rectangle([cx0, cy0, cx1, cy1], radius=31, fill=CORAL)
    d.text((cx0 + 26, cy0 + 12), cta, font=cf, fill=WHITE)


def bottom_band(pin, cover_path, name, facts, price, was, cta, cover_x=70):
    d = ImageDraw.Draw(pin)
    d.rectangle([0, BAND_TOP, W, H], fill=WHITE)
    cover = Image.open(cover_path).convert("RGB")
    cw, ch = 170, 240
    cover = cover.resize((cw, ch), Image.LANCZOS)
    pin.paste(cover, (cover_x, BAND_TOP + 60))
    tx = cover_x + cw + 36
    y = BAND_TOP + 64
    nf = fit_font(d, name, W - tx - 60, 44)
    d.text((tx, y), name, font=nf, fill=DARK)
    _nb = d.textbbox((0, 0), name, font=nf)
    y += (_nb[3] - _nb[1]) + 10
    ff = ImageFont.truetype(FR, 30)
    d.text((tx, y), facts, font=ff, fill=GREY)
    y += 48
    pf = ImageFont.truetype(FB, 58)
    d.text((tx, y), price, font=pf, fill=CORAL)
    pw = text_w(d, price, pf)
    wf = ImageFont.truetype(FR, 30)
    d.text((tx + pw + 16, y + 20), "was " + was, font=wf, fill=GREY)
    d.line([tx + pw + 16, y + 34, tx + pw + 16 + text_w(d, "was " + was, wf), y + 34],
           fill=GREY, width=2)
    y += 96
    cta_button(d, tx, y, cta)
    df = ImageFont.truetype(FR, 24)
    d.text((70, H - 44), "Instant PDF download · jojosblocks.online", font=df, fill=GREY)


def bottom_band_free(pin, facts, cta):
    """Bottom band for the FREE pins: coral FREE badge, no price, no cover."""
    d = ImageDraw.Draw(pin)
    d.rectangle([0, BAND_TOP, W, H], fill=WHITE)
    bx0, by0, r = 155, BAND_TOP + 180, 78
    d.ellipse([bx0 - r, by0 - r, bx0 + r, by0 + r], fill=CORAL)
    d.ellipse([bx0 - r, by0 - r, bx0 + r, by0 + r], outline=WHITE, width=4)
    bf = ImageFont.truetype(FB, 44)
    centered(d, bx0, by0 - 32, "FREE", bf, WHITE)
    tx = 270
    y = BAND_TOP + 64
    nf = fit_font(d, "Free Printable Coloring Pages", W - tx - 60, 44)
    d.text((tx, y), "Free Printable Coloring Pages", font=nf, fill=DARK)
    _nb = d.textbbox((0, 0), "Free Printable Coloring Pages", font=nf)
    y += (_nb[3] - _nb[1]) + 10
    ff = ImageFont.truetype(FR, 30)
    d.text((tx, y), facts, font=ff, fill=GREY)
    y += 96
    cta_button(d, tx, y, cta)
    df = ImageFont.truetype(FR, 24)
    d.text((70, H - 44), "Print at home · No sign-up needed · jojosblocks.online",
           font=df, fill=GREY)


def bottom_band_article(pin, cover_path, title_lines, facts, cta):
    """Bottom band for article pins: landscape blog-cover thumbnail at the
    left, article title (up to 2 lines), facts, CTA. No price."""
    d = ImageDraw.Draw(pin)
    d.rectangle([0, BAND_TOP, W, H], fill=WHITE)
    cover = Image.open(cover_path).convert("RGB")
    thumb = cover_crop(cover, 300, 158)
    pin.paste(thumb, (70, BAND_TOP + 150))
    tx = 406
    y = BAND_TOP + 64
    for line in title_lines:
        nf = fit_font(d, line, W - tx - 60, 40)
        d.text((tx, y), line, font=nf, fill=DARK)
        _nb = d.textbbox((0, 0), line, font=nf)
        y += (_nb[3] - _nb[1]) + 8
    y += 6
    ff = ImageFont.truetype(FR, 30)
    # Facts wrap to at most 2 lines (a single 30px line is 534px wide here;
    # the full facts strings are 646-698px, so they would clip otherwise).
    max_w = W - tx - 60
    words, lines, cur = facts.split(), [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if text_w(d, trial, ff) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    for line in lines[:2]:
        d.text((tx, y), line, font=ff, fill=GREY)
        y += 40
    y += 8
    cta_button(d, tx, y, cta)
    df = ImageFont.truetype(FR, 24)
    d.text((70, H - 44), "Free to read · jojosblocks.online", font=df, fill=GREY)


def make_pin(ill_path, headline, subline, cover_path, name, facts, price, was, cta, out, y0=400):
    ill = Image.open(ill_path).convert("RGB")
    pin = Image.new("RGB", (W, H), CREAM)
    pin.paste(cover_crop(ill, W, ILL_BOT - ILL_TOP, y0=y0), (0, ILL_TOP))
    brand_head(pin, headline, subline)
    bottom_band(pin, cover_path, name, facts, price, was, cta)
    pin.save(IMG / out, quality=92)
    print("saved", out)


def make_free_pin(ill_path, headline, subline, facts, out, y0=400):
    ill = Image.open(ill_path).convert("RGB")
    pin = Image.new("RGB", (W, H), CREAM)
    pin.paste(cover_crop(ill, W, ILL_BOT - ILL_TOP, y0=y0), (0, ILL_TOP))
    brand_head(pin, headline, subline)
    bottom_band_free(pin, facts, "Download Free")
    pin.save(IMG / out, quality=92)
    print("saved", out)


def make_article_pin(ill_path, headline, subline, cover_path, title_lines, facts, out, y0=400):
    ill = Image.open(ill_path).convert("RGB")
    pin = Image.new("RGB", (W, H), CREAM)
    pin.paste(cover_crop(ill, W, ILL_BOT - ILL_TOP, y0=y0), (0, ILL_TOP))
    brand_head(pin, headline, subline)
    bottom_band_article(pin, cover_path, title_lines, facts, "Read the Article")
    pin.save(IMG / out, quality=92)
    print("saved", out)


PHRASES = [
    "Tell me about your picture!",
    "I love the colors you chose.",
    "You worked so hard on this.",
    "What was your favorite part?",
    "Let's put it on the fridge!",
]


def make_phrases_pin(ill_path, headline, subline, cover_path, title_lines, facts, out, y0=200):
    """D01: illustration in the top half of the band, the five phrases as
    small PIL text below it (plan visual direction), article bottom band."""
    ill = Image.open(ill_path).convert("RGB")
    pin = Image.new("RGB", (W, H), CREAM)
    pin.paste(cover_crop(ill, W, 470, y0=y0), (0, ILL_TOP))
    d = ImageDraw.Draw(pin)
    pf = ImageFont.truetype(FR, 32)
    y = 800
    for phrase in PHRASES:
        d.ellipse([92, y + 10, 104, y + 22], fill=CORAL)
        d.text((122, y), phrase, font=pf, fill=DARK)
        y += 52
    brand_head(pin, headline, subline)
    bottom_band_article(pin, cover_path, title_lines, facts, "Read the Article")
    pin.save(IMG / out, quality=92)
    print("saved", out)


def main():
    I = IMG
    BENEFITS = BLOG_COVERS / "benefits-of-coloring-for-preschoolers-cover.jpg"
    HOMESCHOOL = BLOG_COVERS / "homeschool-preschool-daily-routine-with-printables-cover.jpg"

    make_phrases_pin(find_ill("pin-d1-drawing"),
                     ["5 Things to Say When", "Your Child Shows You Art"],
                     "Five simple responses that build confidence",
                     BENEFITS, ["Benefits of Coloring", "for Preschoolers"],
                     "Why coloring counts as learning · Ages 2–7",
                     "pin-d01-drawing.jpg")
    make_article_pin(find_ill("pin-d2-coloring-letter"),
                     ["Learning Through Play:", "Why Coloring Counts"],
                     "What your child is really learning while they color",
                     BENEFITS, ["Benefits of Coloring", "for Preschoolers"],
                     "Fine motor skills, focus & patience · Ages 2–7",
                     "pin-d02-learning.jpg")
    make_free_pin(find_ill("pin-d3-family-coloring"),
                  ["Screen-Free Saturday:", "One Simple Idea"],
                  "Color together for 20 minutes — free pages included",
                  "4 free pages · Ages 2–7 · No sign-up needed",
                  "pin-d03-saturday.jpg")
    make_pin(find_ill("pin-d4-messy-coloring"),
             ["Let Them Color", "Outside the Lines"],
             "Messy coloring builds confidence & imagination",
             COVERS / "book-01.jpg", "My First ABC Book",
             "Ages 2–4 · 28 pages · Printable PDF",
             "$3.59", "$3.99", "Explore the Book", "pin-d04-outside-lines.jpg")
    make_free_pin(find_ill("pin-d5-calm-morning"),
                  ["A Quiet 20 Minutes:", "Calm Mornings"],
                  "Print the night before — start the day with coloring",
                  "4 free pages · Ages 2–7 · No sign-up needed",
                  "pin-d05-calm-morning.jpg")
    make_pin(find_ill("pin-d6-first-crayon"),
             ["Every Artist Starts", "With One Crayon"],
             "Bold & easy pages made for little hands",
             COVERS / "book-01.jpg", "My First ABC Book",
             "Ages 2–4 · 28 pages · Printable PDF",
             "$3.59", "$3.99", "Explore the Book", "pin-d06-first-crayon.jpg")
    make_pin(find_ill("pin-d7-coloring-together"),
             ["Learn Together:", "10 Minutes a Day"],
             "One page, one chat — letters, animals, jobs, planets",
             COVERS / "bundle-cover.jpg", "Complete Coloring Book Bundle",
             "4 books · 154 pages · Ages 2–7 · Save $5.97",
             "$11.69", "$12.99", "Explore the Bundle", "pin-d07-together.jpg")
    make_pin(find_ill("pin-d8-purple-lion"),
             ["Imagination Grows", "When Children Draw"],
             "Let them decide what color a lion should be",
             COVERS / "book-02.jpg", "My First Animal Explorer",
             "Ages 3–6 · 30 pages · Printable PDF",
             "$4.49", "$4.99", "Explore the Book", "pin-d08-imagination.jpg")
    make_article_pin(find_ill("pin-d9-kitchen-table"),
                     ["The Best Learning Happens", "at the Kitchen Table"],
                     "No classroom needed — crayons & four pages",
                     HOMESCHOOL, ["Homeschool Preschool", "Daily Routine"],
                     "A calm daily routine with printables · Ages 2–7",
                     "pin-d09-kitchen-table.jpg")
    make_free_pin(find_ill("pin-d10-fridge-art"),
                  ["Proud of Every Page:", "Celebrate Their Art"],
                  "Fridge it. Date it. Tell them what you love.",
                  "4 free pages · Ages 2–7 · No sign-up needed",
                  "pin-d10-fridge-art.jpg")


main()
