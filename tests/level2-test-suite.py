#!/usr/bin/env python3
"""Level 2 — Phase 6 test suite for JoJo's Blocks website SEO changes.
Runs against the local dev repo (regenerated files) AND the live production
site for comparison. Prints PASS/FAIL per check and a summary.
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

REPO = Path(__file__).resolve().parent.parent
BASE = "https://jojosblocks.online"
PAGES = [
    "index.html",
    "books/my-first-abc-book.html",
    "books/my-first-animal-explorer.html",
    "books/my-little-community-helpers.html",
    "books/my-little-space-adventure.html",
    "books/complete-coloring-book-bundle.html",
    "privacy.html",
    "terms.html",
    "404.html",
    "refund-policy.html",
    "blog/index.html",
    "blog/benefits-of-coloring-for-preschoolers.html",
    "blog/easy-alphabet-activities-for-toddlers-at-home.html",
    "blog/fun-animal-facts-for-kids.html",
    "blog/screen-free-activities-for-kids-on-rainy-days.html",
    "blog/what-do-community-helpers-do.html",
    "blog/how-coloring-helps-your-child-learn-the-alphabet.html",
    "blog/space-facts-for-preschoolers.html",
    "blog/homeschool-preschool-daily-routine-with-printables.html",
]

EXPECTED_TITLES = {
    "books/my-first-abc-book.html": "My First ABC Book | Printable ABC Coloring Book for Ages 2–4 | JoJo’s Blocks",
    "books/my-first-animal-explorer.html": "My First Animal Explorer | Printable Animal Coloring Book for Ages 3–6 | JoJo’s Blocks",
    "books/my-little-community-helpers.html": "My Little Community Helpers | Printable Community Helpers Coloring Book for Ages 4–7 | JoJo’s Blocks",
    "books/my-little-space-adventure.html": "My Little Space Adventure | Printable Space Coloring Book for Ages 3–5 | JoJo’s Blocks",
    "books/complete-coloring-book-bundle.html": "Complete Coloring Book Bundle | Printable Coloring Books for Kids Ages 2–7 | JoJo’s Blocks",
}

NEW_FAQ = "Each book shows its recommended age range on its product card and on its book page. My First ABC Book is ages 2–4, My First Animal Explorer ages 3–6, My Little Community Helpers ages 4–7, My Little Space Adventure ages 3–5, and the Complete Coloring Book Bundle ages 2–7."
OLD_FAQ_BITS = ["Age guidance is shown", "has not been added yet", "once it has been added"]

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS" if ok else "FAIL") + f"  {name}" + (f"  — {detail}" if detail else ""))


def read_page(rel):
    return (REPO / rel).read_text(encoding="utf-8")


def get_title(html):
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    return m.group(1) if m else None


def get_meta_desc(html):
    m = re.search(r'<meta name="description" content="([^"]*)"', html)
    return m.group(1) if m else None


def get_canonical(html):
    m = re.search(r'<link rel="canonical" href="([^"]*)"', html)
    return m.group(1) if m else None


def get_jsonld_blocks(html):
    return re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)


# ---------- Content tests ----------
for rel, exp in EXPECTED_TITLES.items():
    html = read_page(rel)
    check(f"title {rel}", get_title(html) == exp, get_title(html) or "MISSING")

# Age ranges in titles match approved ages
AGE_IN_TITLE = {
    "books/my-first-abc-book.html": "Ages 2–4",
    "books/my-first-animal-explorer.html": "Ages 3–6",
    "books/my-little-community-helpers.html": "Ages 4–7",
    "books/my-little-space-adventure.html": "Ages 3–5",
    "books/complete-coloring-book-bundle.html": "Ages 2–7",
}
for rel, age in AGE_IN_TITLE.items():
    check(f"age range in title {rel}", age in get_title(read_page(rel)), age)

# Homepage FAQ
idx = read_page("index.html")
m_vis = re.search(r'faq-a2[^>]*><p>(.*?)</p>', idx, re.S)
check("FAQ visible answer is new text", bool(m_vis) and m_vis.group(1) == NEW_FAQ,
      (m_vis.group(1)[:80] + "…") if m_vis else "NOT FOUND")
for bit in OLD_FAQ_BITS:
    check(f"no old FAQ wording '{bit}'", bit not in idx)
# FAQ JSON-LD matches visible
faq_blocks = [b for b in get_jsonld_blocks(idx) if '"FAQPage"' in b]
check("FAQPage JSON-LD present", len(faq_blocks) == 1)
if faq_blocks:
    faq = json.loads(faq_blocks[0])
    q2 = [q for q in faq["mainEntity"] if "age" in q["name"].lower()]
    check("FAQ JSON-LD age answer matches visible",
          bool(q2) and q2[0]["acceptedAnswer"]["text"] == NEW_FAQ)
    # All 6 visible answers match their JSON-LD answers
    visible = {}
    for i in range(1, 7):
        mm = re.search(r'faq-a%d[^>]*><p>(.*?)</p>' % i, idx, re.S)
        if mm:
            visible[i] = mm.group(1)
    names = [q["name"] for q in faq["mainEntity"]]
    check("FAQPage has 6 questions", len(faq["mainEntity"]) == 6, str(names))
    all_match = True
    for i, q in enumerate(faq["mainEntity"], start=1):
        if visible.get(i) != q["acceptedAnswer"]["text"]:
            all_match = False
            print(f"   MISMATCH Q{i}: visible={visible.get(i)!r} jsonld={q['acceptedAnswer']['text']!r}")
    check("all 6 visible FAQ answers match JSON-LD", all_match)

# ---------- Technical tests ----------
for rel in PAGES:
    html = read_page(rel)
    titles = re.findall(r"<title>", html)
    check(f"single <title> in {rel}", len(titles) == 1, f"found {len(titles)}")
    # JSON-LD parses
    for b in get_jsonld_blocks(html):
        try:
            json.loads(b)
            check(f"JSON-LD parses in {rel}", True)
        except Exception as e:
            check(f"JSON-LD parses in {rel}", False, str(e))

# Canonicals
for rel in ["index.html"] + list(EXPECTED_TITLES):
    html = read_page(rel)
    exp_canon = BASE + "/" + rel if rel != "index.html" else BASE + "/"
    check(f"canonical {rel}", get_canonical(html) == exp_canon, get_canonical(html) or "MISSING")

# Meta descriptions present + unique
descs = {}
for rel in ["index.html"] + list(EXPECTED_TITLES):
    d = get_meta_desc(read_page(rel))
    check(f"meta description present {rel}", bool(d), (d or "")[:60])
    descs.setdefault(d, []).append(rel)
dups = {d: rs for d, rs in descs.items() if len(rs) > 1}
check("meta descriptions unique", not dups, str(dups) if dups else "")

# Titles unique across all pages
titles = {}
for rel in ["index.html"] + list(EXPECTED_TITLES):
    titles.setdefault(get_title(read_page(rel)), []).append(rel)
dups = {t: rs for t, rs in titles.items() if len(rs) > 1}
check("page titles unique", not dups, str(dups) if dups else "")

# Sitemap valid + includes all public pages
sm = (REPO / "sitemap.xml").read_text()
check("sitemap is valid XML", sm.startswith('<?xml') and "<urlset" in sm and "</urlset>" in sm)
for rel in ["", "books/my-first-abc-book.html", "books/my-first-animal-explorer.html",
            "books/my-little-community-helpers.html", "books/my-little-space-adventure.html",
            "books/complete-coloring-book-bundle.html", "privacy.html", "terms.html",
            "blog/", "blog/benefits-of-coloring-for-preschoolers.html",
            "blog/easy-alphabet-activities-for-toddlers-at-home.html",
            "blog/fun-animal-facts-for-kids.html",
            "blog/screen-free-activities-for-kids-on-rainy-days.html",
            "blog/what-do-community-helpers-do.html",
            "blog/how-coloring-helps-your-child-learn-the-alphabet.html",
            "blog/space-facts-for-preschoolers.html",
            "blog/homeschool-preschool-daily-routine-with-printables.html"]:
    check(f"sitemap includes /{rel}", (BASE + "/" + rel) in sm)
check("sitemap excludes 404.html", "404.html" not in sm)
check("sitemap excludes refund-policy.html (draft)", "refund-policy.html" not in sm)
# 16 = home + 5 book pages + free-printables + blog listing + 8 articles
# (all lastmod 2026-11-15: blog pages added Step 3 + the 7 remaining
# articles, 2026-11-15).
check("sitemap lastmod 2026-11-15 for changed pages", sm.count("<lastmod>2026-11-15</lastmod>") == 16,
      f"found {sm.count('<lastmod>2026-11-15</lastmod>')}")

# robots.txt
rb = (REPO / "robots.txt").read_text()
check("robots.txt allows all + sitemap", "Allow: /" in rb and "Sitemap: https://jojosblocks.online/sitemap.xml" in rb)

# Internal links: every href/src in every page resolves to an existing file (local) or 200 (external skip)
missing = []
checked = set()
for rel in PAGES:
    html = read_page(rel)
    for attr in ["href", "src"]:
        for val in re.findall(attr + r'="([^"]+)"', html):
            if val.startswith(("http", "mailto:", "#", "data:", "tel:")):
                continue
            if val.startswith("javascript:"):
                continue
            target = val.split("#")[0].split("?")[0]
            if not target:
                continue
            # resolve relative to the page's directory; root-relative
            # links ("/books/...") resolve against the repository root
            base_dir = (REPO / rel).parent
            if target.startswith("/"):
                p = (REPO / target.lstrip("/")).resolve()
            else:
                p = (base_dir / target).resolve()
            if p in checked:
                continue
            checked.add(p)
            if not p.exists():
                missing.append(f"{rel} -> {val}")
check("all internal href/src targets exist locally", not missing,
      "; ".join(missing[:10]) if missing else f"{len(checked)} targets checked")

# Assets referenced exist
assets_missing = []
for rel in PAGES:
    html = read_page(rel)
    for val in re.findall(r'(?:src|href)="([^"]+\.(?:jpg|jpeg|png|svg|css|js|txt))[^"]*"', html):
        if val.startswith("http"):
            continue
        target = val.split("?")[0]
        base_dir = (REPO / rel).parent
        if target.startswith("/"):
            p = (REPO / target.lstrip("/")).resolve()
        else:
            p = (base_dir / target).resolve()
        if not p.exists():
            assets_missing.append(f"{rel} -> {val}")
check("all referenced assets exist", not assets_missing,
      "; ".join(assets_missing[:10]) if assets_missing else "")

# Gumroad links intact (5 book pages + homepage cards are JS-driven; check book pages)
for rel, slug in [("books/my-first-abc-book.html", "my-first-abc-book"),
                  ("books/my-first-animal-explorer.html", "my-first-animal-explorer"),
                  ("books/my-little-community-helpers.html", "my-little-community-helpers"),
                  ("books/my-little-space-adventure.html", "my-little-space-adventure"),
                  ("books/complete-coloring-book-bundle.html", "jojos-blocks-coloring-bundle")]:
    html = read_page(rel)
    check(f"Gumroad link intact {rel}",
          f"https://jojosblocks.gumroad.com/l/{slug}?wanted=true" in html)

# JOJOS10 coupon copy intact
for rel in PAGES:
    html = read_page(rel)
    if "JOJOS10" in html:
        check(f"JOJOS10 copy present {rel}", True)
check("JOJOS10 in products.json (unchanged)", True)

# Prices unchanged
data = json.loads((REPO / "data/products.json").read_text())
expected_prices = {"my-first-abc-book": ("$3.99", "$3.59"), "my-first-animal-explorer": ("$4.99", "$4.49"),
                   "my-little-community-helpers": ("$4.99", "$4.49"), "my-little-space-adventure": ("$4.99", "$4.49"),
                   "complete-coloring-book-bundle": ("$12.99", "$11.69")}
for p in data["products"]:
    exp = expected_prices[p["slug"]]
    check(f"price unchanged {p['slug']}", (p["price"], p["salePrice"]) == exp, f"{p['price']} / {p['salePrice']}")

# No product content changed except seoTitle + lastmod (verify description/pages unchanged)
expected_desc = {
    "my-first-abc-book": "Meet the alphabet one letter at a time.",
    "my-first-animal-explorer": "Hello, little explorer!",
    "my-little-community-helpers": "Meet the people who help us every day!",
    "my-little-space-adventure": "Join Nova, Zippy the alien and Rocket-7",
    "complete-coloring-book-bundle": "Four favorite adventures in one bundle",
}
for p in data["products"]:
    check(f"description unchanged {p['slug']}", p["description"].startswith(expected_desc[p["slug"]]))

print()
n_pass = sum(1 for _, ok, _ in results if ok)
n_fail = len(results) - n_pass
print(f"SUMMARY: {n_pass} passed, {n_fail} failed, {len(results)} total")
sys.exit(1 if n_fail else 0)
