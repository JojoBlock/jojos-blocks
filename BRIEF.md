# JoJo's Blocks — Redesign Exploration: Build Brief (for all 10 concept builders)

## What this is
Design exploration ONLY. Nothing here touches production (main branch, jojosblocks.online), the live repo's existing files, or any business data. Each concept is ONE self-contained preview file that the owner can open and browse.

## Output location
`~/workspace/jojos-blocks/redesign-concepts/concepts/<NN>-<slug>/index.html`
One HTML file per concept, fully self-contained (inline CSS + JS, no external dependencies except Google Fonts, which is fine). No other files per concept unless essential.

Assigned folders (do not build any other concept):
- Builder A: `01-premium-marketplace`, `02-creative-marketplace`
- Builder B: `03-amazon-style-commerce`, `04-minimal-premium`
- Builder C: `05-editorial-commerce`, `06-creative-studio`
- Builder D: `07-digital-products-store`, `08-discovery-first`
- Builder E: `09-multi-category-platform`, `10-original-guided-marketplace`

## Content — read CONTENT.md first
All copy, products, prices, links and counts MUST come from `CONTENT.md` in this same folder. It holds the real business content: 5 books with real prices and Gumroad links, 12 free resources, 6 games, 8 blog articles, brand facts.

## Hard rules (owner-set, never break)
- Do NOT invent fake customer reviews, star ratings, sales numbers, bestseller claims, discounts beyond the real ones, or business claims.
- Do NOT invent new products with fake prices. Product listings show the 5 real books; additional slots are honest "Coming soon" cards for future categories (ebooks, templates, planners, guides) with NO price and NO buy button.
- Affiliate Marketplace section: there are NO real affiliate products yet. Show the section structure (category tiles, how recommendations will work, disclosure text) with an honest "Recommendations coming soon" state. Do NOT invent affiliate products, brands, prices or links.
- Games link to the REAL live game pages (URLs in CONTENT.md). Game cards show the real titles and covers via CSS/emoji art — no fake screenshots.
- Blog cards link to the REAL live article URLs.
- "Buy" buttons link to the REAL Gumroad URLs. Do NOT build a cart or checkout (the business sells via Gumroad).
- Do NOT copy Amazon/Flipkart/Etsy/eBay branding, logos, or exact layouts. Use them as UX inspiration only.
- Keep the JoJo's Blocks name and the contact email jojobusiness0101@gmail.com. Never use the owner's personal name.

## Every concept MUST include (all working in the single file)
1. Homepage + hero section.
2. Desktop navigation (full nav bar).
3. Mobile navigation designed for small screens (hamburger and/or bottom nav — must work at 320px).
4. Search that actually filters the product/resource cards on the page (client-side JS, case-insensitive).
5. Category discovery (category chips/pills that filter the listings).
6. Product listing with product cards (real books + coming-soon slots).
7. Product detail view: clicking a book opens a detail view (in-page panel/overlay or a second screen within the file) with cover, title, price + sale price, pages, ages, description, "Buy on Gumroad" link, and related products.
8. Dedicated sections, each reachable from the nav: Our Products, Affiliate Marketplace, Free Resources, Games & Play, Blog.
9. Footer with brand identity, nav links, contact email, Pinterest link, Privacy/Terms/Refund links (link to the live legal pages).
10. Responsive at 320 / 375 / 390 / 768 / 1024 / 1280px. Mobile-first: no horizontal overflow at 320px, tap targets ≥44px, readable text (≥14px body on mobile).

## Design quality bar
- Each concept must look GENUINELY different from the others: different layout logic, different nav pattern, different hero treatment, different card system, different typography and colour story. Not the same template recoloured.
- Professional, not childish. The current site's cream/coral palette is NOT mandatory — each concept defines its own palette, but keep it coherent and print-friendly for a digital-products brand.
- Consistent spacing system, clear visual hierarchy, accessible contrast (body text ≥4.5:1, large text ≥3:1).
- No lorem ipsum. All copy is real or clearly labelled placeholder ("Coming soon").

## Testing (mandatory before you report done)
- Run the Playwright venv `~/workspace/tools/venv-playwright/bin/python` against your files served locally (python http.server on a scratch port in /tmp, or file:// if the script supports it). Do NOT use the bundled Chromium (blocked by policy).
- For EACH concept: desktop 1280px screenshot + mobile 390px screenshot, saved to `~/workspace/jojos-blocks/redesign-concepts/previews/<NN>-<slug>-desktop.png` and `...-mobile.png`. Check for horizontal overflow at 320px and 390px (measure `document.documentElement.scrollWidth` vs `innerWidth`), and exercise: mobile nav open/close, search filter, category filter, product detail open/close.
- Fix what you find. Report: files written, test results, any known issue left.

## What NOT to do
- Do not touch `~/workspace/jojos-blocks/restructure/`, the live repo, production, staging, or any existing file outside `redesign-concepts/`.
- Do not deploy, push, or publish anything. The parent handles publishing.
- Do not start another phase or redesign production.
