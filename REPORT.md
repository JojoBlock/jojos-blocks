# JoJo's Blocks — 10 UI/UX Redesign Concepts: Comparison & Recommendation

**Status: PREVIEW ONLY — 16 Nov 2026.** No design selected, nothing merged, nothing deployed to production. The owner reviews and chooses (or combines elements). Live site untouched (main `04b4148`).

**Preview hub:** `concepts/index.html` on branch `restructure/uiux-redesign-concepts` (raw.githack). Each concept is one self-contained HTML file with inline CSS/JS.

**How they were built:** 5 builders in parallel, 2 concepts each, from a shared brief + real content only (5 books with real prices/Gumroad links, 12 free resources, 6 live games, 8 blog articles; affiliate sections are honest coming-soon states; no fake reviews, ratings, sales numbers or invented products). Every concept includes: homepage + hero, desktop nav, working mobile nav, live search filter, category filters, product cards + product-detail view, Our Products, Affiliate Marketplace, Free Resources, Games & Play, Blog, footer.

**Independent verification (parent, Playwright venv, local server):** all 10 load; 0px horizontal overflow at desktop 1280 and mobile 390; zero page errors (excluding VM-blocked Google Fonts, which load fine in a real browser); nav, footer, Gumroad links, game links and blog links present in all 10. Screenshots: `previews/` — desktop 1280 + mobile 390 per concept (note: VM screenshots use fallback fonts; real browsers show the intended typography).

## The 10 concepts

### 01 — Premium Digital Marketplace
Direction: store-first professional commerce; dominant search, department mega-menu, filter sidebar, trust strip, bundle-led hero.
Advantages: clearest shopping journey; strongest product discovery; most familiar e-commerce patterns; scales to many products.
Disadvantages: the most conventional — least distinctive brand feel; dense header can crowd small screens (trust bar wraps to 4 lines at 390px).
Best for: maximising straightforward buying.

### 02 — Modern Creative Marketplace (Etsy-style)
Direction: discovery-led; maker-story hero, collection rails, warm artisan palette, bottom tab bar on mobile.
Advantages: warmest, most inviting feel; collections make browsing enjoyable; mobile tab bar is excellent.
Disadvantages: softer commerce focus — buying feels secondary to browsing; collection rails need strong imagery to work at full strength.
Best for: a creative brand that wants to feel human, not corporate.

### 03 — Amazon / Flipkart-Inspired Commerce
Direction: high-density store UX (inspiration only, no copied branding); search-led header, department nav, carousels, compact cards.
Advantages: maximum products visible per screen; familiar to the widest audience; best for large catalogues later.
Disadvantages: visually the busiest; risks feeling generic; department nav scrolls horizontally at 1280px (last link cut off until scrolled).
Best for: scale and familiarity over distinctiveness.

### 04 — Minimal Premium Storefront
Direction: quiet luxury; near-monochrome palette, serif typography, huge whitespace, few large cards.
Advantages: the most premium-feeling; products look valuable; fastest to scan; ages best visually.
Disadvantages: least information per screen; discovery is weaker (fewer entry points); can feel sparse until the catalogue grows.
Best for: a premium brand image with a small, curated catalogue.

### 05 — Editorial Commerce Platform
Direction: magazine with a store inside; masthead, featured-article hero, journal rows linking articles to products, buying guide.
Advantages: strongest content-to-commerce path (blog actually sells); most distinctive voice; great for SEO-led growth.
Disadvantages: shopping is slower to reach; magazine layout is the hardest to keep consistent as products multiply.
Best for: a content-led growth strategy.

### 06 — Creative Studio & Marketplace
Direction: bold studio identity; near-black hero, portfolio work-index, marquee, hard shadows, vivid accents, bottom quick bar.
Advantages: the most memorable and distinctive; strong brand statement; games/resources feel like "work", not filler.
Disadvantages: the boldest look risks dating fastest and may alienate more conservative shoppers; bottom quick bar can briefly cover content while scrolling on mobile.
Best for: standing out and building a recognisable brand.

### 07 — Modern Digital Products Store
Direction: format-led download store; PDF/page/age badges, browse-by-format, filter rail with sorting, "what you get" checklists.
Advantages: clearest for digital products specifically — buyers instantly see format, pages, ages; sorting/filtering is the strongest here.
Disadvantages: the most utilitarian; least emotional; format tiles for printables/planners jump to Free Resources rather than filtering the store.
Best for: selling downloads efficiently.

### 08 — Discovery-First Marketplace
Direction: visual discovery; category mosaic hero, trending rows, "Surprise me" random spotlight, bottom tab bar.
Advantages: the most fun to browse; the Surprise-me feature genuinely aids discovery; great mobile tab bar.
Disadvantages: discovery can distract from buying; footer "Popular" links point to sections rather than specific items (concept-level shortcut).
Best for: engagement and repeat visits.

### 09 — Professional Multi-Category Platform
Direction: balanced ecosystem; all six areas equal weight, global search, one card system everywhere, dashboard-style home.
Advantages: the fairest representation of the whole business; nothing is buried; most scalable structure.
Disadvantages: the least distinctive — balance can read as neutrality; hero is a dashboard panel, not an emotional hook.
Best for: a platform that must serve six areas equally.

### 10 — Guided Marketplace (Original)
Direction: journey-based; Learn / Create / Play paths, "Find it fast" preference filter over real content with live counts, strongest search.
Advantages: the best answer to "visitors struggle to find things" — it guides instead of listing; works for every visitor type; warm but professional; the most polished build.
Disadvantages: the finder adds a layer of complexity to maintain; paths need to stay accurate as categories grow.
Best for: the stated problem — mobile-first discovery for a multi-category store.

## Recommendation (parent's view — owner decides)
**First choice: 10 — Guided Marketplace.** It directly solves the brief's core complaint (people can't find things) with guided paths and the best search/filter system, while staying warm and professional. It is the only concept built around the visitor's intent rather than the catalogue's structure.
**Safer alternatives:** 01 (Premium Digital Marketplace) if the priority is the most conventional, proven shopping experience; 09 (Multi-Category Platform) if equal weight for all six areas matters most.
**Elements worth combining into the winner:** 02's mobile bottom tab bar and collection rails; 07's format badges and "what you get" checklists; 05's article-to-product journal rows; 08's "Surprise me" discovery.

## Known limitations of the previews
- Book covers are CSS gradient tiles, not the real cover images (real covers can be wired in at build time).
- Screenshots were rendered in the VM where Google Fonts are blocked, so they show fallback fonts; in a real browser the intended typography applies.
- Mobile search on 05/06 lives inside the opened mobile menu; on other concepts it is directly visible.
- These are design explorations, not production code: no backend, no cart (sales stay on Gumroad), no analytics in the previews.
