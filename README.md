# JoJo’s Blocks — Digital Products Storefront

Brand name: **JoJo’s Blocks** (renamed from the working name “Rainbow Pages” on 8 Nov 2026. To change it again, update `site.brandName` in `data/products.json`, the `<title>` and JSON-LD in `templates/index.html`, and the logo text in `templates/partials/header.html` and `templates/partials/footer.html` — then re-run the generator).

This website is **live** at https://jojosblocks.online since 10 Nov 2026. Children's coloring books are the starting products of a growing digital-products business — books and workbooks, free resources, browser games, digital templates, affiliate products and a blog are planned as future categories (see the Consolidated Project Plan, 14 Nov 2026). Brand identity is brand-only: no personal name or personal details appear on the site.

## Phase 1A — 14 Nov 2026 (development branch `restructure/dev`, not deployed)
Independent technical fixes, all on the development branch; live site untouched:
- Contact email set: `jojobusiness0101@gmail.com` in `data/products.json`, footer contact line on every page, Privacy and Terms contact lines. Pinterest profile verified: https://www.pinterest.com/JoJosBlocks/ — Instagram @rz.views intentionally NOT linked (its profile publicly displays the owner's first name).
- US English throughout: UK spelling forms (about 96 occurrences across 11 files) all converted to US spelling; `aria-labelledby` attributes untouched (they are spec names, not prose).
- License: data field renamed from UK spelling to `license`, value `personal-family` (Personal & Family Use — owner-approved default) for all five products; shown on book pages and in the product modal; full wording in Terms.
- SEO drafts applied (Consolidated Project Plan §10): primary/secondary/long-tail keywords and new meta descriptions (139–147 chars) for all five products. SEO titles unchanged (already matched).
- Images optimized (originals preserved in the pre-Phase-1A backup): bundle cover 598 KB → 155 KB at 600×849 px; other covers 7–9% smaller; og-home 154 → 113 KB; profile logo 49 → 31 KB. Total image weight 1,293 → 749 KB.
- Unused SVG placeholders archived to `assets/archive/placeholder-covers/` (verified unreferenced).
- Custom branded `404.html` added (not in sitemap, as standard). Draft `refund-policy.html` added (hybrid approach; unlinked from footers and not in sitemap until owner approval + legal review — the DRAFT notice on the page says so).
- Ages for Animal Explorer, Community Helpers and the Bundle remain `null` — proposed ranges (3–6, 4–7, 2–7) are working recommendations only and were NOT published.
- Gumroad publication status still UNVERIFIED (Phase 2).

## Phase 1C — 14 Nov 2026 (development branch `restructure/dev`, not deployed)
Header/footer restructuring and future-ready architecture; live site untouched:
- One shared header and footer for every page, from `templates/partials/header.html` and `templates/partials/footer.html`. The generator now renders ALL pages from templates (`index.html`, the 5 book pages, `privacy.html`, `terms.html`, `404.html`, `refund-policy.html`) — never edit a generated page by hand.
- New minimal header: Home, Explore dropdown, Free Resources, Blog, About, Contact (mailto button). New compact footer: brand blurb (broader positioning — digital products for creative learning, not preschool-only), business email, About, Contact, Privacy Policy, Terms & Conditions, verified Pinterest link, copyright + "Prices shown in USD." Refund Policy stays unlinked (draft). Instagram stays unlinked.
- Navigation driven by `data/navigation.json` — the category registry. Books & Workbooks is live; Educational Games, Digital Templates, Affiliate Products, Creative Resources, Free Resources and Blog render as "Soon" text, never as links, so no visitor can land on an empty page. To activate a category: create its data file + listing template, set status to `live` with an href, re-run the generator. The generator FAILS if a live item has no href or a soon item has one.
- Shared site chrome moved to `js/site.js` (mobile menu, Explore dropdown, header shadow, footer year, Buy Now tracking); `js/main.js` keeps homepage-only behavior (cards, modal, FAQ, newsletter). Book pages no longer carry inline scripts.
- Deep-link test gap FIXED: the old harness used the hash `#book-03`, which never matched a product slug (slugs are full names), so its deep-link checks passed vacuously. The harness now uses a real slug (`#book-my-first-animal-explorer`), asserts the modal genuinely opens with content, and adds Escape-close and hashchange tests. (Correction: main.js never used DOMContentLoaded — it runs immediately — so the earlier explanation was wrong.)
- Tests (all in `workspace/jojos-blocks/restructure/tests/`, kept outside the repo): render + interaction 15/15, site chrome 12/12, full site check 173/173 (link crawl 26 paths 0 broken, 404 behavior, JSON-LD, sitemap, meta, accessibility basics). Generator `--check` idempotent.
- Screenshots of the new header/dropdown/footer now exist (Phase 1D, below) — the earlier limitation is resolved: rendered screenshots are produced with Playwright + Chromium headless shell against the local dev server (see `workspace/jojos-blocks/restructure/screenshot-phase1d.py`).

