"""Level 7 Phase 2 Step 3 — rendered checks of the first blog article
and the blog listing page.

Uses Playwright + Chromium headless shell. Serves the repository root
itself on a local port (same pattern as tests/site-check.py and
tests/test-step2-free-page.py), so no separate dev server is needed.
Read-only except for one FAQ toggle. Checks: desktop + mobile
screenshots, console/page errors, failed requests, cover image loads,
breadcrumb, Article + BreadcrumbList + FAQPage structured data (parsed
and matched against the visible page), FAQ details toggle, and every
same-site link on both pages.

The three VM-blocked hosts (Google Fonts, Google Tag Manager,
Pinterest) are reported as environmental notes, not failures — they
are blocked by the VM's egress proxy, not by the site (same as the
Step 2 test's 12 environmental lines).

Screenshots are written to tests/screenshots-step3/ (local artifacts,
not committed).
"""
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "screenshots-step3"
OUT.mkdir(parents=True, exist_ok=True)

ARTICLE = "blog/benefits-of-coloring-for-preschoolers.html"
LISTING = "blog/index.html"
BLOCKED_HOSTS = ("fonts.googleapis.com", "fonts.gstatic.com",
                 "googletagmanager.com", "s.pinimg.com", "ct.pinterest.com")

failures = []
environmental = []


class Tracker:
    """Per-page error tracker. A blocked-host request failure and the
    console error it causes are the same event: the console error is
    attributed to the blocked host only while an unmatched blocked
    request failure exists for this page, so a real failed local
    resource still fails the test."""

    def __init__(self, label=""):
        self.label = label
        self.blocked_pending = 0

    def on_request_failed(self, r):
        if any(h in r.url for h in BLOCKED_HOSTS):
            self.blocked_pending += 1
            environmental.append(
                f"{self.label}request failed (blocked host): {r.url}")
        else:
            failures.append(f"{self.label}request failed: {r.url}")

    def on_console(self, m):
        if m.type != "error":
            return
        if m.text.startswith("Failed to load resource") and self.blocked_pending > 0:
            self.blocked_pending -= 1
            environmental.append(
                f"{self.label}console.error (blocked host): {m.text}")
            return
        failures.append(f"{self.label}console.{m.type}: {m.text}")

    def on_pageerror(self, e):
        failures.append(f"{self.label}page error: {e}")


def check_links(page, page_url):
    """Every same-site link on the page must resolve (GET 200)."""
    hrefs = page.eval_on_selector_all(
        "a[href]", "els => els.map(e => e.getAttribute('href'))")
    seen = set()
    for href in hrefs:
        if not href or href.startswith(("mailto:", "tel:", "#")):
            continue
        if href.startswith("http"):
            continue  # external links (sources, Gumroad) checked separately
        if href in seen:
            continue
        seen.add(href)
        url = urljoin(page_url, href)
        try:
            resp = page.request.get(url, timeout=10000)
            if resp.status != 200:
                failures.append(f"link {href} -> HTTP {resp.status}")
        except Exception as exc:  # noqa: BLE001
            failures.append(f"link {href} -> error {exc}")
    print(f"checked {len(seen)} same-site links")


def jsonld_blocks(page):
    raw = page.evaluate(
        "[...document.querySelectorAll('script[type=\"application/ld+json\"]')]"
        ".map(s => s.textContent)")
    blocks = []
    for text in raw:
        try:
            blocks.append(json.loads(text))
        except Exception as exc:  # noqa: BLE001
            failures.append(f"JSON-LD does not parse: {exc}")
    return blocks


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, *a):
        pass


def main():
    with socketserver.TCPServer(("127.0.0.1", 0), Handler) as httpd:
        port = httpd.server_address[1]
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{port}"
        run(base)
    print("ENVIRONMENTAL (VM-blocked hosts, not site defects):")
    for line in sorted(environmental):
        print(" -", line)
    print("FAILURES:" if failures else "ALL CHECKS PASSED")
    for f in failures:
        print(" -", f)
    sys.exit(1 if failures else 0)


