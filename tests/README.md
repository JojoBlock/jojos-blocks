# JoJo's Blocks — tests

Automated checks for the website. Run them from the repository root.
Nothing here changes the site, Gumroad, or any analytics settings.

## Suites

| File | What it checks | Run |
|---|---|---|
| `tests/site-check.py` | Serves the repo on a local port and verifies every page: title, meta description (120–160 chars), canonical, GA4 + Pinterest tags, header/footer, Explore dropdown, nav links, links, images, sitemap, llms.txt, 404 behavior, US English, no paid PDFs except the approved free pack | `python3 tests/site-check.py` |
| `tests/level2-test-suite.py` | Level 2 SEO checks: page titles, sitemap entries and lastmod dates, robots.txt, internal links, Gumroad links, JOJOS10 copy, prices and descriptions unchanged. Compares the local files against the live production site, so it needs network access | `python3 tests/level2-test-suite.py` |
| `tests/site-chrome-test.js` | Shared header/footer behavior in `js/site.js`: mobile menu, Explore dropdown, header shadow, footer year, Buy Now click tracking | `node tests/site-chrome-test.js` |
| `tests/homepage-render-test.js` | Homepage rendering with the real `js/main.js`: product grid, modal open/close, deep links | `node tests/homepage-render-test.js` |
| `tests/test-step2-free-page.py` | Rendered checks of the Free Resources page (`/free-printables/`): desktop + mobile layout, FAQ toggle, download button (filename, 1,749,828 bytes, `free_sample_download` event), every same-site link. Serves the repo itself; no separate dev server needed | `python3 tests/test-step2-free-page.py` |
| `tests/test-step3-blog-article.py` | Rendered checks of the first blog article (`/blog/benefits-of-coloring-for-preschoolers.html`) and the blog listing (`/blog/`): desktop + mobile layout, cover image loads, breadcrumb, Article + BreadcrumbList + FAQPage structured data (parsed and matched against the visible page), FAQ toggle, every same-site link. Serves the repo itself; no separate dev server needed | `python3 tests/test-step3-blog-article.py` |

`tests/fixtures/products-phase1a.js` is the Phase 1A product-data baseline used by the homepage render test.

## Requirements

- **Python 3** (stdlib only, except `requests` for `level2-test-suite.py`: `pip install requests`).
- **Node.js** for the two `.js` suites (no extra packages).
- **Playwright + Chromium** for `test-step2-free-page.py` and `test-step3-blog-article.py`: `pip install playwright` then `playwright install chromium` (on this VM the Chromium headless shell is used instead — see the project notes).

Run all six from the repository root:

```bash
python3 tests/site-check.py
python3 tests/level2-test-suite.py
node tests/site-chrome-test.js
node tests/homepage-render-test.js
python3 tests/test-step2-free-page.py
python3 tests/test-step3-blog-article.py
```

## Notes

- The Step 2 test writes screenshots to `tests/screenshots-step2/` (local artifacts, not committed; see `.gitignore`). The download it captures goes to a temporary file and is deleted after its size is verified, so no extra PDF is left in the repo.
- The Step 3 test writes screenshots to `tests/screenshots-step3/` (local artifacts, not committed; see `.gitignore`). Unlike the Step 2 test, it reports the three blocked hosts as environmental notes rather than failures, so it exits 0 when the site itself is fine.
- The Step 2 test records failed requests as failures. In restricted environments three third-party hosts cannot load at all — Google Fonts, Google Tag Manager, and the Pinterest tag — so its failure list shows those 12 lines (3 hosts, desktop + mobile, request + console error) even though the site is fine. They load normally in a real browser.
- `site-check.py` fails if any PDF other than the approved free sample (`assets/free-resources/jojos-blocks-free-taster-pack.pdf`) appears in the repository.
