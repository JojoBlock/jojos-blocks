# UI/UX Consistency Audit — Phase 1 (Audit Only)

**Date:** 22 Nov 2026
**Branch:** `restructure/fix4-detail-overflow-preview` (off production `01fe763`)
**Worktree:** `~/workspace/jojos-blocks/restructure/preview-fix4-overflow`
**Scope:** Home, Shop, Our Products, Free Resources, individual product pages, Games, Blog and other navigation pages — desktop, tablet and mobile checked INDEPENDENTLY.
**Method:** local Playwright, served worktree over local HTTP. MEASURED, not eyeballed: every size below is a `getBoundingClientRect()` / computed-style reading (icon boxes via `svg.getBBox()` for visible glyph size).
**Viewports:** 390 / 768 / 1280 on every page type (24 pages); spot-checks at 360 / 375 / 430 / 1024 / 1440 on the worst offenders (FR index, Home, Shop own-products, Books ebooks, Reset Kit page, Dulcis).
**JS errors:** 0 across all pages and viewports.
**Status:** AUDIT ONLY. No fixes were made in this phase. Phase 2–5 follow after this report is approved.

## Summary

**21 inconsistencies found** (one row each below), plus the Fix #4 overflow root cause and the current Fix #4 worktree state (§1).

| Area | Rows | Headline |
|---|---|---|
| A. Category icons (FR index) | 3 | Tiles unequal width on narrow mobile; glyph optical sizes differ |
| B. Product thumbnails | 3 | Tier covers square-crop portrait pages; covers bigger on mobile than desktop; mockup aspect varies |
| C. Homepage sliders / hero | 3 | Hero covers fixed 140×198 at all widths; fan shrinks on larger screens; two carousels, two heights |
| D. Shop category buttons | 2 | 44px chips at every width, no mobile compaction; dead `.ds-icon-chips` class |
| E. Purchase buttons | 4 | No Amazon / Ko-fi / Gumroad logos anywhere (text only); paperback button 62px vs 42px siblings |
| F. Mobile-vs-desktop | 3 | Sticky header broken by Fix #4 safety net (all pages); tabbar 70px vs 59px; dept nav cut mid-label on mobile |
| G. Fix #4 / detail pages | 3 | Cover width depends on image loading; planners-03 cover URL broken live; Look-inside 1-col on mobile |

