# JoJo's Blocks — Design System (Phase 2, 2026-11-22)

One global design system, codified from the live site. This is **not a
visual redesign**: every token below was already live on production
(01fe763); Phase 2 gives the existing identity a single name and a single
place to change it. The tokens live in `:root` in `assets/styles.css`.

## Identity (unchanged)

| Token | Value | Used by |
|---|---|---|
| `--paper` | `#FCFAF6` (warm cream) | page background, header |
| `--surface` | `#FFF` | cards, modal, tab bar |
| `--ink` | `#111827` | text, dark nav bar, button text on yellow |
| `--muted` | `#3A3D42` | secondary text, captions |
| `--line` | `#E4E2DC` | borders, dividers |
| `--tile` | `#ECEAE4` | image stages, placeholder tiles |
| `--bar` | `#111827` | dept nav bar, bottom tab bar active |
| `--accent` | `#E4572E` (coral) | secondary accents |
| `--yellow` | `#FACC15` | primary CTA buttons, active pills |
| `--yellow-dark` | `#EAB308` | CTA hover |
| `--purple` | `#7C3AED` | prices, "New" badges |
| `--purple-dark` | `#6D28D9` | purple hover |
| `--gold` | `#FFF3D6` | highlight backgrounds |

## Typography

| Token | Value |
|---|---|
| `--font-display` | `'Archivo', sans-serif` (headings, buttons, nav) |
| `--font-body` | `'Inter', sans-serif` (body copy) |
| `--text-xs` / `--text-sm` / `--text-base` / `--text-lg` / `--text-xl` / `--text-2xl` / `--text-3xl` | 12 / 14 / 16 / 18 / 22 / 28 / 34px |
| `--weight-bold` / `--weight-xbold` / `--weight-black` | 700 / 800 / 900 |

Body copy is 16px (`--text-base`). Buttons and nav labels use Archivo 700.

## Spacing, radius, shadow

| Token | Value |
|---|---|
| `--space-1` … `--space-8` | 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32px |
| `--radius` / `--radius-sm` / `--radius-lg` / `--radius-card` / `--radius-pill` | 10 / 8 / 14 / 16px / 999px |
| `--shadow` / `--shadow-md` / `--shadow-lg` | card / raised / hero shadows |

Page container: `.wrap{max-width:1200px}` (`--container-max`), padding
32px desktop / 24px ≤1024px / 16px ≤640px.

## Icons

| Token | Value | Used by |
|---|---|---|
| `--icon-box` | 26px | category tile icon box (`.cat-ic`) — **the box is identical on all ten tiles** |
| `--icon-glyph` | 22px | target visible glyph size |
| `--icon-btn` | 18px | brand logo mark inside purchase buttons (`.btn .btn-logo`) |
| `--icon-nav` | 18px | dept-nav tab icons |
| `--icon-tab` | 24px | bottom tab-bar icons |

**Optical sizing (audit A-03):** the 26px box is shared, but glyphs fill
their 24×24 viewBox unevenly, so sparse glyphs render larger to read the
same visual weight: Games 32px, Worksheets / Wallpapers / Planners 29px,
Learn to draw / AI 30px. The box never changes, so tile layout is
untouched. Measured in `test-phase2.py` (glyph `getBBox()`).

## Buttons

| Token | Value |
|---|---|
| `--btn-h` | 44px — **every purchase button, every viewport** |

All purchase buttons are 44px tall, single-line, with a brand logo
(Amazon smile, Ko-fi cup, Gumroad G — inline SVG, 18px, see `site.js`
`LOGO_*`) and a compact label: `Buy $X.XX` (Gumroad), `Buy on Amazon`,
`Buy on Ko-fi`. The 62px two-line paperback button (audit E-04) is gone.
`.btn{line-height:1.2}` — the body line-height (1.55) made the 15px
button text 23px tall, so base buttons measured 49px; 1.2 unifies every
purchase button at exactly 44px (content 18px + padding 24px + border 2px).
**Exceptions, deliberate:** `.msticky .btn` stays 56px (sticky-bar CTA,
not a card/grid/detail button). `.btn{white-space:nowrap}` — the compact
labels never wrap.

**Brand-colour note:** the Amazon smile is drawn in ink (`#111827`), not
brand orange (`#FF9900`): every Amazon button sits on the yellow `#FACC15`
CTA, where orange-on-yellow is ~1.6:1 and unreadable; the smile *shape*
is the Amazon mark, and the adjacent "Buy on Amazon" label carries the
name. Ko-fi uses brand red `#FF5E5B`; Gumroad uses brand black.

## Covers — one size scale

| Token | Value | Used by |
|---|---|---|
| `--cover-grid-w-sm` | 150px | grid covers, 641–767px (horizontal cards) |
| `--cover-grid-w` | 180px | grid covers, ≥768px |
| `--cover-grid-w-lg` | 200px | grid covers, ≥1024px |
| `--cover-hero-w` | 200px | hero slide covers |
| `--cover-hero-w-lg` | 220px | hero slide covers, ≥1280px |
| `--cover-detail-w` | 260px | detail-page cover card (`.detail .dcover`, `width:100%`) |
| `--cover-tier-w` | 270px | FR tier covers (desktop) |

**Aspect ratios:** `--ar-cover: 3/4` (grid covers, `object-fit:contain` on
the cream `#F8F5EE` stage), `--ar-hero: 600/849` (hero covers),
`--ar-fan: 4/3` (Slide 3 fan collage), `--ar-thumb-43: 4/3` (FR thumbs),
`--ar-thumb-169: 16/9` (game/blog thumbs), `--ar-square: 1/1` (wallpaper
board covers), `--ar-mockup: 4/5` (Real-books mockup),
`--cover-tier-ar: 3/4` (FR tier covers, portrait variant).