def run(base):
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        article_url = f"{base}/{ARTICLE}"
        listing_url = f"{base}/{LISTING}"

        # ---------- desktop: article ----------
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        track = Tracker()
        page.on("console", track.on_console)
        page.on("requestfailed", track.on_request_failed)
        page.on("pageerror", track.on_pageerror)
        page.goto(article_url, wait_until="networkidle")
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / "01-article-desktop-top.png"))
        page.screenshot(path=str(OUT / "02-article-desktop-full.png"),
                        full_page=True)
        print("desktop title:", page.title())
        print("desktop h1:", page.locator("h1").inner_text())
        cover_w = page.locator("img.article-cover").evaluate(
            "el => el.naturalWidth")
        print("cover natural width:", cover_w)
        if cover_w == 0:
            failures.append("cover image did not load")
        if not page.locator("nav.breadcrumb").count():
            failures.append("breadcrumb missing")
        if "By JoJo's Blocks" not in page.locator(".card-meta").inner_text():
            failures.append("author byline missing")
        if "6 min read" not in page.locator(".card-meta").inner_text():
            failures.append("reading time missing")

        # Structured data: 3 blocks, parsed, values match the visible page.
        blocks = jsonld_blocks(page)
        types = sorted(b.get("@type", "?") for b in blocks)
        print("JSON-LD types:", types)
        if types != ["Article", "BreadcrumbList", "FAQPage"]:
            failures.append(f"expected Article+BreadcrumbList+FAQPage, got {types}")
        article = next((b for b in blocks if b.get("@type") == "Article"), None)
        if article and article.get("headline") != "Benefits of Coloring for Preschoolers":
            failures.append("Article headline mismatch")
        if article and article.get("author", {}).get("name") != "JoJo's Blocks":
            failures.append("Article author mismatch")
        crumbs = next((b for b in blocks if b.get("@type") == "BreadcrumbList"), None)
        if crumbs and [i["name"] for i in crumbs["itemListElement"]] != [
                "Home", "Blog", "Benefits of Coloring for Preschoolers"]:
            failures.append("BreadcrumbList names mismatch")
        faq = next((b for b in blocks if b.get("@type") == "FAQPage"), None)
        visible_qs = page.eval_on_selector_all(
            "details.faq-item summary",
            "els => els.map(e => e.textContent.replace('⌄', '').trim())")
        if faq and [q["name"] for q in faq["mainEntity"]] != visible_qs:
            failures.append("FAQPage questions do not match visible FAQ")
        print("visible FAQ questions:", len(visible_qs))

        # FAQ toggle: first details element opens on click.
        first = page.locator("details.faq-item").first
        first.locator("summary").click()
        page.wait_for_timeout(300)
        if not first.evaluate("el => el.open"):
            failures.append("FAQ details did not open on click")

        check_links(page, article_url)
        ctx.close()

        # ---------- desktop: listing ----------
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        track = Tracker("listing ")
        page.on("console", track.on_console)
        page.on("requestfailed", track.on_request_failed)
        page.on("pageerror", track.on_pageerror)
        page.goto(listing_url, wait_until="networkidle")
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / "03-listing-desktop.png"))
        cards = page.locator("article.blog-card")
        print("listing cards:", cards.count())
        if cards.count() != 1:
            failures.append(f"expected 1 article card, got {cards.count()}")
        card_link = cards.first.locator("h2 a").get_attribute("href")
        print("card link:", card_link)
        if card_link != "benefits-of-coloring-for-preschoolers.html":
            failures.append(f"card link wrong: {card_link}")
        card_cover = cards.first.locator("img").evaluate(
            "el => el.naturalWidth")
        if card_cover == 0:
            failures.append("listing card cover did not load")
        check_links(page, listing_url)
        ctx.close()

        # ---------- mobile: article ----------
        ctx = browser.new_context(viewport={"width": 390, "height": 844},
                                  is_mobile=True, device_scale_factor=2)
        page = ctx.new_page()
        track = Tracker("mobile ")
        page.on("console", track.on_console)
        page.on("requestfailed", track.on_request_failed)
        page.on("pageerror", track.on_pageerror)
        page.goto(article_url, wait_until="networkidle")
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / "04-article-mobile-top.png"))
        page.screenshot(path=str(OUT / "05-article-mobile-full.png"),
                        full_page=True)
        overflow = page.evaluate(
            "document.documentElement.scrollWidth - "
            "document.documentElement.clientWidth")
        print("mobile horizontal overflow px:", overflow)
        if overflow > 0:
            failures.append(f"mobile horizontal overflow: {overflow}px")
        ctx.close()
        browser.close()


main()