## Phase 1D + Homepage Redesign — 14 Nov 2026 (development branch `restructure/dev`, not deployed)
Three defects found by rendered-preview inspection and fixed; then the homepage repositioned for the broader digital-products brand; live site untouched:
- Dropdown Escape: the Explore menu did not close on Escape when opened by hover (CSS `:hover`/`:focus-within` showed it without the `.open` class, and refocusing the toggle reopened it). Fixed with a `.dismissed` class that suppresses the show rules, cleared on mouseenter/mouseleave/blur/toggle-click; Escape now fires on `.open` OR `:hover` OR `:focus-within`. Verified in the browser (hover-open and click-open) and by unit test.
- Sub-page top gap: first `.section` had 84px top padding on a plain background (~130px under the header). Fixed to 48px (`main > .section:first-child`); measured 76px on book pages (48px + the breadcrumb's own 28px margin) and ~53–59px on privacy — modest, not a defect.
- Modal cover on short screens: cover filled the whole modal below 900px. Fixed with `.modal-cover img{max-height:32vh}`; verified visually at 800px (cover capped, price/features/Buy Now visible).
- Homepage repositioning: hero headline is now "Discover. Create. Explore." with the broader description ("Discover thoughtfully designed digital products, creative resources and useful finds…"); hero art is the bundle cover (the whole collection in one image); hero points are Printable PDF / Instant download / New finds added regularly; About section rewritten for a digital-products brand growing beyond books; FAQ and newsletter copy broadened; `site.tagline` is now "Digital Products & Creative Resources". All five books and the Books section are unchanged.
- Pricing display (verified against live Gumroad, 14 Nov 2026): every card, modal and book page now shows the original price small and crossed out, a 10% OFF badge, the large bold final price, and "JOJOS10 applied at checkout". The percentage is computed from the two prices, never hardcoded. JOJOS10 eligibility was verified on all five live Gumroad products — the code is applied automatically in checkout, discounted amounts $3.59 / $4.49 / $4.49 / $4.49 / $11.69 match the site exactly. (Checkout totals for Indian customers include GST added by Gumroad; the site's prices are the product amounts.)
- Footer Pinterest logo: the text link is now the official Pinterest "P" badge (simple-icons glyph, inlined SVG) + "Pinterest" text, linked to the verified profile https://www.pinterest.com/JoJosBlocks/ with `target="_blank" rel="noopener"` and `aria-label="JoJo's Blocks on Pinterest"`. Instagram stays unlinked.
- Future-ready structure: `data/categories.json` is the full category taxonomy (7 top categories + subcategories, with future URL patterns and the affiliate-disclosure rule); the generator validates it (unique ids, soon items never link, live hrefs must point at files it writes). `templates/blog-article.html` is a reusable article template (title, cover, date, categories, tags, SEO, related articles) — not rendered until a real article exists, so no empty pages are published.
- JSON-LD fix: the homepage `sameAs` used a stale regional Pinterest domain; now the verified `www.pinterest.com/JoJosBlocks/`.
- Tests: render + interaction 23/23 (8 new price-presentation checks), site chrome 18/18, full site check 192/192 (new checks: hero headline + bundle art, price blocks on all 5 book pages, Pinterest icon + label, no stale regional Pinterest links). Generator `--check` idempotent. Rendered screenshots: 10 (desktop 1920px, 800px, 390px) in `workspace/jojos-blocks/restructure/screenshots-phase1d/`.
- NOT pushed: this work is committed locally only (`restructure/dev`); the preview branch still shows the previous snapshot until the owner approves a push. Nothing merged or deployed; live site untouched.

## What was built
Complete landing page / storefront in vanilla HTML5, CSS3 and JavaScript — no framework, no internal checkout. Purchase buttons link out to Gumroad checkout (connected 9 Nov 2026). Business focus: digital PDF coloring books for parents and children (the first products). Primary markets: USA and Europe. US English throughout; prices in USD.
- Header + responsive mobile menu, hero, featured collection, Why Parents Love Our Books, About, How to Buy, FAQ accordion, newsletter (front-end only), footer, product-detail modal.
- Product cards are rendered from `js/products.js`, so adding a book needs no HTML redesign.
- SEO: semantic HTML, unique title/meta description, Open Graph + Twitter cards, canonical placeholder, favicon, `robots.txt`, `sitemap.xml`, Schema.org WebSite JSON-LD.
- Accessibility: skip link, aria labels, keyboard-friendly FAQ/modal, Escape closes modal, focus styles, reduced-motion support.

## The books — real books, added 9 Nov 2026
The four books below were read from Aarif's own PDFs (kept privately in `~/workspace/user/jojos-blocks-books/` — the PDFs themselves are **not** in this repo or on GitHub). Titles, themes, ages and page counts come from the books themselves; ages appear only where the book states them.

| Book | Title | Pages | Age | Cover |
|---|---|---|---|---|
| 1 | My First ABC Book | 28 | Ages 2–4 | `assets/covers/book-01.jpg` |
| 2 | My First Animal Explorer | 30 | — (not stated in the book) | `assets/covers/book-02.jpg` |
| 3 | My Little Community Helpers | 54 | — (not stated in the book) | `assets/covers/book-03.jpg` |
| 4 | My Little Space Adventure | 42 | Ages 3–5 | `assets/covers/book-04.jpg` |

More books can be added at any time — the collection is not fixed at four. Covers are the books' real cover pages, rendered from the PDFs at 600px wide. The old placeholder SVG covers (`book-01.svg` … `book-04.svg`) were archived on 14 Nov 2026 to `assets/archive/placeholder-covers/` — verified unreferenced by any page (only this README mentioned them). Originals are also preserved in the pre-Phase-1A backup.

## Beginner's guide: edit a book in 5 minutes
You only need to edit **one file: `data/products.json`** (the central product data — the single source of truth since the Nov 2026 migration). `js/products.js` is GENERATED from it — never edit it by hand. After editing the data file, run `node tools/generate-pages.js --all` from the repository root to regenerate the book pages, the static pages, sitemap, llms.txt and `js/products.js`. `index.html`, `privacy.html`, `terms.html`, `404.html` and `refund-policy.html` are also GENERATED (from `templates/`) — never edit them by hand; edit their template instead. You do not need to touch `css/styles.css`, `js/site.js` or `js/main.js` for a content change. To change the navigation, edit `data/navigation.json` (see Phase 1C above).

Each book is one block that starts with `id: "book-01"` and ends with `}`. Change only the text inside the quotation marks, and keep the quotation marks and commas exactly as they are.

### Worked example — filling in Book 1
Change this (Book 1 as it stands now):
```js
title: "My First ABC Book",
theme: "Alphabet • Letters A–Z",
age: "Ages 2–4",
pages: 28,
description: "Meet the alphabet one letter at a time. Each page pairs a big letter with a picture word — A is for Apple, B is for Ball, C is for Cat — with a color guide and tracing practice, so little ones learn, color and write their first letters.",
```
To this (using *your* book's real details only):
```js
title: "My Real Book Title",
theme: "Animals",
age: "Ages 4–8",
pages: 50,
description: "A short description in your own words, based on the actual book.",
```

### Every field you can change, in plain English
| Field | What to put | Example |
|---|---|---|
| `title` | The book's real title, exactly as on the book | `"Dinosaur Coloring Fun"` |
| `theme` | Its subject, in a few words | `"Dinosaurs"` |
| `age` | Age guidance from the book, or leave `null` if unknown | `"Ages 4–8"` or `null` |
| `pages` | The real page count, or leave `null` if unknown | `50` or `null` |
| `format` | The product format | `"Digital PDF coloring book"` |
| `description` | 1–3 sentences about the real book | Your own words |
| `features` | 3 short bullet points, each in `"quotes"`, separated by commas | `"50 coloring pages"` |
| `cover` | Path to the cover image (see below) | `"assets/covers/book-01.jpg"` |
| `coverAlt` | Short description of the cover, for screen readers and SEO | `"Dinosaur coloring book cover"` |
| `pdfUrl` | The real PDF purchase link, when you have one, or `null` | `"https://example.com/your-pdf-link"` or `null` |

| `seo.focusKeyword` | Main search phrase for this book | `"dinosaur coloring book for kids"` |
| `seo.metaDescription` | 1–2 sentences for search results (under about 155 characters) | Your own words |

**Rules that keep the site honest:**
- Only write what is true of that book. If you do not know the age or page count, leave it as `null` — the site will simply not show it.
- Never paste a guessed purchase link. Leave the field as `null` until you have the real one — the button will then read “link coming soon” instead of sending visitors to a wrong page.
- Do not copy text, images or characters from other people's books.

### Add a cover image
1. Save your cover as a JPG or PNG, e.g. `my-book-cover.jpg`.
2. Put the file in the `assets/covers/` folder.
3. In `js/products.js`, change that book's `cover` line to `"assets/covers/my-book-cover.jpg"`.
4. Update `coverAlt` to describe the cover.

The four placeholder covers were simple original SVG drawings, archived 14 Nov 2026 to `assets/archive/placeholder-covers/` (see above). Real covers are the books' cover pages, rendered from the PDFs at 600px wide.

### Gumroad purchase links — connected 9 Nov 2026
Gumroad checkout is now connected. In `js/products.js` each book's `pdfUrl` holds its real Gumroad product link, and the detail popup uses the same link. The five links (checkout URLs verified to resolve, HTTP 200, 14 Nov 2026). Publication status on Gumroad itself is UNVERIFIED — the README and the code comments contradict each other on it — and will be checked in Phase 2 (Gumroad audit). Do not state published or unpublished until then:
- My First ABC Book — https://jojosblocks.gumroad.com/l/my-first-abc-book
- My First Animal Explorer — https://jojosblocks.gumroad.com/l/my-first-animal-explorer
- My Little Community Helpers — https://jojosblocks.gumroad.com/l/my-little-community-helpers
- My Little Space Adventure — https://jojosblocks.gumroad.com/l/my-little-space-adventure
- Complete 4-Book Bundle (book-05, 154 pages, cover `assets/covers/bundle-cover.jpg`) — https://jojosblocks.gumroad.com/l/jojos-blocks-coloring-bundle
The bundle link slug is `jojos-blocks-coloring-bundle` — the spelling `jojosblocks-coloring-bundle` (no hyphen) returns a Gumroad 404, so do not use it. To change a link, edit only that book's `gumroadUrl` in `data/products.json` and re-run the generator. Leave it as `null` if a book should not be for sale — the button will then read “buy link unavailable”.

### Add a fifth or sixth book
Copy one whole product block in `data/products.json`, paste it after the last one, and give it a new `id` (e.g. `book-06`) and a new `slug`, `slot` (e.g. `"Book 6"`) and `title`. Fill in its fields the same way, then run `node tools/generate-pages.js --all`. The card, detail modal, book page, sitemap and book count update automatically. Add a comma after the previous book's closing `}` if there was not one already.

### If something breaks after editing
- Check you did not delete a quotation mark, comma or closing `}` — that is the most common cause.
- Undo your last change, save, and refresh the page.
- If a card disappears, open the browser console (F12) — a JavaScript error there usually names the line in `js/products.js` (generated) or `js/main.js`. If the data file itself is broken, run `node tools/generate-pages.js --check` — it reports the problem.

## Replace the domain placeholder
Live domain is https://jojosblocks.online (set at launch, 10 Nov 2026) in: `index.html` (canonical, Open Graph/Twitter, JSON-LD), `js/products.js` (`SITE_CONFIG.domain`), `sitemap.xml`, `robots.txt`, plus a `CNAME` file. Contact email is now set in `data/products.json` (`site.contactEmail` = jojobusiness0101@gmail.com, 14 Nov 2026) and the footer contact line shows on every page. Instagram @rz.views is intentionally NOT linked: its profile publicly displays the owner's first name. Pinterest profile verified 14 Nov 2026: https://www.pinterest.com/JoJosBlocks/

## Audit — 9 Nov 2026
A full audit found and fixed these genuine problems (design and colors unchanged):
- **Product cards were invisible.** The cards were rendered by JavaScript *after* the scroll-reveal setup, so they were never observed and stayed at opacity 0. Cards are now rendered before the reveal setup, so they appear normally.
- **Visitors could see owner instructions.** Product titles, descriptions, the collection note, the modal note, the purchase-link message, the newsletter note and the footer all mentioned `js/products.js` / `README.md` or "Email address to be added". All visitor-facing copy is now written for visitors; the editing instructions live only in this README and in code comments.
- **Confusing copy fixed:** the second hero button said "Discover Our Collection" but linked to About (now "Browse the Collection", links to the books); a hero badge implied a choice of formats (now "Digital PDF — Print at home, again & again"); How to Buy steps 2 and 3 said almost the same thing (step 3 is now "Get your PDF", step 4 "Print & color"); the About section carried a defensive "We do not claim awards…" line (removed); "Activity Books" wording was removed from the title and metadata at that time. (Nov 2026 update: the brand is no longer coloring-books-only — children's books are the starting products of a wider digital-products business.)
- **Small technical fixes:** the purchase-link `rel` no longer claims `sponsored`; the newsletter message no longer says your email was "noted in this browser" (it is not stored anywhere); FAQ answers can now expand to 480px instead of 320px; Privacy Policy and Terms pages now have meta descriptions.
- **Unpublished site kept out of search:** the page meta robots tag was `index, follow` and `robots.txt` allowed all crawlers, even though the site is unpublished. Both are now set to block indexing/crawling until launch (see the launch checklist for how to flip them back).
- Still needed from you before launch: real book details, a contact email, a real domain, and legal review of Privacy/Terms. The GitHub repository was also found showing as **Public** on 9 Nov 2026 even though it was set to Private on 8 Nov — check its visibility in GitHub Settings before sharing anything.

## Preview ↔ GitHub reconciliation — 9 Nov 2026
The hosted preview had picked up extra improvements that were not in the GitHub source. They are now all in this source (and on GitHub): book-detail modal is focus-trapped, titled by the book name and returns focus when closed; FAQ buttons use `aria-controls`/ids and the answers stay visible if JavaScript is off; light/dark `theme-color` tags; FAQ structured data (JSON-LD) matches the visible FAQ word for word; hero second button reads “See How Buying Works” and links to How to Buy; footer book links show the real titles; footer contact line set 14 Nov 2026 to the public business email jojobusiness0101@gmail.com (it had been removed at launch until a real email was available); Books 3–4 covers and the About photo load eagerly with their 600×849 shape reserved; collection intro and the yellow parents' note rewritten; newsletter note shortened. Design, colors and typography unchanged. The full-cover fix (`object-fit: contain`, 600×849) was already on GitHub before this — see commit `1db03655`.

## Final audit — 9 Nov 2026
A final visual and functional audit of the preview passed: all four covers display complete and uncropped; cards and descriptions match the real books; desktop and mobile layouts have no sideways scrolling; navigation, mobile menu, FAQ, book popup and newsletter form all work; the newsletter was tested live against the sheet (valid signup saved, duplicate blocked, invalid rejected — test rows removed afterwards). The audit's fixes, now also in this source: the Privacy Policy and Terms pages no longer carry "placeholder" labels (replaced with plain closing sentences — the pages still need a qualified adviser's review before launch, see the checklist below). The audit noted one capture quirk, not a page fault: in its own full-page screenshots, below-fold covers occasionally painted blank even though every image loaded — the covers use eager loading with their shape reserved to paint promptly.

## Newsletter
The form is live since 9 Nov 2026 (`SITE_CONFIG.newsletterConnected: true`). When a visitor subscribes, the form sends their email address to a small Google Apps Script web app, which appends it to the “JoJo's Blocks subscribers” Google Sheet (columns: Email, Date subscribed). The script's URL lives in `data/products.json` (`site.newsletterEndpoint`) and is emitted into `SITE_CONFIG` in the generated `js/products.js`; the code and deployment steps are in `workspace/goals/jojo-s-blocks-website/newsletter-apps-script.md`. No promotional emails are sent automatically — emails only go out when there is a new book or freebie to share. If the endpoint ever stops working, set `newsletterConnected: false` and the form will show its honest “not connected yet” message again instead of pretending to work.

## Run locally / deploy
```bash
cd ~/workspace/coloring-book-store
python3 -m http.server 8000
# open http://localhost:8000
```
Build step: after editing `data/products.json` or `data/navigation.json`, run `node tools/generate-pages.js --all` (dependency-free Node) to regenerate all pages, sitemap, llms.txt and `js/products.js`. Verify with `node tools/generate-pages.js --check` (dry run) and the tests in `workspace/jojos-blocks/restructure/tests/` (`homepage-render-test.js`, `site-chrome-test.js`, `site-check.py`). Deploy: upload the whole folder (index.html, css/, js/, assets/, robots.txt, sitemap.xml, privacy.html, terms.html, 404.html, refund-policy.html) to any static host — Netlify, Vercel, GitHub Pages, or your web host's public folder. No server code, no database. Never deploy from `main` without the owner's explicit approval; work happens on `restructure/dev`.

## Project structure
```
coloring-book-store/
├── index.html          # GENERATED from templates/index.html — do not edit by hand
├── privacy.html        # GENERATED — get legal review before launch
├── terms.html          # GENERATED — get legal review before launch
├── css/styles.css
├── data/products.json  # ★ EDIT BOOKS, LINKS, BRAND, CONTACT HERE (single source of truth)
├── data/navigation.json # ★ EDIT NAVIGATION + CATEGORIES HERE (header, Explore dropdown, footer links)
├── data/categories.json # ★ CATEGORY TAXONOMY for the future platform (validated by the generator)
├── templates/index.html # homepage template
├── templates/book.html # book-page template (tokens filled by the generator)
├── templates/blog-article.html # blog article template — reusable, NOT rendered until a real article exists
├── templates/privacy.html templates/terms.html templates/404.html templates/refund-policy.html
├── templates/partials/header.html templates/partials/footer.html # the ONE shared header/footer
├── tools/generate-pages.js # dependency-free Node generator (--only / --all / --check)
├── js/products.js      # GENERATED from data/products.json — do not edit by hand
├── js/site.js          # shared site chrome: mobile menu, Explore dropdown, header shadow, footer year, buy tracking
├── js/main.js          # homepage only: rendering, modal, FAQ, newsletter — no need to edit
├── assets/archive/placeholder-covers/ # the four unused SVG placeholder covers, archived 14 Nov 2026
├── assets/favicon.svg      # old favicon (kept, no longer referenced)
├── assets/profile-logo.jpg # brand logo — the exact file used as the Gumroad profile picture (800x800 coral logo, SHA-256 bfeb971a97a94eadca759e9052424f9ce031febc06d0d27651e7bdce590a08b5); also the site favicon and header/footer logo
├── 404.html            # branded custom 404 page (added 14 Nov 2026)
├── refund-policy.html  # DRAFT refund & support policy — pending owner approval + legal review
├── robots.txt
├── sitemap.xml
└── README.md           # this file
```

## Before you publish — checklist
- [x] All books in the collection have real titles, descriptions and covers (added 9 Nov 2026 from the real PDFs).
- [x] Age and page count are filled in, or left as `null` where unknown.
- [x] Real PDF purchase links are in place — all five Gumroad links in `js/products.js` (9 Nov 2026).
- [x] Contact email added — jojobusiness0101@gmail.com (14 Nov 2026, footer + Privacy + Terms).
- [x] Real domain replaces `www.example.com` everywhere — live domain is https://jojosblocks.online (10 Nov 2026).
- [x] `robots.txt` changed from `Disallow: /` to `Allow: /` and the `index.html` meta robots tag changed from `noindex, nofollow` to `index, follow` (10 Nov 2026, launch).
- [ ] Privacy Policy and Terms reviewed by a qualified adviser.
- [x] Newsletter connected — live since 9 Nov 2026 (Google Sheets + Apps Script).
- [x] No placeholder text (“To be added”, “Book 1”, “link coming soon”) remains on any live book.

## Launch — 10 Nov 2026
- All five Gumroad products PUBLISHED 10 Nov 2026 (ABC $3.99, Animal $4.99, Community Helpers $4.99, Space $4.99, bundle $12.99; JOJOS10 10% off auto-applied on all five). Prices and settings as agreed; nothing published before Aarif's explicit approval that day.
- Website live at https://jojosblocks.online (GitHub Pages, custom domain, `CNAME` file in repo). Repository stays PUBLIC by Aarif's decision 10 Nov 2026 — he cannot afford paid hosting or GitHub plans right now. Do not make it private.
- Buttons read "Buy Now on Gumroad" and link to the published Gumroad products.
- Buy links use Gumroad's direct-checkout format (`?wanted=true` on each product URL), fixed 10 Nov 2026 after customers saw several products together in checkout. Cause: Gumroad keeps a persistent cart in the visitor's browser — clicking "I want this!" on other products leaves them in the cart, and no link format clears a saved cart (verified live: plain link, `?wanted=true` and the buy-now checkout URL all open the same saved cart). A fresh visitor always sees exactly the one product they clicked; returning visitors remove older cart items once. Do not "fix" this by changing product URLs again without re-testing in a fresh private session.

## Per-product deep links — 10 Nov 2026
Each product has its own shareable URL that opens its details modal directly (used as Pinterest Pin destinations):
- My First ABC Book — https://jojosblocks.online/#book-my-first-abc-book
- My First Animal Explorer — https://jojosblocks.online/#book-my-first-animal-explorer
- My Little Community Helpers — https://jojosblocks.online/#book-my-little-community-helpers
- My Little Space Adventure — https://jojosblocks.online/#book-my-little-space-adventure
- Complete Coloring Book Bundle — https://jojosblocks.online/#book-complete-coloring-book-bundle
Implemented in `js/main.js` (`productFromHash` / `openFromHash`; opening a modal sets the hash via `replaceState`, closing it returns to `#books`). Prices are now shown on cards and in the modal from the `price` / `salePrice` fields in `js/products.js` (sale price = with JOJOS10, auto-applied at Gumroad checkout). Cache note: after the 10 Nov 2026 deploy, one CDN edge kept serving the old JS files for over 40 minutes even though the live files were byte-identical to the new version — fixed by versioning the asset URLs in `index.html` (`?v=2` on styles.css, products.js, main.js). Bump the version number whenever these files change again.