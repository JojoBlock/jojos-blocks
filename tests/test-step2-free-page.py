"""Level 7 Phase 2 Step 2 — rendered checks of the Free Resources page.

Uses Playwright + Chromium headless shell. Serves the repository root
itself on a local port (same pattern as tests/site-check.py), so no
separate dev server is needed. Read-only except for one download-button
click (captured to a temporary file, verified, then discarded) and one
FAQ toggle. Checks: desktop + mobile screenshots, console/page errors,
failed requests, FAQ details toggle, download button (file + GA4 event
stub), and every same-site link on the page.

Screenshots are written to tests/screenshots-step2/ (local artifacts,
not committed).
"""
import http.server
import socketserver
import sys
import tempfile
import threading
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "screenshots-step2"
OUT.mkdir(parents=True, exist_ok=True)

failures = []


def check_links(page, page_url):
    """Every same-site link on the page must resolve (GET 200)."""
    hrefs = page.eval_on_selector_all(
        "a[href]", "els => els.map(e => e.getAttribute('href'))")
    seen = set()
    for href in hrefs:
        if not href or href.startswith(("mailto:", "tel:", "#")):
            continue
        if href.startswith("http"):
            continue  # external links (Gumroad, Pinterest) checked separately
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


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, *a):
        pass


def main():
    with socketserver.TCPServer(("127.0.0.1", 0), Handler) as httpd:
        port = httpd.server_address[1]
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        page_url = f"http://127.0.0.1:{port}/free-printables/index.html"
        run(page_url)
    print("FAILURES:" if failures else "ALL CHECKS PASSED")
    for f in failures:
        print(" -", f)
    sys.exit(1 if failures else 0)


def run(page_url):
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])

        # ---------- desktop ----------
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.on("console", lambda m: failures.append(
            f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("requestfailed", lambda r: failures.append(
            f"request failed: {r.url}"))
        page.on("pageerror", lambda e: failures.append(f"page error: {e}"))
        page.goto(page_url, wait_until="networkidle")
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / "01-free-desktop-top.png"))
        page.screenshot(path=str(OUT / "02-free-desktop-full.png"),
                        full_page=True)
        print("desktop title:", page.title())
        print("desktop h1:", page.locator("h1").inner_text())

        # FAQ toggle: first details element opens on click.
        first = page.locator("details.faq-item").first
        print("faq before click open:", first.evaluate("el => el.open"))
        first.locator("summary").click()
        page.wait_for_timeout(300)
        print("faq after click open:", first.evaluate("el => el.open"))
        if not first.evaluate("el => el.open"):
            failures.append("FAQ details did not open on click")

        # Download button: stub gtag AFTER load, then click and capture.
        # The download is saved to a temporary file, verified, then
        # discarded, so no PDF is left inside the repository (the
        # site-check PDF rule allows only the approved free pack).
        page.evaluate(
            "window.__gtagCalls = []; window.gtag = function(){"
            "window.__gtagCalls.push(Array.from(arguments)); };")
        with tempfile.TemporaryDirectory() as tmp:
            with page.expect_download() as dl_info:
                page.locator("a[data-free-download]").first.click()
            dl = dl_info.value
            print("download suggested filename:", dl.suggested_filename)
            dl_path = Path(tmp) / "downloaded-taster-pack.pdf"
            dl.save_as(str(dl_path))
            size = dl_path.stat().st_size
            print("downloaded bytes:", size)
            if size != 1749828:
                failures.append(f"downloaded PDF is {size} bytes, expected 1749828")
        calls = page.evaluate("window.__gtagCalls")
        print("gtag calls after download click:", calls)
        if not any(c and c[0] == "event" and c[1] == "free_sample_download"
                   for c in calls):
            failures.append("free_sample_download event was not fired")

        check_links(page, page_url)
        ctx.close()

        # ---------- mobile ----------
        ctx = browser.new_context(viewport={"width": 390, "height": 844},
                                  is_mobile=True, device_scale_factor=2)
        page = ctx.new_page()
        page.on("console", lambda m: failures.append(
            f"mobile console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("requestfailed", lambda r: failures.append(
            f"mobile request failed: {r.url}"))
        page.on("pageerror", lambda e: failures.append(f"mobile page error: {e}"))
        page.goto(page_url, wait_until="networkidle")
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / "03-free-mobile-top.png"))
        page.screenshot(path=str(OUT / "04-free-mobile-full.png"),
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
