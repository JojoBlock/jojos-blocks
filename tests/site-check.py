#!/usr/bin/env python3
"""JoJo's Blocks — full site check (Phase 1C).

Serves the dev copy on a local port with a GitHub-Pages-style 404
handler, then verifies every page: metadata, canonicals, JSON-LD,
analytics tags, the new header/footer, the Explore dropdown, links,
images, sitemap, and the 404 behaviour. A check that cannot execute
is reported as such — nothing passes by comparing two empty values.

Usage: python3 tests/site-check.py
"""
import http.server
import json
import re
import socketserver
import sys
import threading
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html"] + [f"books/{s}.html" for s in [
    "my-first-abc-book", "my-first-animal-explorer", "my-little-community-helpers",
    "my-little-space-adventure", "complete-coloring-book-bundle",
]] + ["privacy.html", "terms.html", "404.html", "refund-policy.html",
     "free-printables/index.html",
     "blog/index.html", "blog/benefits-of-coloring-for-preschoolers.html"]

failures = []


def check(name, ok, detail=""):
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok or not detail else "\n  " + detail))
    if not ok:
        failures.append(name)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, *a):
        pass

    def send_error(self, code, message=None, explain=None):
        # GitHub Pages behaviour: unknown paths serve the branded 404 page.
        if code == 404:
            body = (ROOT / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)