**Scaling rule (audit B-02/C-02):** covers grow with the viewport and never
shrink — mobile 171px < tablet 180px < desktop 200px. The mobile grid
cover is the full card-column width (Fix #1/#3 look, owner-approved).
Known tolerance: at 430px the mobile cover measures ~193px, 13px over the
180px tablet cover — visually imperceptible; shrinking mobile would
regress Fix #1/#3.

**Portrait variant (audit B-01):** `.wp-cover--portrait` — 3/4 frame with
`object-fit:contain` on the cream stage, for artwork that is a portrait
page (the four colouring tiers, 2550×3300). Wallpaper board covers keep
the square frame (the hub's design).

**Real-books mockup (audit B-03):** the SVG is a 600×750 (4:5) render, shown
in a fixed 336×420 box at every width (was 614×420 @768 vs 475×420 @1280).
The `#real-books` section measures 599px @390 (compact card — 18px shorter
than Fix #2's 617px because the Amazon button is now single-line),
1224px @768 (the promo is single-column at tablet: art + text stack) and
875px @1280 (two-column promo).

## Category tiles (audit A-01/A-02)

`body.fr-phase2 #listingChips` is `repeat(5, minmax(0, 1fr))` (10 columns
≥1025px) with `min-width:0` on the tiles — equal width at every mobile
width, so "Learn to draw" and "AI" never shrink. Labels are 11px at
≤640px with `overflow-wrap:break-word` as a safety net. Tile height
86px @390 vs 92px @768/1280 is **by design** (mobile override), not a bug.
**Below 450px the grid drops to 4 columns** (`repeat(4, minmax(0, 1fr))`):
five equal columns are too narrow for the longest single-word labels —
"Worksheets" (62px at 11px) broke mid-word ("Worksheet / s") in a 57px
label box at 390px. Four columns give ~77px tiles at 390px, so every
label fits at the readable 11px (no tiny 9px text) and every tile stays
the same 86px height. The 10 tiles lay out 4+4+2 on narrow phones.

## Filter chips (audit D-01)

`.chip` compacts at ≤640px: 38px tall, 8px/13px padding, 13px font (was
44px / 10px/16px / 14px at every width). The dead `.ds-icon-chips` class
(audit D-02) was removed from `shop/own-products/index.html` — it had zero
CSS rules anywhere.

## Carousels (audit C-03)

The two homepage carousels **intentionally differ in height**: the hero
carousel is a full product slide (cover + title + description + buttons);
the Kids-Books carousel is a single book card. They are different
components, not one component done twice. Tests assert slides are equal
**within** each carousel, never across carousels. The fan frame is 260px
desktop / 280px max mobile and never shrinks on larger screens (audit
C-02). Hero covers scale with the viewport (audit C-01).

## Navigation (audit F-02/F-03)

- **Dept nav:** a horizontal scroll strip below 1024px. A right-edge fade
  (CSS mask) hints that more tabs exist, and `site.js` scrolls the active
  tab into view on load (scrolls only the strip, never the page).
- **Bottom tab bar:** one fixed height, 64px + safe-area, at every width,
  with links vertically centred — matching `body{padding-bottom}` so no
  content hides under it. Labels are the standard mobile abbreviations
  "Products" / "Resources" (icons disambiguate); the dept nav keeps the
  full "Our Products" / "Free resources" labels.

## Detail pages (audit G-01/G-02/G-03, Fix #4)

- **Overflow root cause (Fix #4):** the "You may also like" `.chips` row
  inside the second `.dgrid` column had an unwrapped min-content up to
  ~3100px; the 1fr track expanded to it. Fixed by
  `.detail .dgrid{grid-template-columns:minmax(0,1fr)}` (≤820px) +
  `.dgrid>*{min-width:0}` + `.detail .chips{max-width:100%}`.
- **Safety net (audit F-01):** `html,body{overflow-x:clip}` — clips
  horizontal overflow **without** creating a scroll container, so the
  sticky header keeps working. The old `overflow-x:hidden` broke sticky on
  every page at every width (header top −800px after scrolling 800px).
  The grid fix alone holds 390px, so the net can be dropped outright if
  clip ever misbehaves.
- **Cover card:** `width:100%;max-width:260px` — explicit width, so the
  card holds 260px even if its image fails to load.
- **Malformed URLs:** all 180 `../https://…` occurrences in 60 files fixed
  to absolute URLs (images + download links).
- **Samples:** every book's "Look inside" / sample pages use the shared
  `.detail .samples` grid (3-col desktop / 2-col mobile), including the
  Reset Kit (was page-inline CSS, 1-column on mobile).

## Breakpoints

`--bp-mobile: 640px`, `--bp-tablet: 768px`, `--bp-desktop: 1024px`,
`--bp-wide: 1280px` — documentation only; CSS custom properties cannot be
used inside `@media`, so the queries use the literal values. Test widths:
360 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440.

## Files

- Tokens + component rules: `assets/styles.css` (`:root` block, "PHASE 2
  DESIGN TOKENS" comment).
- Brand logos + modal labels + dept scroll: `assets/site.js` (`LOGO_*`).
- Scripted HTML fixes: `~/workspace/jojos-blocks/restructure/apply-phase2-html.py`
  (idempotent; run report in its output).
- Regression test: `~/workspace/jojos-blocks/restructure/test-phase2.py`.