**What is consistent (verified, not assumed):** product-grid cover frames (3/4 + contain, uniform per viewport: 171×228 @390, 150×200 @768/1280); game thumbs (16:9, 143×80 @390); blog thumbs (16:9, 171×96 @390, 366×206 @1280); FR item thumbs (4:3, 170×128 @390); header / dept nav / footer span 100% of the viewport at every width; **zero horizontal overflow on any audited page at 390/768/1280** (with the uncommitted Fix #4 edit in place); **no image on the site is actually distorted** (first-pass aspect flags were all `object-fit: cover/contain` crops or letterboxes — verified per image); grid cards are equal height within each row (0px spread); slides are equal height within each carousel.

## 1. Fix #4 — horizontal overflow / zoom-out (findings carried into this audit)

### 1.1 Root cause — MEASURED

The owner's screenshots (Begin Again page shrunk to the left half, white gap on the right) are caused by **one element: the "You may also like" / "More in …" `.chips` row inside the second `.dgrid` column on detail pages.**

- `.detail .dgrid` at ≤820px used `grid-template-columns:1fr`. `1fr` = `minmax(auto, 1fr)` and the `auto` minimum is the grid item's **min-content**.
- At ≤640px, `.chips{flex-wrap:nowrap;overflow-x:auto}` with `.chips .chip{flex:none}` makes the row's min-content the **full unwrapped row** (up to ~3100px).
- The single `1fr` track therefore expanded to the chips' min-content instead of the viewport: **735px on the Reset Kit page, 970px on My First ABC Book, 841px on Christmas, 573px on Dulcis, 722px on Flower Stickers, up to 1105px on free-resource detail pages.** The phone zoomed out to fit the whole document → content on the left half, white gap on the right. Footer and header shrink with it (they span the document, not the screen).
- **Proof (not a guess):** hiding the `.chips` row alone restores `documentElement.scrollWidth = 390` (track 358px); setting `grid-template-columns:minmax(0,1fr)` alone restores 390px; setting the second grid item `min-width:0` alone restores 390px. Hiding the email-capture form does NOT fix it (still 735px).
- **Sweep of all 139 detail pages (pre-fix): 86 overflowed** — all 9 book pages, all 8 shop detail pages, 69 free-resource detail pages (max 1105px). All 39 blog articles and all 11 game pages were clean (their chips rows sit in width-constrained containers).
- The viewport meta tag is correct on every template (`width=device-width, initial-scale=1.0`) — it was never the cause.

### 1.2 Current worktree state — Fix #4 edits (UNCOMMITTED, left exactly as made)

`assets/styles.css` only, **+42/−7, not committed** (per the 22 Nov ~10:09 IST stop order — no further fix edits, no commit of the fix):

1. `@media (max-width:820px)`: `.detail .dgrid{grid-template-columns:minmax(0,1fr)}` (was `1fr`) — the root-cause fix.
2. `.detail .dgrid>*{min-width:0}` and `.detail .chips{max-width:100%}` — belt & braces; the chips row now scrolls internally.
3. **Safety net:** `html,body{max-width:100%;overflow-x:hidden}`.
4. Cover card: `.detail .dcover{max-width:260px;margin:0 auto}` + soft shadow at ≤820px (was 420px; kit-hero was 140px).
5. CTAs: `.detail .dbuy{flex-direction:column}` + `.btn{width:100%}` at ≤640px (stacked full-width).

**Test result (test-fix4-overflow.py, 103/128 PASS):** all overflow checks pass — 147 pages (139 detail + 8 listings) at 390px AND 1280px have `scrollWidth == viewport`. Covers are 260px centred on book/shop pages; CTAs stack 358×49px on the Reset Kit page; 0 JS errors; Fix #1/#2/#3 regressions intact (see §1.3).

**Two failures the test caught (both real, both need a Phase 2 decision):**

- **(a) The safety net breaks the sticky header — all pages, all widths.** After scrolling to 800px, `header.site` top = **−793px** (scrolled away) with `overflow-x:hidden` in place; with a runtime-only override restoring `overflow-x:visible`, top = **0px** (sticks) on every one of the 24 audited pages. The root-cause grid fix is NOT the problem — only the `overflow-x:hidden` safety net. The dept nav stickiness goes with it (same mechanism). The safety net must be reworked (e.g. `overflow-x:clip`, or dropped entirely now the root cause is fixed) — Phase 2.
- **(b) Cover card under 240px on 3 templates in the VM** (FR forest 237px, planners-03 185px, Flappy 181px vs the 240–280px spec). Cause: `margin:0 auto` on the grid item defeats `stretch`, so the card sizes to its content — the image. Those three images do not load in the VM (absolute `https://jojosblocks.online/…` URLs), so the card collapses to alt-text size. **On the live site the forest/flappy images load, so their cards render 260px** — a VM measurement artefact, not a live bug. The planners-03 image is genuinely broken live (see G-02). Underlying fragility (real): any cover image that fails to load collapses the card instead of holding 260px — the card has no explicit width.

**Test artefacts (NOT regressions, verified by re-measurement):** the test's "grid cards equal height" failure compared all 10 cards globally (47px spread across rows); per-row spread is **0px** in every row at 390 and 1280. Its "slides equal height" failure compared the two different carousels as one set; within each carousel the slides are equal (spot 599px, kb 285px @390).

### 1.3 Begin Again page — current state (mobile 390px)

- Cover: 260px centred card, rounded corners, soft shadow ✓ (was a 140px thumbnail).
- CTAs: stacked full-width, each 358×49px — "Buy on Gumroad — $12.99" (yellow #FACC15 already, no colour change needed), "Buy Paperback on Amazon — $21.99", "Download Free 3-Page Sample" ✓.
- Sections present: Buyer promise (`.guarantee`, padding 12px 14px), email capture (padding 16px), "What readers say" ✓; page padding 16px via `.wrap` ✓.
- "Look inside": flip-through video 358×462 + 5 sample figures — see G-03 (single-column stack on mobile, not 2-column).
- No overflow; header/footer span 100% (with the uncommitted fix; sticky broken — see §1.2a).

## 2. Findings — one row per inconsistency

### A. Category icons — Free Resources index (`free-resources/index.html`, `#listingChips .cat-tile`)

| ID | Viewport | Component | Measured inconsistency | Likely cause |
|---|---|---|---|---|
| A-01 | 360 / 390px | Category tiles | Tile columns UNEQUAL width: "Learn to draw" and "AI" tiles **41px wide @360px / 52px @390px**, vs Worksheets/Stickers **77px**, Coloring/Wallpapers **72px**, All/Printables **66px**, Planners/Games **59px**. Equal (72px) only at ≥430px; 136px @768, 105px @1280 (all equal). | `#listingChips` is `repeat(5,1fr)` — but `1fr` = `minmax(auto,1fr)`, so each column's floor is its items' longest-word min-content (Worksheets 77px, Learn/AI 52px). Same min-content family as the Fix #4 overflow. At ≥430px there is enough free space for the tracks to equalise. |
| A-02 | 360px | "Learn to draw" tile | Tile **100px tall** vs 86px for every other tile (label wraps to 2 lines: "Learn to / draw"). At 390px it is 86px like the rest (label fits on one line at 52px width? No — it wraps at 360 only). | Longest label in the narrowest column (A-01). |
| A-03 | all widths | Category icon glyphs | Icon BOX is 26×26 for all 10 tiles, but the VISIBLE glyph differs: Games **21.7×11.9px** (half the height of the rest), Worksheets **17.3px wide**, Wallpapers / Planners **19.5px**, most others **21.7×21.7px**. | Per-icon SVG paths fill the 24×24 viewBox unevenly (gamepad is a flat wide shape; document is narrow). No per-icon optical sizing. Note: the owner's "Learn to Draw and AI shrink smaller" is the TILE width (A-01) plus the sparse diagonal pencil / chip paths — the icon boxes themselves measure 26×26 on every tile. |

Note: tile height 86px @390 vs 92px @768/1280 is **by design** — a mobile override (`assets/styles.css:1070`) sets `min-height:86px` at ≤640px. Not an inconsistency.

### B. Product thumbnails

| ID | Viewport | Component | Measured inconsistency | Likely cause |
|---|---|---|---|---|
| B-01 | 390 / 768 / 1280 | FR category tier covers (`free-resources/category/coloring/`, `.wp-card .wp-cover`) | Portrait colouring pages (natural 2550×3300, aspect 0.77) shown in a **square 171×171px @390 / 352×352 @768 / 270×270 @1280** box with `object-fit:cover` — **~23% of the page height is cropped** at every width (top and bottom cut off). Not distortion (cover crops, never stretches), but the thumbnail hides a quarter of the page it advertises. | `.wp-cover img{object-fit:cover}` in a square frame; no portrait-ratio variant for portrait artwork. |
| B-02 | 390 vs 768 / 1280 | Homepage product-grid covers (`.card .cover`) | Covers are **LARGER on mobile (171×228px) than on tablet/desktop (150×200px)** — inverted scaling: the phone shows bigger thumbnails than the desktop. Frames themselves are uniform per viewport (3/4 + contain, all cards). | Mobile uses 2-col vertical cards (cover = full card width); desktop uses horizontal cards with a fixed 150px thumb. No shared cover-size token across breakpoints. |
| B-03 | 768 / 1280 | Real-books 3D mockup (`#real-books`, `my-first-abc-book-paperback.svg`) | Displayed aspect **varies by viewport: 614×420 (1.46) @768 vs 475×420 (1.13) @1280**, natural 120×150 (0.8). `object-fit:contain` so it letterboxes rather than distorting, but the mockup sits in a large empty frame with visible whitespace at both widths. (Same internal-whitespace issue noted in Fix #2: the SVG is a raster 3D render with whitespace baked in.) | Container sizes the mockup differently per breakpoint; the SVG's own whitespace is never trimmed. |

### C. Homepage sliders / hero (`index.html`)

| ID | Viewport | Component | Measured inconsistency | Likely cause |
|---|---|---|---|---|
| C-01 | 390 / 768 / 1280 | Hero slide covers (slides 1–2, `.hslide .cover img`) | Cover is **fixed 140×198px at every width** while the slide grows: slide 358×599 @390, 720×394 @768, 517×435 @1280. On desktop the cover occupies only ~27% of the slide width. | Fixed pixel size, no viewport scaling. (Slide 1 is the Reset Kit cover — the same artwork that is 260px on its detail page.) |
| C-02 | 390 vs 768 / 1280 | Slide 3 fan frame (`.spot-fan-cover`) | Fan frame **SHRINKS on larger screens: 280×210 @390 → 220×165 @768/1280**. Inverted scaling, same family as B-02. | Fixed widths per breakpoint, set in the wrong direction. |
| C-03 | 390 / 1280 | Two homepage carousels | Spot slides **599px tall @390 (435 @1280)** vs Kids-Books slides **285px @390 (313 @1280)** on the same page — two carousels with unrelated heights and unrelated cover treatments. | Separate components, never unified. (Within each carousel the slides ARE equal height — verified.) |

### D. Shop category buttons (`shop/own-products/index.html`, `#listingChips`)

| ID | Viewport | Component | Measured inconsistency | Likely cause |
|---|---|---|---|---|
| D-01 | 390 / 768 / 1280 | Filter chips (`.chip`) | **44px tall, 10px/16px padding, 14px font at every width** — zero mobile compaction. The 5-chip row totals ~628px wide in a 358px viewport, so on mobile only ~2.5 chips are visible and the rest hide behind a horizontal scroll. (44px is a valid touch target; the inconsistency is that mobile gets the desktop size, and the row is far wider than the screen.) | One `.chip` rule for all widths; no ≤640px size step. The row is a scroll strip by design (FIX 4 comment), but the chips never shrink for it. |
| D-02 | all | `.ds-icon-chips` class | The class on `#listingChips` (`class="chips ds-icon-chips"`) has **zero CSS rules anywhere** — dead class; the chips fall back to the generic `.chip` styling (no icons render on these chips, unlike the FR tiles). | Leftover from an earlier design; never cleaned up. |

### E. Purchase buttons — logos missing

| ID | Viewport | Component | Measured inconsistency | Likely cause |
|---|---|---|---|---|
| E-01 | all | Amazon buttons | **No Amazon logo on any Amazon button** — homepage ("Paperback on Amazon — $21.99", "Get the Paperback on Amazon"), all book detail pages ("Buy Paperback on Amazon — $21.99 / $9.99"), shop grids. Every button is text-only: `hasImg=false, hasSvg=false` on all 10+ sampled buttons. Owner's report confirmed. | Buttons are plain `<a class="btn btn-accent">` text links; no logo asset is ever included. No Amazon logo file exists in the repo. |
| E-02 | all | Ko-fi buttons | **No Ko-fi logo** — "Buy on Ko-fi — $3" (Flower Stickers) is text-only, same as E-01. | Same as E-01. |
| E-03 | all | Gumroad buttons | **No Gumroad logo either** — "Buy on Gumroad — $12.99", "Buy $3.59" etc. are text-only. (Owner asked about Amazon/Ko-fi; Gumroad has the identical gap.) | Same as E-01. |
| E-04 | 390 | "Get the Paperback on Amazon" (grid cards) | **62px tall** (text wraps to 2 lines at 147–204px wide) vs **42px** for every sibling Buy button in the same grid — inconsistent button heights inside product cards, on Home and Shop. At 1280 the same buttons are one line. | Long label + narrow mobile card column; no `white-space`/sizing handling for the longest label. |

### F. Mobile-vs-desktop

| ID | Viewport | Component | Measured inconsistency | Likely cause |
|---|---|---|---|---|
| F-01 | all widths, all pages | Sticky header + dept nav | **Sticky header does not stick** (see §1.2a): after scrolling 800px, header top = −793px on all 24 pages at 390 and 1280. Caused by the uncommitted Fix #4 safety net (`html,body{overflow-x:hidden}`). With the rule overridden at runtime, the header sticks (top = 0) on every page. | Safety net creates a scroll container that breaks `position:sticky`. Must be reworked in Phase 2 — do not ship as-is. |
| F-02 | 390 vs 768 | Bottom tab bar (`.tabbar`) | **70px tall @390 vs 59px @768** (hidden @1280, correct). The two-line labels ("Our Products", "Free resources") wrap on the phone and stretch the bar. | Label wrapping at 390px; no fixed bar height. |
| F-03 | 390 | Dept nav (`nav.dept`) | Only **~3.5 of 6 tabs visible**; "Free resources" is cut mid-label ("Fr…"). All 6 tabs fit at 768 (right edge 752px) and 1280. | The nav is a horizontal scroll strip (~700px of tabs in a 358px viewport) by design — but on mobile the 4th tab is unreadable without swiping, and there is no scroll hint. |

### G. Fix #4 / detail pages

| ID | Viewport | Component | Measured inconsistency | Likely cause |
|---|---|---|---|---|
| G-01 | 390 | Detail cover card (`.detail .dcover`) | Card width **depends on whether its image loads**: `margin:0 auto` on the grid item defeats `stretch`, so the card sizes to its content (the image). Measured 260px where the image loads (book/shop covers), but **237px / 185px / 181px where it does not** (FR forest / planners-03 / Flappy in the VM). On live, forest/flappy images load → 260px; the fragility is real for any future failed image. | No explicit width on the card (`width:100%;max-width:260px` would hold 260px regardless of the image). |
| G-02 | all (live) | Planners-03 cover image | **Broken on the live site**: `free-resources/planners-03-monthly-habit-tracker/index.html:128` uses `src="../https://jojosblocks.online/assets/free-resources-60/planners/planners-03-monthly-habit-tracker.png"` — a malformed `../https://…` URL that 404s everywhere, not just in the VM. Same malformed pattern previously found on `free-resources/ai-*` pages (PR #35 note). Cover never renders. | Bad URL written into the page data/template. |
| G-03 | 390 | Kit "Look inside" samples (`.look-inside`) | The 5 sample figures render as a **single-column stack (358×492px each)** on mobile — not the 2-column grid in the brief. The rule is page-inline CSS (kit page line 37: `repeat(auto-fit,minmax(180px,1fr))` → 1 column at 358px, since 2×180+16=376 > 358). Meanwhile Christmas and helpers-3-5 use the shared `.samples` grid, which IS 2-column on mobile (173px each @390). Two implementations, two mobile layouts for the same "sample pages" pattern. | Inline per-page CSS vs shared stylesheet; the 180px minimum is 9px too wide for 2 columns at 390px. |

## 3. What the audit covered

- **24 pages** at 390 / 768 / 1280: Home, Shop (Our Products), Shop own-products, Books & ebooks category, Reset Kit / ABC / Christmas book pages, Dulcis + Flower Stickers shop details, FR index, FR Coloring category, 2 FR detail pages, Games index, Flappy + Memory Match, Blog index + 1 article, About, Search, Digital Tools, Physical Products, Free Printables, Products index.
- **Spot widths** 360 / 375 / 430 / 1024 / 1440: FR index, Home, Shop own-products, Books ebooks, Reset Kit page, Dulcis.
- **Full detail sweep** (from Fix #4): all 139 detail pages at 390px — 86 overflowed pre-fix, 0 post-fix (see §1.1).
- **Screenshots:** `screenshots-audit-phase1/` (72 shots: 24 pages × 3 viewports) + `screenshots-fix4-overflow/` (Fix #4 test shots).
- **Raw data:** `audit-phase1-results.json`, `audit-phase1-followup.json`, `sweep-fix4-before.json`, `test-fix4-results.json` (all in `~/workspace/jojos-blocks/restructure/`).
- **Scripts (not committed):** `audit-phase1.py`, `audit-phase1-followup.py`, `probe-fix4-overflow.py`, `sweep-fix4-overflow.py`, `test-fix4-overflow.py`.

## 4. Worktree state (at audit end)

- Branch `restructure/fix4-detail-overflow-preview`, head `01fe763` (production).
- **Uncommitted:** `assets/styles.css` (+42/−7) — the Fix #4 edit, left exactly as made per the stop order. It fixes the overflow but breaks sticky (F-01). **Do not deploy this state.**
- **Committed by this audit:** this file only (`uiux-consistency-audit-2026-11-22.md`).
- No other files changed. No push, no merge, no deploy.

## 5. Recommended Phase 2 shape (for approval — no work started)

1. Fix the safety net (F-01) first — rework or drop `overflow-x:hidden` on html/body, re-verify sticky on all pages.
2. Design-system tokens for the inconsistent sizes: one cover-size scale, one chip-size scale with a mobile step, one button-height rule (fix E-04), one icon-glyph optical-size rule (A-03), one tile-grid rule for narrow mobile (A-01/A-02).
3. Logo assets for Amazon / Ko-fi / Gumroad buttons (E-01–E-03) — needs logo files (none exist in the repo) or an approved text-badge treatment.
4. Hero/slide proportions (C-01–C-03, B-02/B-03) and the Look-inside unification (G-03).
5. Broken planners-03 image URL (G-02) — one-line data fix, shippable with Phase 2.