def fetch(base, path):
    req = urllib.request.Request(base + path, headers={"User-Agent": "site-check/1c"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:
        return None, str(e)


def main():
    with socketserver.TCPServer(("127.0.0.1", 0), Handler) as httpd:
        port = httpd.server_address[1]
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{port}/"
        run(base)
    print()
    print("FAILURES: " + str(len(failures)) if failures else "ALL SITE CHECKS PASSED")
    sys.exit(1 if failures else 0)


def run(base):
    pages = {}
    for p in PAGES:
        status, html = fetch(base, p)
        check(f"{p} returns 200", status == 200, f"got {status}")
        pages[p] = html

    for p, html in pages.items():
        tag = f"[{p}] "
        check(tag + "has a title", "<title>" in html and "</title>" in html)
        m = re.search(r'<meta name="description" content="([^"]+)"', html)
        check(tag + "meta description present (120-160 chars)",
              bool(m) and 120 <= len(m.group(1)) <= 160,
              f"length {len(m.group(1)) if m else 'missing'}")
        check(tag + "canonical present",
              'rel="canonical"' in html and "jojosblocks.online" in html)
        check(tag + "GA4 tag present", "G-PYDBE3YS5S" in html)
        check(tag + "Pinterest tag present", "2614299974172" in html)
        check(tag + "header nav present",
              'id="nav-menu"' in html and 'id="explore-toggle"' in html)
        check(tag + "Explore dropdown has live Books link + 4 Soon items",
              html.count('class="dropdown-soon"') == 4 and "Books &amp; Workbooks" in html)
        check(tag + "Free Resources is a live nav link, Blog is Soon text",
              html.count('class="nav-soon"') == 1 and
              'free-printables/index.html">Free Resources</a>' in html and
              'class="nav-soon">Blog' in html)
        check(tag + "footer has business email",
              "jojobusiness0101@gmail.com" in html)
        check(tag + "footer links Pinterest (verified URL)",
              "https://www.pinterest.com/JoJosBlocks/" in html)
        check(tag + "footer Pinterest link has logo icon + accessible label",
              'class="social-link"' in html and
              "aria-label=\"JoJo’s Blocks on Pinterest\"" in html and
              'class="social-icon"' in html and
              'target="_blank" rel="noopener"' in html)
        check(tag + "footer does NOT link the refund policy (draft)",
              "refund-policy.html" not in html.split('<footer')[1] if "<footer" in html else False,
              "refund-policy.html found inside the footer")
        check(tag + "no Instagram link anywhere",
              "instagram.com" not in html)
        check(tag + "no leftover generator tokens",
              "{{" not in html)
        check(tag + "loads site.js", "js/site.js" in html)

    # Hero: the broader brand headline and the bundle cover art.
    check("[index.html] hero headline is Discover. Create. Explore.",
          'Discover. <span class="hl-coral">Create.</span> <span class="hl-teal">Explore.</span>' in pages["index.html"])
    check("[index.html] hero art is the bundle cover (the whole collection)",
          "bundle-cover.jpg" in pages["index.html"])
    check("[index.html] hero no longer uses the children's-only headline",
          "Where little imaginations" not in pages["index.html"])

    # Price presentation on the 5 book pages: crossed-out original,
    # 10% OFF badge, large final price, JOJOS10 code line.
    for slug, was, now in [
            ("my-first-abc-book", "$3.99", "$3.59"),
            ("my-first-animal-explorer", "$4.99", "$4.49"),
            ("my-little-community-helpers", "$4.99", "$4.49"),
            ("my-little-space-adventure", "$4.99", "$4.49"),
            ("complete-coloring-book-bundle", "$12.99", "$11.69")]:
        p = f"books/{slug}.html"
        html = pages[p]
        check(f"[{p}] price block: {was} crossed out, {now} final, 10% OFF, JOJOS10",
              f'<span class="price-was">{was}</span>' in html and
              '<span class="price-off">10% OFF</span>' in html and
              f'<span class="price-now">{now}</span>' in html and
              "JOJOS10 applied at checkout" in html)

    # JSON-LD: homepage + all 5 book pages (privacy/terms/404/refund have none, as before).
    for p in ["index.html"] + [f"books/{s}.html" for s in [
            "my-first-abc-book", "my-first-animal-explorer", "my-little-community-helpers",
            "my-little-space-adventure", "complete-coloring-book-bundle"]]:
        check(f"[{p}] JSON-LD present and parses",
              json.loads(re.search(r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
                                   pages[p], re.S).group(1)) is not None
              if re.search(r'<script type="application/ld\+json">', pages[p]) else False)

    # Link crawl: every local href/src across all pages must resolve.
    seen, broken = set(), []
    for p, html in pages.items():
        for url in re.findall(r'(?:href|src)="([^"]+)"', html):
            if url.startswith(("http", "mailto:", "tel:", "#", "data:")):
                continue
            url = url.split("?")[0].split("#")[0]
            if not url:
                continue
            target = str((Path(p).parent / url).as_posix())
            if target in seen:
                continue
            seen.add(target)
            status, _ = fetch(base, target)
            if status != 200:
                broken.append((p, target, status))
    check(f"link crawl: {len(seen)} local paths, 0 broken",
          not broken, str(broken[:5]))

    # 404 behaviour: unknown paths return 404 + the branded page.
    for probe in ["/no-such-page.html", "/books/no-such-book.html"]:
        status, html = fetch(base, probe)
        check(f"404 for {probe}: status 404 + branded page",
              status == 404 and "This page isn" in html and 'href="index.html"' in html or
              status == 404 and "This page isn" in html and 'href="../index.html"' in html,
              f"status {status}")

    # Sitemap: valid XML, 11 URLs, no 404/refund-policy.
    status, sm = fetch(base, "sitemap.xml")
    root = ET.fromstring(sm)
    urls = [u.text for u in root.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    check("sitemap valid XML with 11 URLs", status == 200 and len(urls) == 11,
          f"status {status}, urls {len(urls)}")
    check("sitemap excludes 404 + refund-policy (draft)",
          not any("404" in u or "refund" in u for u in urls))

    # llms.txt: present, mentions the contact email.
    status, llms = fetch(base, "llms.txt")
    check("llms.txt present with contact email",
          status == 200 and "jojobusiness0101@gmail.com" in llms)

    # Assets: every local image referenced exists and is a real JPEG.
    imgs = set()
    for html in pages.values():
        imgs.update(re.findall(r'src="([^"]+\.jpg[^"]*)"', html))
    for img in sorted(imgs):
        status, _ = fetch(base, img.split("?")[0])
        check(f"image {img} returns 200", status == 200, f"got {status}")

    # US English: zero UK spellings in repo files (aria-labelledby excluded).
    bad = []
    for f in ROOT.rglob("*"):
        if f.is_file() and ".git" not in f.parts and f.suffix in (".html", ".js", ".json", ".md", ".txt", ".xml"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            for w in ["colour", "favourite", "licence"]:
                if re.search(w, text, re.I):
                    bad.append((str(f.relative_to(ROOT)), w))
    check("zero UK spellings (colour/favourite/licence) in repo files",
          not bad, str(bad[:5]))

    # No stale in.pinterest.com links anywhere (the verified URL is
    # www.pinterest.com/JoJosBlocks/).
    stale = []
    for f in ROOT.rglob("*"):
        if f.is_file() and ".git" not in f.parts and f.suffix in (".html", ".js", ".json", ".md", ".txt", ".xml"):
            if "in.pinterest.com" in f.read_text(encoding="utf-8", errors="ignore"):
                stale.append(str(f.relative_to(ROOT)))
    check("no stale in.pinterest.com links in repo files",
          not stale, str(stale[:5]))

    # No paid PDFs anywhere public. The approved free sample pack is the
    # sole exception (owner-approved 2026-11-15, Level 7 Phase 2 Step 2);
    # any other PDF in the repository still fails this check.
    ALLOWED_PDFS = {"assets/free-resources/jojos-blocks-free-taster-pack.pdf"}
    pdfs = [str(f.relative_to(ROOT)) for f in ROOT.rglob("*.pdf")]
    check("no paid PDF files in the repository", set(pdfs) <= ALLOWED_PDFS, str(pdfs))


if __name__ == "__main__":
    main()
